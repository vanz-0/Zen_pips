import os
import time
import requests
from dotenv import load_dotenv
from supabase import create_client, Client

# Load Environment
load_dotenv('.env')

# Configuration
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPPORT_BOT_TOKEN = os.getenv("SUPPORT_BOT_TOKEN")
ADMIN_TELEGRAM_ID = os.getenv("ADMIN_TELEGRAM_ID", "MadDmakz")

if not SUPPORT_BOT_TOKEN:
    print("❌ ERROR: SUPPORT_BOT_TOKEN missing in .env")
    exit(1)

# Initialize Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def send_to_admin(message_text, from_user):
    """
    Forward the support message to the admin.
    """
    url = f"https://api.telegram.org/bot{SUPPORT_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": ADMIN_TELEGRAM_ID,
        "text": f"🚨 <b>NEW SUPPORT TICKET</b>\n\n<b>From:</b> @{from_user}\n<b>Message:</b> {message_text}",
        "parse_mode": "HTML"
    }
    try:
        requests.post(url, json=payload)
    except Exception as e:
        print(f"Error forwarding to admin: {e}")

def handle_update(update):
    if "message" not in update:
        return

    msg = update["message"]
    chat_id = msg["chat"]["id"]
    user_handle = msg.get("from", {}).get("username", "Unknown")
    text = msg.get("text", "")

    if text.startswith("/start"):
        # Welcome message
        welcome = "Welcome to Zen Pips Support. Please describe your issue or the problem you are facing, and our team will tackle it immediately."
        requests.post(f"https://api.telegram.org/bot{SUPPORT_BOT_TOKEN}/sendMessage", json={
            "chat_id": chat_id,
            "text": welcome
        })
        return

    # 1. Log to Supabase
    try:
        supabase.table("support_tickets").insert({
            "telegram_id": str(chat_id),
            "username": user_handle,
            "message": text,
            "status": "OPEN"
        }).execute()
        print(f"✅ Ticket logged for @{user_handle}")
    except Exception as e:
        print(f"❌ DB Error: {e}")

    # 2. Forward to Admin
    send_to_admin(text, user_handle)

    # 3. Respond to User
    receipt = "✅ Ticket Received. Our institutional team has been notified and will resolve this issue shortly."
    requests.post(f"https://api.telegram.org/bot{SUPPORT_BOT_TOKEN}/sendMessage", json={
        "chat_id": chat_id,
        "text": receipt
    })

def main():
    print(f"🚀 Support Bot Listening... (Token: {SUPPORT_BOT_TOKEN[:10]}...)")
    last_update_id = 0
    
    while True:
        try:
            url = f"https://api.telegram.org/bot{SUPPORT_BOT_TOKEN}/getUpdates?offset={last_update_id + 1}&timeout=30"
            response = requests.get(url).json()
            
            if response.get("ok"):
                for update in response.get("result", []):
                    handle_update(update)
                    last_update_id = update["update_id"]
            
        except Exception as e:
            print(f"Connection Error: {e}")
            time.sleep(5)
        
        time.sleep(1)

if __name__ == "__main__":
    main()
