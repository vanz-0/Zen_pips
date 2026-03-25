import os
import sys
import io
import logging
import asyncio
import json
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv

# Force UTF-8 encoding for Windows terminal emojis
if sys.stdout.encoding != 'UTF-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='UTF-8')
import requests
from telegram import Update, Bot, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, filters, ContextTypes, CallbackQueryHandler
from openai import OpenAI

# Load env variables
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
ADMIN_USERNAME = os.getenv("ADMIN_TELEGRAM_USERNAME", "MadDmakz")

last_proposed_signal = {} # Temporary cache for confirmation
openai_client = OpenAI(api_key=OPENAI_API_KEY)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

# ─── Supabase Data Fetching ───

def get_db_stats():
    url = f"{SUPABASE_URL}/rest/v1/signals?select=total_pips,closed,created_at"
    headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
    try:
        resp = requests.get(url, headers=headers)
        if resp.status_code == 200:
            signals = resp.json()
            total_signals = len(signals)
            total_pips = sum(s.get('total_pips', 0) for s in signals)
            wins = len([s for s in signals if s.get('total_pips', 0) > 0])
            win_rate = (wins / total_signals * 100) if total_signals > 0 else 0
            today = datetime.now(timezone.utc).date()
            today_pips = sum(s.get('total_pips', 0) for s in signals if datetime.fromisoformat(s['created_at'].replace('Z', '+00:00')).date() == today)
            return {"total_pips": total_pips, "today_pips": today_pips, "win_rate": round(win_rate, 1), "total_count": total_signals}
    except Exception as e:
        logging.error(f"DB Error: {e}")
    return None

# ─── AI Extraction ───

def parse_signal_with_ai(text):
    prompt = f'Extract trading parameters from text: "{text}". Return JSON with pair, direction, entry, sl, timeframe. NO TP levels needed here.'
    try:
        response = openai_client.chat.completions.create(model="gpt-4o", messages=[{"role": "user", "content": prompt}], response_format={ "type": "json_object" })
        return response.choices[0].message.content
    except Exception as e:
        logging.error(f"AI Parse Error: {e}"); return None

# ─── Handlers ───

async def start_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.username != ADMIN_USERNAME:
        await update.message.reply_text("🚫 Access Denied.")
        return
    await update.message.reply_text("💎 <b>ZEN PIPS ADMIN</b> 💎\n🎙 Send voice/text to push signals.")

async def handle_voice(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.username != ADMIN_USERNAME: return
    voice = update.message.voice
    new_file = await context.bot.get_file(voice.file_id)
    file_path = "voice_signal.ogg"
    await new_file.download_to_drive(file_path)
    with open(file_path, "rb") as f:
        transcript = openai_client.audio.transcriptions.create(model="whisper-1", file=f).text
    os.remove(file_path)
    await update.message.reply_text(f"🎙 <b>Transcribed:</b>\n<i>\"{transcript}\"</i>\n🔄 Analyzing...", parse_mode='HTML')
    signal_json_str = parse_signal_with_ai(transcript)
    if signal_json_str:
        try:
            sig_data = json.loads(signal_json_str)
            global last_proposed_signal
            last_proposed_signal = sig_data
            keyboard = [[InlineKeyboardButton("✅ CONFIRM & EXECUTE", callback_data="exec_sig_now")]]
            await update.message.reply_text(f"📦 <b>EXTRACTED:</b>\n<pre>{json.dumps(sig_data, indent=2)}</pre>", parse_mode='HTML', reply_markup=InlineKeyboardMarkup(keyboard))
        except: await update.message.reply_text("❌ Error.")

async def handle_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    if query.data == "exec_sig_now":
        global last_proposed_signal
        if not last_proposed_signal: return
        await query.edit_message_text("🚀 <b>EXECUTING...</b>", parse_mode='HTML')
        import subprocess
        cmd = [sys.executable, "execution/process_new_signal.py", "--pair", last_proposed_signal['pair'], "--direction", last_proposed_signal['direction'], "--entry", str(last_proposed_signal['entry']), "--sl", str(last_proposed_signal['sl']), "--timeframe", last_proposed_signal.get('timeframe', 'M15')]
        subprocess.run(cmd); last_proposed_signal = {}

if __name__ == '__main__':
    if not TOKEN: exit(1)
    app = ApplicationBuilder().token(TOKEN).build()
    app.add_handler(CommandHandler("start", start_cmd))
    app.add_handler(CallbackQueryHandler(handle_callback))
    app.add_handler(MessageHandler(filters.VOICE, handle_voice))
    app.add_handler(MessageHandler(filters.TEXT & (~filters.COMMAND), start_cmd))
    print("🚀 Bot Active..."); app.run_polling()
