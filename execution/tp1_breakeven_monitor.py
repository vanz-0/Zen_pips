"""
TP1 Breakeven Monitor — Zen Pips
Monitors Supabase for TP1 hits and moves the Stop Loss of remaining orders to Entry (breakeven).

This script can run locally alongside mt5_bridge.py OR be deployed to Modal for 24/7 cloud operation.

Usage:
  python execution/tp1_breakeven_monitor.py
"""

import os
import sys
import time
import json
import logging
import requests
from dotenv import load_dotenv
from pathlib import Path

try:
    import MetaTrader5 as mt5
    MT5_AVAILABLE = True
except ImportError:
    MT5_AVAILABLE = False

# Load env
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
VIP_CHANNEL_ID = os.getenv("ZENPIPS_CHANNEL_ID")

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

SYNC_MAGIC = 999111

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("tp1-monitor")


def send_telegram_notification(message):
    """Send a notification to the VIP Telegram channel."""
    if not TELEGRAM_BOT_TOKEN or not VIP_CHANNEL_ID:
        return
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        payload = {"chat_id": VIP_CHANNEL_ID, "text": message, "parse_mode": "HTML"}
        requests.post(url, json=payload, timeout=10)
    except Exception as e:
        logger.error(f"Telegram notification failed: {e}")


def fetch_tp1_hit_signals():
    """Fetch signals where TP1 has been hit but SL hasn't been moved to breakeven yet."""
    url = (
        f"{SUPABASE_URL}/rest/v1/signals"
        f"?tp1_hit=eq.true&closed=eq.false"
        f"&select=id,pair,direction,entry,current_sl,tp1,tp2,tp3,status"
    )
    try:
        resp = requests.get(url, headers=HEADERS, timeout=10)
        if resp.status_code == 200:
            return resp.json()
    except Exception as e:
        logger.error(f"Supabase fetch error: {e}")
    return []


def update_supabase_sl(signal_id, new_sl, new_status):
    """Update the current_sl and status in Supabase."""
    url = f"{SUPABASE_URL}/rest/v1/signals?id=eq.{signal_id}"
    payload = {
        "current_sl": new_sl,
        "status": new_status
    }
    try:
        resp = requests.patch(url, headers=HEADERS, json=payload, timeout=10)
        if resp.status_code in [200, 204]:
            logger.info(f"Supabase SL updated for {signal_id} to {new_sl}")
            return True
        else:
            logger.error(f"Supabase update failed: {resp.status_code} {resp.text}")
    except Exception as e:
        logger.error(f"Supabase update error: {e}")
    return False


def modify_mt5_sl(symbol, entry_price):
    """Move SL for all Zen Pips positions/orders of a symbol to entry (breakeven)."""
    if not MT5_AVAILABLE:
        logger.warning("MT5 not available. Supabase-only mode (SL update will propagate via mt5_bridge).")
        return True
    
    if not mt5.initialize():
        logger.error("MT5 initialization failed")
        return False

    modified_count = 0
    
    # Check active positions
    positions = mt5.positions_get()
    if positions:
        for p in positions:
            if p.magic == SYNC_MAGIC and p.symbol.strip().upper() == symbol.strip().upper():
                if abs(p.sl - entry_price) > 0.001:  # Only modify if different
                    request = {
                        "action": mt5.TRADE_ACTION_SLTP,
                        "position": p.ticket,
                        "sl": float(entry_price),
                        "tp": p.tp,
                    }
                    result = mt5.order_send(request)
                    if result and result.retcode == mt5.TRADE_RETCODE_DONE:
                        logger.info(f"Position {p.ticket} SL moved to breakeven ({entry_price})")
                        modified_count += 1
                    else:
                        logger.error(f"Failed to modify position {p.ticket}: {getattr(result, 'comment', 'Unknown')}")

    # Check pending orders
    orders = mt5.orders_get()
    if orders:
        for o in orders:
            if o.magic == SYNC_MAGIC and o.symbol.strip().upper() == symbol.strip().upper():
                if abs(o.sl - entry_price) > 0.001:
                    request = {
                        "action": mt5.TRADE_ACTION_MODIFY,
                        "order": o.ticket,
                        "price": o.price_open,
                        "sl": float(entry_price),
                        "tp": o.tp,
                    }
                    result = mt5.order_send(request)
                    if result and result.retcode == mt5.TRADE_RETCODE_DONE:
                        logger.info(f"Order {o.ticket} SL moved to breakeven ({entry_price})")
                        modified_count += 1
                    else:
                        logger.error(f"Failed to modify order {o.ticket}: {getattr(result, 'comment', 'Unknown')}")

    logger.info(f"Modified {modified_count} tickets for {symbol}")
    return True


def monitor_loop():
    """Main monitoring loop — checks for TP1 hits and moves SL to breakeven."""
    print("=" * 60)
    print(" ZEN PIPS - TP1 BREAKEVEN MONITOR ".center(60))
    print("=" * 60)
    
    # Track which signals we've already processed to avoid repeated modifications
    processed_signals = set()
    
    while True:
        try:
            signals = fetch_tp1_hit_signals()
            
            for signal in signals:
                sig_id = signal["id"]
                
                # Skip if already at breakeven or already processed
                if sig_id in processed_signals:
                    continue
                
                entry = float(signal["entry"])
                current_sl = float(signal["current_sl"])
                status = signal.get("status", "")
                
                # Check if SL is already at or beyond breakeven
                if signal["direction"] == "BUY" and current_sl >= entry:
                    processed_signals.add(sig_id)
                    continue
                elif signal["direction"] == "SELL" and current_sl <= entry:
                    processed_signals.add(sig_id)
                    continue
                
                logger.info(f"TP1 HIT detected for {signal['pair']}! Moving SL to breakeven ({entry})...")
                
                symbol = signal["pair"].replace("/", "")
                
                # 1. Update Supabase first (this also triggers mt5_bridge SL sync)
                db_updated = update_supabase_sl(sig_id, entry, "TP1 HIT - SL IN PROFIT")
                
                # 2. Directly modify MT5 if available (faster than waiting for bridge cycle)
                if MT5_AVAILABLE:
                    modify_mt5_sl(symbol, entry)
                
                # 3. Notify Telegram
                if db_updated:
                    send_telegram_notification(
                        f"<b>TP1 HIT</b> {signal['pair']}\n"
                        f"SL moved to breakeven: <b>{entry}</b>\n"
                        f"Remaining targets: TP2 ({signal['tp2']}), TP3 ({signal['tp3']})\n"
                        f"#ZENPIPS #RISKFREE"
                    )
                
                processed_signals.add(sig_id)
            
            time.sleep(5)  # Check every 5 seconds
            
        except KeyboardInterrupt:
            logger.info("Monitor stopped by user.")
            break
        except Exception as e:
            logger.error(f"Monitor error: {e}")
            time.sleep(10)


if __name__ == "__main__":
    monitor_loop()
