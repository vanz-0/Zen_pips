import dotenv from 'dotenv';
dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHANNEL_ID = process.env.ZENPIPS_CHANNEL_ID || process.env.FREE_GROUP_ID;

if (!BOT_TOKEN || !CHANNEL_ID) {
  console.error("Missing TELEGRAM_BOT_TOKEN or ZENPIPS_CHANNEL_ID/FREE_GROUP_ID in environment.");
}

/**
 * Sends a text message to the Telegram Free Group.
 * @param {string} text - Message text (Markdown supported).
 */
export async function sendTelegramMessage(text) {
  if (!BOT_TOKEN || !CHANNEL_ID) return;

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHANNEL_ID,
        text: text,
        parse_mode: 'Markdown'
      })
    });

    const result = await response.json();
    if (!result.ok) {
      console.error("Telegram API Error:", result.description);
    } else {
      console.log("Telegram message sent successfully!");
    }
  } catch (err) {
    console.error("Error calling Telegram API:", err);
  }
}
