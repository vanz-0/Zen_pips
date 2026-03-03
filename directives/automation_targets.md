# Zen Pips: Backend Automation vs Frontend Integration

This document outlines exactly which parts of the Supabase architecture will require automated **Modal (Python)** background scripts, and which will simply be read by your **Vercel (Next.js)** website.

## 🔴 Requires Modal (Python) Backend Automation
These tables represent your "Engine". They require scripts running 24/7 on Modal to interact with the database autonomously.

1. **`signals` Table**
   - **Modal Job:** Runs `monitor_signals.py` every X minutes. It reads active signals, fetches current live prices (via TwelveData/Binance), and if a TP or SL is hit, it updates the row in this table and fires off a Telegram string.

2. **`client_trading_profiles` Table (Auto-Execution)**
   - **Modal Job:** When a new signal is logged, a Modal script triggers and immediately connects to the HFMarket API via MetaTrader 5, executing the exact trade setup on each listed client account based on their risk profile.

3. **`users` & `subscriptions` Tables**
   - **Modal Job:** The `@Zen_pips` Telegram bot script. When users click "Start", the bot writes their info to `users`. When they provide a TRC20 TxID, the bot creates a `pending` row in `subscriptions`.

4. **`support_interactions` Table**
   - **Modal Job:** The Support FAQ Telegram bot. It listens to user messages, logs their questions here, tries to answer them, and flags `resolved = FALSE` if human intervention (you) is required.

---

## 🟢 Requires Vercel (Next.js) Frontend Integration
These tables do not need automation. Your Vercel website simply reads from them when a user loads a webpage, or you (the Admin) write to them through an admin dashboard.

1. **`content_links` Table**
   - **Vercel Job:** The website renders buttons like "Download Guide" by querying this table for the latest URL. 
   - *(Note: The Modal bot also reads this so it can send the exact same links in Telegram without hardcoding).*

2. **`marketing_assets` Table**
   - **Vercel Job:** The website reads blog posts, service descriptions, and active UI copy from here.

3. **`bot_faqs` Table**
   - **Admin Job:** You update this table via the Supabase Dashboard (or a future admin web panel) to teach your bot new answers. The Modal bot then reads this data on the fly.
