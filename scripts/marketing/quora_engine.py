import os
import random
from apify_client import ApifyClient
from openai import OpenAI
from dotenv import load_dotenv
from typing import List, Dict

try:
    from .links_manager import LinksManager
except ImportError:
    from links_manager import LinksManager

load_dotenv()

class QuoraEngine:
    def __init__(self):
        token = os.getenv("APIFY_API_TOKEN")
        if not token:
            raise ValueError("APIFY_API_TOKEN not found in .env")
        
        self.apify = ApifyClient(token)
        self.openai = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.links = LinksManager()
        
    def find_opportunities(self, topic: str = "forex smart money concepts", limit: int = 5) -> List[Dict]:
        """
        Uses Apify's Google Search Scraper to find the top Quora questions matching our topic.
        This is cheaper and faster than full Quora site scraping.
        """
        print(f"Scouting Quora using Apify for: {topic}...")
        
        # We use standard Google SERP restricted to Quora using apify/google-search-scraper
        run_input = {
            "queries": f"site:quora.com {topic}",
            "resultsPerPage": limit,
            "maxPagesPerQuery": 1,
        }

        try:
            # We call the official Apify Google Scraper actor
            run = self.apify.actor("apify/google-search-scraper").call(run_input=run_input)
            
            opportunities = []
            for item in self.apify.dataset(run["defaultDatasetId"]).iterate_items():
                for organic_result in item.get("organicResults", []):
                    title = organic_result.get("title", "")
                    url = organic_result.get("url", "")
                    
                    if "quora.com" in url and "profile" not in url:
                        opportunities.append({
                            "title": title.replace(" - Quora", ""),
                            "url": url,
                        })
                        
            return opportunities
        except Exception as e:
            print(f"Apify Scout Error: {e}")
            return []

    def draft_answer(self, question: str, context: str = "") -> str:
        """
        Drafts a high-value, educational response using OpenAI.
        """
        print(f"Drafting expert reply for: '{question}'...")
        
        cta = self.links.get_cta(temperature="warm")
        
        prompt = f"""
You are a senior institutional FX trader representing Zen Pips. 
A user on Quora asked: "{question}"

Write a confident, 250-word educational response. 
Focus on Smart Money Concepts (SMC), institutional liquidity, and avoiding retail traps. 
Be helpful, professional, and slightly contrarian to mainstream retail advice.
Never reveal the exact strategy mechanically, but explain the philosophy.
Include this EXACT call to action seamlessly at the end of your answer:
"{cta}"

{context}
"""

        try:
            response = self.openai.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are a professional trader and educator for Zen Pips."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"OpenAI Error: {e}")
            return f"Error drafting answer: {str(e)}"

    def run_daily_playbook(self, topic="best forex signals setup"):
        """
        Full workflow for Human-in-The-Loop posting.
        Finds questions, drafts answers, and prepares them for the user to copy-paste.
        """
        opportunities = self.find_opportunities(topic, limit=2)
        results = []
        
        if not opportunities:
            return [{"error": "No Quora opportunities found today. Check Apify credits or query."}]
            
        for opp in opportunities:
            draft = self.draft_answer(opp["title"])
            results.append({
                "platform": "Quora",
                "question": opp['title'],
                "url": opp['url'],
                "draft": draft
            })
            
        return results

if __name__ == "__main__":
    # Test the engine directly
    print("Testing Quora Engine Startup...")
    engine = QuoraEngine()
    
    test_topic = "why do retail forex traders fail"
    results = engine.run_daily_playbook(topic=test_topic)
    
    for res in results:
        print("\n" + "="*50)
        print(f"QUESTION: {res.get('question')}")
        print(f"URL: {res.get('url')}")
        print("-" * 50)
        print(res.get('draft'))
        print("="*50 + "\n")
