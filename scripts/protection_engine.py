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
#  ZEN PIPS GLOBAL PROTECTION ENGINE v2.0
#  ──────────────────────────────────────
#  Trademark 3-Order Split: 0.01 lot × 3 orders per signal
#
#  RULES:
#    1. Each signal deploys 3 positions: TP1, TP2, TP3
#       All at 0.01 lot size with the same Stop Loss.
#
#    2. TP1 HIT → TP1 position closes naturally (MT5 handles this).
#       NO stop loss modification. TP2 and TP3 continue running
#       with their original SL.
#
#    3. TP2 HIT → TP2 position closes naturally (MT5 handles this).
#       MOVE the Stop Loss of TP3 to the TP1 price level.
#       This locks in profit on the final runner.
#
#    4. TP3 HIT → All positions closed. Signal lifecycle complete.
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

        # Filter to only ZenPips positions (magic number 123456)
        zen_positions = [p for p in positions if p.magic == 123456]

        for signal in active_signals:
            # Match positions to signal by symbol
            pair_clean = signal["pair"].replace("/", "")
            pair_positions = [p for p in zen_positions if p.symbol.startswith(pair_clean)]

            if not pair_positions and not signal.get("tp1_hit"):
                # Signal might not yet be triggered or no matching positions
                continue

            # Identify TP1, TP2, TP3 positions by comment tag
            pos_tp1 = next((p for p in pair_positions if "TP1" in (p.comment or "")), None)
            pos_tp2 = next((p for p in pair_positions if "TP2" in (p.comment or "")), None)
            pos_tp3 = next((p for p in pair_positions if "TP3" in (p.comment or "")), None)

            tp1_price = float(signal["tp1"]) if signal.get("tp1") else 0

            # ─────────────────────────────────────────────────
            # RULE 1: TP1 HIT → Only TP1 closes. No SL change.
            # ─────────────────────────────────────────────────
            # TP1 has closed naturally (position gone), mark it
            if pos_tp1 is None and (pos_tp2 or pos_tp3) and not signal.get("tp1_hit"):
                print(f"🎯 TP1 HIT for {signal['pair']} — TP1 closed. No SL modification. TP2/TP3 running.")
                supabase.table("signals").update({
                    "tp1_hit": True
                }).eq("id", signal["id"]).execute()

            # ─────────────────────────────────────────────────
            # RULE 2: TP2 HIT → Move SL of TP3 to TP1 level.
            # ─────────────────────────────────────────────────
            # TP2 has closed naturally (position gone), TP3 still running
            if pos_tp1 is None and pos_tp2 is None and pos_tp3 and not signal.get("tp2_hit"):
                # Move TP3 stop loss to TP1 price (lock profit)
                if tp1_price > 0 and abs(pos_tp3.sl - tp1_price) > 0.0001:
                    print(f"🛡️ TP2 HIT for {signal['pair']} — Moving TP3 SL to TP1 level ({tp1_price})")
                    request = {
                        "action": mt5.TRADE_ACTION_SLTP,
                        "position": pos_tp3.ticket,
                        "sl": tp1_price,
                        "tp": pos_tp3.tp
                    }
                    result = mt5.order_send(request)
                    if result and result.retcode == mt5.TRADE_RETCODE_DONE:
                        print(f"   ✅ SL moved to {tp1_price} for ticket {pos_tp3.ticket}")
                    else:
                        err = result.comment if result else mt5.last_error()
                        print(f"   ❌ SL modification failed: {err}")

                supabase.table("signals").update({
                    "tp2_hit": True
                }).eq("id", signal["id"]).execute()

            # ─────────────────────────────────────────────────
            # RULE 3: ALL CLOSED → Signal lifecycle complete.
            # ─────────────────────────────────────────────────
            if not pos_tp1 and not pos_tp2 and not pos_tp3 and signal.get("tp1_hit"):
                print(f"🏁 Signal {signal['pair']} complete — All 3 positions closed.")
                supabase.table("signals").update({
                    "status": "CLOSED",
                    "closed": True
                }).eq("id", signal["id"]).execute()

    except Exception as e:
        print(f"⚠️ Protection Engine Error: {e}")


if __name__ == "__main__":
    print("═══════════════════════════════════════════════════")
    print("  ZEN PIPS GLOBAL PROTECTION ENGINE v2.0")
    print("  Split: 0.01 × 3 | TP1→Close | TP2→SL to TP1")
    print(f"  Session: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("═══════════════════════════════════════════════════")

    if initialize_mt5():
        last_heartbeat = time.time()
        try:
            while True:
                monitor_protection()

                # Heartbeat every 60s
                if time.time() - last_heartbeat > 60:
                    ts = datetime.now().strftime('%H:%M:%S')
                    active_count = len(mt5.positions_get() or [])
                    print(f"[{ts}] 💓 Monitoring {active_count} open positions...")
                    last_heartbeat = time.time()

                time.sleep(5)  # Poll every 5 seconds
        except KeyboardInterrupt:
            print("\n🛑 Protection Engine Stopping...")
        finally:
            mt5.shutdown()
            print("✅ MT5 Disconnected. Engine offline.")
