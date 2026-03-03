# Signal Processing Orchestration

## Goal
To define the strict, non-negotiable sequence of events that the Orchestrator (you) must follow the moment the User provides a new trading signal, a screenshot of a signal, or an update to an existing signal (like a TP hit).

## The Golden Rule (Non-Negotiable)
**TELEGRAM FIRST. ALWAYS.**

The community's edge relies on speed and execution. If there is a delay in posting to Telegram because you were updating website code or databases, the signal value drops. 

## The Orchestration Sequence

When the User provides a new signal or an update:

### STEP 1: Generate & Send Telegram Copy (IMMEDIATE PRIORITY)
1. Immediately extract the pair, timeframe, direction, Entry, TPs, and SL from the user's input/screenshot.
2. Determine if it's a new signal or an update to an existing one.
3. Generate the highly-converting, emoji-rich Telegram copy (following the style in `content_templates.md`).
4. **Action:** If there is a Python script to send this (e.g., `execution/send_signals_25feb.py`), execute it immediately. If not, write the copy to a `.tmp/signals/` file and use the `notify_user` tool with `ShouldAutoProceed: false` so the user can copy-paste it immediately.
5. **DO NOT proceed to Step 2 until Step 1 is completely finished.**

### STEP 2: Update the Central Database / State
1. Open the active signals state file (currently `.tmp/signals/active_signals.json`, soon to be Supabase).
2. Append the new signal or update the existing signal's levels and pip metrics.
3. Ensure the `status` matches the reality of the trade (e.g., `ACTIVE`, `TP1 HIT - SL AT ENTRY`, `ALL TPs HIT`).

### STEP 3: Update the Frontend Website
1. Update any necessary frontend UI components (e.g., `trading-terminal.tsx`, `page.tsx`).
2. Recalculate and update the Total Pips / Total Signals statistics.

### STEP 4: Version Control Backup (Optional but recommended)
1. Run `git add .`, `git commit -m "..."`, and `git push` to ensure the live Vercel/Netlify website reflects the new data immediately.

## Example Flow
**User:** *"Silver hit TP1 on the M5"*
**You (Orchestrator):** 
1. Think: *"I must draft the Telegram update for Silver hitting TP1 and send it immediately."*
2. Execute Step 1.
3. Think: *"Telegram is handled. Now I will update `active_signals.json` to move the SL to entry for Silver M5."*
4. Execute Step 2.
5. Think: *"Now I will recount the total pips and update `page.tsx`."*
6. Execute Step 3.
