import requests

SUPABASE_URL = "https://cablmdyiymmkhseqfhxq.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhYmxtZHlpeW1ta2hzZXFmaHhxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk5NjkyOCwiZXhwIjoyMDg3NTcyOTI4fQ.vXziaDp3tMY15zFoi2wwud44QQboc-cEfMYlFNCGDaY"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

signals = [
    {
        "pair": "XAU/USD", "ticker": "XAUUSD", "source": "TradingView Admin", "timeframe": "M15", "direction": "BUY", "status": "CLOSED_CLEANUP",
        "entry": 2000, "tp1": 2020, "tp2": 2040, "tp3": 2060, "sl": 1980, "current_sl": 2000,
        "tp1_hit": True, "tp2_hit": False, "tp3_hit": False, "sl_hit": False, "closed": True, "total_pips": 200, "pip_multiplier": 10,
        "confluence": "High probability setup confirmed with internal confluence indicators.",
        "created_at": "2026-03-24T07:34:00+00:00"
    },
    {
        "pair": "XAU/USD", "ticker": "XAUUSD", "source": "London/NY overlap", "timeframe": "5m", "direction": "BUY", "status": "SL HIT",
        "entry": 4582.23, "tp1": 4604.18, "tp2": 4626.13, "tp3": 4648.08, "sl": 4560.27, "current_sl": 4560.27,
        "tp1_hit": False, "tp2_hit": False, "tp3_hit": False, "sl_hit": True, "closed": True, "total_pips": -220, "pip_multiplier": 10,
        "confluence": "London/NY overlap, bullish structure shift with clean BOS. Entry at demand zone retest.",
        "created_at": "2026-03-25T11:44:00+00:00"
    },
    {
        "pair": "XAU/USD", "ticker": "XAUUSD", "source": "NY Rejection", "timeframe": "M15", "direction": "SELL", "status": "FULL SWEEP — ALL 3 TPS HIT",
        "entry": 5169.43, "tp1": 5160.19, "tp2": 5150.96, "tp3": 5141.71, "sl": 5180.00, "current_sl": 5180.00,
        "tp1_hit": True, "tp2_hit": True, "tp3_hit": True, "sl_hit": False, "closed": True, "total_pips": 2772, "pip_multiplier": 100,
        "confluence": "Institutional rejection at the highs during NY session. Maven confirmed the short bias.",
        "created_at": "2026-02-24T16:00:00+00:00"
    },
    {
        "pair": "BTC/USD", "ticker": "BTCUSDT", "source": "Binance Session Low", "timeframe": "M15", "direction": "BUY", "status": "TP2 HIT | TRAILING",
        "entry": 63344.5, "tp1": 63904, "tp2": 64463.5, "tp3": 65023, "sl": 62785, "current_sl": 63344.5,
        "tp1_hit": True, "tp2_hit": True, "tp3_hit": False, "sl_hit": False, "closed": False, "total_pips": 1119, "pip_multiplier": 1,
        "confluence": "BTC bounced cleanly off the session low during London-NY overlap.",
        "created_at": "2026-02-24T14:00:00+00:00"
    },
    {
        "pair": "XAG/USD", "ticker": "XAGUSD", "source": "metals", "timeframe": "M15", "direction": "BUY", "status": "BREAK-EVEN",
        "entry": 87.39, "tp1": 88.00, "tp2": 89.00, "tp3": 90.00, "sl": 86.50, "current_sl": 87.39,
        "tp1_hit": False, "tp2_hit": False, "tp3_hit": False, "sl_hit": False, "closed": True, "total_pips": 0, "pip_multiplier": 100,
        "confluence": "M15 Silver tracking Gold bid. Trailed back to entry after showing initial strength.",
        "created_at": "2026-02-24T15:00:00+00:00"
    }
]

for s in signals:
    response = requests.post(f"{SUPABASE_URL}/rest/v1/signals", headers=headers, json=s)
    if response.status_code in (200, 201):
        print(f"Successfully restored {s['pair']} {s['entry']}")
    else:
        print(f"Failed to restore {s['pair']}: {response.text}")
