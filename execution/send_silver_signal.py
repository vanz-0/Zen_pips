import os
import asyncio
from dotenv import load_dotenv
from telegram import Bot

# Load configurations
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))
TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
VIP_CHANNEL_ID = os.getenv("ZENPIPS_CHANNEL_ID")

async def send_signal():
    if not TOKEN:
        print("Error: No TELEGRAM_BOT_TOKEN provided in .env")
        return

    bot = Bot(token=TOKEN)
    
    # Read the formatted signal
    signal_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.tmp', 'signals', 'silver_signal.txt')
    with open(signal_path, 'r', encoding='utf-8') as f:
        signal_text = f.read()
        
    try:
        print(f"Deploying Silver Signal to VIP Channel ({VIP_CHANNEL_ID})...")
        await bot.send_message(
            chat_id=VIP_CHANNEL_ID,
            text=signal_text,
            parse_mode='Markdown'
        )
        print("Silver Signal Sent!")

    except Exception as e:
        print(f"Error broadcasting message: {e}")

if __name__ == "__main__":
    asyncio.run(send_signal())
