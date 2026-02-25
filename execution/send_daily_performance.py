import os
import asyncio
from dotenv import load_dotenv
from telegram import Bot

# Load configurations
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))
TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
FREE_GROUP_ID = os.getenv("FREE_GROUP_ID")

async def send_performance():
    if not TOKEN:
        print("Error: No TELEGRAM_BOT_TOKEN provided in .env")
        return

    bot = Bot(token=TOKEN)
    
    # Read the performance summary
    summary_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.tmp', 'signals', 'daily_performance.txt')
    with open(summary_path, 'r', encoding='utf-8') as f:
        summary_text = f.read()
        
    try:
        print(f"Deploying Daily Performance to Free Group ({FREE_GROUP_ID})...")
        await bot.send_message(
            chat_id=FREE_GROUP_ID,
            text=summary_text,
            parse_mode='HTML'
        )
        print("Performance Summary Sent!")

    except Exception as e:
        print(f"Error broadcasting message: {e}")

if __name__ == "__main__":
    asyncio.run(send_performance())
