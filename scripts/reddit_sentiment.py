import os
import praw
from supabase import create_client, Client
from dotenv import load_dotenv
from collections import Counter
import re

# Load Environment
load_dotenv('.env')

REDDIT_ID = os.getenv("REDDIT_CLIENT_ID")
REDDIT_SECRET = os.getenv("REDDIT_CLIENT_SECRET")
USER_AGENT = os.getenv("REDDIT_USER_AGENT", "ZenPipsIntel/1.0")
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not all([REDDIT_ID, REDDIT_SECRET, SUPABASE_URL, SUPABASE_KEY]):
    print("❌ Reddit or Supabase credentials missing. Please check your .env file.")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def analyze_sentiment():
    print(f"📡 Initializing Institutional Sentiment Mining via Reddit...")
    
    reddit = praw.Reddit(
        client_id=REDDIT_ID,
        client_secret=REDDIT_SECRET,
        user_agent=USER_AGENT
    )

    # Subreddits to monitor
    subs = ["Forex", "Gold", "CryptoCurrency", "wallstreetbets", "investing"]
    
    # Target Keywords per Asset
    asset_groups = {
        "XAU/USD": ["gold", "xau", "precious metals"],
        "BTC/USD": ["bitcoin", "btc", "crypto"],
        "EUR/USD": ["euro", "eur"],
        "GBP/USD": ["gbp", "pound", "cable"],
        "XAG/USD": ["silver", "xag"]
    }

    results = {}

    for sub_name in subs:
        print(f"[*] Scanning r/{sub_name} for institutional breadcrumbs...")
        try:
            subreddit = reddit.subreddit(sub_name)
            # Fetch hot posts and comments from the last 24h
            for submission in subreddit.hot(limit=25):
                text = (submission.title + " " + submission.selftext).lower()
                
                for asset, keywords in asset_groups.items():
                    if any(k in text for k in keywords):
                        if asset not in results:
                            results[asset] = {"bullish": 0, "bearish": 0, "total": 0, "mentions": 0}
                        
                        results[asset]["mentions"] += 1
                        
                        # Simple Bias Detection
                        if any(b in text for b in ["buy", "bull", "long", "moon", "breakout"]):
                            results[asset]["bullish"] += 1
                        if any(b in text for b in ["sell", "bear", "short", "dump", "crash"]):
                            results[asset]["bearish"] += 1
                            
        except Exception as e:
            print(f"⚠️ Error accessing r/{sub_name}: {e}")

    # Process and Update Supabase
    for asset, data in results.items():
        total = data["bullish"] + data["bearish"]
        if total > 0:
            strength = data["bullish"] / total
            bias = "BULLISH" if strength > 0.6 else "BEARISH" if strength < 0.4 else "NEUTRAL"
            
            print(f"📊 {asset}: Bias={bias} | Strength={strength:.2f} | Mentions={data['mentions']}")
            
            supabase.table("market_sentiment").upsert({
                "pair": asset,
                "bias": bias,
                "strength": strength,
                "mentions": data["mentions"],
                "summary": f"High engagement on Reddit detected. Consensus leaning {bias} with {data['bullish']} bullish signals vs {data['bearish']} bearish signals.",
                "updated_at": "now()"
            }, on_conflict="pair").execute()

if __name__ == "__main__":
    analyze_sentiment()
