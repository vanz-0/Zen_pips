import os
import sys
import io
import requests
import xml.etree.ElementTree as ET
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client

if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Load environment variables
load_dotenv('.env')

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Supabase credentials not found in .env")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def fetch_and_sync_forex_factory():
    """
    Fetches the free public XML schedule from Forex Factory,
    parses it, and syncs high/medium impact events to Supabase 'market_news'.
    This fulfills the SGTP (HTTP) caching logic avoiding Apify/Finnhub blocks.
    """
    # Direct public XML feed for this week's calendar
    url = "https://nfs.faireconomy.media/ff_calendar_thisweek.xml"
    print(f"Fetching Forex Factory Schedule from: {url} ...")
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                      "(KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        
        root = ET.fromstring(response.content)
        events_added = 0
        
        # Clear upcoming events from today onwards, so we don't have duplicates
        # when caching the fresh weekly fetch.
        today_str = datetime.utcnow().strftime('%Y-%m-%d')
        supabase.table("market_news").delete().gte("event_date", today_str).execute()
        
        for event in root.findall('event'):
            title = event.findtext('title')
            country = event.findtext('country')
            date_str = event.findtext('date')   # Format: 10-21-2026
            time_str = event.findtext('time')   # Format: 8:30am
            impact = event.findtext('impact')   # High, Medium, Low, Non
            forecast = event.findtext('forecast')
            previous = event.findtext('previous')
            
            # Institutional scope: High/Medium impact on major currencies
            if impact in ["High", "Medium"] and country in ["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "NZD"]:
                try:
                    dt = datetime.strptime(date_str, "%m-%d-%Y")
                    formatted_date = dt.strftime("%Y-%m-%d")
                except Exception as e:
                    formatted_date = date_str
                
                data = {
                    "event_date": formatted_date,
                    "event_time": time_str,
                    "currency": country,
                    "event_name": title,
                    "impact": impact,
                    "actual": "N/A",  # TBD or cached empty
                    "forecast": forecast or "N/A",
                    "previous": previous or "N/A"
                }
                
                supabase.table("market_news").insert(data).execute()
                events_added += 1
                
        print(f"✅ Successfully cached {events_added} High/Medium impact events to Supabase 'market_news'.")
        print("This script can safely be run via Cron at 1:00 AM daily or weekly.")
        
    except Exception as e:
        print(f"❌ Failed to sync Forex Factory data: {e}")

if __name__ == "__main__":
    # Execute the cache pull
    fetch_and_sync_forex_factory()
