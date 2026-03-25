import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

import openai
from dotenv import load_dotenv
from execution.monitor_signals import get_metals_price

# Load environment
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

def format_telegram_copy(price, asset="Gold (XAU/USD)"):
    """
    Acts as the Zen Pips Brain / Market Analyst.
    It takes the live price and requests high-quality, educational copywriting 
    from OpenAI citing the internal PDF strategies (SMC/ICT).
    """
    if not OPENAI_API_KEY:
        return "[!] OpenAI API Key is missing. Cannot generate analysis."

    client = openai.OpenAI(api_key=OPENAI_API_KEY)

    system_prompt = (
        "You are the elite Market Analyst for 'Zen Pips', an institutional trading group. "
        "Your job is to provide short, highly educational, and professional trading copy for the Telegram VIP group. "
        "You must heavily utilize Smart Money Concepts (SMC) or Inner Circle Trader (ICT) strategies. "
        "Critically Important: You must cite that you are using these strategies from the 'Zen Pips Educational PDF Library' "
        "so members know we practice what we preach."
    )

    user_prompt = (
        f"Right now, {asset} is trading at exactly {price}. "
        "Write a brief, sharp Telegram update (1-2 paragraphs) for our members analyzing this current price action. "
        "Include a hypothetical SMC or ICT breakdown (e.g. liquidity sweep, fair value gap, or mitigation block) that aligns with this price. "
        "Explicitly cite the 'Zen Pips Educational PDF Library' (e.g., volume 3 or SMC setup guide). "
        "Give clear CTA (Call to action) for them to stay disciplined and watch for our next signal."
    )

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=400
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"[!] Error contacting OpenAI Brain: {e}"

if __name__ == "__main__":
    print("🧠 Waking up Zen Pips Market Analyst...")
    print("📡 Fetching live prices...\n")
    
    # Get Gold Price
    xau_price = get_metals_price("XAUUSD")
    
    if xau_price:
        print(f"✅ Market Data Retrieved: Gold @ {xau_price}")
        print("✍️  Generating Educational Copy using internal PDF strategies (ICT/SMC)...\n")
        
        copy = format_telegram_copy(xau_price, "Gold (XAU/USD)")
        
        print("="*60)
        print("📥 GENERATED TELEGRAM COPY:")
        print("="*60)
        print(copy)
        print("="*60)
        print("Admin Request: [APPROVE] / [DENY] -> Send to VIP Room?")
    else:
        print("❌ Failed to fetch Gold price. Analyst offline.")

