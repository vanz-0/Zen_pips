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

class LinkedInEngine:
    def __init__(self):
        token = os.getenv("APIFY_API_TOKEN")
        self.apify = ApifyClient(token)
        self.openai = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.links = LinksManager()
        
        sb_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
        sb_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        self.supabase: Client = create_client(sb_url, sb_key)
        
        # Default Kenyan targets if none provided
        self.default_targets = [
            "https://www.linkedin.com/school/nairobi-securities-exchange-nse-/",
            "https://www.linkedin.com/company/central-bank-of-kenya/"
        ]

    def find_opportunities(self, targets: List[str] = None, limit: int = 3) -> List[Dict]:
        """
        Scrapes targeted LinkedIn profiles/pages for latest posts.
        """
        urls = targets or self.default_targets
        print(f"Monitoring LINKEDIN targets: {len(urls)} pages...")
        
        run_input = {
            "urls": urls,
            "limit": 10
        }

        try:
            # Using the specific LinkedIn Scraper ID provided by the user
            run = self.apify.actor("2SyF0bVxmgGr8IVCZ").call(run_input=run_input)
            raw_opportunities = []
            
            for item in self.apify.dataset(run["defaultDatasetId"]).iterate_items():
                url = item.get("url", "")
                text = item.get("text", "")
                
                if not text or not url: continue
                
                # Deduplication
                existing = self.supabase.table("marketing_history").select("url").eq("url", url).execute()
                if existing.data:
                    continue
                
                raw_opportunities.append({
                    "title": text[:100] + "...",
                    "url": url,
                    "content": text,
                    "platform": "linkedin"
                })
                
                if len(raw_opportunities) >= 10:
                    break
                    
            if len(raw_opportunities) > limit:
                print(f"AI Filtering {len(raw_opportunities)} raw results down to top {limit} most viable...")
                prompt = "Select the most viable LinkedIn posts for an institutional financial trader to comment on to acquire clients. Look for topics on investment, Eastern Africa, or finance. Return ONLY the exact titles/snippets of the best ones, each on a new line.\n\nPosts:\n"
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
            print(f"LinkedIn Scout Error: {e}")
            return []

    def draft_comment(self, post_text: str) -> Dict:
        """
        Drafts a professional LinkedIn comment.
        """
        print("Drafting LinkedIn comment...")
        cta = self.links.get_cta(temperature="warm")
        
        prompt = f"""
You are an institutional trading executive at Zen Pips.
LinkedIn Post Content: "{post_text}"

Instructions:
1. Write a 50-80 word professional, insightful comment.
2. Add value by mentioning institutional liquidity or market structure if applicable.
3. Integrate this CTA naturally: "{cta['text']}"
4. Maintain a "thought leader" tone.

Your comment:
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

    def run_daily_playbook(self, region="kenya", limit=2):
        # In the future, fetch targets from DB based on region
        opps = self.find_opportunities(limit=limit)
        results = []
        for opp in opps:
            draft = self.draft_comment(opp["content"])
            self.supabase.table("marketing_history").insert({
                "url": opp["url"],
                "title": opp["title"],
                "category": "institutional",
                "platform": "linkedin",
                "region": region,
                "status": "draft",
                "draft_content": draft["answer"]
            }).execute()
            results.append(opp)
        return results

if __name__ == "__main__":
    engine = LinkedInEngine()
    print(engine.run_daily_playbook())
