import os
import time
import datetime
from dotenv import load_dotenv
from supabase import create_client, Client
from openai import OpenAI

load_dotenv()

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY, OPENAI_API_KEY]):
    print("[ERROR] Missing required environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY)")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
client = OpenAI(api_key=OPENAI_API_KEY)

def generate_daily_brief(news_events):
    if not news_events:
        return "No high-impact news scheduled for today. Markets should respect technical levels."
    
    prompt = "You are Zen Pips AI, an institutional trading assistant.\n"
    prompt += "Provide a daily brief based on the following high-impact news events for today:\n"
    for event in news_events:
        prompt += f"- {event['time']} : {event['country']} {event['title']} (Forecast: {event.get('forecast', 'N/A')})\n"
    
    prompt += "\nFormat as a short, institutional Telegram message warning traders of volatility windows and giving a bearish/bullish tilt. Use emojis."

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=250
    )
    return response.choices[0].message.content

def generate_news_warning(event):
    prompt = "You are Zen Pips AI. Provide a 1-sentence institutional warning that high-impact news is dropping in 15 minutes.\n"
    prompt += f"Event: {event['country']} {event['title']} at {event['time']}.\n"
    prompt += "Advise traders to manage risk, close partials, or move SL to break even. Use emojis."

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=100
    )
    return response.choices[0].message.content

def post_to_community(content):
    post_message = f"🌅 **ZEN PIPS DAILY INSTITUTIONAL BRIEF** 🌅\n\n{content}\n\n*Powered by Autonomous News Engine*"
    try:
        supabase.table("community_messages").insert([{
            "content": post_message,
            "channel": "general-chat",
            "user_id": "00000000-0000-0000-0000-000000000000"
        }]).execute()
        print("[SUCCESS] Posted message to community.")
    except Exception as e:
        print(f"[ERROR] Failed to post message: {e}")

def run_engine():
    print("=== ZEN PIPS AUTONOMOUS NEWS ENGINE STARTED ===")
    
    while True:
        now = datetime.datetime.now()
        today_str = now.strftime('%Y-%m-%d')
        print(f"\n[INFO] Heartbeat at {now.strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Determine 1:00 AM target
        target_1am = now.replace(hour=1, minute=0, second=0, microsecond=0)
        if now >= target_1am:
            target_1am = target_1am + datetime.timedelta(days=1)
        
        # Fetch today's news
        try:
            response = supabase.table("news").select("*").eq("impact", "High").eq("date", today_str).execute()
            today_news = response.data
        except Exception as e:
            print(f"[ERROR] Failed to fetch news: {e}")
            today_news = []
            
        events_schedule = []
        
        # Add 1 AM Brief
        events_schedule.append({
            'type': 'DAILY_BRIEF',
            'time': target_1am,
            'data': today_news
        })
        
        # Add 15-min warnings
        for n in today_news:
            if not n.get('time'): continue
            try:
                # Assuming time format "HH:MM AM/PM" or similar, handled by datetime
                # Wait, Forex Factory time format is often "8:30am". 
                # We need to parse it relative to 'today_str'.
                time_str = n['time'].upper().strip()
                news_time = datetime.datetime.strptime(f"{today_str} {time_str}", "%Y-%m-%d %I:%M%p")
                
                # Adjust for timezone if necessary? We'll assume local system time matches the news source timezone for now.
                warning_time = news_time - datetime.timedelta(minutes=15)
                
                if warning_time > now:
                    events_schedule.append({
                        'type': 'NEWS_WARNING',
                        'time': warning_time,
                        'data': n
                    })
            except Exception as e:
                print(f"[WARN] Could not parse time for event {n.get('title')}: {e}")
        
        # Sort by time
        events_schedule.sort(key=lambda x: x['time'])
        
        next_event = events_schedule[0]
        sleep_seconds = (next_event['time'] - now).total_seconds()
        
        if sleep_seconds > 0:
            print(f"[SLEEP] Waiting {sleep_seconds:.1f} seconds for {next_event['type']} at {next_event['time']}")
            time.sleep(sleep_seconds)
        
        # Execute Event
        if next_event['type'] == 'DAILY_BRIEF':
            print("[ACTION] Generating Daily Brief...")
            content = generate_daily_brief(next_event['data'])
            post_to_community(content)
        elif next_event['type'] == 'NEWS_WARNING':
            print(f"[ACTION] Generating News Warning for {next_event['data'].get('title')}...")
            content = generate_news_warning(next_event['data'])
            # Different header for warnings
            post_message = f"🚨 **HIGH IMPACT NEWS IN 15 MINS** 🚨\n\n{content}\n\n*Automated Risk Management Protocol*"
            try:
                supabase.table("community_messages").insert([{
                    "content": post_message,
                    "channel": "general-chat",
                    "user_id": "00000000-0000-0000-0000-000000000000"
                }]).execute()
            except Exception as e:
                print(f"[ERROR] Failed to post warning: {e}")
        
        # Sleep a tiny bit to avoid rapid looping on the same second
        time.sleep(2)

if __name__ == "__main__":
    run_engine()
