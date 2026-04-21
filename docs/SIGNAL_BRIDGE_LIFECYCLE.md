# Zen Pips Signal Bridge Lifecycle

This document provides a detailed technical breakdown of the institutional signal path, from the moment an order is identified to the final community broadcast in Telegram and the Zen Pips portal.

## 🟢 Phase 1: Institutional Entry (The Catalyst)
The lifecycle begins in the **Signal Deployment Portal**. An institutional analyst (e.g., `merchzenith@gmail.com`) inputs a high-probablity setup.

1.  **Price Capture**: The analyst specifies the Asset Pair (e.g., XAU/USD), Direction, Entry Price, and 3-Tier Take Profit targets.
2.  **Thesis Validation**: The analyst selects confluences (Order Block, FVG, Session Bias) which auto-builds the trade narrative.
3.  **The Broadcast Trigger**: Clicking "Broadcast to Live Partners" executes a multi-channel deployment.

## 🟠 Phase 2: Database & Web Integration
Once the "Broadcast" button is triggered, the following sequential events occur:

1.  **Supabase Sync**: A new record is inserted into the `signals` table with a `status: 'ACTIVE'`.
2.  **Community Persistence**: The trade narrative is converted from HTML to Markdown and inserted into the `community_messages` table (Channel: `setups-and-charts`).
3.  **Web Dashboard Update**: Real-time listeners in the Zen Pips web application (Next.js) detect the new signal and update the Signal Stats grid and Active Signals table for all users.

## 🔵 Phase 3: The Telegram Bridge (Broadcast)
Concurrent with the database sync, the **Institutional Bridge API** is called:

1.  **API Call**: The frontend sends a POST request to `/api/telegram-broadcast`.
2.  **Payload Processing**: The server-side route retrieves the `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHANNEL_URL` from the environmental configuration.
3.  **Telegram Dispatch**: The message is formatted with professional market-standard emojis and dispatched directly to the **Zen Pips Community Channel**.

## 🔴 Phase 4: Autonomous Monitoring (TV Sentinel)
Once a signal is active, the **TV Agent Sentinel** (running in the background) begins its monitoring cycle:

1.  **Price Polling**: The sentinel polls live institutional quotes (via YFinance/TwelveData) every 1–15 minutes depending on the timeframe.
2.  **Target Verification**:
    *   **TP1 Hit**: The sentinel triggers an automated broadcast ("TP1 SECURED ✅"), updates the database, and moves the Stop Loss to Entry (Risk-Free).
    *   **TP2/TP3 Hit**: Further broadcasts are dispatched, and the signal is eventually marked as `closed: true` with total pip profit calculated.
    *   **SL Hit**: The sentinel closes the signal and notifies the community to ensure full transparency.

## 🏁 Phase 5: Final Reconciliation
All completed signals are automatically archived and mirrored in the **Discipline Tracker (Journal)**, providing a permanent historical audit trail for the administrative profile.

---
*Authorized for Zen Pips Institutional Operations*
