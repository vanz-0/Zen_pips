# Signal Monitoring

## Goal
Automatically track active trading signals, check their current prices against Entry/TP/SL levels, and send real-time Telegram notifications when levels are hit. 

## Inputs
- `.tmp/signals/active_signals.json`: The single source of truth for all currently active signals.
- `.env`: Requires `TELEGRAM_BOT_TOKEN`, `FREE_GROUP_ID`, `ZENPIPS_CHANNEL_ID`.
- `.env` (Optional but recommended): `TWELVE_DATA_API_KEY` for robust gold (XAU) and silver (XAG) price fetching.

## Tools to use
Run the dedicated execution script to monitor and process signals:
```bash
python execution/monitor_signals.py
```

To run it continuously in a loop (checks every 5 minutes):
```bash
python execution/monitor_signals.py --loop
```

## Logic
**Check Intervals:**
- M5 timeframe signals: Checked every **15 minutes**.
- M15 timeframe signals: Checked every **60 minutes**.

**Events & Actions:**
- **TP1 Hit:** Status updates to "TP1 HIT - SL AT ENTRY". The stop loss is automatically moved to the entry price (risk-free). A notification is sent to both VIP and Free groups.
- **TP2 Hit:** Status updates. Notification sent.
- **TP3 Hit:** Status updates to "ALL TPs HIT". Signal is marked as `closed: true`. Notification sent.
- **SL Hit:** Signal is closed as a loss (or break-even if SL was moved to entry). Notification sent.

## Manual Updates
If you need to manually add a new signal or update a level (e.g. manually closing a trade early), edit `.tmp/signals/active_signals.json` directly. The monitoring script will pick up the changes on its next cycle.

## Edge Cases
- **API Limits / Errors:** The script falls back through multiple free metal APIs, but for maximum reliability, obtain a free TwelveData API key and add it to `.env` as `TWELVE_DATA_API_KEY`. Binance is used for BTC and has generous limits.
- **JSON Structure:** Ensure the `active_signals.json` maintains the exact key structure expected by the script.
