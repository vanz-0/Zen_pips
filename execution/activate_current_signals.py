import requests

SUPABASE_URL = "https://cablmdyiymmkhseqfhxq.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhYmxtZHlpeW1ta2hzZXFmaHhxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk5NjkyOCwiZXhwIjoyMDg3NTcyOTI4fQ.vXziaDp3tMY15zFoi2wwud44QQboc-cEfMYlFNCGDaY"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

# 1. Gold Update (4544.85)
gold_id = "227e7e0a-13fd-41c6-83a7-30fb2cdee716"
gold_data = {
    "closed": False,
    "tp1_hit": True,
    "tp2_hit": True,
    "current_sl": 4544.85,
    "status": "TP2 HIT - LOCKET PROFITS",
    "created_at": "2026-03-26T16:55:00+00:00"
}

resp_gold = requests.patch(f"{SUPABASE_URL}/rest/v1/signals?id=eq.{gold_id}", headers=headers, json=gold_data)
print(f"Gold Update status: {resp_gold.status_code}")

# 2. Silver Update (72.95)
silver_id = "2de803eb-f856-4e09-b548-c047a0bb9e0f"
silver_data = {
    "closed": False,
    "tp1_hit": True,
    "tp2_hit": True,
    "current_sl": 72.95,
    "status": "TP2 HIT - LOCKET PROFITS",
    "created_at": "2026-03-26T16:55:01+00:00"
}

resp_silver = requests.patch(f"{SUPABASE_URL}/rest/v1/signals?id=eq.{silver_id}", headers=headers, json=silver_data)
print(f"Silver Update status: {resp_silver.status_code}")
