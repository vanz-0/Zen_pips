import os
import sys
import io
import json
import PyPDF2
import subprocess
from glob import glob
from datetime import datetime
from dotenv import load_dotenv
from openai import OpenAI

if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

load_dotenv('.env')

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not OPENAI_API_KEY:
    print("Error: Missing OpenAI API Key.")
    exit(1)

client = OpenAI(api_key=OPENAI_API_KEY)
BRAIN_DIR = os.path.join(os.getcwd(), 'zain_brain')
RAW_DIR = os.path.join(BRAIN_DIR, 'raw')
CONCEPTS_DIR = os.path.join(BRAIN_DIR, 'concepts')
PROCESSED_DIR = os.path.join(RAW_DIR, 'processed')
INDEX_FILE = os.path.join(BRAIN_DIR, 'index.md')

if not os.path.exists(PROCESSED_DIR):
    os.makedirs(PROCESSED_DIR)

def read_pdf(file_path):
    text = ""
    try:
        with open(file_path, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            # Read first 15 pages for SMC to prevent gigantic token limits
            for i in range(min(15, len(reader.pages))):
                text += reader.pages[i].extract_text() + "\n"
        return text
    except Exception as e:
        print(f"Error reading PDF {file_path}: {e}")
        return ""

def generate_concepts(raw_text, filename):
    prompt = f"""
    You are ZAIN (Zen Pips Autonomous Intelligence Network). Your job is to extract high-value institutional trading concepts or platform metadata from raw source material.
    
    Source Context: {filename}
    Raw Text:
    {raw_text[:12000]}
    
    Task:
    Analyze and return a JSON array of objects. 
    1. "filename": e.g. "trading/NFP_Logic.md" or "platform/Community_Rules.md"
    2. "content": Full markdown content.
    
    Available Categories: trading, platform, operations, marketing, data, business.
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You output ONLY valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3
        )
        content = response.choices[0].message.content.strip()
        if content.startswith("```json"):
            content = content[7:-3]
        return json.loads(content)
    except Exception as e:
        print(f"OpenAI Generation Error: {e}")
        return []

def update_index():
    print("Rebuilding Categorized ZAIN Brain index.md...")
    index_content = "# ZAIN Brain Index\n\n*Master registry of all institutional knowledge categories.*\n\n"
    
    categories = ["trading", "platform", "operations", "marketing", "data", "business"]
    for cat in categories:
        cat_path = os.path.join(CONCEPTS_DIR, cat)
        if not os.path.exists(cat_path): continue
        
        index_content += f"## {cat.capitalize()}\n"
        concept_files = glob(os.path.join(cat_path, '*.md'))
        for c_file in concept_files:
            basename = os.path.basename(c_file)
            with open(c_file, 'r', encoding='utf-8') as f:
                first_line = f.readline().replace('# ', '').strip()
            index_content += f"- **[{first_line}](concepts/{cat}/{basename})**\n"
        index_content += "\n"
        
    with open(INDEX_FILE, 'w', encoding='utf-8') as f:
        f.write(index_content)

def git_commit_changes(message):
    try:
        subprocess.run(["git", "add", "."], cwd=BRAIN_DIR, check=True)
        res = subprocess.run(["git", "commit", "-m", message], cwd=BRAIN_DIR, capture_output=True, text=True)
        if "nothing to commit" not in res.stdout.lower():
            print(f"✅ Git Commit: {message}")
    except Exception as e:
        print(f"Git error: {e}")

def process_raw_files():
    files = glob(os.path.join(RAW_DIR, '*.*'))
    processed_any = False
    
    for f in files:
        if os.path.isdir(f): continue
        basename = os.path.basename(f)
        print(f"Ingesting: {basename}")
        
        if f.endswith('.pdf'):
            text = read_pdf(f)
        else:
            with open(f, 'r', encoding='utf-8') as file:
                text = file.read()
                
        if not text.strip(): continue
            
        concepts = generate_concepts(text, basename)
        for concept in concepts:
            c_filename = concept['filename']
            c_content = concept['content']
            c_path = os.path.join(CONCEPTS_DIR, c_filename)
            
            # Ensure sub-directory exists (e.g. concepts/trading/)
            os.makedirs(os.path.dirname(c_path), exist_ok=True)
            
            with open(c_path, 'w', encoding='utf-8') as cf:
                cf.write(c_content)
            print(f"🧠 Learned: {c_filename}")
            
        os.rename(f, os.path.join(PROCESSED_DIR, basename))
        processed_any = True

    if processed_any:
        update_index()
        git_commit_changes(f"ZAIN Evolved - {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    else:
        update_index() # Rebuild index anyway to pick up manual edits
        print("Brain index refreshed.")

if __name__ == "__main__":
    process_raw_files()
