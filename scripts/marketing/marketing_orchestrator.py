import os
import sys
import io
import time
from datetime import datetime
from dotenv import load_dotenv

# Import engines
try:
    from .quora_engine import QuoraEngine
    from .reddit_engine import RedditEngine
    from .linkedin_engine import LinkedInEngine
except ImportError:
    from quora_engine import QuoraEngine
    from reddit_engine import RedditEngine
    from linkedin_engine import LinkedInEngine

# Ensure UTF-8 output
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

load_dotenv()

class MarketingOrchestrator:
    def __init__(self):
        print("🚀 Initializing Zen Pips Marketing Hub...")
        self.quora = QuoraEngine()
        self.reddit = RedditEngine()
        self.linkedin = LinkedInEngine()

    def run_cycle(self, region="kenya", limit_per_platform=2):
        """
        Executes a full marketing cycle across all active platforms.
        """
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"\n--- Starting Marketing Cycle [{region.upper()}] at {timestamp} ---")
        
        results = {
            "quora": [],
            "reddit": [],
            "linkedin": []
        }

        # 1. Quora Run
        try:
            print("\n[QUORA PHASE]")
            results["quora"] = self.quora.run_daily_playbook(region=region, limit=limit_per_platform)
        except Exception as e:
            print(f"Quora Cycle Error: {e}")

        # 2. Reddit Run
        try:
            print("\n[REDDIT PHASE]")
            results["reddit"] = self.reddit.run_daily_playbook(region=region, limit=limit_per_platform)
        except Exception as e:
            print(f"Reddit Cycle Error: {e}")

        # 3. LinkedIn Run
        try:
            print("\n[LINKEDIN PHASE]")
            results["linkedin"] = self.linkedin.run_daily_playbook(region=region, limit=limit_per_platform)
        except Exception as e:
            print(f"LinkedIn Cycle Error: {e}")

        self.summarize_cycle(results)
        return results

    def summarize_cycle(self, results):
        print("\n" + "="*40)
        print("📈 CYCLE COMPLETE: DRAFTS GENERATED")
        print(f"Quora: {len(results['quora'])} leads")
        print(f"Reddit: {len(results['reddit'])} leads")
        print(f"LinkedIn: {len(results['linkedin'])} leads")
        print("="*40)
        print("Ready for Admin review in Supabase/Telegram.")

    def run_daily_cadence(self):
        """
        Logic for 2nd and 3rd runs (e.g., staggering).
        In a production VPS, this would be managed by Cron.
        """
        # Cycle 1: Kenya Priority (Morning)
        self.run_cycle(region="kenya", limit_per_platform=2)
        
        # Cycle 2: Global (Mid-day) - Hypothetical stagger
        # time.sleep(3600 * 4) 
        # self.run_cycle(region="global", limit_per_platform=2)

if __name__ == "__main__":
    orchestrator = MarketingOrchestrator()
    # Execute a test cycle
    orchestrator.run_cycle(region="kenya", limit_per_platform=1)
