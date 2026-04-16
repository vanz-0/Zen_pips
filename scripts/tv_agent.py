import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import datetime

load_dotenv('.env')

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
TV_URL = os.getenv("TRADINGVIEW_CHART_URL") # e.g., https://www.tradingview.com/chart/XXXX/

if not all([SUPABASE_URL, SUPABASE_KEY, TV_URL]):
    print("[ERROR] Missing TV_URL or Supabase credentials. Check your .env.")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

import sys

def capture_and_broadcast(login_mode=False):
    print(f"[*] Initializing TradingView Autonomous Capture [{'LOGIN MODE' if login_mode else 'AUTO MODE'}]")
    
    chrome_options = Options()
    # Use a persistent user profile to stay logged into TradingView
    user_data_dir = os.path.join(os.getcwd(), "chrome_profile")
    chrome_options.add_argument(f"user-data-dir={user_data_dir}")
    chrome_options.add_argument("--window-size=1920,1080")
    
    if login_mode:
        print("[!] LOGIN MODE: A Chrome window will open. Please log into TradingView manually.")
        print("   The script will stay open for 120 seconds for you to complete the login.")
    else:
        chrome_options.add_argument("--headless")

    driver = webdriver.Chrome(options=chrome_options)

    screenshot_path = None
    try:
        driver.get(TV_URL)
        
        if login_mode:
            print("[*] Waiting for manual login (120 seconds)...")
            time.sleep(120)
            print("[*] Login window closed. Profile saved.")
            return

        print("[*] Navigating to TradingView Chart...")
        time.sleep(10) # Wait for indicators and markups to load

        # Take Screenshot
        screenshot_path = f"tv_markup_{int(time.time())}.png"
        driver.save_screenshot(screenshot_path)
        print(f"[SUCCESS] Screenshot captured: {screenshot_path}")

        # Upload to Supabase Storage
        with open(screenshot_path, 'rb') as f:
            file_data = f.read()
            file_name = f"charts/{datetime.now().strftime('%Y-%m')}/{screenshot_path}"
            
            storage_res = supabase.storage.from_("charts").upload(file_name, file_data, {"content-type": "image/png"})
            
            if storage_res:
                public_url = supabase.storage.from_("charts").get_public_url(file_name)
                print(f"[INFO] Image uploaded: {public_url}")

                # Broadcast to Community
                supabase.table("community_messages").insert({
                    "user_id": "00000000-0000-0000-0000-000000000000",
                    "channel": "setups-and-charts",
                    "content": "📡 **Institutional Markup Alert**\nAutonomous scan detected a fresh institutional level. Review the chart below for expansion confluence.",
                    "image": public_url
                }).execute()
                print("🏁 Community broadcast complete.")

    except Exception as e:
        print(f"[WARNING] TV Agent Error: {e}")
    finally:
        driver.quit()
        if os.path.exists(screenshot_path):
            os.remove(screenshot_path)

if __name__ == "__main__":
    is_login = "--login" in sys.argv
    capture_and_broadcast(login_mode=is_login)
