import os
import requests
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client

# Load Environment
load_dotenv('.env')

FINNHUB_KEY = os.getenv("FINNHUB_API_KEY")
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
FREE_GROUP_ID = os.getenv("FREE_GROUP_ID")

if not all([FINNHUB_KEY, SUPABASE_URL, SUPABASE_KEY]):
    print("❌ Missing environment variables for news check.")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def send_telegram(text):
    if not TELEGRAM_BOT_TOKEN or not FREE_GROUP_ID:
        return
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    requests.post(url, json={
        "chat_id": FREE_GROUP_ID,
        "text": text,
        "parse_mode": "Markdown"
    })

def check_news():
    print(f"[*] Checking High Impact News for {datetime.now().strftime('%Y-%m-%d')}...")
    
    today = datetime.now().strftime('%Y-%m-%d')
    url = f"https://finnhub.io/api/v1/calendar/economic?from={today}&to={today}&token={FINNHUB_KEY}"
    
    try:
        response = requests.get(url)
        data = response.json()
        
        events = data.get("economicCalendar", [])
        # Filter for high/medium impact on major currencies
        high_impact = [e for e in events if e.get("impact") in ["high", "medium"] and e.get("country") in ["USD", "EUR", "GBP", "JPY", "AUD"]]
        
        if not high_impact:
            print("✅ No high impact volatility expected today.")
            return

        print(f"[+] Found {len(high_impact)} relevant events.")
        
        news_report = "📰 *INSTITUTIONAL ECONOMIC CALENDAR*\n\n"
        
        for event in high_impact:
            # Prepare for DB
            news_data = {
                "event_date": today,
                "event_time": event.get("time", ""),
                "currency": event.get("country", ""),
                "event_name": event.get("event", ""),
                "impact": event.get("impact", "").capitalize(),
                "actual": str(event.get("actual", "")),
                "forecast": str(event.get("estimate", "")),
                "previous": str(event.get("previous", ""))
            }
            
            # Insert to DB
            supabase.table("market_news").insert(news_data).execute()
            
            # Add to report
            news_report += f"🔹 *{news_data['currency']}*: {news_data['event_name']}\n"
            news_report += f"   Impact: {news_data['impact']} | Time: {news_data['event_time']}\n"
            news_report += f"   Forecast: {news_data['forecast']} | Prev: {news_data['previous']}\n\n"

        news_report += "🚨 *ADVISORY*: High-impact data releases often cause significant slippage. Automated blackouts may be enforced in 15-minute intervals surrounding these times."
        
        # Post to Community
        supabase.table("community_messages").insert({
            "user_id": "00000000-0000-0000-0000-000000000000",
            "channel": "general",
            "content": news_report
        }).execute()
        
        # Send Telegram
        send_telegram(news_report)
        print("[+] News report broadcasted.")
        
    except Exception as e:
        print(f"⚠️ Error checking news: {e}")

if __name__ == "__main__":
    check_news()
