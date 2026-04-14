import os
import requests
from dotenv import load_dotenv

# Load Environment
load_dotenv('.env')

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
GROUP_ID = os.getenv("FREE_GROUP_ID")

if not BOT_TOKEN or not GROUP_ID:
    print("❌ ERROR: TELEGRAM_BOT_TOKEN or FREE_GROUP_ID missing in .env")
    exit(1)

def api_call(method, payload=None):
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/{method}"
    try:
        res = requests.post(url, json=payload).json()
        if not res.get("ok"):
            print(f"API Error ({method}): {res.get('description')}")
        return res
    except Exception as e:
        print(f"Connection Error ({method}): {e}")
        return {}

def lock_group(chat_id):
    """Locks the group so only admins can send messages."""
    payload = {
        "chat_id": chat_id,
        "permissions": {
            "can_send_messages": False,
            "can_send_audios": False,
            "can_send_documents": False,
            "can_send_photos": False,
            "can_send_videos": False,
            "can_send_video_notes": False,
            "can_send_voice_notes": False,
            "can_send_polls": False,
            "can_send_other_messages": False,
            "can_add_web_page_previews": False
        }
    }
    
    print(f"Attempting to lock group: {chat_id}...")
    perm_res = api_call("setChatPermissions", payload)
    
    if perm_res.get("ok"):
        api_call("sendMessage", {
            "chat_id": chat_id, 
            "text": "🔒 *Group Locked*\n\nThis group is now securely locked for broadcasting. Only administrators and official Zen Pips institutional bots can transmit messages.",
            "parse_mode": "Markdown"
        })
        print(f"✅ Group {chat_id} successfully locked to Admin Only mode.")
    else:
        print("❌ Failed to set permissions.")

if __name__ == "__main__":
    lock_group(GROUP_ID)
