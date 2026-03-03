import os
import requests
from dotenv import load_dotenv

load_dotenv()

URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

headers = {
    "apikey": KEY,
    "Authorization": f"Bearer {KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

# Update BTC/USD M15
updates = {
    "tp1_hit": True,
    "tp2_hit": True,
    "tp3_hit": True,
    "closed": True,
    "status": "ALL TPs HIT",
    "total_pips": 3480,
    "tp3": 67425 # Ensuring it matches the screenshot precisely
}

target_url = f"{URL}/rest/v1/signals?pair=eq.BTC/USD&timeframe=eq.M15"
resp = requests.patch(target_url, headers=headers, json=updates)

if resp.status_code in (200, 204):
    print("Successfully updated BTC/USD M15 Signal.")
else:
    print(f"Failed: {resp.text}")
