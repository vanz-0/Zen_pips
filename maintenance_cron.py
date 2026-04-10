import os
import sys
import requests
from datetime import datetime, date
from dotenv import load_dotenv
from supabase import create_client, Client
import subprocess

# Load Environment
load_dotenv('.env')

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Critical: Supabase credentials missing.")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def cleanup_temp_bucket():
    """
    Daily 1:00 AM task: Purge all files in the temp_images bucket.
    """
    print("🧹 Starting Daily Cleanup of temp_images...")
    try:
        bucket_name = 'temp_images'
        # List all files
        files = supabase.storage.from_(bucket_name).list()
        
        if not files:
            print("✅ Temp bucket is already empty.")
            return

        file_names = [f['name'] for f in files]
        res = supabase.storage.from_(bucket_name).remove(file_names)
        print(f"✅ Successfully deleted {len(file_names)} temporary images.")
    except Exception as e:
        print(f"⚠️ Cleanup error: {e}")

def get_monthly_performance():
    """
    Calculate performance for the previous month.
    """
    # Just a placeholder for the logic - we would query 'signals' table
    # for all closed signals in the last 30 days.
    return "Monthly Performance Audit: [In development - will track closed signal outcomes]"

def run_system_check_and_report():
    """
    Run the master diagnostic and send the telegram report.
    """
    print("📡 Running System Audit...")
    try:
        # Run the existing systemcheck.py with the --report flag
        # We assume 'python' is in the PATH or we use the absolute path to current venv
        result = subprocess.run([sys.executable, "systemcheck.py", "--report"], capture_output=True, text=True)
        print(result.stdout)
        if result.stderr:
            print(f"⚠️ Audit errors: {result.stderr}")
    except Exception as e:
        print(f"⚠️ Subprocess error: {e}")

def main():
    print(f"\n--- Zen Pips Daily Maintenance Job [{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] ---")
    
    # 1. Cleanup Temp Storage
    cleanup_temp_bucket()
    
    # 2. Run Audit and Notify Admin
    run_system_check_and_report()
    
    # 3. Monthly Rotation Check
    today = date.today()
    if today.day == 1:
        print("📆 NEW MONTH DETECTED: Rotating Chart Folders...")
        # Future: Logic to generate a 'deep analysis' report for the prior month
        pass

if __name__ == "__main__":
    main()
