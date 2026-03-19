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

def execute_trade(signal, risk_percent=1.0):
    """Place a trade on MT5 based on signal parameters."""
    if mt5 is None:
        logger.warning("MT5 library not available. Skipping execution.")
        return False

    # Map general crypto/forex tickers to broker-specific (e.g. BTCUSD vs BTC/USD vs BTCUSDm)
    symbol = signal["pair"].replace("/", "")
    if symbol == "XAUUSD":
        symbol = "XAUUSD" # Some brokers use GOLD or XAUUSD.pro 
    
    # Select symbol
    if not mt5.symbol_select(symbol, True):
        logger.error(f"Failed to select symbol {symbol} in MT5. Broker might use different ticker.")
        return False

    symbol_info = mt5.symbol_info(symbol)
    if not symbol_info.visible:
        logger.error(f"Symbol {symbol} is not visible in Market Watch.")
        return False

    # Dynamic Lot Size Calculation based on Account Equity and Risk
    account_info = mt5.account_info()
    if account_info is None:
        logger.error("Failed to get MT5 account info.")
        return False

    equity = account_info.equity
    sl_points = abs(float(signal["entry"]) - float(signal["sl"]))
    
    # Fallback to minimum lot if math gets weird (e.g., SL distance is 0)
    lot = 0.01
    try:
        if sl_points > 0:
            tick_value = symbol_info.trade_tick_value
            tick_size = symbol_info.trade_tick_size
            risk_amount = equity * (risk_percent / 100.0)
            calculated_lot = risk_amount / ((sl_points / tick_size) * tick_value)
            # Clamp lot size to broker limits
            lot = max(symbol_info.volume_min, min(symbol_info.volume_max, round(calculated_lot, 2)))
    except Exception as e:
        logger.error(f"Error calculating lot size: {e}. Defaulting to 0.01")

    order_type = mt5.ORDER_TYPE_BUY if signal["direction"].upper() == "BUY" else mt5.ORDER_TYPE_SELL
    
    # Use current market price for immediate execution
    price = mt5.symbol_info_tick(symbol).ask if order_type == mt5.ORDER_TYPE_BUY else mt5.symbol_info_tick(symbol).bid
    
    sl = float(signal["sl"])
    tp = float(signal["tp1"]) # Initial take profit
    
    request = {
        "action": mt5.TRADE_ACTION_DEAL,
        "symbol": symbol,
        "volume": float(lot),
        "type": order_type,
        "price": price,
        "sl": sl,
        "tp": tp,
        "deviation": 20,
        "magic": 999111, # Unique Magic Number for Zen Pips Copy Trader
        "comment": "Zen Pips Auto",
        "type_time": mt5.ORDER_TIME_GTC,
        "type_filling": mt5.ORDER_FILLING_IOC,
    }

    logger.info(f"Sending order to MT5: {signal['direction']} {lot} Lots of {symbol}")
    result = mt5.order_send(request)
    if result.retcode != mt5.TRADE_RETCODE_DONE:
        logger.error(f"Order failed: {result.comment} (retcode: {result.retcode})")
        return False

    logger.info(f"✅ Trade Executed Successfully! Order Ticket: {result.order}")
    return True

# ─── Main Loop ───

async def bridge_loop(mt5_account=None, mt5_password=None, mt5_server=None, risk_percent=1.0):
    print("="*60)
    print(" ⚡ ZEN PIPS — MT5 COPY TRADER CLIENT ⚡ ".center(60))
    print("="*60)
    
    if mt5 is None:
        logger.error("MetaTrader5 library is required. Install via `pip install MetaTrader5`")
        return

    # Attempt to initialize
    if not mt5.initialize():
        logger.error(f"MT5 terminal failed to initialize. Error: {mt5.last_error()}")
        return
        
    # Optional Login to specific account
    if mt5_account and mt5_password and mt5_server:
        logger.info(f"Logging into MT5 Account: {mt5_account} on {mt5_server}...")
        authorized = mt5.login(int(mt5_account), password=mt5_password, server=mt5_server)
        if not authorized:
            logger.error(f"Login failed. Error: {mt5.last_error()}")
            mt5.shutdown()
            return
        logger.info("Login Successful!")

    processed_ids = set()
    
    # Pre-fill processed_ids with existing signals to avoid firing old signals upon boot
    existing = fetch_pending_signals()
    for s in existing:
        processed_ids.add(s["id"])
    
    logger.info(f"Bridge initialized & Synced. Monitoring Database for NEW Incoming Signals...")
    logger.info(f"Current Risk Parameter: {risk_percent}% per trade")

    try:
        while True:
            signals = fetch_pending_signals()
            for signal in signals:
                sig_id = signal["id"]
                if sig_id not in processed_ids:
                    logger.info(f"⚠️ NEW MASTER SIGNAL: {signal['direction']} {signal['pair']} @ {signal['entry']}")
                    
                    if execute_trade(signal, risk_percent=risk_percent):
                        processed_ids.add(sig_id)
                        
            time.sleep(3) # Ultra-low latency 3 second fetch cycle
            
    except KeyboardInterrupt:
        logger.info("\nBridge stopped by user.")
    finally:
        mt5.shutdown()

if __name__ == "__main__":
    import asyncio
    
    # Edit these parameters if you want the script to force login.
    # Otherwise, it uses the currently active account on the open MT5 terminal.
    MT5_ACCOUNT = os.getenv("MT5_ACCOUNT_NUMBER")
    MT5_PASSWORD = os.getenv("MT5_PASSWORD")
    MT5_SERVER = os.getenv("MT5_SERVER")
    RISK_PERCENT = 1.0 # E.g., 1.0 = 1% of account equity per trade
    
    asyncio.run(bridge_loop(
        mt5_account=MT5_ACCOUNT, 
        mt5_password=MT5_PASSWORD, 
        mt5_server=MT5_SERVER, 
        risk_percent=RISK_PERCENT
    ))
