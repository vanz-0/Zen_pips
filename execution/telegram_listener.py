import os
import sqlite3
import logging
from dotenv import load_dotenv
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, MessageHandler, filters, ContextTypes, ConversationHandler

# Load configurations
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))
TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
WALLET = os.getenv("CRYPTO_WALLET_ADDRESS")

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.tmp', 'zenpips.db')

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Conversation states
CHOOSING_TIER, WAITING_FOR_TXID = range(2)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Send a message when the command /start is issued."""
    user = update.effective_user
    welcome_message = (
        f"Welcome to Zen Pips Elite, {user.first_name}.\n\n"
        "Are you ready to trade with discipline and precision?\n"
        "Choose your tier to gain access to our live signals, market breakdowns, and community."
    )
    
    keyboard = [
        [InlineKeyboardButton("1 Month ($50)", callback_data="tier_1_month")],
        [InlineKeyboardButton("6 Months ($250)", callback_data="tier_6_months")],
        [InlineKeyboardButton("1 Year ($450)", callback_data="tier_1_year")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    await update.message.reply_text(welcome_message, reply_markup=reply_markup)
    return CHOOSING_TIER

async def tier_selected(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handles the tier selection."""
    query = update.callback_query
    await query.answer()
    
    tier_data = query.data
    context.user_data['selected_tier'] = tier_data
    
    price_map = {
        "tier_1_month": "50",
        "tier_6_months": "250",
        "tier_1_year": "450"
    }
    price = price_map.get(tier_data, "50")

    instruction_message = (
        f"Excellent. Please send exactly {price} USDT (TRC20) to the following address:\n\n"
        f"`{WALLET}`\n\n"
        "Once you have sent the transaction, please paste the Transaction ID (TxID) below."
    )
    
    await query.edit_message_text(text=instruction_message, parse_mode='Markdown')
    return WAITING_FOR_TXID

async def receive_txid(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Saves the TxID to the database pending manual approval."""
    txid = update.message.text
    user = update.effective_user
    tier = context.user_data.get('selected_tier', 'unknown')

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO pending_transactions (user_id, username, tier, tx_id) VALUES (?, ?, ?, ?)",
            (user.id, user.username or user.first_name, tier, txid)
        )
        conn.commit()
        conn.close()
        
        await update.message.reply_text(
            "Thank you. Your transaction is being verified by the Zen Pips team. "
            "This usually takes less than 15 minutes."
        )
        logger.info(f"New pending transaction from {user.id} for {tier}. TxID: {txid}")
        
    except Exception as e:
        logger.error(f"Database error: {e}")
        await update.message.reply_text("An error occurred. Please contact support.")

    return ConversationHandler.END

async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Cancels and ends the conversation."""
    await update.message.reply_text("Payment process cancelled. Type /start to try again.")
    return ConversationHandler.END

def main() -> None:
    """Start the bot."""
    if not TOKEN:
        logger.error("No TELEGRAM_BOT_TOKEN provided in .env")
        return

    application = Application.builder().token(TOKEN).build()

    conv_handler = ConversationHandler(
        entry_points=[CommandHandler("start", start)],
        states={
            CHOOSING_TIER: [CallbackQueryHandler(tier_selected, pattern="^tier_")],
            WAITING_FOR_TXID: [MessageHandler(filters.TEXT & ~filters.COMMAND, receive_txid)],
        },
        fallbacks=[CommandHandler("cancel", cancel)],
    )

    application.add_handler(conv_handler)
    
    # Initialize DB specifically so it exists when we run this.
    try:
        from db_setup import setup_database
        setup_database()
    except Exception as e:
        logger.warning(f"Could not initialize DB on startup: {e}")

    logger.info("Bot is polling...")
    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == "__main__":
    main()
