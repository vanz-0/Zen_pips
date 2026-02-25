"""
Signal Monitoring System — Zen Pips
Checks active signals at configured intervals and sends Telegram updates when TPs/SL are hit.

Usage:
  python execution/monitor_signals.py          # Single check run
  python execution/monitor_signals.py --loop   # Continuous monitoring loop

Logic:
  - M5 signals: checked every 15 minutes
  - M15 signals: checked every 60 minutes
  - TP1 hit → move SL to entry, send notification
  - TP2 hit → send notification
  - TP3 hit → close signal, send notification
  - SL hit → close signal, send notification
"""

import os
import sys
import json
import asyncio
import time
from datetime import datetime, timezone
from dotenv import load_dotenv
from telegram import Bot
import requests

# Load configurations
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))
TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
FREE_GROUP_ID = os.getenv("FREE_GROUP_ID")
VIP_CHANNEL_ID = os.getenv("ZENPIPS_CHANNEL_ID")

SIGNALS_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.tmp', 'signals', 'active_signals.json')


# ─── Price Fetching ───

def get_btc_price():
    """Fetch BTC/USDT price from Binance (free, no key needed)."""
    try:
        resp = requests.get("https://api.binance.com/api/v3/ticker/price", params={"symbol": "BTCUSDT"}, timeout=10)
        data = resp.json()
        return float(data["price"])
    except Exception as e:
        print(f"  ⚠ Error fetching BTC price: {e}")
        return None


def get_metals_price(symbol):
    """Fetch gold/silver price. Uses multiple free sources with fallback."""
    # Try TwelveData first (free tier: 800 calls/day)
    twelve_data_key = os.getenv("TWELVE_DATA_API_KEY", "")
    if twelve_data_key:
        try:
            resp = requests.get(
                f"https://api.twelvedata.com/price",
                params={"symbol": f"{symbol}", "apikey": twelve_data_key},
                timeout=10
            )
            data = resp.json()
            if "price" in data:
                return float(data["price"])
        except Exception:
            pass

    # Fallback: use metals.dev free API
    try:
        metal_code = "XAU" if "XAU" in symbol.upper() else "XAG"
        resp = requests.get(f"https://api.metals.dev/v1/latest?api_key=demo&currency=USD&unit=toz", timeout=10)
        data = resp.json()
        if "metals" in data:
            key = "gold" if metal_code == "XAU" else "silver"
            price = data["metals"].get(key)
            if price:
                return float(price)
    except Exception:
        pass

    # Fallback 2: use exchangerate API
    try:
        resp = requests.get(f"https://open.er-api.com/v6/latest/XAU", timeout=10)
        data = resp.json()
        if symbol.upper() == "XAUUSD" and "rates" in data:
            return 1 / data["rates"]["USD"] if data["rates"].get("USD") else None
    except Exception:
        pass

    print(f"  ⚠ Could not fetch price for {symbol} from any source")
    return None


def get_current_price(signal):
    """Get current price for a signal based on its source type."""
    if signal["source"] == "binance":
        return get_btc_price()
    elif signal["source"] == "metals":
        return get_metals_price(signal["ticker"])
    return None


# ─── Signal State Management ───

def load_signals():
    """Load active signals from JSON file."""
    try:
        with open(SIGNALS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print("⚠ No active signals file found.")
        return []


def save_signals(signals):
    """Save updated signals to JSON file."""
    with open(SIGNALS_FILE, 'w', encoding='utf-8') as f:
        json.dump(signals, f, indent=2, ensure_ascii=False)


# ─── TP/SL Detection ───

def check_signal_levels(signal, current_price):
    """
    Check if any new TPs or SL have been hit.
    Returns a list of events: [("TP1_HIT", pips), ("SL_HIT", pips), etc.]
    """
    events = []
    direction = signal["direction"]
    multiplier = signal["pip_multiplier"]

    if signal["closed"]:
        return events

    # For BUY: price goes UP to hit TPs, goes DOWN to hit SL
    # For SELL: price goes DOWN to hit TPs, goes UP to hit SL
    if direction == "BUY":
        # Check TPs (price >= TP level)
        if not signal["tp1_hit"] and current_price >= signal["tp1"]:
            pips = round((signal["tp1"] - signal["entry"]) * multiplier)
            events.append(("TP1_HIT", pips))

        if not signal["tp2_hit"] and current_price >= signal["tp2"]:
            pips = round((signal["tp2"] - signal["entry"]) * multiplier)
            events.append(("TP2_HIT", pips))

        if not signal["tp3_hit"] and current_price >= signal["tp3"]:
            pips = round((signal["tp3"] - signal["entry"]) * multiplier)
            events.append(("TP3_HIT", pips))

        # Check SL (price <= current SL)
        if current_price <= signal["current_sl"]:
            if signal["current_sl"] == signal["entry"]:
                events.append(("BREAK_EVEN", 0))
            else:
                pips = round((signal["entry"] - signal["current_sl"]) * multiplier)
                events.append(("SL_HIT", -pips))

    elif direction == "SELL":
        # Check TPs (price <= TP level)
        if not signal["tp1_hit"] and current_price <= signal["tp1"]:
            pips = round((signal["entry"] - signal["tp1"]) * multiplier)
            events.append(("TP1_HIT", pips))

        if not signal["tp2_hit"] and current_price <= signal["tp2"]:
            pips = round((signal["entry"] - signal["tp2"]) * multiplier)
            events.append(("TP2_HIT", pips))

        if not signal["tp3_hit"] and current_price <= signal["tp3"]:
            pips = round((signal["entry"] - signal["tp3"]) * multiplier)
            events.append(("TP3_HIT", pips))

        # Check SL (price >= current SL)
        if current_price >= signal["current_sl"]:
            if signal["current_sl"] == signal["entry"]:
                events.append(("BREAK_EVEN", 0))
            else:
                pips = round((signal["current_sl"] - signal["entry"]) * multiplier)
                events.append(("SL_HIT", -pips))

    return events


def apply_events(signal, events):
    """Apply events to signal state and return the updated signal."""
    total_new_pips = 0

    for event, pips in events:
        if event == "TP1_HIT":
            signal["tp1_hit"] = True
            signal["current_sl"] = signal["entry"]  # Move SL to entry
            signal["status"] = "TP1 HIT - SL AT ENTRY"
            total_new_pips += pips

        elif event == "TP2_HIT":
            signal["tp2_hit"] = True
            signal["status"] = "TP2 HIT - RISK-FREE"
            total_new_pips += pips

        elif event == "TP3_HIT":
            signal["tp3_hit"] = True
            signal["closed"] = True
            signal["status"] = "ALL TPs HIT"
            total_new_pips += pips

        elif event == "SL_HIT":
            signal["closed"] = True
            signal["status"] = "STOPPED OUT"
            total_new_pips += pips

        elif event == "BREAK_EVEN":
            signal["closed"] = True
            signal["status"] = "BREAK-EVEN"

    signal["total_pips"] = signal.get("total_pips", 0) + total_new_pips
    return signal


# ─── Telegram Notifications ───

def format_tp_hit_message(signal, event, pips, current_price):
    """Format a TP hit notification for Telegram."""
    event_label = event.replace("_", " ")
    emoji = "🎯" if "TP" in event else "⚖️" if "BREAK" in event else "🛑"

    if event == "TP1_HIT":
        action_note = "🔒 <b>SL moved to entry — RISK ELIMINATED.</b>"
    elif event == "TP2_HIT":
        action_note = "🔒 <b>Running risk-free. Trailing for TP3.</b>"
    elif event == "TP3_HIT":
        action_note = "🏆 <b>FULL SWEEP! All targets destroyed.</b>"
    elif event == "BREAK_EVEN":
        action_note = "⚖️ <b>Trade closed at break-even. Capital preserved.</b>"
    elif event == "SL_HIT":
        action_note = "🛑 <b>Stopped out. Risk was managed.</b>"
    else:
        action_note = ""

    tp_status = ""
    tp_status += f"• TP 1: <code>{signal['tp1']}</code> {'✅' if signal['tp1_hit'] else '⏳'}\n"
    tp_status += f"• TP 2: <code>{signal['tp2']}</code> {'✅' if signal['tp2_hit'] else '⏳'}\n"
    tp_status += f"• TP 3: <code>{signal['tp3']}</code> {'✅' if signal['tp3_hit'] else '⏳'}\n"

    pips_display = f"+{pips:,}" if pips > 0 else f"{pips:,}" if pips < 0 else "0"

    return (
        f"{emoji} <b>ZEN PIPS — {event_label}</b> {emoji}\n"
        f"📊 <b>{signal['pair']} ({signal['timeframe']}) — {signal['direction']}</b>\n\n"
        f"⏱ Current Price: <code>{current_price:,.2f}</code>\n\n"
        f"{tp_status}"
        f"• SL: <code>{signal['current_sl']}</code>\n\n"
        f"📈 <b>This target: {pips_display} Pips</b>\n"
        f"💰 <b>Trade total: +{signal['total_pips']:,} Pips</b>\n\n"
        f"{action_note}\n\n"
        f"<i>Zen Pips. Discipline is the strategy.</i> 📈"
    )


async def send_notification(bot, signal, event, pips, current_price):
    """Send TP/SL hit notification to both VIP and Free groups."""
    message = format_tp_hit_message(signal, event, pips, current_price)

    # Send to VIP channel
    try:
        await bot.send_message(chat_id=VIP_CHANNEL_ID, text=message, parse_mode='HTML', disable_web_page_preview=True)
        print(f"    ✓ VIP notified")
    except Exception as e:
        print(f"    ✗ VIP error: {e}")

    # Send to Free group
    try:
        await bot.send_message(chat_id=FREE_GROUP_ID, text=message, parse_mode='HTML', disable_web_page_preview=True)
        print(f"    ✓ Free group notified")
    except Exception as e:
        print(f"    ✗ Free group error: {e}")

    await asyncio.sleep(0.5)


# ─── Main Monitoring Logic ───

async def check_all_signals():
    """Single pass: check all active signals and send notifications."""
    signals = load_signals()
    if not signals:
        print("No signals to monitor.")
        return

    bot = Bot(token=TOKEN) if TOKEN else None
    if not bot:
        print("⚠ No bot token. Running in dry-run mode.")

    now = datetime.now(timezone.utc)
    updated = False

    print(f"\n{'='*50}")
    print(f"📡 Signal Check — {now.strftime('%Y-%m-%d %H:%M:%S UTC')}")
    print(f"{'='*50}")

    for signal in signals:
        if signal["closed"]:
            print(f"\n  ⏭ {signal['pair']} {signal['timeframe']} — CLOSED ({signal['status']})")
            continue

        # Check if enough time has passed since last check
        last_checked = datetime.fromisoformat(signal["last_checked"].replace("Z", "+00:00"))
        minutes_since = (now - last_checked).total_seconds() / 60
        interval = signal["check_interval_minutes"]

        if minutes_since < interval:
            remaining = round(interval - minutes_since)
            print(f"\n  ⏳ {signal['pair']} {signal['timeframe']} — Next check in {remaining}min")
            continue

        # Fetch current price
        print(f"\n  📊 {signal['pair']} {signal['timeframe']} — Checking...")
        current_price = get_current_price(signal)

        if current_price is None:
            print(f"    ⚠ Could not fetch price, skipping")
            continue

        print(f"    Current: {current_price:,.2f} | Entry: {signal['entry']:,} | SL: {signal['current_sl']:,}")

        # Check for events
        events = check_signal_levels(signal, current_price)
        signal["last_checked"] = now.isoformat()

        if events:
            for event, pips in events:
                print(f"    🔥 {event}! ({'+' if pips >= 0 else ''}{pips} pips)")
                signal = apply_events(signal, [(event, pips)])
                if bot:
                    await send_notification(bot, signal, event, pips, current_price)
            updated = True
        else:
            # Calculate floating P/L
            if signal["direction"] == "BUY":
                floating = round((current_price - signal["entry"]) * signal["pip_multiplier"])
            else:
                floating = round((signal["entry"] - current_price) * signal["pip_multiplier"])
            status = "profit" if floating > 0 else "loss" if floating < 0 else "flat"
            print(f"    No new levels hit. Floating: {'+' if floating >= 0 else ''}{floating} pips ({status})")
            updated = True  # Update last_checked timestamp

    if updated:
        save_signals(signals)
        print(f"\n{'='*50}")
        print("✓ Signals file updated.")

    # Summary
    active = [s for s in signals if not s["closed"]]
    closed = [s for s in signals if s["closed"]]
    total_pips = sum(s["total_pips"] for s in signals)
    print(f"\n📋 Summary: {len(active)} active, {len(closed)} closed | Total confirmed: +{total_pips:,} pips")


async def monitoring_loop():
    """Continuous monitoring loop. Checks every 5 minutes (the minimum interval check is done per-signal)."""
    print("🚀 Starting continuous signal monitoring...")
    print("   M5 signals checked every 15 min | M15 signals checked every 60 min")
    print("   Press Ctrl+C to stop\n")

    while True:
        try:
            await check_all_signals()
            print(f"\n⏰ Next sweep in 5 minutes...\n")
            await asyncio.sleep(300)  # Check every 5 minutes, per-signal intervals enforced inside
        except KeyboardInterrupt:
            print("\n\n🛑 Monitoring stopped.")
            break
        except Exception as e:
            print(f"\n⚠ Error in monitoring loop: {e}")
            print("   Retrying in 60 seconds...")
            await asyncio.sleep(60)


if __name__ == "__main__":
    if "--loop" in sys.argv:
        asyncio.run(monitoring_loop())
    else:
        asyncio.run(check_all_signals())
