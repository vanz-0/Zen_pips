import os
import time
from datetime import datetime
import MetaTrader5 as mt5
from supabase import create_client, Client
from dotenv import load_dotenv

# 1. Environment Location fix: Look for .env in the parent directory (project root)
base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(base_path, '.env')
load_dotenv(env_path)

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print(f"❌ CRITICAL: Supabase credentials missing from {env_path}")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def initialize_mt5():
    if not mt5.initialize():
        print(f"[FAIL] MT5 Initialization failed: {mt5.last_error()}")
        return False
    
    print("[OK] MT5 Connected Successfully")
    account_info = mt5.account_info()
    if account_info:
        print(f"[*] Trading Account: {account_info.login}")
        print(f"[*] Server: {account_info.server}")
    return True

def get_vantage_symbol(base_pair):
    """
    Vantage MT5 accounts often use suffixes like .v or + 
    This function attempts to find the correct symbol on the terminal.
    """
    clean_pair = base_pair.replace("/", "")
    suffixes = ["", ".v", "+", "m", "c"] # Common suffixes
    
    for suffix in suffixes:
        symbol = f"{clean_pair}{suffix}"
        info = mt5.symbol_info(symbol)
        if info is not None:
            if not info.visible:
                mt5.symbol_select(symbol, True)
            return symbol
            
    return clean_pair # Fallback to base

def handle_pending_events():
    try:
        response = supabase.table("copy_events").select("*").eq("status", "PENDING").execute()
        events = response.data
        
        if not events:
            return

        print(f"[{datetime.now().strftime('%H:%M:%S')}] [*] Found {len(events)} pending execution tasks...")

        for event in events:
            # Re-verify signal data from 'signals' table
            signal_res = supabase.table("signals").select("*").eq("id", event["signal_id"]).execute()
            if not signal_res.data:
                print(f"[WARN] Signal {event['signal_id']} not found.")
                continue
            
            sig = signal_res.data[0]
            
            # Map signal to MT5 order
            symbol = get_vantage_symbol(sig["pair"])
            direction = sig["direction"]
            # Trademark 3-Order Split: Always 0.01 lot x 3 orders
            split_lot = 0.01
            
            entry = float(sig["entry"])
            sl = float(sig["sl"]) if sig.get("sl") else 0
            
            tps = [
                float(sig["tp1"]) if sig.get("tp1") else 0,
                float(sig["tp2"]) if sig.get("tp2") else 0,
                float(sig["tp3"]) if sig.get("tp3") else 0
            ]

            print(f"[*] Attempting 3-Order Split for {direction} {symbol} @ {entry} (0.01 x 3)...")

            # FETCH LIVE PRICE for Logic
            tick = mt5.symbol_info_tick(symbol)
            if not tick:
                print(f"[FAIL] Failed to get live tick for {symbol}. Cannot determine LIMIT vs STOP.")
                continue
                
            current_price = tick.ask if direction == "BUY" else tick.bid
            
            if direction == "BUY":
                # Market > Entry -> Buy Limit. Market < Entry -> Buy Stop
                order_type = mt5.ORDER_TYPE_BUY_LIMIT if current_price > entry else mt5.ORDER_TYPE_BUY_STOP
                log_type = "LIMIT" if current_price > entry else "STOP"
            else:
                # Market < Entry -> Sell Limit. Market > Entry -> Sell Stop
                order_type = mt5.ORDER_TYPE_SELL_LIMIT if current_price < entry else mt5.ORDER_TYPE_SELL_STOP
                log_type = "LIMIT" if current_price < entry else "STOP"

            print(f"   [Routing] Live: {current_price} | Entry: {entry} | Selected: {direction}_{log_type}")

            deployed_tickets = []
            
            for i, tp in enumerate(tps):
                if tp == 0: continue
                
                request = {
                    "action": mt5.TRADE_ACTION_PENDING,
                    "symbol": symbol,
                    "volume": split_lot,
                    "type": order_type,
                    "price": entry,
                    "sl": sl,
                    "tp": tp,
                    "magic": 123456,
                    "comment": f"ZenPips TP{i+1}",
                    "type_time": mt5.ORDER_TIME_GTC,
                    "type_filling": mt5.ORDER_FILLING_RETURN,
                }

                result = mt5.order_send(request)
                
                if result.retcode != mt5.TRADE_RETCODE_DONE:
                    print(f"[FAIL] TP{i+1} Order Failed: {result.comment}")
                else:
                    print(f"[OK] TP{i+1} Set! Ticket: {result.order}")
                    deployed_tickets.append(str(result.order))

            if deployed_tickets:
                supabase.table("copy_events").update({
                    "status": "SUCCESS",
                    "mt5_tickets": deployed_tickets
                }).eq("id", event["id"]).execute()
            else:
                supabase.table("copy_events").update({
                    "status": "FAILED",
                    "error_message": "All 3 order attempts failed."
                }).eq("id", event["id"]).execute()

    except Exception as e:
        print(f"[WARN] Bridge Logic Error: {e}")

if __name__ == "__main__":
    print("--- Zen Pips Institutional MT5 Bridge Starting ---")
    print(f"[*] Session: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    if initialize_mt5():
        last_heartbeat = time.time()
        try:
            while True:
                handle_pending_events()
                
                # Heartbeat every 60s
                if time.time() - last_heartbeat > 60:
                    print(f"[{datetime.now().strftime('%H:%M:%S')}] [*] Polling active...")
                    last_heartbeat = time.time()
                    
                time.sleep(2) 
        except KeyboardInterrupt:
            print("\n[!] Bridge Stopping...")
        finally:
            mt5.shutdown()
