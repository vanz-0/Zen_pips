import os
import logging
from dotenv import load_dotenv
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, MessageHandler, filters, ContextTypes

# Load configurations
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))
TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# --- Content Definitions ---
MENU_TEXT = """🏆 <b>Zen Pips Support & FAQ</b>

Welcome to the command center. Our mission is to provide you with institutional-grade precision and unshakeable discipline in the markets.

How can we assist you in your path to market dominance today?

🔹 <b>Elite Signals</b> - Join our VIP circle.
🔹 <b>Broker Setup</b> - Get the best spreads with HFM.
🔹 <b>Exchange Help</b> - Join via Binance (USDT).
🔹 <b>The Zen Methodology</b> - Our trading FAQ.

<i>Discipline is not just a rule; it's the edge.</i>"""

FAQ_TEXT = """🔎 <b>Zen Pips: Frequently Asked Questions</b>

<b>Q: What pairs do you trade?</b>
A: We focus strictly on high-liquidity assets where we have a proven edge: <b>XAU/USD (Gold)</b> and <b>BTC/USD (Bitcoin)</b>. 

<b>Q: How many signals per day?</b>
A: Quality over quantity. We typically execute 1-3 high-probability setups daily, primarily during the London and NY open volatility windows.

<b>Q: Do you use a specific strategy?</b>
A: Yes. We combine <b>Institutional Orderflow</b>, <b>Market Structure Displacement</b>, and <b>Smart Money Concepts (SMC)</b> to find sniper entries with tight risk.

<b>Q: What is the minimum capital required?</b>
A: We recommend starting with at least $500 to practice proper risk management (1-2% per trade)."""

VIP_TEXT = """👑 <b>Zen Pips Dominators VIP</b>

Gain access to our full institutional ecosystem:
• Real-time Sniper Entries (Entry, SL, TP1-3)
• Live Session Market Breakdowns
• Educational Market Psychology Vault
• Direct Admin Alpha

💰 <b>Pricing Tiers:</b>
• 1 Month: <code>$50</code>
• 6 Months: <code>$250</code>
• 1 Year: <code>$450</code>

👉 Ready? Use our automated onboarding bot: @Zen_pips"""

BROKER_TEXT = """🏦 <b>Broker Setup: HFM</b>

For maximum precision and institutional-grade spreads, we exclusively use and recommend HFM.

1. Register using the official Zen Pips partner link:
👉 <a href="https://www.hfm.com/ke/en/?refid=30508914">Open HFM Trading Account</a>

2. Complete your profile and identity verification (KYC).
3. Open an MT4/MT5 account (Raw or Zero Spread).
4. Fund your account to start executing."""

BINANCE_TEXT = """🟠 <b>Exchange Help: Binance (USDT)</b>

If you need to purchase USDT to join the VIP group or fund your broker:

1. Register via Zen Pips link for bonuses:
👉 <a href="https://www.binance.com/referral/earn-together/refer2earn-usdc/claim?hl=en&ref=GRO_28502_E50OE&utm_source=default">Create Binance Account</a>

2. Buy USDT using your Card or Bank transfer.
3. Withdraw via <b>TRC20</b> to pay the VIP bot (@Zen_pips) or your broker."""

# --- Handlers ---

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [
        [InlineKeyboardButton("👑 Join VIP", callback_data="support_vip")],
        [InlineKeyboardButton("🔎 FAQs", callback_data="support_faq")],
        [InlineKeyboardButton("🏦 Broker (HFM)", callback_data="support_hfm")],
        [InlineKeyboardButton("🟠 Binance (USDT)", callback_data="support_binance")],
        [InlineKeyboardButton("👨‍💻 Talk to Admin", url="https://t.me/MadDmakz")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    if update.message:
        await update.message.reply_text(MENU_TEXT, reply_markup=reply_markup, parse_mode='HTML')
    else:
        await update.callback_query.edit_message_text(MENU_TEXT, reply_markup=reply_markup, parse_mode='HTML')

async def button_tap(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    back_button = [[InlineKeyboardButton("🔙 Back to Menu", callback_data="support_start")]]
    reply_markup = InlineKeyboardMarkup(back_button)
    
    if query.data == "support_start":
        await start(update, context)
    elif query.data == "support_faq":
        await query.edit_message_text(FAQ_TEXT, reply_markup=reply_markup, parse_mode='HTML')
    elif query.data == "support_vip":
        await query.edit_message_text(VIP_TEXT, reply_markup=reply_markup, parse_mode='HTML')
    elif query.data == "support_hfm":
        await query.edit_message_text(BROKER_TEXT, reply_markup=reply_markup, parse_mode='HTML')
    elif query.data == "support_binance":
        await query.edit_message_text(BINANCE_TEXT, reply_markup=reply_markup, parse_mode='HTML')

async def keyword_monitor(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Listens in groups for specific keywords and auto-replies with links."""
    text = update.message.text.lower() if update.message.text else ""
    
    if "broker" in text or "hfm" in text:
        await update.message.reply_text("Looking for our recommended broker? Setup your institutional account here: \nhttps://www.hfm.com/ke/en/?refid=30508914", disable_web_page_preview=True)
    elif "vip" in text or "join" in text or "payment" in text:
        await update.message.reply_text("To join the Zen Pips VIP Dominators Room, message our automated bot here: @Zen_pips")
    elif "binance" in text or "usdt" in text:
        await update.message.reply_text("New to crypto? Set up your Binance account here to get started: \nhttps://www.binance.com/referral/earn-together/refer2earn-usdc/claim?hl=en&ref=GRO_28502_E50OE&utm_source=default", disable_web_page_preview=True)

def main():
    if not TOKEN:
        logger.error("No TELEGRAM_BOT_TOKEN provided.")
        return

    application = Application.builder().token(TOKEN).build()
    
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CallbackQueryHandler(button_tap, pattern="^support_"))
    
    # Catch keywords in groups (only works if bot is admin or has privacy disabled)
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, keyword_monitor))
    
    logger.info("Support Bot is online...")
    application.run_polling()

if __name__ == "__main__":
    main()
