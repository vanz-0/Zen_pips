import os
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import datetime

base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(base_path, '.env')
load_dotenv(env_path)

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ CRITICAL: Supabase credentials missing")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

news_content = """🌅 **ZEN PIPS INSTITUTIONAL NEWS BRIEF: WEEK OF APRIL 26 - MAY 2** 🌅

Market conditions are heavily influenced by the BOJ and Federal Reserve decisions this week, alongside ongoing geopolitical tension in the Strait of Hormuz.

🚨 **HIGH IMPACT EVENTS TO WATCH:** 🚨
- **Central Banks:** Bank of Japan (BOJ) Interest Rate Decisions & Fed FOMC Meetings.
- **Tuesday, Apr 28:** USD CB Consumer Confidence, S&P/CS Composite-20 HPI, ADP Weekly Employment.
- **Geopolitical Watch:** Geopolitical conflict driving volatility in Oil and safe-haven currencies.

*Risk Protocol: Manage exposure around 1:00 PM - 3:00 PM EST daily. Consider moving SL to entry on active pairs before major red folder events.*

*Powered by Autonomous News Engine*"""

try:
    supabase.table("community_messages").insert([{
        "content": news_content,
        "channel": "market-news",
        "user_id": "00000000-0000-0000-0000-000000000000"
    }]).execute()
    print("✅ Successfully posted weekly news brief to the #market-news channel.")
except Exception as e:
    print(f"❌ Failed to post news: {e}")
