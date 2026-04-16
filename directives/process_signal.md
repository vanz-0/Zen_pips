# Signal Processing Directive

> **Purpose**: When a trading signal chart image is provided, extract the signal data and insert it into Supabase immediately. Do NOT ask for permission — execute and report.

## Inputs
- A chart screenshot (TradingView or similar) containing:
  - Pair (e.g., XAUUSD, BTCUSD)
  - Entry price
  - Stop Loss (SL)
  - Take Profit levels (TP1, TP2, TP3)
  - Direction (BUY/SELL) — inferred from SL/TP positioning relative to entry

## Steps

### 1. Extract Signal Data from Chart
Read the chart image and extract:
| Field | How to Identify |
|---|---|
| **Pair** | Top-left of chart header (e.g., "Bitcoin / U.S. Dollar") |
| **Timeframe** | In chart header (e.g., "5" = M5) |
| **Direction** | If SL > Entry and TPs < Entry → SELL. If SL < Entry and TPs > Entry → BUY |
| **Entry** | Blue label on chart (e.g., "Entry: 67542.5") |
| **SL** | Red label (e.g., "Stop Loss: 68399.5") |
| **TP1/TP2/TP3** | Green labels (e.g., "TP 1: 66685.5") |

### 2. Insert into Supabase
Run the following from within the `zenpips-web` directory:

```bash
node -e "const{createClient}=require('@supabase/supabase-js');const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);s.from('signals').insert({pair:'PAIR_HERE',ticker:'TICKER',source:'TradingView',timeframe:'M5',direction:'SELL',status:'ACTIVE',entry:0,tp1:0,tp2:0,tp3:0,sl:0,current_sl:0,tp1_hit:false,tp2_hit:false,tp3_hit:false,sl_hit:false,closed:false,total_pips:0,pip_multiplier:1,confluence:'ANALYSIS'}).select().then(({data,error})=>{if(error)console.error(error.message);else console.log(JSON.stringify(data[0],null,2))})"
```

Replace placeholders with actual values.

### 3. Verify
- Check the live site at `http://localhost:3000/` — the signal should appear in the trading terminal's signal feed via Supabase Realtime.

### 4. Report
After insertion, report to user:
- Pair, Direction, Entry, SL, TP1–TP3
- Signal ID from Supabase
- Confirmation that it's visible on the live site

## Signal Schema Reference
```
pair: string          (e.g., "BTC/USD")
ticker: string        (e.g., "BTCUSD")
source: string        (e.g., "TradingView")
timeframe: string     (e.g., "M5", "M15", "H1")
direction: "BUY" | "SELL"
status: string        (e.g., "ACTIVE")
entry: number
tp1: number
tp2: number
tp3: number
sl: number
current_sl: number    (same as sl initially)
tp1_hit: boolean      (false)
tp2_hit: boolean      (false)
tp3_hit: boolean      (false)
sl_hit: boolean       (false)
closed: boolean       (false)
total_pips: number    (0)
pip_multiplier: number (1 for most, 10 for JPY pairs)
confluence: string    (analysis notes)
```

## Edge Cases
- If chart is unclear, make best effort and flag uncertainty
- For gold (XAUUSD), pip_multiplier = 10
- For JPY pairs, pip_multiplier = 100
- Always set status to "ACTIVE" for new signals
