import os
import random
import sys
import io

# Ensure UTF-8 output even on Windows terminals
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

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
        
    def find_opportunities(self, category: str = "forex", region: str = "kenya", limit: int = 5) -> List[Dict]:
        """
        Uses crawlerbros/quora-search-scraper for direct internal Quora searching.
        """
        # Niche down to high-intent financial topics
        if region.lower() == "kenya":
            niche_queries = {
                "forex": ["forex trading in kenya", "currency trading nairobi", "forex signals kenya"],
                "crypto": ["bitcoin investment kenya", "how to buy crypto in kenya", "crypto trading nairobi"],
                "regional": ["investing in nairobi securities exchange", "investment opportunities in east africa"],
                "institutional": ["institutional trading kenya", "smart money concepts forex kenya"],
                "propfirm": ["forex prop firms for kenyans", "best funding accounts kenya"]
            }
        else:
            niche_queries = {
                "forex": ["institutional forex signals", "smart money concepts forex"],
                "crypto": ["bitcoin institutional accumulation", "crypto hedge fund investing"],
                "regional": ["best global forex communities", "advanced trading psychology"],
                "institutional": ["order block trading strategy", "liquidity grab smart money"],
                "propfirm": ["pass prop firm challenge institutional", "best prop firm strategy"]
            }
        
        keywords = niche_queries.get(category.lower(), niche_queries["forex"])
        raw_opportunities = []
        
        for topic_query in keywords:
            print(f"Scouting DIRECT Quora [{region.upper()}] for [{category}]: {topic_query}...")
            
            run_input = {
                "searchQueries": [topic_query],
                "maxResults": 10
            }

            try:
                run = self.apify.actor("crawlerbros/quora-search-scraper").call(run_input=run_input)
                
                for item in self.apify.dataset(run["defaultDatasetId"]).iterate_items():
                    url = item.get("url", "")
                    title = item.get("title") or item.get("question") or ""
                    
                    if not url or "quora.com" not in url or "profile" in url or not title:
                        continue
                        
                    # DEDUPLICATION CHECK
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
            except Exception as e:
                print(f"Apify Scout Error: {e}")
                continue
            
            if len(raw_opportunities) >= 10:
                break
                
        # AI Selection over the 10 raw results to find the most viable up to 'limit' (usually 3)
        if len(raw_opportunities) > limit:
            print(f"AI Filtering {len(raw_opportunities)} raw results down to top {limit} most viable...")
            prompt = "Select the most viable questions for an institutional financial trader to answer to acquire clients. Return ONLY the exact titles of the best ones, each on a new line.\n\nQuestions:\n"
            for opp in raw_opportunities:
                prompt += f"- {opp['title']}\n"
                
            try:
                resp = self.openai.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=200
                )
                selected_titles = resp.choices[0].message.content.split('\n')
                
                # Match back to objects
                opportunities = []
                for title in selected_titles:
                    clean_title = title.replace('-', '').strip()
                    for opp in raw_opportunities:
                        if clean_title in opp['title'] and opp not in opportunities:
                            opportunities.append(opp)
                            break
                    if len(opportunities) >= limit:
                        break
            except Exception as e:
                print(f"AI Selection error: {e}")
                opportunities = raw_opportunities[:limit]
        else:
            opportunities = raw_opportunities[:limit]
            
        return opportunities

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

    def run_daily_playbook(self, category="forex", region="kenya", limit=2):
        """
        Finds questions, drafts, and saves to history to prevent repeats.
        """
        opportunities = self.find_opportunities(category, region=region, limit=limit)
        results = []
        
        for opp in opportunities:
            draft_data = self.draft_answer(opp["title"])
            
            # Save to history
            self.supabase.table("marketing_history").insert({
                "url": opp["url"],
                "title": opp["title"],
                "category": category,
                "platform": "quora",
                "region": region,
                "status": "draft",
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
