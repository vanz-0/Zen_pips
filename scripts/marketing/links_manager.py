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
            "https://t.me/zenpips_support_bot" # Funnel to the bot
        ]
        
        # High Intent (Hot Leads)
        self.action_links = [
            "https://www.vantagemarkets.com/", # TODO: Replace with User's Affiliate URL
            f"{self.base_domain}?tab=journal",
            "https://t.me/zenpips_support_bot?start=vip"
        ]

    def get_cta(self, temperature="warm"):
        """
        Returns a formatted Markdown CTA for social media platforms.
        Temperature can be 'cold', 'warm', or 'hot'.
        """
        if temperature == "cold":
            link = random.choice(self.educational_links)
            message = [
                f"I actually dive deeper into this institutional approach over at Zen Pips: {link}",
                f"If you're tired of retail traps, grab our free institutional blueprint here: {link}",
                f"We just published an analysis that covers this exact scenario: {link}"
            ]
        elif temperature == "hot":
            link = random.choice(self.action_links)
            message = [
                f"We execute these exact institutional setups live. See the raw journal: {link}",
                f"Ready to trade with real institutional liquidity? Get the exact tools here: {link}",
                f"Connect directly with our autonomous AI for live setups: {link}"
            ]
        else: # Warm
            link = random.choice(self.community_links)
            message = [
                f"Drop this chart into our free Chart AI at Zen Pips to see the real institutional zones: {link}",
                f"Our community was just discussing this exact pair today: {link}",
                f"Let our AI bot break down this setup for you directly in Telegram: {link}"
            ]
            
        return random.choice(message)

# Simple manual test if run directly
if __name__ == "__main__":
    manager = LinksManager()
    print("Cold CTA:", manager.get_cta('cold'))
    print("Warm CTA:", manager.get_cta('warm'))
    print("Hot CTA:", manager.get_cta('hot'))
