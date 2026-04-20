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

from supabase import create_client, Client

load_dotenv()

class QuoraEngine:
    def __init__(self):
        token = os.getenv("APIFY_API_TOKEN")
        if not token:
            raise ValueError("APIFY_API_TOKEN not found in .env")
        
        self.apify = ApifyClient(token)
        self.openai = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.links = LinksManager()
        
        # Initialize Supabase for history tracking
        sb_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
        sb_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        self.supabase: Client = create_client(sb_url, sb_key)
        
    def find_opportunities(self, category: str = "forex", limit: int = 5) -> List[Dict]:
        """
        Uses Apify's Google Search Scraper to find top Quora questions.
        Categories: crypto, forex, regional, institutional, propfirm
        """
        queries = {
            "forex": "best forex signals institutional",
            "crypto": "bitcoin institutional accumulation signals",
            "regional": "best forex traders in Kenya and Nigeria",
            "institutional": "how to trade like a bank liquidty zones",
            "propfirm": "passing prop firm challenge institutional strategy"
        }
        
        topic = queries.get(category.lower(), queries["forex"])
        print(f"Scouting Quora for [{category}] niche: {topic}...")
        
        run_input = {
            "queries": f"site:quora.com {topic}",
            "resultsPerPage": 20, # Fetch more to allow for deduplication
            "maxPagesPerQuery": 1,
        }

        try:
            run = self.apify.actor("apify/google-search-scraper").call(run_input=run_input)
            
            opportunities = []
            for item in self.apify.dataset(run["defaultDatasetId"]).iterate_items():
                for organic_result in item.get("organicResults", []):
                    url = organic_result.get("url", "")
                    title = organic_result.get("title", "").replace(" - Quora", "")
                    
                    if "quora.com" in url and "profile" not in url:
                        # DEDUPLICATION CHECK
                        existing = self.supabase.table("marketing_history").select("url").eq("url", url).execute()
                        if not existing.data:
                            opportunities.append({
                                "title": title,
                                "url": url,
                                "category": category
                            })
                    
                    if len(opportunities) >= limit:
                        break
            return opportunities
        except Exception as e:
            print(f"Apify Scout Error: {e}")
            return []

    def draft_answer(self, question: str) -> Dict:
        """
        Drafts a seamless educational response. Returns {answer, link_text, link_url}
        """
        print(f"Drafting expert reply for: '{question}'...")
        
        cta_data = self.links.get_cta(temperature="warm")
        
        # Instruction for AI to integrate the 'text' naturally
        prompt = f"""
You are a senior institutional trader at Zen Pips. 
Question to answer: "{question}"

Instructions:
1. Write a 200-250 word high-value response focused on Smart Money Concepts and institutional liquidity.
2. Maintain a professional, educational, and slightly contrarian tone (retail vs institutional).
3. Do NOT include any titles, headers, or labels like "Answer:" or "Introduction:". Just provide the raw text.
4. Integrate this exact phrase naturally into your closing: "{cta_data['text']}"
5. Never mention "I am an AI" or "representative". You are the trader.

Your response:
"""

        try:
            response = self.openai.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are a professional institutional trader for Zen Pips."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
            )
            draft = response.choices[0].message.content.strip()
            
            return {
                "answer": draft,
                "cta_url": cta_data['url']
            }
        except Exception as e:
            print(f"OpenAI Error: {e}")
            return {"answer": f"Error: {e}", "cta_url": ""}

    def run_daily_playbook(self, category="forex", limit=2):
        """
        Finds questions, drafts, and saves to history to prevent repeats.
        """
        opportunities = self.find_opportunities(category, limit=limit)
        results = []
        
        for opp in opportunities:
            draft_data = self.draft_answer(opp["title"])
            
            # Save to history
            self.supabase.table("marketing_history").insert({
                "url": opp["url"],
                "title": opp["title"],
                "category": category,
                "draft_content": draft_data["answer"]
            }).execute()
            
            results.append({
                "question": opp['title'],
                "url": opp['url'],
                "answer": draft_data["answer"],
                "cta_url": draft_data["cta_url"]
            })
            
        return results

if __name__ == "__main__":
    engine = QuoraEngine()
    # Test one result for crypto
    res = engine.run_daily_playbook(category="crypto", limit=1)
    for r in res:
        print(f"\nSOURCE: {r['url']}")
        print(f"ANS: {r['answer']}")
        print(f"LINK TO EMBED: {r['cta_url']}")
