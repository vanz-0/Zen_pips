import os
import time
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client, Client
import subprocess

load_dotenv('.env')

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Missing credentials.")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_upcoming_news():
    """Fetch high/medium impact news for today."""
    today_str = datetime.utcnow().strftime('%Y-%m-%d')
    res = supabase.table('market_news').select('*').eq('event_date', today_str).execute()
    return res.data

def parse_time(time_str):
    """Parse time string like '10:30am' or '2:15pm' into a datetime object for today."""
    try:
        t = datetime.strptime(time_str.lower(), "%I:%M%p").time()
        now = datetime.utcnow()
        return datetime.combine(now.date(), t)
    except Exception as e:
        # If it's just '8:30pm' without space
        try:
             t = datetime.strptime(time_str.lower().replace(" ", ""), "%I:%M%p").time()
             now = datetime.utcnow()
             return datetime.combine(now.date(), t)
        except:
            return None

def main_loop():
    print("ZAIN News Watcher (The 15-min Guardian) started.")
    processed_events = set()
    
    while True:
        try:
            news_items = get_upcoming_news()
            now = datetime.utcnow()
            
            for item in news_items:
                event_time = parse_time(item['event_time'])
                if not event_time: continue
                
                # Calculate time difference
                time_diff = event_time - now
                
                # If event is in exactly 15 minutes (allowing a 60s window)
                if timedelta(minutes=14) < time_diff < timedelta(minutes=15) and item['id'] not in processed_events:
                    print(f"🚨 TARGET DETECTED: {item['event_name']} in 15 minutes.")
                    
                    # 1. Trigger the news_agent.py to start discussion
                    print("Initiating Multi-Persona Engagement...")
                    subprocess.run(["python", "scripts/market_data/news_agent.py"])
                    
                    # 2. Inject high-impact warning to general chat
                    supabase.table("community_messages").insert({
                        "content": f"🔥 **WARNING**: {item['currency']} {item['event_name']} is firing in 15 minutes. Prepare for institutional displacement.",
                        "channel": "general-chat"
                    }).execute()
                    
                    processed_events.add(item['id'])
            
            # Reset processed events at midnight
            if now.hour == 0 and now.minute == 0:
                processed_events.clear()
                
            time.sleep(60) # Watch every minute
        except Exception as e:
            print(f"Error in Watcher: {e}")
            time.sleep(60)

if __name__ == "__main__":
    main_loop()
