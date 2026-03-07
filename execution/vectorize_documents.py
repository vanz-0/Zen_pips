import os
import sys
import argparse
import base64
import json
import time
import hashlib
import fitz  # PyMuPDF
from supabase import create_client, Client
from openai import OpenAI
from dotenv import load_dotenv

# Load env variables
base_dir = os.path.dirname(os.path.dirname(__file__))
load_dotenv(os.path.join(base_dir, '.env'))

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not SUPABASE_URL or not SUPABASE_KEY or not OPENAI_API_KEY:
    print("[ERROR] Missing environment variables. Make sure SUPABASE and OPENAI keys are in .env")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
client = OpenAI(api_key=OPENAI_API_KEY)

CHUNK_SIZE = 1500
OVERLAP = 200
HASH_FILE = os.path.join(base_dir, "processed_hashes.json")

def load_processed_hashes():
    if os.path.exists(HASH_FILE):
        with open(HASH_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_processed_hashes(hashes):
    with open(HASH_FILE, 'w') as f:
        json.dump(hashes, f, indent=4)

def get_file_hash(filepath):
    hasher = hashlib.sha256()
    with open(filepath, 'rb') as f:
        buf = f.read()
        hasher.update(buf)
    return hasher.hexdigest()

def get_embedding(text):
    text = text.replace("\n", " ")
    response = client.embeddings.create(
        input=[text],
        model="text-embedding-3-small"
    )
    return response.data[0].embedding

def analyze_image_with_vision(image_bytes):
    base64_image = base64.b64encode(image_bytes).decode('utf-8')
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "This is an image from an institutional trading manual (likely SMC or ICT based). Analyze the chart or illustration in detail. Describe the market structure, any highlighted liquidity pools, fair value gaps, order blocks, and the overall educational takeaway taught by this image. If there is text, transcribe it."},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                    ]
                }
            ],
            max_tokens=500
        )
        time.sleep(1) # Rate limit protection
        return response.choices[0].message.content
    except Exception as e:
        print(f"Vision API Error: {e}")
        return None

def categorize_pdf(filename, first_page_text):
    system_prompt = """
    Analyze the filename and text to categorize this trading PDF into exactly ONE of these precise categories:
    - 'market_structure': For topics on BOS, CHoCH, trends.
    - 'liquidity_concepts': For topics on Sweeps, FVG, Order Blocks, Inducements.
    - 'trading_strategies': For topics on AMD, specific entry models, execution playbooks.
    - 'psychology_mindset': For topics on discipline, emotion, risk management.
    
    Output ONLY the exact category string. No quotes or punctuation.
    """
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Filename: {filename}\nText: {first_page_text[:1000]}"}
            ],
            max_tokens=20,
            temperature=0
        )
        cat = response.choices[0].message.content.strip().lower()
        valid_cats = ['market_structure', 'liquidity_concepts', 'trading_strategies', 'psychology_mindset']
        if cat in valid_cats:
            return cat
        return "trading_strategies" # fallback
    except Exception as e:
        print(f"Categorization Error: {e}")
        return "trading_strategies"

def chunk_text(text, chunk_size=CHUNK_SIZE, overlap=OVERLAP):
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return chunks

def insert_document(content, category, source, page=None):
    if not content or len(content.strip()) < 10:
        return
    
    print(f"  -> Generating embedding for chunk ({len(content)} chars) under '{category}'...")
    try:
        embedding = get_embedding(content)
        metadata = {
            "category": category,
            "source": source
        }
        if page is not None:
            metadata["page"] = page
            
        supabase.table("documents").insert({
            "content": content,
            "metadata": metadata,
            "embedding": embedding
        }).execute()
    except Exception as e:
        print(f"  [ERROR] DB/Embedding Error: {e}")

def process_file_text_only(filepath, category):
    print(f"Processing text file: {filepath}")
    with open(filepath, 'r', encoding='utf-8') as f:
        text = f.read()
    
    chunks = chunk_text(text)
    print(f"Found {len(chunks)} chunks.")
    
    for i, c in enumerate(chunks):
        insert_document(c, category, os.path.basename(filepath))
    
    print("[SUCCESS] Finished processing text file.")

def process_pdf(pdf_path, process_images=True, start_page=0, max_pages=None):
    print(f"\nProcessing PDF: {pdf_path}")
    source_name = os.path.basename(pdf_path)
    
    file_hash = get_file_hash(pdf_path)
    processed_hashes = load_processed_hashes()
    if file_hash in processed_hashes:
        print(f"  \u23ed\ufe0f Skipping {source_name} - Already processed (Hash: {file_hash[:8]}).")
        return
    
    doc = fitz.open(pdf_path)
    total_pages = len(doc)
    print(f"Total pages: {total_pages}")
    
    if total_pages == 0:
        return

    first_page_text = doc.load_page(0).get_text()
    category = categorize_pdf(source_name, first_page_text)
    print(f"  \ud83d\udcc2 Assigned Category: [{category}]")

    end_page = total_pages
    if max_pages is not None:
        end_page = min(total_pages, start_page + max_pages)

    for page_num in range(start_page, end_page):
        print(f"--- Page {page_num + 1}/{total_pages} ---")
        page = doc.load_page(page_num)
        
        # 1. Extract Text
        text = page.get_text()
        if text and len(text.strip()) > 50:
            chunks = chunk_text(text)
            for c in chunks:
                insert_document(c, category, source_name, page=page_num+1)
        
        # 2. Extract Images if enabled
        if process_images:
            image_list = page.get_images(full=True)
            if image_list:
                print(f"  Found {len(image_list)} images on page {page_num + 1}.")
                for img_index, img in enumerate(image_list):
                    xref = img[0]
                    base_image = doc.extract_image(xref)
                    image_bytes = base_image["image"]
                    ext = base_image["ext"]
                    
                    if len(image_bytes) < 10000:
                        continue
                        
                    print(f"  -> Analyzing image {img_index+1} (Size: {len(image_bytes)} bytes) with Vision API...")
                    img_description = analyze_image_with_vision(image_bytes)
                    if img_description:
                        final_text = f"[Image Description from {source_name} Page {page_num+1}]: {img_description}"
                        insert_document(final_text, category, source_name, page=page_num+1)
                        
    # Successfully processed PDF - Save hash
    processed_hashes[file_hash] = {"filename": source_name, "category": category}
    save_processed_hashes(processed_hashes)
    print(f"[SUCCESS] Finished {source_name}. Saved to tracking list.")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=['sop', 'pdf', 'all'], required=True)
    parser.add_argument("--pdf-path", type=str, default="../Trading Edu")
    parser.add_argument("--sop-path", type=str, default="../zenpips_sop.md")
    parser.add_argument("--no-images", action="store_true", help="Skip vision API for PDF images (saves tokens)")
    parser.add_argument("--start-page", type=int, default=0)
    parser.add_argument("--max-pages", type=int, default=None, help="Limit pages processed (useful for large PDFs)")
    
    args = parser.parse_args()
    
    base_dir = os.path.dirname(os.path.dirname(__file__))
    sop_full_path = os.path.join(base_dir, "zenpips_sop.md")
    pdf_full_path = os.path.join(base_dir, "Trading Edu")
    
    if args.mode in ['sop', 'all']:
        if os.path.exists(sop_full_path):
            process_file_text_only(sop_full_path, "sop")
        else:
            print(f"SOP file not found at {sop_full_path}")
            
    if args.mode in ['pdf', 'all']:
        if os.path.isdir(pdf_full_path):
            print(f"Directory detected. Processing all PDFs in {pdf_full_path}...")
            for filename in os.listdir(pdf_full_path):
                if filename.lower().endswith('.pdf'):
                    file_path = os.path.join(pdf_full_path, filename)
                    process_pdf(
                        file_path, 
                        process_images=not args.no_images,
                        start_page=args.start_page,
                        max_pages=args.max_pages
                    )
        elif os.path.exists(pdf_full_path):
            process_pdf(
                pdf_full_path, 
                process_images=not args.no_images,
                start_page=args.start_page,
                max_pages=args.max_pages
            )
        else:
            print(f"Trading Edu path not found at {pdf_full_path}")

if __name__ == "__main__":
    main()
