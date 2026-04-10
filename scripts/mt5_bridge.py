import os
import time
import MetaTrader5 as mt5
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ CRITICAL: Supabase credentials missing from .env")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def initialize_mt5():
    if not mt5.initialize():
        print(f"❌ MT5 Initialization failed: {mt5.last_error()}")
        return False
    
    print("✅ MT5 Connected Successfully")
    account_info = mt5.account_info()
    if account_info:
        print(f"📡 Trading Account: {account_info.login}")
        print(f"🏢 Server: {account_info.server}")
    return True

def handle_pending_events():
    # Fetch events marked as PENDING
    try:
        response = supabase.table("copy_events").select("*").eq("status", "PENDING").execute()
        events = response.data
        
        if not events:
            return

        print(f"🚀 Found {len(events)} pending execution tasks...")

        for event in events:
            # Re-verify signal data from 'signals' table
            signal_res = supabase.table("signals").select("*").eq("id", event["signal_id"]).execute()
            if not signal_res.data:
                print(f"⚠️ Signal {event['signal_id']} not found.")
                continue
            
            sig = signal_res.data[0]
            
            # Map signal to MT5 order
            symbol = sig["pair"].replace("/", "") # MT5 uses concatenated symbol like XAUUSD
            direction = sig["direction"]
            lot = event.get("lot_size", 0.01)
            entry = float(sig["entry"])
            sl = float(sig["sl"]) if sig.get("sl") else 0
            tp = float(sig["tp1"]) if sig.get("tp1") else 0

            print(f"📈 Attempting {direction} {symbol} @ {entry} (Lot: {lot})...")

            # MT5 Order Request
            # User specifically asked for PENDING LIMIT orders for safety
            order_type = mt5.ORDER_TYPE_BUY_LIMIT if direction == "BUY" else mt5.ORDER_TYPE_SELL_LIMIT
            
            request = {
                "action": mt5.TRADE_ACTION_PENDING,
                "symbol": symbol,
                "volume": float(lot),
                "type": order_type,
                "price": entry,
                "sl": sl,
                "tp": tp,
                "magic": 123456,
                "comment": "ZenPips Institutional Bridge",
                "type_time": mt5.ORDER_TIME_GTC,
                "type_filling": mt5.ORDER_FILLING_IOC,
            }

            result = mt5.order_send(request)
            
            if result.retcode != mt5.TRADE_RETCODE_DONE:
                print(f"❌ MT5 Order Failed: {result.comment} (code: {result.retcode})")
                supabase.table("copy_events").update({
                    "status": "FAILED",
                    "error_message": f"MT5 Error: {result.comment}"
                }).eq("id", event["id"]).execute()
            else:
                print(f"✅ Order Placed! Ticket: {result.order}")
                supabase.table("copy_events").update({
                    "status": "SUCCESS",
                    "mt5_ticket": str(result.order),
                    "executed_at": "now()"
                }).eq("id", event["id"]).execute()

    except Exception as e:
        print(f"⚠️ Bridge Logic Error: {e}")

if __name__ == "__main__":
    print("--- Zen Pips Institutional MT5 Bridge Starting ---")
    if initialize_mt5():
        try:
            while True:
                handle_pending_events()
                time.sleep(2) # Poll every 2 seconds
        except KeyboardInterrupt:
            print("\n🛑 Bridge Stopping...")
        finally:
            mt5.shutdown()
