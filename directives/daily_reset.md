# Daily Reset & Synchronization

## Goal
The Daily Reset script ensures that the Zen Pips local terminal is cleared and all trading data from the day is preserved in Supabase and cached locally for redundancy. It also sends a final recap to the Zen Pips community.

## Trigger Time
- **Scheduled:** Every day at **1:00 AM UTC** (Before the start of the next day's Asian/London session).

## Logic & Workflow
1. **Load Active Signals:** Read from `.tmp/signals/active_signals.json`.
2. **Safety Cache:** Save the current state of signals to `.tmp/cache/signals_summary_YYYYMMDD_HHMMSS.json`.
3. **Database Sync:** Sync all signal data (pips, status, TP hits, SL) to the Supabase `signals` table.
4. **Send Final Recap:**
    - Calculate total daily pips.
    - List all signals that hit TP3 (Full Sweep).
    - Format and send a professional recap message to both the **VIP Channel** and **Free Group**.
5. **Unclog (Reset):** Clear the `.tmp/signals/active_signals.json` file by setting it to an empty list `[]`.

## Tools to use
Run the dedicated reset script:
```bash
python execution/daily_reset.py
```

## Inputs
- `.tmp/signals/active_signals.json`: Source of signal data.
- `.env`: Requires `TELEGRAM_BOT_TOKEN`, `FREE_GROUP_ID`, `ZENPIPS_CHANNEL_ID`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

## Outputs
- **Telegram:** Final Daily Recap message.
- **Supabase:** Updated `signals` table with confirmed closure of day's trades.
- **Local:** Timestamped JSON in `.tmp/cache/`.
- **System State:** `active_signals.json` is set to `[]`.

## Error Handling
- **No Signals:** If the file is empty or missing, the script logs an alert and skips the recap/sync.
- **Sync Failure:** If Supabase is unreachable, the script relies on the local safety cache to ensure data isn't lost before clearing the active file.
