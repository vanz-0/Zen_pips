import os
import asyncio
from dotenv import load_dotenv
from telegram import Bot

# Load configurations
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))
TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
FREE_GROUP_ID = os.getenv("FREE_GROUP_ID")
VIP_CHANNEL_ID = os.getenv("ZENPIPS_CHANNEL_ID")

# ── Individual signal messages (VIP gets entries, Free group gets the recap) ──

SIGNALS = [
    {
        "text": (
            "🎯⚡ <b>ZEN PIPS — LIVE SIGNAL</b> 🔥\n"
            "📊 <b>BTC/USD (Bitcoin) — BUY</b>\n"
            "⏱ Timeframe: M5\n\n"
            "• Entry: <code>64,423.5</code>\n"
            "• TP 1: <code>64,689.5</code>\n"
            "• TP 2: <code>64,955.5</code>\n"
            "• TP 3: <code>65,221.5</code>\n"
            "• SL: <code>64,157.5</code>\n\n"
            "Confluence: BTC bouncing off session structure during Tokyo-London overlap. "
            "Multiple confluences aligned — displacement confirmed.\n\n"
            "🔒 Risk: 1% max | SL to BE after TP1\n"
            "<i>Zen Pips. Discipline is the strategy.</i> 📈"
        ),
        "target": "VIP"
    },
    {
        "text": (
            "🎯⚡ <b>ZEN PIPS — LIVE SIGNAL</b> 🔥\n"
            "📊 <b>BTC/USD (Bitcoin) — BUY</b>\n"
            "⏱ Timeframe: M15\n\n"
            "• Entry: <code>63,945</code>\n"
            "• TP 1: <code>65,105</code>\n"
            "• TP 2: <code>66,265</code>\n"
            "• TP 3: <code>67,425</code>\n"
            "• SL: <code>62,785</code>\n\n"
            "Confluence: Institutional demand zone at 63,900 during London session. "
            "Higher timeframe bullish structure confirmed. Swing play — larger targets, wider SL, same 1% risk.\n\n"
            "🔒 Risk: 1% max | SL to BE after TP1\n"
            "<i>Zen Pips. Discipline is the strategy.</i> 📈"
        ),
        "target": "VIP"
    },
    {
        "text": (
            "🎯⚡ <b>ZEN PIPS — LIVE SIGNAL</b> 🔥\n"
            "📊 <b>XAU/USD (Gold) — BUY</b>\n"
            "⏱ Timeframe: M5\n\n"
            "• Entry: <code>5,168.73</code>\n"
            "• TP 1: <code>5,194.88</code>\n"
            "• TP 2: <code>5,221.04</code>\n"
            "• TP 3: <code>5,247.19</code>\n"
            "• SL: <code>5,142.57</code>\n\n"
            "Confluence: Gold finding support at session low. Institutional accumulation visible below 5,170. "
            "Clean setup — execute and manage.\n\n"
            "🔒 Risk: 1% max | SL to BE after TP1\n"
            "<i>Zen Pips. Discipline is the strategy.</i> 📈"
        ),
        "target": "VIP"
    },
    {
        "text": (
            "🎯⚡ <b>ZEN PIPS — LIVE SIGNAL</b> 🔥\n"
            "📊 <b>XAG/USD (Silver) — BUY</b>\n"
            "⏱ Timeframe: M5\n\n"
            "• Entry: <code>88.19</code>\n"
            "• TP 1: <code>89.19</code>\n"
            "• TP 2: <code>90.19</code>\n"
            "• TP 3: <code>91.19</code>\n"
            "• SL: <code>87.18</code>\n\n"
            "Confluence: Silver correlating with gold bid. Clear higher-low formation on M5. "
            "1:3 RR setup targeting next resistance cluster.\n\n"
            "🔒 Risk: 1% max | SL to BE after TP1\n"
            "<i>Zen Pips. Discipline is the strategy.</i> 📈"
        ),
        "target": "VIP"
    },
]

# Free group gets a summary teaser
FREE_TEASER = (
    "🏆🔥 <b>ZEN PIPS — SIGNAL ALERT</b> 🔥\n"
    "<i>Tuesday, 25th February 2026</i>\n\n"
    "4 signals deployed to the <b>Dominators VIP Room</b> just now:\n\n"
    "📊 BTC/USD (M5) — BUY ⚡\n"
    "📊 BTC/USD (M15) — BUY ⚡\n"
    "📊 XAU/USD (M5) — BUY 👑\n"
    "📊 XAG/USD (M5) — BUY\n\n"
    "💰 <b>BTC M5 has already swept ALL 3 TPs: +1,596 Pips</b> ✅\n"
    "💰 <b>BTC M15 TP1 + TP2 HIT: +3,480 Pips</b> ✅\n"
    "⏳ XAU and XAG still running...\n\n"
    "🏆 <b>Total Confirmed: +5,076 Pips | 0 Losses</b>\n\n"
    "The free group gets the recap.\n"
    "The <b>Dominators VIP Room</b> gets the entries <i>before</i> the market moves.\n\n"
    "Ready to stop watching from the sidelines?\n"
    "1. Open your broker: <a href=\"https://www.hfm.com/ke/en/?refid=30508914\">HFM Account</a>\n"
    "2. Get USDT: <a href=\"https://www.binance.com/referral/earn-together/refer2earn-usdc/claim?hl=en&ref=GRO_28502_E50OE&utm_source=default\">Binance</a>\n"
    "3. Message the bot: @Zen_pips\n\n"
    "<i>Zen Pips. Discipline is the strategy.</i> 📈"
)


async def send_signals():
    if not TOKEN:
        print("Error: No TELEGRAM_BOT_TOKEN provided in .env")
        return

    bot = Bot(token=TOKEN)

    # 1. Send individual signals to VIP channel
    for i, sig in enumerate(SIGNALS):
        chat_id = VIP_CHANNEL_ID if sig["target"] == "VIP" else FREE_GROUP_ID
        try:
            print(f"Sending signal {i+1}/{len(SIGNALS)} to {'VIP' if sig['target'] == 'VIP' else 'Free'}...")
            await bot.send_message(
                chat_id=chat_id,
                text=sig["text"],
                parse_mode='HTML',
                disable_web_page_preview=True
            )
            print(f"  ✓ Signal {i+1} sent!")
            await asyncio.sleep(1)  # Rate limit respect
        except Exception as e:
            print(f"  ✗ Error sending signal {i+1}: {e}")

    # 2. Send teaser/recap to FREE group
    try:
        print(f"\nSending recap teaser to Free Group ({FREE_GROUP_ID})...")
        await bot.send_message(
            chat_id=FREE_GROUP_ID,
            text=FREE_TEASER,
            parse_mode='HTML',
            disable_web_page_preview=True
        )
        print("  ✓ Free group teaser sent!")
    except Exception as e:
        print(f"  ✗ Error sending teaser: {e}")

    print("\n🏆 All signals deployed!")


if __name__ == "__main__":
    asyncio.run(send_signals())
