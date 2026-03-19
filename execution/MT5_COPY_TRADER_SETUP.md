# ⚡ Zen Pips - MT5 Copy Trader Setup

This guide explains how to use the Zen Pips MT5 Copy Trading node. Since our signals are stored on the cloud via Supabase, **the database acts as the Master Signal node.** 

Clients simply run this Python bridge locally alongside their MetaTrader 5 terminal, transforming their PC or VPS into a powerful **Slave Node** that copies your master trades with dynamic risk.

## 1. Prerequisites (For the Client)
1. **MetaTrader 5 Terminal** installed and logged into their Broker (e.g., HFM).
2. **Python 3.9+** installed on their computer.
3. The Zen Pips Node files: `mt5_bridge.py` and `.env`

## 2. Installation
The client must open their Command Prompt / Terminal and run:

```bash
pip install MetaTrader5
pip install requests python-dotenv
```

## 3. Configuration (`.env`)
Clients will need an environment file to securely connect to the master database. Provide the client with a secure `.env` file containing:

```env
# Supabase Master Connection
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
SUPABASE_SERVICE_ROLE_KEY="your-anon-or-service-key"

# Optional: Hardcode MT5 Login Details (If left blank, the script uses whatever MT5 account is currently open on the screen)
MT5_ACCOUNT_NUMBER=""
MT5_PASSWORD=""
MT5_SERVER="HFMarketsSV-Live Server"
```

## 4. Running the Copy Trader
Once configured, the client opens MT5 in the background and runs the bridge script:

```bash
python mt5_bridge.py
```

### What happens?
1. **Syncing**: The script connects to the MT5 terminal and authenticates.
2. **Listening**: It queries the Supabase `signals` table every 3 seconds for new trades.
3. **Dynamic Risk**: When a signal fires on your end, the client's script calculates the precise Lot Size based on their `RISK_PERCENT` setting (default 1%) relative to their Account Equity and the Stop Loss distance.
4. **Execution**: The trade fires instantly into their MT5 terminal with a unique Magic Number (`999111`).

## FAQ / Advanced
**How does the lot size work?**
If a client has a $1,000 account and `RISK_PERCENT = 1.0`, the script calculates exactly 1% ($10) of risk. It divides that $10 by the tick value of the stop loss distance given in the signal to place the exact micro-lot required. If risk calculation fails, it defaults to `0.01` lots to ensure safety.

**Can multiple clients run this?**
Yes. Since the trades are placed by the `python` client reading from the database, scaling is infinite. 1,000 clients can all be running `mt5_bridge.py` on their own machines, and when you upload 1 signal to Supabase, all 1,000 scripts read it and execute it simultaneously on their respective MetaTrader 5 terminals.
