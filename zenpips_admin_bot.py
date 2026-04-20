import os
import time
import requests
from dotenv import load_dotenv
from supabase import create_client, Client
from scripts.marketing.quora_engine import QuoraEngine

# Load Environment
load_dotenv('.env')

# Configuration
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPPORT_BOT_TOKEN = os.getenv("SUPPORT_BOT_TOKEN")
ADMIN_TELEGRAM_ID = os.getenv("ADMIN_TELEGRAM_ID", "MadDmakz") # Numeric ID or Username

if not SUPPORT_BOT_TOKEN:
    print("❌ ERROR: SUPPORT_BOT_TOKEN missing in .env")
    exit(1)

# Initialize Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
quora = QuoraEngine()

def send_msg(chat_id, text, parse_mode="HTML"):
    url = f"https://api.telegram.org/bot{SUPPORT_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": parse_mode,
        "disable_web_page_preview": False
    }
    try:
        requests.post(url, json=payload)
    except Exception as e:
        print(f"Error sending message: {e}")

def handle_quora_command(chat_id, category="forex"):
    send_msg(chat_id, f"🔍 <b>Scouting Quora for [{category}]...</b>\n<i>This may take 30-60 seconds due to Apify/AI processing.</i>")
    
    try:
        results = quora.run_daily_playbook(category=category, limit=2)
        
        if not results:
            send_msg(chat_id, "❌ No fresh questions found for this category today.")
            return

        for res in results:
            msg = (
                f"🌐 <b>QUORA OPPORTUNITY [{category.upper()}]</b>\n\n"
                f"❓ <b>Question:</b> {res['question']}\n\n"
                f"🔗 <b>Source:</b> {res['url']}\n\n"
                f"--------------------------------\n"
                f"{res['answer']}\n"
                f"--------------------------------\n\n"
                f"🔗 <b>LINK TO EMBED:</b>\n<code>{res['cta_url']}</code>\n\n"
                f"<i>Action: Copy the text, go to the source, and hyperlink a keyword with the URL above.</i>"
            )
            send_msg(chat_id, msg)
            
    except Exception as e:
        send_msg(chat_id, f"❌ <b>Quora Engine Error:</b> {str(e)}")

def handle_update(update):
    if "message" not in update:
        return

    msg = update["message"]
    chat_id = msg["chat"]["id"]
    user_handle = msg.get("from", {}).get("username", "Unknown")
    text = msg.get("text", "")

    # Security: Only allow Admin to use these commands
    is_admin = str(chat_id) == ADMIN_TELEGRAM_ID or user_handle == ADMIN_TELEGRAM_ID
    
    if text.startswith("/start"):
        welcome = (
            "🛡 <b>ZEN PIPS ADMIN TOOL</b>\n\n"
            "Commands:\n"
            "/quora [category] - Get fresh Quora leads\n"
            "<i>Categories: crypto, forex, regional, inst, propfirm</i>\n\n"
            "Incoming support tickets will also be forwarded here automatically."
        )
        send_msg(chat_id, welcome)
        return

    if text.startswith("/quora") and is_admin:
        parts = text.split()
        category = parts[1] if len(parts) > 1 else "forex"
        handle_quora_command(chat_id, category)
        return

    # Default: Support Ticket Handling
    try:
        supabase.table("support_tickets").insert({
            "telegram_id": str(chat_id),
            "username": user_handle,
            "message": text,
            "status": "OPEN"
        }).execute()
        
        # Forward to Admin (if the sender isn't already the admin)
        if not is_admin:
            admin_forward = f"🚨 <b>NEW SUPPORT TICKET</b>\n\n<b>From:</b> @{user_handle}\n<b>Message:</b> {text}"
            send_msg(ADMIN_TELEGRAM_ID, admin_forward)
            
            # Receipt to User
            send_msg(chat_id, "✅ Ticket Received. Our institutional team has been notified.")
    except Exception as e:
        print(f"❌ DB Error: {e}")

def main():
    print(f"🚀 ZenPips Admin Bot Listening...")
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
