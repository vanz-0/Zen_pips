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

SYNC_MAGIC = 999111 # Unique Magic Number for Zen Pips Copy Trader

# ─── Supabase Helpers ───

def fetch_pending_signals():
    """Fetch signals that haven't been processed by the bridge yet."""
    # We'll use a hidden field or check 'status' if we update it.
    # For now, let's look for ACTIVE signals created in the last 1 minute or use a processed flag if we add one.
    # To keep it simple, we'll fetch ACTIVE signals and track IDs locally to avoid double-firing.
    url = f"{SUPABASE_URL}/rest/v1/signals?closed=eq.false"
    try:
        resp = requests.get(url, headers=HEADERS, timeout=10)
        if resp.status_code == 200:
            return resp.json()
    except Exception as e:
        logger.error(f"Error fetching signals: {e}")
    return []

# ─── MT5 Execution ───

def cancel_pending_orders_for_symbol(symbol):
    """Nullifies all pending orders for the given symbol to prevent clutter."""
    if mt5 is None: return
    orders = mt5.orders_get(symbol=symbol)
    if not orders: return
    
    count = 0
    for order in orders:
        if order.type in (mt5.ORDER_TYPE_BUY_LIMIT, mt5.ORDER_TYPE_SELL_LIMIT, mt5.ORDER_TYPE_BUY_STOP, mt5.ORDER_TYPE_SELL_STOP):
            request = {
                "action": mt5.TRADE_ACTION_REMOVE,
                "order": order.ticket,
            }
            res = mt5.order_send(request)
            if res.retcode == mt5.TRADE_RETCODE_DONE:
                count += 1
    if count > 0:
        logger.info(f"🗑️ Cleaned up {count} old pending orders for {symbol}.")


def modify_sltp_for_tickets(tickets, new_sl, new_tp=None):
    """Modify the SL and TP for active MT5 positions and pending orders."""
    if mt5 is None: return
    
    sl_val = round(float(new_sl), 3)

    for ticket in tickets:
        # 1. Try Position (Live Trade)
        position = mt5.positions_get(ticket=ticket)
        if position and len(position) > 0:
            pos = position[0]
            # Use provided TP or fall back to position's existing TP
            final_tp = round(float(new_tp), 3) if new_tp is not None else pos.tp
            request = {
                "action": mt5.TRADE_ACTION_SLTP,
                "position": ticket,
                "sl": sl_val,
                "tp": final_tp,
            }
            result = mt5.order_send(request)
            if result.retcode != mt5.TRADE_RETCODE_DONE:
                logger.error(f"\u274c Failed to sync SL/TP for POSITION {ticket}: {result.comment} ({result.retcode})")
            else:
                logger.info(f"\u2705 SL/TP successfully synced for POSITION {ticket} (SL: {sl_val}, TP: {final_tp})")
            continue

        # 2. Try Order (Pending)
        order = mt5.orders_get(ticket=ticket)
        if order and len(order) > 0:
            ord_p = order[0]
            final_tp = round(float(new_tp), 3) if new_tp is not None else ord_p.tp
            request = {
                "action": mt5.TRADE_ACTION_MODIFY,
                "order": ticket,
                "price": ord_p.price_open,
                "sl": sl_val,
                "tp": final_tp,
            }
            result = mt5.order_send(request)
            if result.retcode != mt5.TRADE_RETCODE_DONE:
                logger.error(f"\u274c Failed to sync SL/TP for ORDER {ticket}: {result.comment} ({result.retcode})")
            else:
                logger.info(f"\u2705 SL/TP successfully synced for ORDER {ticket} (SL: {sl_val}, TP: {final_tp})")
            continue

        logger.warning(f"\u26a0\ufe0f Sync Mismatch: Ticket {ticket} not found in MT5.")

def get_active_tickets_by_symbol(symbol):
    """Find all active MT5 tickets (positions or pending orders) for a symbol with the magic number."""
    if mt5 is None: return []
    logger.info(f"🔍 DEBUG SYNC: Looking for {symbol} | Magic: {SYNC_MAGIC}")
    
    # Check Active Positions
    positions = mt5.positions_get()
    pos_tickets = []
    if positions:
        pos_tickets = [p.ticket for p in positions if p.magic == SYNC_MAGIC and p.symbol.strip().upper() == symbol.strip().upper()]
        for p in positions:
            if p.magic == SYNC_MAGIC:
                logger.info(f"🔍 DEBUG SYNC: Found POSITION - Ticket: {p.ticket}, Symbol: {p.symbol}")

    # Check Pending Orders
    orders = mt5.orders_get()
    ord_tickets = []
    if orders:
        ord_tickets = [o.ticket for o in orders if o.magic == SYNC_MAGIC and o.symbol.strip().upper() == symbol.strip().upper()]
        for o in orders:
            if o.magic == SYNC_MAGIC:
                logger.info(f"🔍 DEBUG SYNC: Found PENDING - Ticket: {o.ticket}, Symbol: {o.symbol}")
        
    all_tickets = pos_tickets + ord_tickets
    if all_tickets:
        logger.info(f"✅ DEBUG SYNC: Matched {len(all_tickets)} total tickets (Positions: {len(pos_tickets)}, Orders: {len(ord_tickets)}) for {symbol}.")
    else:
        logger.error(f"❌ DEBUG SYNC: No positions or orders matched {symbol} with magic {SYNC_MAGIC}")
    return all_tickets

def execute_trade(signal, risk_percent=1.0):
    """Place a trade on MT5 based on signal parameters."""
    if mt5 is None:
        logger.warning("MT5 library not available. Skipping execution.")
        return False

    # Map general crypto/forex tickers to broker-specific (e.g. BTCUSD vs BTC/USD vs BTCUSDm)
    base_symbol = signal["pair"].replace("/", "")
    
    # Common broker aliases/suffixes for metals and forex
    symbol_variants = [base_symbol]
    if base_symbol == "XAUUSD":
        symbol_variants += ["GOLD", "XAUUSD.a", "XAUUSD.p", "XAUUSD.c", "XAUUSD_m"]
    if base_symbol == "XAGUSD":
        symbol_variants += ["SILVER", "XAGUSD.a", "XAGUSD.p", "XAGUSD.c", "XAGUSD_m"]
    
    symbol = None
    symbol_info = None
    
    # Try all known variants until one succeeds
    for variant in symbol_variants:
        if mt5.symbol_select(variant, True):
            info = mt5.symbol_info(variant)
            if info and info.visible:
                symbol = variant
                symbol_info = info
                break
                
    if not symbol_info:
        logger.error(f"Failed to find and select symbol {base_symbol} (or any variants) in MT5. Broker might use different ticker.")
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

    requested_entry = float(signal["entry"])
    current_ask = mt5.symbol_info_tick(symbol).ask
    current_bid = mt5.symbol_info_tick(symbol).bid
    
    # 5 pips tolerance
    tolerance = 50 * symbol_info.point 
    
    action = mt5.TRADE_ACTION_DEAL
    
    if signal["direction"].upper() == "BUY":
        if requested_entry < current_ask - tolerance:
            action = mt5.TRADE_ACTION_PENDING
            order_type = mt5.ORDER_TYPE_BUY_LIMIT
        elif requested_entry > current_ask + tolerance:
            action = mt5.TRADE_ACTION_PENDING
            order_type = mt5.ORDER_TYPE_BUY_STOP
        else:
            order_type = mt5.ORDER_TYPE_BUY
    else:
        if requested_entry > current_bid + tolerance:
            action = mt5.TRADE_ACTION_PENDING
            order_type = mt5.ORDER_TYPE_SELL_LIMIT
        elif requested_entry < current_bid - tolerance:
            action = mt5.TRADE_ACTION_PENDING
            order_type = mt5.ORDER_TYPE_SELL_STOP
        else:
            order_type = mt5.ORDER_TYPE_SELL
            
    # Set the price correctly depending on if it's pending or market execution
    digits = symbol_info.digits
    if action == mt5.TRADE_ACTION_PENDING:
        exec_price = round(requested_entry, digits)
    else:
        exec_price = current_ask if "BUY" in signal["direction"].upper() else current_bid
    
    sl = round(float(signal["sl"]), digits)
    tp_levels = [round(float(signal["tp1"]), digits), round(float(signal["tp2"]), digits), round(float(signal["tp3"]), digits)]
    
    # Divide lot size among 3 orders — STRICT 0.01 per order (0.03 total exposure)
    # Dynamic logic disabled temporarily to maintain disciplined 0.01 testing across metals.
    lot_per_trade = 0.01
    
    # Manual Lot Override from Signal Confluence
    confluence = signal.get("confluence", "")
    import re
    lot_match = re.search(r'(\d+\.\d+)\s*LOT\s*OVERRIDE', confluence, re.IGNORECASE)
    if lot_match:
        override_val = float(lot_match.group(1))
        logger.info(f"Applied {override_val} LOT OVERRIDE as requested by user.")
        lot_per_trade = override_val
        
    tickets = []
    filling_modes = [mt5.ORDER_FILLING_RETURN, mt5.ORDER_FILLING_IOC, mt5.ORDER_FILLING_FOK]
    filling_names = ["RETURN", "IOC", "FOK"]
    
    for idx, tp in enumerate(tp_levels):
        if tp == 0:
            continue
            
        order_placed = False
        
        for cycle in range(2):  # Reduced retry cycles for better responsiveness
            for fm_idx, fm in enumerate(filling_modes):
                request = {
                    "action": action,
                    "symbol": symbol,
                    "volume": float(lot_per_trade),
                    "type": order_type,
                    "price": exec_price,
                    "sl": sl,
                    "tp": tp,
                    "deviation": 20,
                    "magic": 999111,
                    "comment": f"Zen Pips Auto TP{idx+1}",
                    "type_time": mt5.ORDER_TIME_GTC,
                    "type_filling": fm,
                }

                logger.info(f"Sending order TP{idx+1}: {signal['direction']} {lot_per_trade} Lots of {symbol} (TP: {tp}) [Fill: {filling_names[fm_idx]}, Cycle: {cycle+1}]")
                result = mt5.order_send(request)
                
                if result is not None and result.retcode == mt5.TRADE_RETCODE_DONE:
                    logger.info(f"Trade Executed for TP{idx+1}! Ticket: {result.order}")
                    tickets.append(result.order)
                    order_placed = True
                    break
                else:
                    retcode = getattr(result, 'retcode', 'Unknown')
                    comment = getattr(result, 'comment', 'Unknown')
                    if retcode == 10030:  # Unsupported filling mode, try next
                        continue
                    elif retcode in [10017, 10021]:  # Trade disabled / No prices
                        logger.warning(f"Broker unavailable ({comment}). Waiting 5s...")
                        time.sleep(5)
                        break  # Break filling loop, retry next cycle
                    else:
                        logger.error(f"Order TP{idx+1} failed ({filling_names[fm_idx]}): {comment} ({retcode})")
                        continue
            
            if order_placed:
                break
            
            if cycle < 2:
                time.sleep(3)
        
        if not order_placed:
            logger.error(f"❌ CRITICAL: Could not place TP{idx+1}. Skipping this order stage.")

    return tickets

# ─── Main Loop ───

async def bridge_loop(mt5_account=None, mt5_password=None, mt5_server=None, risk_percent=1.0):
    print("="*60)
    print(" ZEN PIPS - MT5 COPY TRADER CLIENT ".center(60))
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

    active_trades = {}
    
    # Pre-fill with existing signals and discover active MT5 positions
    existing = fetch_pending_signals()
    logger.info(f"Sync: Found {len(existing)} active signals in Supabase.")
    for s in existing:
        symbol = s["pair"].replace("/", "")
        logger.info(f"Sync: Processing {s['pair']} (MT5 Symbol: {symbol})")
        tickets = get_active_tickets_by_symbol(symbol)
        if tickets:
            db_sl = float(s["current_sl"])
            logger.info(f"🔗 Synced {len(tickets)} existing MT5 positions for {s['pair']} (ID: {s['id']})")
            
            # Check if MT5 actually matches DB SL/TP
            db_sl = float(s["current_sl"])
            for idx, t in enumerate(tickets):
                pos = mt5.positions_get(ticket=t)
                ord_p = mt5.orders_get(ticket=t) if not pos else None
                item = pos[0] if pos else ord_p[0] if ord_p else None
                
                if item:
                    # In our 3-order system, TP is order-specific (TP1, TP2, TP3)
                    db_tp = float(s[f"tp{idx+1}"])
                    mt5_sl = round(item.sl, 3)
                    mt5_tp = round(item.tp, 3)
                    
                    if mt5_sl != round(db_sl, 3) or mt5_tp != round(db_tp, 3):
                        logger.info(f"🔄 Sync Mismatch for Ticket {t}: SL({mt5_sl} vs {db_sl}), TP({mt5_tp} vs {db_tp}). Correcting...")
                        modify_sltp_for_tickets([t], db_sl, db_tp)

            active_trades[s["id"]] = {
                "tickets": tickets, 
                "current_sl": db_sl,
                "pair": s["pair"],
                "direction": s["direction"]
            }
        else:
            # Only re-execute if signal is truly fresh (no TPs hit yet)
            if s.get("tp1_hit") or s.get("tp2_hit") or s.get("tp3_hit"):
                logger.info(f"⏭ Skipping {s['pair']} — already has TP hits, no MT5 re-execution needed.")
                active_trades[s["id"]] = {
                    "tickets": [], 
                    "current_sl": float(s["current_sl"]),
                    "pair": s["pair"],
                    "direction": s["direction"]
                }
            else:
                logger.warning(f"⚠️ No MT5 positions found for ACTIVE signal {s['pair']} (ID: {s['id']})")
                logger.info(f"🚀 RE-EXECUTING UNTRACKED SIGNAL: {s['direction']} {s['pair']} @ {s['entry']}")
                tickets = execute_trade(s, risk_percent=risk_percent)
                if tickets:
                    active_trades[s["id"]] = {
                        "tickets": tickets, 
                        "current_sl": float(s["current_sl"]),
                        "pair": s["pair"],
                        "direction": s["direction"]
                    }
    
    logger.info(f"Bridge initialized & Synced. Monitoring Database for NEW Incoming Signals...")
    logger.info(f"Current Risk Parameter: {risk_percent}% per trade")

    try:
        while True:
            signals = fetch_pending_signals()
            for signal in signals:
                sig_id = signal["id"]
                db_sl = float(signal["current_sl"])
                
                if sig_id not in active_trades:
                    logger.info(f"⚠️ NEW MASTER SIGNAL: {signal['direction']} {signal['pair']} @ {signal['entry']}")
                    
                    # Prevent clutter by nullifying old pending orders for the same pair when a new active signal comes
                    cancel_pending_orders_for_symbol(signal["pair"].replace("/", ""))
                    
                    tickets = execute_trade(signal, risk_percent=risk_percent)
                    if tickets:
                        active_trades[sig_id] = {
                            "tickets": tickets, 
                            "current_sl": db_sl, 
                            "tp1": float(signal["tp1"]),
                            "tp2": float(signal["tp2"]),
                            "tp3": float(signal["tp3"]),
                            "pair": signal["pair"], 
                            "direction": signal["direction"]
                        }
                else:
                    # Monitor for SL or TP changes in Brain
                    local = active_trades[sig_id]
                    db_tp1 = float(signal["tp1"])
                    db_tp2 = float(signal["tp2"])
                    db_tp3 = float(signal["tp3"])

                    if db_sl != local["current_sl"] or db_tp1 != local.get("tp1") or db_tp2 != local.get("tp2") or db_tp3 != local.get("tp3"):
                        logger.info(f"🔄 Parameter Change detected for {signal['pair']}. Syncing new SL/TP targets...")
                        
                        # Apply to each ticket (TP1, TP2, TP3)
                        for idx, ticket in enumerate(local["tickets"]):
                            target_tp = db_tp1 if idx == 0 else db_tp2 if idx == 1 else db_tp3
                            modify_sltp_for_tickets([ticket], db_sl, target_tp)
                        
                        # Update local snapshot
                        active_trades[sig_id].update({
                            "current_sl": db_sl,
                            "tp1": db_tp1,
                            "tp2": db_tp2,
                            "tp3": db_tp3
                        })


            time.sleep(0.5) # Reduced polling interval for ultra-fast response (< 500ms)
            
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
