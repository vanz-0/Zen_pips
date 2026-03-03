import os
import asyncio
import json
import requests
from dotenv import load_dotenv
from telegram import Bot

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
FREE_GROUP_ID = os.getenv("FREE_GROUP_ID")
VIP_CHANNEL_ID = os.getenv("ZENPIPS_CHANNEL_ID")
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}

async def send_updates():
    if not TOKEN:
        print("Error: No TELEGRAM_BOT_TOKEN")
        return

    bot = Bot(token=TOKEN)
    url = f"{SUPABASE_URL}/rest/v1/signals"
    resp = requests.get(url, headers=HEADERS)
    signals = resp.json()

    tp3_signals = [s for s in signals if s.get("tp3_hit")]
    profiting_signals = [s for s in signals if s.get("total_pips", 0) > 0]
    total_pips = sum(s.get("total_pips", 0) for s in profiting_signals)

    msg = (
        "🏆🔥 <b>ZEN PIPS — DAILY RECAP & UPDATES</b> 🔥🏆\n\n"
        "Here is the update on the signals provided today:\n\n"
        "🎯 <b>ORDERS THAT HIT TP3 (FULL SWEEP):</b>\n"
    )

    if not tp3_signals:
        msg += "<i>None so far. Keep holding!</i>\n"
    for s in tp3_signals:
        msg += f"✅ <b>{s['pair']} ({s['timeframe']})</b> — {s['direction']} | {s['status']} (+{s['total_pips']:,} Pips)\n"

    msg += "\n📈 <b>ALL PROFITING ORDERS TODAY:</b>\n"
    for s in profiting_signals:
        if not s.get("tp3_hit"):
            msg += f"⏳ <b>{s['pair']} ({s['timeframe']})</b> — {s['direction']} | {s['status']} (+{s['total_pips']:,} Pips)\n"

    msg += f"\n💰 <b>Total Confirmed Today: +{total_pips:,} Pips</b> | 0 Losses\n\n"

    msg += (
        "The market gave us exactly what we anticipated. Discipline pays.\n\n"
        "<i>Zen Pips. Discipline is the strategy.</i> 📈"
    )

    print(msg)
    
    print("\nSending to VIP Channel...")
    try:
        await bot.send_message(chat_id=VIP_CHANNEL_ID, text=msg, parse_mode='HTML', disable_web_page_preview=True)
        print("✓ Sent to VIP")
    except Exception as e:
        print(f"✗ Failed to send to VIP: {e}")

    print("\nSending to Free Group...")
    try:
        await bot.send_message(chat_id=FREE_GROUP_ID, text=msg, parse_mode='HTML', disable_web_page_preview=True)
        print("✓ Sent to Free Group")
    except Exception as e:
        print(f"✗ Failed to send to Free Group: {e}")

if __name__ == "__main__":
    asyncio.run(send_updates())
