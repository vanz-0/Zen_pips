# News Manipulation & Institutional Volatility

## Core Thesis
High-impact economic news releases are NOT random market events. They are **engineered volatility injections** used by institutions to sweep liquidity pools before executing their real directional bias. Retail traders who enter DURING news are almost always trapped.

## The Institutional News Playbook
1. **Pre-News Accumulation**: 1-4 hours before news, price consolidates in a tight range. Retail traders place pending orders above/below this range.
2. **The Spike (Liquidity Sweep)**: At the exact moment of news release, price violently spikes in ONE direction, triggering all the retail stop-losses and pending orders in that zone.
3. **The Reversal (Displacement)**: Within 5-30 minutes post-news, price aggressively reverses in the TRUE institutional direction. The spike was merely liquidity collection.
4. **The Continuation**: Once "dumb money" has been cleared, price trends smoothly in the institutional direction for hours/days.

## Practical Rules
- **NEVER enter a trade within 15 minutes before or after a High Impact news release.**
- Wait for the liquidity sweep to complete, then look for a displacement candle + FVG/OB entry.
- News on USD affects ALL major pairs simultaneously. Prioritize USD events above all others.
- Medium-impact news can be traded through IF your stop-loss is wider than the expected volatility spike.

## Key News Events by Impact

### USD (Most Volatile)
- Non-Farm Payrolls (NFP) — First Friday of every month
- CPI (Consumer Price Index)
- FOMC Interest Rate Decision
- GDP, Retail Sales, PPI

### EUR
- ECB Interest Rate Decision
- German CPI, Eurozone GDP
- PMI (Manufacturing/Services)

### GBP
- BOE Interest Rate Decision
- UK CPI, Employment Data
- GDP

### CAD / NZD / CHF / JPY
- Bank of Canada Rate Decision
- RBNZ Rate Decision
- Swiss National Bank Rate Decision
- Bank of Japan Rate Decision

## Data Sources
- Forex Factory XML Feed (cached daily via `sync_forex_factory.py`)
- Results stored in Supabase `market_news` table

## Tags
#NewsManipulation #LiquiditySweep #ForexFactory #HighImpactEvents
