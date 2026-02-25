import os
import asyncio
from dotenv import load_dotenv
from telegram import Bot
import time

# Load configurations
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))
TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
VIP_CHANNEL_ID = os.getenv("ZENPIPS_CHANNEL_ID")
FREE_GROUP_ID = os.getenv("FREE_GROUP_ID")

WELCOME_VIP = """🏆 <b>Welcome to Zen Pips Market Dominators.</b>

You are now part of an elite circle. Here, we do not gamble. We execute with precision, patience, and unbreakable discipline. 

📌 <b>Rules of Engagement:</b>
1. Turn your notifications ON.
2. Never risk more than 1-2% per trade. Let compounding do the heavy lifting.
3. Do not forward these signals. The community’s edge relies on exclusivity.
4. We trade primarily XAU/USD and BTC/USD during key volatility windows (London/NY Open).

Master your psychology. Dominance starts in the mind.
Let’s collect these pips. 📈"""

WELCOME_FREE = """⚡️ <b>Welcome to the Zen Pips Community</b>

A free hub for serious traders discussing setups, macro bias, and market psychology.

🔹 <b>Chat Rules:</b> 
- No spamming, self-promotion, or links.
- Keep the discussion focused on the charts (XAU/USD, BTC, Majors).
- Respect your fellow traders. We win together, we learn together.

👑 Ready to elevate your trading game and catch every precise move? Join the <b>Dominators VIP Room</b> today and get complete access to our daily sniper entries:
👉 Msg our onboarding bot: @Zen_pips"""

SAMPLE_POLL_QUESTION = "What is your primary bias on Gold (XAU/USD) today heading into NY Open?"
SAMPLE_POLL_OPTIONS = [
    "🐂 Bullish (Buying the dips)",
    "🐻 Bearish (Shorting the rallies)",
    "⚖️ Ranging (Waiting for a break)"
]

async def broadcast_messages():
    if not TOKEN:
        print("Error: No TELEGRAM_BOT_TOKEN provided in .env")
        return

    bot = Bot(token=TOKEN)
    
    try:
        print(f"Deploying Welcome Message to VIP Channel ({VIP_CHANNEL_ID})...")
        await bot.send_message(
            chat_id=VIP_CHANNEL_ID,
            text=WELCOME_VIP,
            parse_mode='HTML'
        )
        print("VIP Message Sent!")
        
        # Small delay to prevent rate limits
        time.sleep(2)
        
        print(f"\nDeploying Welcome Message to Free Group ({FREE_GROUP_ID})...")
        await bot.send_message(
            chat_id=FREE_GROUP_ID,
            text=WELCOME_FREE,
            parse_mode='HTML'
        )
        print("Free Group Message Sent!")
        
        time.sleep(2)
        
        print(f"\nDeploying Interactive Poll to Free Group ({FREE_GROUP_ID})...")
        await bot.send_poll(
            chat_id=FREE_GROUP_ID,
            question=SAMPLE_POLL_QUESTION,
            options=SAMPLE_POLL_OPTIONS,
            is_anonymous=True
        )
        print("Free Group Poll Sent!")
        
        print("\nAll templates deployed successfully! Check your Telegram groups.")
            
    except Exception as e:
        print(f"Error broadcasting messages: {e}")

if __name__ == "__main__":
    asyncio.run(broadcast_messages())
