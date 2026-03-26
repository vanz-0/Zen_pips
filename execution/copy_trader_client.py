"""
Chart AI Copy Trader Client — Zen Pips
Final High-Performance Edition
"""

import os
import sys
import time
import json
import logging
import requests
from dotenv import load_dotenv
from pathlib import Path
from datetime import datetime, timezone

try:
    import MetaTrader5 as mt5
except ImportError:
    print("[!] MetaTrader5 library not found.")
    mt5 = None

# Config
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUBSCRIBER_ID = os.getenv("SUBSCRIBER_PROFILE_ID") 

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

SYNC_MAGIC = 999111
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("chart-ai-client")

# ─── Helpers ───

def get_subscriber_profile():
    url = f"{SUPABASE_URL}/rest/v1/client_trading_profiles?id=eq.{SUBSCRIBER_ID}"
    try:
        resp = requests.get(url, headers=HEADERS, timeout=10)
        return resp.json()[0] if resp.status_code == 200 and resp.json() else None
    except: return None

def fetch_user_triggered_events():
    url = f"{SUPABASE_URL}/rest/v1/copy_events?subscriber_id=eq.{SUBSCRIBER_ID}&status=eq.USER_TRIGGERED&select=*,signals(*)"
    try:
        resp = requests.get(url, headers=HEADERS, timeout=10)
        return resp.json() if resp.status_code == 200 else []
    except: return []

def update_event_status(event_id, status, tickets=[], error=None):
    url = f"{SUPABASE_URL}/rest/v1/copy_events?id=eq.{event_id}"
    payload = {"status": status, "mt5_tickets": json.dumps(tickets), "error_message": error}
    try: requests.patch(url, headers=HEADERS, json=payload, timeout=10)
    except: pass

def log_copy_event(signal_id, tickets, status, latency_ms=None, error=None):
    url = f"{SUPABASE_URL}/rest/v1/copy_events"
    payload = {"signal_id": signal_id, "subscriber_id": SUBSCRIBER_ID, "mt5_tickets": json.dumps(tickets), "status": status, "copy_latency_ms": latency_ms, "error_message": error}
    try: requests.post(url, headers=HEADERS, json=payload, timeout=10)
    except: pass

def fetch_active_signals():
    url = f"{SUPABASE_URL}/rest/v1/signals?closed=eq.false&order=created_at.desc"
    try:
        resp = requests.get(url, headers=HEADERS, timeout=10)
        return resp.json() if resp.status_code == 200 else []
    except: return []

def check_already_copied(signal_id):
    url = f"{SUPABASE_URL}/rest/v1/copy_events?signal_id=eq.{signal_id}&subscriber_id=eq.{SUBSCRIBER_ID}&status=in.(COPIED,LIVE,PENDING,FAILED)"
    try:
        resp = requests.get(url, headers=HEADERS, timeout=10)
        return len(resp.json()) > 0 if resp.status_code == 200 else False
    except: return False

# ─── Execution Logic (RR 1:1, 1:2, 1:3) ───

def execute_copy(signal, lot_size):
    if mt5 is None: return []
    symbol = signal["pair"].replace("/", "")
    if not mt5.symbol_select(symbol, True): return []

    symbol_info = mt5.symbol_info(symbol)
    entry = float(signal["entry"])
    sl = float(signal["sl"])
    risk = abs(entry - sl)
    is_buy = signal["direction"].upper() == "BUY"

    # Enforce Zen 1:1, 1:2, 1:3 RR Logic
    tp1 = round(entry + (risk if is_buy else -risk), symbol_info.digits)
    tp2 = round(entry + (2*risk if is_buy else -2*risk), symbol_info.digits)
    tp3 = round(entry + (3*risk if is_buy else -3*risk), symbol_info.digits)
    tps = [tp1, tp2, tp3]

    cur_tick = mt5.symbol_info_tick(symbol)
    action = mt5.TRADE_ACTION_DEAL
    otype = mt5.ORDER_TYPE_BUY if is_buy else mt5.ORDER_TYPE_SELL
    price = cur_tick.ask if is_buy else cur_tick.bid


    tickets = []
    for i, target in enumerate(tps):
        req = {
            "action": action, "symbol": symbol, "volume": float(lot_size), "type": otype,
            "price": price, "sl": sl, "tp": target, "magic": SYNC_MAGIC,
            "comment": f"ZenPure Copy TP{i+1}", "type_time": mt5.ORDER_TIME_GTC, "type_filling": mt5.ORDER_FILLING_IOC
        }
        res = mt5.order_send(req)
        if res and res.retcode == mt5.TRADE_RETCODE_DONE:
            tickets.append(res.order)
    return tickets

def sync_sl(copied_signals):
    for sig_id, data in list(copied_signals.items()):
        # 1. Check for autonomous TP1/TP2 hits (if tickets closed)
        all_tickets = data["tickets"]
        if not all_tickets: continue
        
        # Check if TP1 ticket is still active
        tp1_active = False
        tp1_ticket = all_tickets[0]
        if mt5.positions_get(ticket=tp1_ticket) or mt5.orders_get(ticket=tp1_ticket):
            tp1_active = True
            
        if not tp1_active and not data.get("tp1_hit"):
            logger.info(f"🏆 AUTONOMOUS: TP1 HIT for {data['pair']}! Moving remaining to BE.")
            data["tp1_hit"] = True
            new_sl = data["entry"]
            # Push to Supabase so website/monitor knows
            try: requests.patch(f"{SUPABASE_URL}/rest/v1/signals?id=eq.{sig_id}", headers=HEADERS, json={"current_sl": new_sl, "tp1_hit": True, "status": "TP1 HIT - SL AT ENTRY"})
            except: pass
            
        # 2. Sync from Supabase Brain (Monitor or AI updates)
        try:
            url = f"{SUPABASE_URL}/rest/v1/signals?id=eq.{sig_id}&select=current_sl"
            resp = requests.get(url, headers=HEADERS, timeout=5).json()
            if resp:
                new_sl = float(resp[0]["current_sl"])
                if abs(new_sl - data["last_sl"]) > 0.00001:
                    logger.info(f"🔄 SYNC: Moving SL for {data['pair']} to {new_sl}")
                    for t in all_tickets:
                        p = mt5.positions_get(ticket=t)
                        if p: mt5.order_send({"action": mt5.TRADE_ACTION_SLTP, "position": t, "sl": new_sl, "tp": p[0].tp})
                    data["last_sl"] = new_sl
        except: pass

# ─── Main ───

import sys
sys.stdout.reconfigure(line_buffering=True)

def main():
    print("="*60)
    print(" ZEN PIPS - SMART COPY CLIENT (RR: 1/2/3) ".center(60))
    print("="*60)
    if not mt5.initialize():
        print(f"[!] MT5 Initialization failed. Error code: {mt5.last_error()}")
        return
    print("[+] MT5 Initialized Successfully.")

    def rebuild():
        print("[*] Rebuilding local state from MT5 positions...")
        rebuilt = {}
        try:
            positions = mt5.positions_get()
            if not positions: return rebuilt
            # Fetch all ACTIVE signals
            resp = requests.get(f"{SUPABASE_URL}/rest/v1/signals?closed=eq.false", headers=HEADERS).json()
            if not resp or not isinstance(resp, list): return rebuilt
            active_signals = {s["id"]: s for s in resp}
            for p in positions:
                if p.magic == SYNC_MAGIC:
                    # Match by symbol/direction? Or comment? Or fetch copy events.
                    # Simple match: symbol/direction/entry.
                    for sid, sig in active_signals.items():
                        if sig["pair"].replace("/", "") == p.symbol:
                            # If it matches, we resume monitoring for it.
                            if sid not in rebuilt:
                                rebuilt[sid] = {
                                    "tickets": [p.ticket], # We'll collect all tickets for this signal
                                    "last_sl": float(sig["current_sl"]),
                                    "pair": sig["pair"],
                                    "entry": float(sig["entry"]),
                                    "tp1_hit": sig.get("tp1_hit", False)
                                }
                            else:
                                rebuilt[sid]["tickets"].append(p.ticket)
            print(f"[*] Resumed monitoring for {len(rebuilt)} active signal(s).")
        except Exception as e:
            print(f"[!] Rebuild error: {e}")
        return rebuilt

    copied_signals = rebuild()
    while True:
        profile = get_subscriber_profile()
        if not profile: 
            time.sleep(5)
            continue
        
        lot_size = float(profile.get("chart_ai_lot_size", 0.01))
        
        # 1. Manual Triggers
        for ev in fetch_user_triggered_events():
            sig = ev["signals"]
            logger.info(f"⚡ MANUAL EXECUTION: {sig['pair']} {sig['direction']}")
            ts = execute_copy(sig, lot_size)
            if ts:
                update_event_status(ev["id"], "COPIED", ts)
                copied_signals[sig["id"]] = {"tickets": ts, "last_sl": float(sig["current_sl"]), "pair": sig["pair"], "entry": float(sig["entry"])}
            else:
                update_event_status(ev["id"], "FAILED", error="MT5 Execution Failed (Symbol missing/MT5 error)")
                copied_signals[sig["id"]] = {"tickets": [], "last_sl": float(sig["current_sl"]), "pair": sig["pair"], "entry": float(sig["entry"])}
        
        # 2. Auto Copy
        if profile.get("chart_ai_active"):
            for sig in fetch_active_signals():
                if sig["id"] not in copied_signals and not check_already_copied(sig["id"]):
                    logger.info(f"🤖 AUTO COPY: {sig['pair']}")
                    ts = execute_copy(sig, lot_size)
                    if ts:
                        log_copy_event(sig["id"], ts, "COPIED")
                        copied_signals[sig["id"]] = {"tickets": ts, "last_sl": float(sig["current_sl"]), "pair": sig["pair"], "entry": float(sig["entry"])}
                    else:
                        log_copy_event(sig["id"], [], "FAILED", error="MT5 auto-copy failed. Invalid symbol?")
                        copied_signals[sig["id"]] = {"tickets": [], "last_sl": float(sig["current_sl"]), "pair": sig["pair"], "entry": float(sig["entry"])}
        
        if copied_signals: sync_sl(copied_signals)
        time.sleep(1)

if __name__ == "__main__":
    main()
