import os
import time
import MetaTrader5 as mt5
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import datetime

# Load Environment — look for .env in the parent directory (project root)
base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(base_path, '.env')
load_dotenv(env_path)

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print(f"❌ CRITICAL: Supabase credentials missing from {env_path}")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ═══════════════════════════════════════════════════════════════════
#  ZEN PIPS GLOBAL PROTECTION ENGINE v2.5 (Order-Count Logic)
#  ──────────────────────────────────────
#  Interval: Every 15 minutes
#  Logic:
#    - 3 Orders Active = No Targets Hit
#    - 2 Orders Active = TP1 Hit. Move SL to Entry.
#    - 1 Order Active = TP2 Hit. Move SL to TP1.
#    - 0 Orders Active = Signal Closed (Hit all TPs or SL).
# ═══════════════════════════════════════════════════════════════════

def initialize_mt5():
    if not mt5.initialize():
        print(f"❌ MT5 Initialization failed: {mt5.last_error()}")
        return False
    print("✅ MT5 Connected for Protection Monitoring")
    account_info = mt5.account_info()
    if account_info:
        print(f"📡 Account: {account_info.login} | Server: {account_info.server}")
    return True

def monitor_protection():
    try:
        # 1. Fetch active signals from Supabase
        signals_res = supabase.table("signals").select("*").eq("status", "ACTIVE").execute()
        active_signals = signals_res.data
        if not active_signals:
            return

        # 2. Fetch all open positions in MT5
        positions = mt5.positions_get()
        if positions is None:
            print(f"⚠️ No positions found or MT5 Error: {mt5.last_error()}")
            return

        zen_positions = [p for p in positions if p.magic == 123456]

        for signal in active_signals:
            pair_clean = signal["pair"].replace("/", "")
            pair_positions = [p for p in zen_positions if p.symbol.startswith(pair_clean)]
            
            count = len(pair_positions)
            
            entry_price = float(signal["entry"]) if signal.get("entry") else 0
            tp1_price = float(signal["tp1"]) if signal.get("tp1") else 0

            if count == 3:
                # No TPs hit yet
                pass

            elif count == 2 and not signal.get("tp1_hit"):
                print(f"🎯 TP1 HIT for {signal['pair']} — 2 orders remain. Moving SL to Entry ({entry_price}).")
                # Move SL to Entry for remaining 2 positions
                for pos in pair_positions:
                    if entry_price > 0 and abs(pos.sl - entry_price) > 0.0001:
                        req = {
                            "action": mt5.TRADE_ACTION_SLTP,
                            "position": pos.ticket,
                            "sl": entry_price,
                            "tp": pos.tp
                        }
                        res = mt5.order_send(req)
                        if res and res.retcode == mt5.TRADE_RETCODE_DONE:
                            print(f"   ✅ SL moved to Entry {entry_price} for ticket {pos.ticket}")
                
                supabase.table("signals").update({"tp1_hit": True}).eq("id", signal["id"]).execute()

            elif count == 1 and not signal.get("tp2_hit"):
                print(f"🛡️ TP2 HIT for {signal['pair']} — 1 order remains. Moving SL to TP1 ({tp1_price}).")
                # Move SL to TP1 for the final position
                pos = pair_positions[0]
                if tp1_price > 0 and abs(pos.sl - tp1_price) > 0.0001:
                    req = {
                        "action": mt5.TRADE_ACTION_SLTP,
                        "position": pos.ticket,
                        "sl": tp1_price,
                        "tp": pos.tp
                    }
                    res = mt5.order_send(req)
                    if res and res.retcode == mt5.TRADE_RETCODE_DONE:
                        print(f"   ✅ SL moved to TP1 {tp1_price} for ticket {pos.ticket}")
                
                supabase.table("signals").update({"tp1_hit": True, "tp2_hit": True}).eq("id", signal["id"]).execute()

            elif count == 0 and (signal.get("tp1_hit") or signal.get("tp2_hit") or not signal.get("closed")):
                # Check if it was ever triggered (if count is 0 because pending orders haven't triggered, we must ignore)
                # We assume if count is 0, we must check MT5 history to see if they were closed.
                # To simplify, if count drops to 0 AFTER being active, it's closed.
                print(f"🏁 Signal {signal['pair']} complete — 0 orders remain.")
                supabase.table("signals").update({
                    "status": "CLOSED",
                    "closed": True
                }).eq("id", signal["id"]).execute()

    except Exception as e:
        print(f"⚠️ Protection Engine Error: {e}")

if __name__ == "__main__":
    print("═══════════════════════════════════════════════════")
    print("  ZEN PIPS GLOBAL PROTECTION ENGINE v2.5")
    print("  Split: 0.01 × 3 | Order-Count Logic | 15 Min Interval")
    print(f"  Session: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("═══════════════════════════════════════════════════")

    if initialize_mt5():
        last_heartbeat = time.time()
        try:
            while True:
                monitor_protection()

                # Heartbeat
                ts = datetime.now().strftime('%H:%M:%S')
                active_count = len(mt5.positions_get() or [])
                print(f"[{ts}] 💓 Monitoring {active_count} open positions. Sleeping for 15 mins...")
                
                # Sleep for 15 minutes (900 seconds)
                time.sleep(900)
        except KeyboardInterrupt:
            print("\n🛑 Protection Engine Stopping...")
        finally:
            mt5.shutdown()
            print("✅ MT5 Disconnected. Engine offline.")
