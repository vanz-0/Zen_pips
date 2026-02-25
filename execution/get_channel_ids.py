import os
import asyncio
from dotenv import load_dotenv
from telegram import Bot

# Load configurations
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))
TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

async def get_recent_updates():
    if not TOKEN:
        print("Error: No TELEGRAM_BOT_TOKEN provided in .env")
        return

    bot = Bot(token=TOKEN)
    try:
        print("Fetching recent updates to find Channel/Group IDs...")
        print("Make sure you have added the bot to your channels and sent a test message in them.")
        updates = await bot.get_updates(limit=10)
        
        found = False
        for update in updates:
            if update.message:
                chat = update.message.chat
                print(f"[{chat.title}] (Type: {chat.type}) -> ID: {chat.id}")
                found = True
            elif update.channel_post:
                chat = update.channel_post.chat
                print(f"[{chat.title}] (Type: {chat.type}) -> ID: {chat.id}")
                found = True
            elif update.my_chat_member:
                chat = update.my_chat_member.chat
                print(f"[{chat.title}] Bot Admin Status Changed (Type: {chat.type}) -> ID: {chat.id}")
                found = True
        
        if not found:
            print("\nDid not find any events. Please go to your Telegram Channel/Group, make sure the bot is an admin, and send a message. Then run this again.")
            
    except Exception as e:
        print(f"Error fetching updates: {e}")

if __name__ == "__main__":
    asyncio.run(get_recent_updates())
