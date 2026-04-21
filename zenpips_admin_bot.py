import os
import time
import requests
from dotenv import load_dotenv
from supabase import create_client, Client
from scripts.marketing.marketing_orchestrator import MarketingOrchestrator

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

# Initialize
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
orchestrator = MarketingOrchestrator()

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

def handle_scout_command(chat_id, region="kenya"):
    send_msg(chat_id, f"🚀 <b>ZEN PIPS HUB: Scouting [{region.upper()}] leads...</b>\n<i>Activating Quora, Reddit, and LinkedIn engines. This takes ~60-90s.</i>")
    
    try:
        cycle_results = orchestrator.run_cycle(region=region, limit_per_platform=1)
        
        found_any = False
        for platform, results in cycle_results.items():
            if not results:
                continue
            
            found_any = True
            for res in results:
                msg = (
                    f"🎯 <b>NEW LEAD [{platform.upper()}] - {region.upper()}</b>\n\n"
                    f"❓ <b>Topic:</b> {res.get('question') or res.get('title')}\n\n"
                    f"🔗 <b>Source:</b> {res['url']}\n"
                    f"--------------------------------\n"
                    f"<i>Drafting content available in Supabase history.</i>\n\n"
                    f"🔗 <b>CTA LINK:</b>\n<code>{res.get('cta_url', 'Check Supabase')}</code>\n\n"
                    f"<i>Action: Verify lead and post from your browser.</i>"
                )
                send_msg(chat_id, msg)
        
        if not found_any:
            send_msg(chat_id, "❌ No fresh opportunities found in this cycle.")
            
    except Exception as e:
        send_msg(chat_id, f"❌ <b>Hub Error:</b> {str(e)}")

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
            "🛡 <b>ZEN PIPS ADMIN HUB</b>\n\n"
            "<b>Marketing Commands:</b>\n"
            "/scout [region] - Trigger Quora, Reddit, LinkedIn\n"
            "<i>Regions: kenya, global</i>\n\n"
            "<b>Support:</b>\n"
            "Tickets are forwarded here automatically."
        )
        send_msg(chat_id, welcome)
        return

    if text.startswith("/scout") and is_admin:
        parts = text.split()
        region = parts[1] if len(parts) > 1 else "kenya"
        handle_scout_command(chat_id, region)
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
