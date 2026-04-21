# MT5 Bridge Operations

## Overview
The MetaTrader 5 (MT5) Bridge connects the Zen Pips web dashboard to the user's MT5 terminal, enabling autonomous order placement, real-time pip tracking, and trade lifecycle management.

## Components

### 1. Local Bridge (`scripts/local_bridge.py`)
- Runs on the user's local machine alongside MT5.
- Polls Supabase for new ACTIVE signals.
- Places pending orders on MT5 with exact entry, SL, TP1/TP2/TP3 levels.
- Reports order status back to Supabase.

### 2. MT5 Bridge (`scripts/mt5_bridge.py`)
- Server-side bridge for VPS deployment.
- Handles the same signal-to-MT5 pipeline but runs 24/7 on the VPS.
- Monitors open positions and syncs status to Supabase in real-time.

### 3. Protection Engine (`scripts/protection_engine.py`)
- **3-Tier Autonomous Risk Management**:
  - **Tier 1 (TP1 Hit)**: Move SL to breakeven (entry price). Position is now risk-free.
  - **Tier 2 (TP2 Hit)**: Move SL to TP1 level. Locks in partial profit.
  - **Tier 3 (TP3 Hit)**: Close remaining position. Full target achieved.
- Runs continuously, checking all active signals against live prices.
- Updates `current_sl` field in Supabase to reflect trailing stops.

### 4. TradingView Agent (`scripts/tv_agent.py`)
- Monitors TradingView alerts for automated signal generation.
- Parses alert messages and creates new signals in Supabase.

## Signal Lifecycle
1. **Signal Created**: Admin uploads chart → AI extracts data → inserted into Supabase `signals` table.
2. **Signal Active**: Bridge picks up the signal → places pending order on MT5.
3. **TP1 Hit**: Protection Engine moves SL to entry. Signal marked `tp1_hit: true`.
4. **TP2 Hit**: SL moved to TP1. Signal marked `tp2_hit: true`.
5. **TP3 Hit / SL Hit**: Position closed. Signal marked `closed: true`.
6. **Victory Broadcast**: If TP hit, celebration message sent to Telegram and community.

## Signal Schema
| Field | Type | Description |
|---|---|---|
| pair | string | e.g., "XAU/USD" |
| ticker | string | e.g., "XAUUSD" |
| direction | BUY/SELL | Trade direction |
| entry | number | Entry price |
| sl | number | Stop loss |
| current_sl | number | Current (trailing) stop loss |
| tp1, tp2, tp3 | number | Take profit levels |
| tp1_hit, tp2_hit, tp3_hit | boolean | TP status flags |
| closed | boolean | Whether trade is complete |
| pip_multiplier | number | 1 for most, 10 for gold, 100 for JPY |
| confluence | string | Analysis notes |

## Tags
#MT5 #Bridge #ProtectionEngine #Signals #Automation
