import os
import requests
from dotenv import load_dotenv
from pathlib import Path

# Load env
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

signals = [
    {
        "pair": "BTC/USD", "ticker": "BTCUSDT", "source": "binance", "timeframe": "M15", "direction": "BUY", "status": "TP2 HIT · RISK-FREE",
        "entry": 63945, "tp1": 65105, "tp2": 66265, "tp3": 67425, "sl": 62785, "current_sl": 63945,
        "tp1_hit": True, "tp2_hit": True, "tp3_hit": False, "sl_hit": False, "closed": False, "total_pips": 3480, "pip_multiplier": 1,
        "confluence": "Institutional demand at 63,900. HTF bullish structure confirmed."
    },
    {
        "pair": "XAU/USD", "ticker": "XAUUSD", "source": "metals", "timeframe": "M15", "direction": "BUY", "status": "ALL TPs HIT",
        "entry": 5185.42, "tp1": 5230.28, "tp2": 5275.13, "tp3": 5319.99, "sl": 5140.57, "current_sl": 5140.57,
        "tp1_hit": True, "tp2_hit": True, "tp3_hit": True, "sl_hit": False, "closed": True, "total_pips": 13457, "pip_multiplier": 100,
        "confluence": "M15 New York reversal. Price swept liquidity and broke structure."
    },
    {
        "pair": "XAG/USD", "ticker": "XAGUSD", "source": "metals", "timeframe": "M15", "direction": "BUY", "status": "ALL TPs HIT",
        "entry": 88.46, "tp1": 90.08, "tp2": 91.70, "tp3": 93.32, "sl": 86.85, "current_sl": 86.85,
        "tp1_hit": True, "tp2_hit": True, "tp3_hit": True, "sl_hit": False, "closed": True, "total_pips": 486, "pip_multiplier": 100,
        "confluence": "M15 Silver tracking Gold bid. Clear bullish displacement."
    },
    {
        "pair": "XAU/USD", "ticker": "XAUUSD", "source": "metals", "timeframe": "M5", "direction": "BUY", "status": "TP1 HIT · SL AT ENTRY",
        "entry": 5168.73, "tp1": 5194.88, "tp2": 5221.04, "tp3": 5247.19, "sl": 5142.57, "current_sl": 5168.73,
        "tp1_hit": True, "tp2_hit": False, "tp3_hit": False, "sl_hit": False, "closed": False, "total_pips": 2615, "pip_multiplier": 100,
        "confluence": "Accumulation below 5,170. Session low bounce."
    },
    {
        "pair": "XAG/USD", "ticker": "XAGUSD", "source": "metals", "timeframe": "M5", "direction": "BUY", "status": "ALL TPs HIT",
        "entry": 88.19, "tp1": 89.19, "tp2": 90.19, "tp3": 91.19, "sl": 87.18, "current_sl": 87.18,
        "tp1_hit": True, "tp2_hit": True, "tp3_hit": True, "sl_hit": False, "closed": True, "total_pips": 300, "pip_multiplier": 100,
        "confluence": "Correlated with gold bid. Higher-low M5 formation."
    }
]

for s in signals:
    s["check_interval_minutes"] = 15 if s["timeframe"] == "M5" else 60
    url = f"{SUPABASE_URL}/rest/v1/signals"
    response = requests.post(url, headers=headers, json=s)
    if response.status_code in (200, 201):
        print(f"Successfully inserted {s['pair']} {s['timeframe']}")
    else:
        print(f"Failed to insert {s['pair']}: {response.text}")

print("Seeding complete.")
