import os
from supabase import create_client, Client
from dotenv import load_dotenv

base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(base_path, '.env')
load_dotenv(env_path)

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ CRITICAL: Supabase credentials missing")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def inject_signal():
    # 1. Insert Signal
    print("[*] Inserting GBPUSD SELL signal...")
    signal_data = {
        "pair": "GBPUSD",
        "ticker": "GBPUSD",
        "timeframe": "1M",
        "direction": "SELL",
        "entry": 1.34766,
        "sl": 1.34800,
        "current_sl": 1.34800,
        "tp1": 1.34720,
        "tp2": 1.34680,
        "tp3": 1.34640,
        "status": "ACTIVE"
    }
    
    sig_res = supabase.table("signals").insert(signal_data).execute()
    if not sig_res.data:
        print("[FAIL] Could not insert signal.")
        return
        
    signal_id = sig_res.data[0]["id"]
    print(f"[OK] Signal inserted with ID: {signal_id}")
    
    # 2. Broadcast to Telegram via direct fetch to Telegram API since local server might not be running
    import requests
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
    channel_id = os.getenv("TELEGRAM_CHANNEL_ID")
    
    if bot_token and channel_id:
        print("[*] Triggering Telegram Broadcast...")
        msg = f"🔔 <b>NEW INSTITUTIONAL SIGNAL</b>\n\n<b>Pair:</b> {signal_data['pair']}\n<b>Direction:</b> {signal_data['direction']}\n<b>Entry:</b> {signal_data['entry']}\n<b>SL:</b> {signal_data['sl']}\n<b>TP1:</b> {signal_data['tp1']}\n<b>TP2:</b> {signal_data['tp2']}\n<b>TP3:</b> {signal_data['tp3']}"
        url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        try:
            res = requests.post(url, json={"chat_id": channel_id, "text": msg, "parse_mode": "HTML"})
            if res.ok:
                print("[OK] Broadcast sent to Telegram")
            else:
                print(f"[FAIL] Telegram broadcast failed: {res.text}")
        except Exception as e:
            print(f"[WARN] Telegram broadcast exception: {e}")
    else:
        print("[WARN] Telegram credentials not found in .env")
        
    # 3. Create Copy Event for MT5 Bridge
    print("[*] Creating copy_event for MT5 Bridge (Account 25803510)...")
    
    event_data = {
        "signal_id": signal_id,
        "mt5_account_id": "25803510",
        "status": "PENDING",
        "lot_size": 0.01
    }
    
    ev_res = supabase.table("copy_events").insert(event_data).execute()
    if ev_res.data:
        print("[SUCCESS] Signal Bridge triggered successfully! MT5 should pick this up momentarily.")
    else:
        print("[FAIL] Failed to create copy_event")

if __name__ == "__main__":
    inject_signal()
