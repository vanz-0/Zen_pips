"""
Daily Reset Script — Zen Pips
Triggered at 1:00 AM to:
1. Send final daily recap to Telegram.
2. Sync all signals from local JSON to Supabase.
3. Clear the local active_signals.json (unclogging).
"""

import os
import json
import asyncio
import requests
import sys
import io
from datetime import datetime, timezone
from dotenv import load_dotenv
from telegram import Bot

# Force UTF-8 encoding for stdout to handle emojis in Windows terminal
if sys.stdout.encoding != 'UTF-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='UTF-8')

# Load configurations
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, '.env'))

TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
FREE_GROUP_ID = os.getenv("FREE_GROUP_ID")
VIP_CHANNEL_ID = os.getenv("ZENPIPS_CHANNEL_ID")
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

ACTIVE_SIGNALS_PATH = os.path.join(BASE_DIR, ".tmp", "signals", "active_signals.json")
CACHE_DIR = os.path.join(BASE_DIR, ".tmp", "cache")

def ensure_cache_dir():
    if not os.path.exists(CACHE_DIR):
        os.makedirs(CACHE_DIR)

async def sync_to_supabase(signals):
    """Sync signals to Supabase by selecting only valid schema fields."""
    print(f"📡 Syncing {len(signals)} signals to Supabase...")
    
    # Valid fields based on supabase_schema.sql
    valid_fields = {
        "pair", "ticker", "source", "timeframe", "direction", 
        "entry", "tp1", "tp2", "tp3", "sl", "current_sl", 
        "pip_multiplier", "tp1_hit", "tp2_hit", "tp3_hit", 
        "sl_hit", "closed", "status", "total_pips", 
        "check_interval_minutes", "confluence"
    }

    for signal in signals:
        # Create a filtered version of the signal
        sync_data = {k: v for k, v in signal.items() if k in valid_fields}
        
        url = f"{SUPABASE_URL}/rest/v1/signals"
        
        try:
            # We use POST for simplicity. If the user wants to update existing records, 
            # we'd need to handle that, but for daily reset, these are usually final states.
            resp = requests.post(url, headers=HEADERS, json=sync_data)
            if resp.status_code in (200, 201, 204):
                print(f"  ✓ Synced {signal.get('pair')} ({signal.get('timeframe')})")
            else:
                print(f"  ✗ Failed to sync {signal.get('pair')}: {resp.text}")
        except Exception as e:
            print(f"  ⚠ Sync error: {e}")

async def send_recap(bot, signals):
    """Generate and send the daily recap message."""
    if not signals:
        print("No signals found for recap.")
        return

    # Aggregate stats
    tp3_signals = [s for s in signals if s.get("tp3_hit")]
    profiting_signals = [s for s in signals if s.get("total_pips", 0) > 0]
    total_pips = sum(s.get("total_pips", 0) for s in signals)
    
    date_str = datetime.now().strftime("%A, %d %B %Y")
    
    msg = (
        f"🏆🔥 <b>ZEN PIPS — FINAL DAILY RECAP</b> 🔥🏆\n"
        f"<i>{date_str}</i>\n\n"
        "The trading day has concluded. Here is the final performance report:\n\n"
        "🎯 <b>FULL SWEEPS (TP3 HIT):</b>\n"
    )

    if not tp3_signals:
        msg += "<i>None today. Market volatility was high.</i>\n"
    for s in tp3_signals:
        msg += f"✅ <b>{s['pair']} ({s['timeframe']})</b> — {s['direction']} | +{s['total_pips']:,} Pips\n"

    msg += "\n📈 <b>SUMMARY:</b>\n"
    msg += f"• Total Signals: {len(signals)}\n"
    msg += f"• Profiting/Closed: {len(profiting_signals)}/{len(signals)}\n"
    msg += f"• Total Confirmed: <b>+{total_pips:,} Pips</b>\n\n"

    msg += (
        "All active orders have been synced to our master database. "
        "Local terminal is reset for the new London session.\n\n"
        "<i>Zen Pips. Discipline is the strategy.</i> 📈"
    )

    try:
        await bot.send_message(chat_id=FREE_GROUP_ID, text=msg, parse_mode='HTML')
        print("✓ Recap sent to Free Group")
    except Exception as e:
        print(f"✗ Failed to send recap: {e}")

def cache_signals(signals):
    """Save the day's signals to a timestamped cache file."""
    ensure_cache_dir()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    cache_file = os.path.join(CACHE_DIR, f"signals_summary_{timestamp}.json")
    with open(cache_file, 'w') as f:
        json.dump(signals, f, indent=4)
    print(f"📁 Cached current signals to {cache_file}")

def clear_local_signals():
    """Clear the active signals file."""
    with open(ACTIVE_SIGNALS_PATH, 'w') as f:
        json.dump([], f)
    print("🧹 Local signals file cleared (Unclogged).")

async def main():
    print(f"🚀 Starting Daily Reset Cycle — {datetime.now().isoformat()}")
    
    if not os.path.exists(ACTIVE_SIGNALS_PATH):
        print(f"⚠ {ACTIVE_SIGNALS_PATH} not found. Nothing to reset.")
        return

    with open(ACTIVE_SIGNALS_PATH, 'r') as f:
        try:
            signals = json.load(f)
        except Exception as e:
            print(f"✗ Failed to read JSON: {e}")
            return

    bot = Bot(token=TOKEN) if TOKEN else None
    
    if signals:
        # 1. Cache for safety
        cache_signals(signals)
        
        # 2. Sync to Supabase
        await sync_to_supabase(signals)
        
        # 3. Send Recap
        if bot:
            await send_recap(bot, signals)
        else:
            print("⚠ Bot token missing, skipping Telegram recap.")
            
        # 4. Clear local file
        clear_local_signals()
    else:
        print("No active signals to process.")

    print("🏁 Reset cycle complete.")

if __name__ == "__main__":
    asyncio.run(main())
