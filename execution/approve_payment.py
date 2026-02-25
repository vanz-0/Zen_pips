import os
import sqlite3
import sys
import asyncio
from datetime import datetime, timedelta
from dotenv import load_dotenv
from telegram import Bot

# Load configs
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))
TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.tmp', 'zenpips.db')
# We need to assume the channel is linked to the bot in the future.
# For now we'll put clearly identified PLACEHOLDERS that the user needs to configure
CHANNEL_ID = os.getenv("ZENPIPS_CHANNEL_ID", "-100123456789")

async def approve_and_invite(transaction_id):
    if not TOKEN:
        print("Error: Bot token not found in .env")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Get transaction details
    cursor.execute("SELECT user_id, username, tier FROM pending_transactions WHERE id=?", (transaction_id,))
    record = cursor.fetchone()

    if not record:
        print(f"Error: Pending transaction {transaction_id} not found.")
        conn.close()
        return

    user_id, username, tier = record
    
    # Calculate expiry
    days = 30
    if tier == "tier_6_months":
        days = 180
    elif tier == "tier_1_year":
        days = 365
        
    expiry = datetime.now() + timedelta(days=days)
    
    # Insert or replace user in active users table
    cursor.execute('''
        INSERT OR REPLACE INTO users (user_id, username, subscription_tier, expiry_date, status)
        VALUES (?, ?, ?, ?, 'active')
    ''', (user_id, username, tier, expiry.strftime("%Y-%m-%d %H:%M:%S")))

    # Remove from pending
    cursor.execute("DELETE FROM pending_transactions WHERE id=?", (transaction_id,))
    
    conn.commit()
    conn.close()
    
    print(f"Database updated. User {username} approved for {tier} until {expiry.strftime('%Y-%m-%d')}.")
    
    # Now generate the invite link and send it
    bot = Bot(token=TOKEN)
    try:
        # Note: The Bot MUST be an admin in the CHANNEL_ID to create links.
        # This might fail right now if CHANNEL_ID is not real or Bot is not admin.
        invite_link = await bot.create_chat_invite_link(
            chat_id=CHANNEL_ID,
            member_limit=1,
            name=f"Invite for {username}",
            creates_join_request=False
        )
        link_str = invite_link.invite_link
        
        await bot.send_message(
            chat_id=user_id,
            text=f"Your payment has been successfully verified!\n\nHere is your one-time invite link to the Zen Pips VIP Channel. Do not share this link, as it will expire upon use:\n{link_str}"
        )
        print(f"Successfully generated invite link and PM'd user {user_id}.")
        
    except Exception as e:
        print(f"\nWarning: User was approved in DB, but encountered Telegram API Error: {e}")
        print("Note: This Usually happens because we haven't created the telegram channel yet, or the bot isn't an admin in it.")
        print(f"Once the channel is made, you would manually send the link to {username} (@{username}) if they paid.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python approve_payment.py <transaction_id>")
        sys.exit(1)
        
    tx_id = sys.argv[1]
    asyncio.run(approve_and_invite(tx_id))
