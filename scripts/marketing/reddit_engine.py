import os
import sys
import io
from apify_client import ApifyClient
from openai import OpenAI
from dotenv import load_dotenv
from typing import List, Dict
from supabase import create_client, Client

try:
    from .links_manager import LinksManager
except ImportError:
    from links_manager import LinksManager

# Ensure UTF-8 output
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

load_dotenv()

class RedditEngine:
    def __init__(self):
        token = os.getenv("APIFY_API_TOKEN")
        self.apify = ApifyClient(token)
        self.openai = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.links = LinksManager()
        
        sb_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
        sb_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        self.supabase: Client = create_client(sb_url, sb_key)

    def find_opportunities(self, category: str = "forex", region: str = "kenya", limit: int = 3) -> List[Dict]:
        """
        Scrapes Reddit for recent high-intent threads.
        """
        # Demographic Focus
        subreddits = ["Kenya", "Forex", "CryptoCurrency", "Investing"]
        
        keywords = {
            "forex": "institutional trading setup strategies",
            "crypto": "bitcoin accumulation smart money",
            "propfirm": "prop firm trading challenges tips",
            "kenya": "trading forex in kenya investment"
        }
        
        query = keywords.get(category.lower(), keywords["forex"])
        if region.lower() == "kenya":
            query += " Kenya"

        print(f"Scouting REDDIT for [{category}] in [{region}]: {query}...")
        
        run_input = {
            "searchQueries": [query],
            "subreddits": subreddits,
            "maxPosts": 10,
            "sort": "new", # Catch recent discussions
            "time": "month" # Give it a slightly wider net if highly niched
        }

        try:
            run = self.apify.actor("crawlerbros/reddit-scraper").call(run_input=run_input)
            raw_opportunities = []
            
            for item in self.apify.dataset(run["defaultDatasetId"]).iterate_items():
                url = item.get("url", "")
                title = item.get("title", "")
                
                if not url or not title:
                    continue
                
                # Deduplication
                existing = self.supabase.table("marketing_history").select("url").eq("url", url).execute()
                if existing.data:
                    continue
                
                raw_opportunities.append({
                    "title": title,
                    "url": url,
                    "category": category,
                    "region": region
                })
                
                if len(raw_opportunities) >= 10:
                    break
                    
            if len(raw_opportunities) > limit:
                print(f"AI Filtering {len(raw_opportunities)} raw results down to top {limit} most viable...")
                prompt = "Select the most viable discussion threads for an institutional financial trader to answer to acquire clients. Return ONLY the exact titles of the best ones, each on a new line.\n\nThreads:\n"
                for opp in raw_opportunities:
                    prompt += f"- {opp['title']}\n"
                    
                resp = self.openai.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=200
                )
                selected_titles = resp.choices[0].message.content.split('\n')
                
                opportunities = []
                for title in selected_titles:
                    clean_title = title.replace('-', '').strip()
                    for opp in raw_opportunities:
                        if clean_title in opp['title'] and opp not in opportunities:
                            opportunities.append(opp)
                            break
                    if len(opportunities) >= limit:
                        break
            else:
                opportunities = raw_opportunities[:limit]
                
            return opportunities
        except Exception as e:
            print(f"Reddit Scout Error: {e}")
            return []

    def draft_reply(self, title: str, op_text: str = "") -> Dict:
        """
        Drafts a Reddit-style helpful response.
        """
        print(f"Drafting Reddit reply for: '{title}'...")
        cta = self.links.get_cta(temperature="warm")
        
        prompt = f"""
You are a master institutional trader on Reddit.
Post Title: "{title}"
Context: "{op_text}"

Instructions:
1. Write a 150-200 word response that is helpful, slightly informal (reddit-style), but authoritative.
2. Focus on institutional liquidity and "the why" behind market moves.
3. Integrate this CTA naturally: "{cta['text']}"
4. Use formatting like bullet points or bold text to make it readable.

Your response:
"""
        try:
            response = self.openai.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": prompt}]
            )
            return {
                "answer": response.choices[0].message.content.strip(),
                "cta_url": cta["url"]
            }
        except Exception as e:
            return {"answer": f"Error: {e}", "cta_url": ""}

    def run_daily_playbook(self, category="forex", region="kenya", limit=2):
        opps = self.find_opportunities(category, region, limit)
        results = []
        for opp in opps:
            draft = self.draft_reply(opp["title"])
            self.supabase.table("marketing_history").insert({
                "url": opp["url"],
                "title": opp["title"],
                "category": category,
                "platform": "reddit",
                "region": region,
                "status": "draft",
                "draft_content": draft["answer"]
            }).execute()
            results.append(opp)
        return results

if __name__ == "__main__":
    engine = RedditEngine()
    print(engine.run_daily_playbook())
