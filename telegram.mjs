import dotenv from 'dotenv';
dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const VIP_CHANNEL_ID = process.env.ZENPIPS_CHANNEL_ID;
const FREE_GROUP_ID = process.env.FREE_GROUP_ID;

if (!BOT_TOKEN) {
  console.error("Missing TELEGRAM_BOT_TOKEN in environment.");
}

/**
 * Sends a message to a single Telegram chat.
 */
async function sendToChat(chatId, text) {
  if (!BOT_TOKEN || !chatId) return false;

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown'
      })
    });

    const result = await response.json();
    if (!result.ok) {
      console.error(`Telegram API Error (${chatId}):`, result.description);
      return false;
    } else {
      console.log(`Telegram message sent to ${chatId}!`);
      return true;
    }
  } catch (err) {
    console.error(`Error calling Telegram API (${chatId}):`, err);
    return false;
  }
}

/**
 * Sends a text message to ALL Telegram destinations (VIP Channel + Free Group).
 * @param {string} text - Message text (Markdown supported).
 */
export async function sendTelegramMessage(text) {
  const targets = [VIP_CHANNEL_ID, FREE_GROUP_ID].filter(Boolean);
  
  if (targets.length === 0) {
    console.error("No Telegram channel/group IDs configured.");
    return;
  }

  for (const chatId of targets) {
    await sendToChat(chatId, text);
  }
}
