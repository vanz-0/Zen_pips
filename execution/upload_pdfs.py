import os
import glob
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

url: str = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

bucket_name = "education-vault"
base_dir = r"c:\Users\Admin\OneDrive\Desktop\ZENPIPS\Trading Edu"

print(f"Uploading PDFs from {base_dir} to the {bucket_name} bucket...")

for filepath in glob.glob(os.path.join(base_dir, "*.pdf")):
    filename = os.path.basename(filepath)
    title = filename.replace(".pdf", "").replace("_", " ")
    
    # Upload to storage
    try:
        with open(filepath, 'rb') as f:
            res = supabase.storage.from_(bucket_name).upload(
                path=filename,
                file=f,
                file_options={"content-type": "application/pdf", "upsert": "true"}
            )
        print(f"Uploaded: {filename}")
    except Exception as e:
        print(f"Error uploading {filename}: {e}")
        # Could be 400 if already exists, we set upsert=true so it should overwrite, but ignore if it fails
        pass

    # Insert into database
    try:
        # Check if already exists
        existing = supabase.table("vault_resources").select("id").eq("title", title).execute()
        if len(existing.data) == 0:
            data = {
                "title": title,
                "description": f"Learn the trading secrets behind {title}.",
                "type": "PDF",
                "category": "Technical Analysis" if "Structure" in title or "Price" in title else "Strategy",
                "level": "Intermediate",
                "locked": False,
                "file_path": filename
            }
            supabase.table("vault_resources").insert(data).execute()
            print(f"Inserted DB record for {title}")
    except Exception as e:
        print(f"Error inserting DB record for {title}: {e}")

print("Upload complete.")
