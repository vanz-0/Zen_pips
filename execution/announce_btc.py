import os
import asyncio
from dotenv import load_dotenv
from telegram import Bot

load_dotenv()

TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
FREE_GROUP_ID = os.getenv("FREE_GROUP_ID")
VIP_CHANNEL_ID = os.getenv("ZENPIPS_CHANNEL_ID")

async def announce_btc_win():
    bot = Bot(token=TOKEN)
    
    # Message for both groups
    message = (
        "🎯 <b>ZEN PIPS — MASSIVE TP3 HIT</b> 🎯\n"
        "📊 <b>BTC/USD (M15) — BUY</b>\n\n"
        "🏆 <b>FULL SWEEP! All targets destroyed.</b>\n\n"
        "• Entry: <code>63,945</code>\n"
        "• TP 1: <code>65,105</code> ✅\n"
        "• TP 2: <code>66,265</code> ✅\n"
        "• TP 3: <code>67,425</code> ✅\n\n"
        "📈 <b>Result: +3,480 Pips</b> 💰\n\n"
        "<i>Congratulations to all holders who stayed in until the end! Discipline is the strategy.</i> 📈"
    )

    try:
        await bot.send_message(chat_id=FREE_GROUP_ID, text=message, parse_mode='HTML')
        print("Announced to Free Group.")
    except Exception as e:
        print(f"Free Group Error: {e}")

if __name__ == "__main__":
    asyncio.run(announce_btc_win())
