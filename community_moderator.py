import os
import time
import requests
from dotenv import load_dotenv

# Load Environment
load_dotenv('.env')

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

if not BOT_TOKEN:
    print("❌ ERROR: TELEGRAM_BOT_TOKEN missing in .env")
    exit(1)

# Banned keywords that trigger the moderation strike system
BANNED_WORDS = [
    "t.me/", "discord.gg/", "wa.me/", "crypto investment", "guaranteed returns", 
    "join my group", "free signals", "subscribe to my", "binance.com/", "bybit.com/",
    "pump and dump"
]

# Track strikes: dict mapped by user_telegram_id -> count
user_strikes = {}

def api_call(method, payload=None):
    """Helper method properly wrapping Telegram API REST calls"""
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/{method}"
    try:
        res = requests.post(url, json=payload).json()
        if not res.get("ok"):
            # Suppress generic permission errors to avoid spamming the console
            if "Bad Request: message to delete not found" not in res.get("description", ""):
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
    api_call("setChatPermissions", payload)
    api_call("sendMessage", {
        "chat_id": chat_id, 
        "text": "🔒 *Group Locked*\n\nThis group is now specifically locked for broadcasting. Only administrators and official Zen Pips institutional bots can transmit messages.",
        "parse_mode": "Markdown"
    })
    print(f"✅ Group {chat_id} locked to Admin Only mode.")

def unlock_group(chat_id):
    """Unlocks the group for public member discussion."""
    payload = {
        "chat_id": chat_id,
        "permissions": {
            "can_send_messages": True,
            "can_send_audios": True,
            "can_send_documents": True,
            "can_send_photos": True,
            "can_send_videos": True,
            "can_send_video_notes": True,
            "can_send_voice_notes": True,
            "can_send_polls": True,
            "can_send_other_messages": True,
            "can_add_web_page_previews": True
        }
    }
    api_call("setChatPermissions", payload)
    api_call("sendMessage", {
        "chat_id": chat_id, 
        "text": "🔓 *Group Unlocked*\n\nMembers can now send messages. Please strictly adhere to the community rules. Spam link violations will result in automated bans.",
        "parse_mode": "Markdown"
    })
    print(f"✅ Group {chat_id} unlocked.")

def enforce_strike(chat_id, user_id, user_name, message_id):
    # 1. Delete the offending message
    api_call("deleteMessage", {"chat_id": chat_id, "message_id": message_id})
    
    strikes = user_strikes.get(user_id, 0) + 1
    user_strikes[user_id] = strikes
    
    print(f"⚠️ Strike {strikes} applied to @{user_name}")

    if strikes == 1:
        text = f"⚠️ *Warning System [Strike 1/3]*\n\n@{user_name}, promotional links and unauthorized content are strictly prohibited."
        api_call("sendMessage", {"chat_id": chat_id, "text": text, "parse_mode": "Markdown"})
    
    elif strikes == 2:
        text = f"🚨 *Mute Applied [Strike 2/3]*\n\n@{user_name} has been structurally muted for 24 hours for repeated rule violations."
        api_call("sendMessage", {"chat_id": chat_id, "text": text, "parse_mode": "Markdown"})
        
        # Mute for 24 hours
        mute_until = int(time.time()) + 86400
        api_call("restrictChatMember", {
            "chat_id": chat_id,
            "user_id": user_id,
            "until_date": mute_until,
            "permissions": {"can_send_messages": False}
        })
        
    elif strikes >= 3:
        text = f"⚖️ *Permanent Ban [Strike 3/3]*\n\n@{user_name} has been permanently removed from the Zen Pips institutional ecosystem."
        api_call("sendMessage", {"chat_id": chat_id, "text": text, "parse_mode": "Markdown"})
        api_call("banChatMember", {"chat_id": chat_id, "user_id": user_id})

def check_spam(text):
    text_lower = text.lower()
    for word in BANNED_WORDS:
        if word in text_lower:
            return True
    return False

def get_chat_member(chat_id, user_id):
    res = api_call("getChatMember", {"chat_id": chat_id, "user_id": user_id})
    if res.get("ok"):
        return res.get("result", {})
    return {}

def is_admin(chat_id, user_id):
    member = get_chat_member(chat_id, user_id)
    return member.get("status") in ["creator", "administrator"]

def process_update(update):
    if "message" not in update:
        return
        
    msg = update["message"]
    chat = msg.get("chat", {})
    chat_id = chat.get("id")
    chat_type = chat.get("type")
    
    # Process group messages only
    if chat_type not in ["group", "supergroup"]:
        return
        
    user = msg.get("from", {})
    user_id = user.get("id")
    user_name = user.get("username", user.get("first_name", str(user_id)))
    text = msg.get("text", "")
    message_id = msg.get("message_id")
    
    if not text:
        return

    # Commands for Admins
    if text.startswith("/lockgroup"):
        if is_admin(chat_id, user_id):
            lock_group(chat_id)
        return
        
    if text.startswith("/unlockgroup"):
        if is_admin(chat_id, user_id):
            unlock_group(chat_id)
        return

    # Skip moderation for admins
    if is_admin(chat_id, user_id):
        return

    # Run spam check
    if check_spam(text):
        enforce_strike(chat_id, user_id, user_name, message_id)

def main():
    print(f"🛡️ Zen Pips Moderator Board Initialized...")
    last_update_id = 0
    
    while True:
        try:
            url = f"https://api.telegram.org/bot{BOT_TOKEN}/getUpdates?offset={last_update_id + 1}&timeout=30"
            response = requests.get(url, timeout=40).json()
            
            if response.get("ok"):
                for update in response.get("result", []):
                    process_update(update)
                    last_update_id = update["update_id"]
            
        except requests.exceptions.RequestException as e:
            # Handle brief network disconnects silently
            time.sleep(5)
        except Exception as e:
            print(f"Unexpected Polling Error: {e}")
            time.sleep(5)

if __name__ == "__main__":
    main()
