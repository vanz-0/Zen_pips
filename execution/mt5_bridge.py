"""
MT5 Bridge — Zen Pips
Monitors Supabase for new signals and executes them immediately on MT5.

Usage:
  python execution/mt5_bridge.py

Requirements:
  - MetaTrader5 python library
  - MT5 Terminal running on Windows
  - Environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
"""

import os
import sys
import time
import json
import logging
import requests
from dotenv import load_dotenv
from datetime import datetime, timezone

try:
    import MetaTrader5 as mt5
except ImportError:
    print("  [!] MetaTrader5 library not found. Install it with: pip install MetaTrader5")
    mt5 = None

# Load configurations
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

# Logging setup
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("mt5-bridge")

# ─── Supabase Helpers ───

def fetch_pending_signals():
    """Fetch signals that haven't been processed by the bridge yet."""
    # We'll use a hidden field or check 'status' if we update it.
    # For now, let's look for ACTIVE signals created in the last 1 minute or use a processed flag if we add one.
    # To keep it simple, we'll fetch ACTIVE signals and track IDs locally to avoid double-firing.
    url = f"{SUPABASE_URL}/rest/v1/signals?closed=eq.false&status=eq.ACTIVE"
    try:
        resp = requests.get(url, headers=HEADERS, timeout=10)
        if resp.status_code == 200:
            return resp.json()
    except Exception as e:
        logger.error(f"Error fetching signals: {e}")
    return []

# ─── MT5 Execution ───

def execute_trade(signal):
    """Place a trade on MT5 based on signal parameters."""
    if mt5 is None:
        logger.warning("MT5 library not available. Skipping execution.")
        return False

    symbol = signal["pair"]
    # MT5 often expects specific formatting (e.g., XAUUSD vs Gold)
    # We might need a mapping here if tickers differ.
    
    # Check if symbol exists in MT5
    symbol_info = mt5.symbol_info(symbol)
    if symbol_info is None:
        logger.error(f"Symbol {symbol} not found in MT5")
        return False
    
    if not symbol_info.visible:
        if not mt5.symbol_select(symbol, True):
            logger.error(f"Failed to select symbol {symbol}")
            return False

    # Define lot size (This should eventually come from the client_trading_profiles risk setting)
    lot = 0.01 
    
    order_type = mt5.ORDER_TYPE_BUY if signal["direction"] == "BUY" else mt5.ORDER_TYPE_SELL
    price = mt5.symbol_info_tick(symbol).ask if signal["direction"] == "BUY" else mt5.symbol_info_tick(symbol).bid
    
    sl = float(signal["sl"])
    tp = float(signal["tp1"]) # Use TP1 as initial safety, manual intervention for further TPs or logic for split lots.

    request = {
        "action": mt5.TRADE_ACTION_DEAL,
        "symbol": symbol,
        "volume": lot,
        "type": order_type,
        "price": price,
        "sl": sl,
        "tp": tp,
        "deviation": 20,
        "magic": 123456,
        "comment": "Zen Pips Auto-Signal",
        "type_time": mt5.ORDER_TIME_GTC,
        "type_filling": mt5.ORDER_FILLING_IOC,
    }

    result = mt5.order_send(request)
    if result.retcode != mt5.TRADE_RETCODE_DONE:
        logger.error(f"Order failed: {result.comment} (retcode: {result.retcode})")
        return False

    logger.info(f"Successfully placed {signal['direction']} order for {symbol} at {price}")
    return True

# ─── Main Loop ───

async def bridge_loop():
    logger.info("Starting MT5 Bridge...")
    
    if mt5 and not mt5.initialize():
        logger.error(f"MT5 initialize failed, error code: {mt5.last_error()}")
        return

    processed_ids = set()
    
    # Pre-fill processed_ids with existing signals to avoid firing on old data on startup
    existing = fetch_pending_signals()
    for s in existing:
        processed_ids.add(s["id"])
    
    logger.info(f"Bridge initialized. Monitoring for NEW signals...")

    try:
        while True:
            signals = fetch_pending_signals()
            for signal in signals:
                sig_id = signal["id"]
                if sig_id not in processed_ids:
                    logger.info(f"New signal detected: {signal['pair']} {signal['direction']}")
                    if execute_trade(signal):
                        processed_ids.add(sig_id)
                        # Optionally update status in Supabase to 'EXECUTED'
                        # requests.patch(f"{SUPABASE_URL}/rest/v1/signals?id=eq.{sig_id}", headers=HEADERS, json={"status": "EXECUTED (MT5)"})
            
            time.sleep(5) # Poll every 5 seconds for low latency
    except KeyboardInterrupt:
        logger.info("Bridge stopped by user.")
    finally:
        if mt5:
            mt5.shutdown()

if __name__ == "__main__":
    import asyncio
    asyncio.run(bridge_loop())
