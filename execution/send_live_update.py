import os
import asyncio
import sys
import io
from dotenv import load_dotenv
from telegram import Bot

# Force UTF-8 encoding for stdout to handle emojis in Windows terminal
if sys.stdout.encoding != 'UTF-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='UTF-8')

# Load configurations
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))
TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
FREE_GROUP_ID = os.getenv("FREE_GROUP_ID")

MESSAGE = (
    "🎯⚡ <b>ZEN PIPS — LIVE PERFORMANCE UPDATE</b> 🔥👑\n\n"
    "Discipline is our only strategy. The market is moving exactly as anticipated.\n\n"
    "💰 <b>XAG/USD (Silver) — TP1 HIT!</b> ✅\n"
    "The first target at <code>89.99</code> has been destroyed.\n"
    "🔒 <b>ACTION REQUIRED:</b> Move your Stop Loss to <b>ENTRY (89.44)</b> now. "
    "This trade is officially risk-free. Trailing for TP2 and TP3.\n\n"
    "📈 <b>XAU/USD (Gold) — APPROACHING TP1!</b> ⏳\n"
    "Gold is accelerating towards our first target at <code>5,205.1</code>. "
    "Momentum is high — prepare to lock in fixed profits.\n\n"
    "<i>\"The goal of a successful trader is to make the best trades. Money is secondary.\"</i>\n\n"
    "Stay focused. Stay disciplined.\n"
    "<i>Zen Pips. Discipline is the strategy.</i> 📈"
)

async def send_update():
    if not TOKEN:
        print("Error: No TELEGRAM_BOT_TOKEN")
        return

    bot = Bot(token=TOKEN)
    
    print("\nSending live update to Group...")
    try:
        await bot.send_message(
            chat_id=FREE_GROUP_ID, 
            text=MESSAGE, 
            parse_mode='HTML', 
            disable_web_page_preview=True
        )
        print("✓ Sent to Group successfully!")
    except Exception as e:
        print(f"✗ Failed to send: {e}")

if __name__ == "__main__":
    asyncio.run(send_update())
