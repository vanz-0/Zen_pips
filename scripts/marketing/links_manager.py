import random
import os
from dotenv import load_dotenv

load_dotenv()

class LinksManager:
    """
    Manages and rotates Call-To-Action (CTA) urls to avoid platform spam filters 
    and precisely target lead intent (Cold, Warm, Hot).
    """
    
    def __init__(self):
        self.base_domain = os.getenv("NEXT_PUBLIC_SITE_URL", "https://zenpips.netlify.app")
        # Community Channel / Support Bot
        self.channel_link = "https://t.me/+zWQd9S4pAyMyNmY8"
        self.bot_link = "https://t.me/zenpips_support_bot"
        
        # Free Lead Magnets (Cold Leads - Value First)
        self.educational_links = [
            f"{self.base_domain}",
            f"{self.base_domain}#features",
            f"{self.base_domain}/blog"
        ]
        
        # High value, mid-intent (Warm Leads)
        self.community_links = [
            f"{self.base_domain}?tab=community",
            f"{self.base_domain}?tab=chartai",
            self.channel_link
        ]
        
        # High Intent (Hot Leads)
        self.action_links = [
            "https://www.vantagemarkets.com/", # TODO: Replace with User's Affiliate URL
            f"{self.base_domain}?tab=journal",
            f"{self.bot_link}?start=vip"
        ]

    def get_cta(self, temperature="warm"):
        """
        Returns a dictionary with 'text' and 'url' for the CTA.
        Temperature can be 'cold', 'warm', or 'hot'.
        """
        if temperature == "cold":
            link = random.choice(self.educational_links)
            message = [
                "I actually dive deeper into this institutional approach over at Zen Pips: [here]",
                "If you're tired of retail traps, grab our free institutional blueprint: [here]",
                "We just published an analysis that covers this exact scenario: [details]"
            ]
        elif temperature == "hot":
            link = random.choice(self.action_links)
            message = [
                "We execute these exact institutional setups live. See the raw journal: [here]",
                "Ready to trade with real institutional liquidity? Get the tools [here]",
                "Connect directly with our autonomous AI for live setups: [start]"
            ]
        else: # Warm
            link = random.choice(self.community_links)
            message = [
                "Drop this chart into our free Chart AI to see the real institutional zones: [here]",
                "Our community was just discussing this institutional move today: [community]",
                "Let our AI bot break down this setup for you directly in Telegram: [here]"
            ]
            
        return {
            "text": random.choice(message),
            "url": link
        }

# Simple manual test if run directly
if __name__ == "__main__":
    manager = LinksManager()
    print("Cold CTA:", manager.get_cta('cold'))
    print("Warm CTA:", manager.get_cta('warm'))
    print("Hot CTA:", manager.get_cta('hot'))
