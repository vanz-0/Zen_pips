import os
import sys
import argparse
import asyncio
import requests
from dotenv import load_dotenv
from pathlib import Path
from telegram import Bot, InlineKeyboardButton, InlineKeyboardMarkup

# Load env variables
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
VIP_CHANNEL_ID = os.getenv("ZENPIPS_CHANNEL_ID")
BROKER_LINK = "https://www.hfm.com/ke/en/?refid=30508914"
WEBSITE_URL = "https://zenpips.com" # Update to your live URL if different
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

async def send_to_telegram(signal_text, signal_id=None):
    if not TELEGRAM_BOT_TOKEN or not VIP_CHANNEL_ID:
        print("[ERROR] Missing Telegram Config.")
        return False
    
    bot = Bot(token=TELEGRAM_BOT_TOKEN)

    # Build Interactive Buttons
    keyboard = [
        [
            InlineKeyboardButton("🚀 Copy on Website", url=f"https://zenpips.com/dashboard?signal={signal_id}"),
            InlineKeyboardButton("⚡ EXECUTE ORDER", url="https://zenpips.com/dashboard/chart-ai")
        ],
        [
            InlineKeyboardButton("💎 Join Broker (HFM)", url="https://active.hfm.com/en/market/trading-account/live?refid=383084"),
            InlineKeyboardButton("💬 Support", url="https://t.me/ZenPipsSupport_Bot")
        ]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    try:
        await bot.send_message(
            chat_id=VIP_CHANNEL_ID,
            text=signal_text,
            parse_mode='HTML',
            reply_markup=reply_markup
        )
        print("[SUCCESS] Successfully sent signal to Telegram VIP Channel with Buttons.")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to send to Telegram: {e}")
        return False

def insert_to_supabase(data):
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("[ERROR] Missing Supabase Config.")
        return False

    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

    url = f"{SUPABASE_URL}/rest/v1/signals"
    response = requests.post(url, headers=headers, json=data)

    if response.status_code in (200, 201):
        try:
            inserted = response.json()[0]
            print(f"[SUCCESS] Successfully inserted signal into Supabase. ID: {inserted.get('id')}")
        except:
            print("[SUCCESS] Successfully inserted signal into Supabase.")
        return True
    else:
        print(f"[ERROR] Failed to insert to Supabase: {response.text}")
        return False

def check_duplicate(pair, direction):
    if not SUPABASE_URL or not SUPABASE_KEY:
        return False

    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    
    url = f"{SUPABASE_URL}/rest/v1/signals?pair=eq.{pair}&direction=eq.{direction}&status=eq.ACTIVE"
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            data = response.json()
            if len(data) > 0:
                print(f"[WARNING] An active {direction} signal for {pair} already exists. Skipping duplicate.")
                return True
    except Exception as e:
        print(f"[ERROR] Duplicate check failed: {e}")
    return False

def main():
    parser = argparse.ArgumentParser(description="Process and broadcast a new signal.")
    parser.add_argument("--pair", required=True, help="Currency Pair (e.g., BTC/USD)")
    parser.add_argument("--direction", required=True, choices=["BUY", "SELL"])
    parser.add_argument("--entry", required=True, type=float)
    parser.add_argument("--sl", required=True, type=float)
    parser.add_argument("--tp1", type=float, help="Take Profit 1 (Optional, defaults to 1:1 RR)")
    parser.add_argument("--tp2", type=float, help="Take Profit 2 (Optional, defaults to 1:2 RR)")
    parser.add_argument("--tp3", type=float, help="Take Profit 3 (Optional, defaults to 1:3 RR)")
    parser.add_argument("--timeframe", default="M15")
    parser.add_argument("--confluence", default="Standard Setup")
    parser.add_argument("--force", action="store_true", help="Bypass duplicate check")
    
    args = parser.parse_args()

    # Determine precision - JPY and Metals usually need 2-3, others 4-5
    is_jpy_or_metal = any(x in args.pair for x in ["JPY", "XAG", "XAU"])
    precision = 3 if is_jpy_or_metal else 5
    
    # Calculate automated TPs if not provided
    risk_distance = abs(args.entry - args.sl)
    
    if args.tp1 is None:
        args.tp1 = round(args.entry + (risk_distance if args.direction == "BUY" else -risk_distance), precision)
    if args.tp2 is None:
        args.tp2 = round(args.entry + (2 * risk_distance if args.direction == "BUY" else -2 * risk_distance), precision)
    if args.tp3 is None:
        args.tp3 = round(args.entry + (3 * risk_distance if args.direction == "BUY" else -3 * risk_distance), precision)

    # Derived fields
    ticker = args.pair.replace("/", "")
    pip_multiplier = 100 if "JPY" in args.pair or "XAG" in args.pair else 10 if "XAU" in args.pair else 1

    # 1. Format Telegram Message
    action_emoji = "🟢" if args.direction == "BUY" else "🔴"
    
    telegram_msg = f"""⚡️ <b>NEW SIGNAL</b> ⚡️

{action_emoji} <b>{args.pair} | {args.direction}</b>
⏱ Timeframe: {args.timeframe}

🎯 <b>Entry:</b> {args.entry}
🛑 <b>SL:</b> {args.sl}

✅ <b>TP1:</b> {args.tp1}
✅ <b>TP2:</b> {args.tp2}
✅ <b>TP3:</b> {args.tp3}

🧠 <i>Analysis:</i> {args.confluence}

#ZENPIPS #SIGNAL"""

    print("--- Executing Signal Processing ---")
    
    # 1.5 Duplicate Check (only if not forced)
    if not args.force and check_duplicate(args.pair, args.direction):
        sys.exit(0)
    
    # 2. Insert to Supabase first so website updates immediately
    supabase_data = {
        "pair": args.pair,
        "ticker": ticker,
        "source": "TradingView Admin",
        "timeframe": args.timeframe,
        "direction": args.direction,
        "status": "ACTIVE",
        "entry": args.entry,
        "tp1": args.tp1,
        "tp2": args.tp2,
        "tp3": args.tp3,
        "sl": args.sl,
        "current_sl": args.sl,
        "tp1_hit": False,
        "tp2_hit": False,
        "tp3_hit": False,
        "sl_hit": False,
        "closed": False,
        "total_pips": 0,
        "pip_multiplier": pip_multiplier,
        "confluence": args.confluence
    }
    
    db_success = insert_to_supabase(supabase_data)

    # 3. Broadcast to Telegram
    # Only if DB insert was successful to maintain consistency
    if db_success:
        # Fetch the signal ID we JUST inserted for the link
        sig_id = "0"
        try:
            # Re-fetch latest for this pair/direction
            url = f"{SUPABASE_URL}/rest/v1/signals?pair=eq.{args.pair}&order=created_at.desc&limit=1"
            resp = requests.get(url, headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"})
            if resp.status_code == 200 and resp.json():
                sig_id = resp.json()[0]['id']
        except:
            pass

        asyncio.run(send_to_telegram(telegram_msg, signal_id=sig_id))
    else:
        print("[WARNING] Skipped Telegram broadcast due to Supabase insertion failure.")
        sys.exit(1)
        
    print("-----------------------------------")
    print("Process Complete. Ecosystem updated.")

if __name__ == "__main__":
    main()
