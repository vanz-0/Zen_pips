# Chat AI & Chart AI System

## Chat AI (`/api/chat`)
- Powered by OpenAI GPT-4o.
- Available 24/7 on the dashboard as a floating widget and dedicated tab.
- **MUST read from ZAIN Brain** before responding to any trading question.
- Flow: User asks → Chat AI reads `zain_brain/index.md` → loads relevant concept file → responds with ZAIN-grounded answer.

## Chart AI (`/api/analyze-chart`)
- User uploads a chart screenshot (TradingView or similar).
- GPT-4o Vision analyzes the image and identifies: BOS, CHoCH, OBs, FVGs, liquidity zones, premium/discount.
- References `trading/SMC_Chart_Analysis.md` for analysis protocol.
- Returns a structured markdown analysis with entry suggestions (NOT financial advice).

## Credit System
- New users receive **10 free credits** upon registration.
- Each Chart AI analysis costs 1 credit. Each extended Chat AI conversation costs 1 credit per 10 messages.
- Additional credits: $10 for 20 credits, $20 for 50 credits, $50 for 150 credits.
- Credits are tracked in Supabase `client_trading_profiles.credits_remaining`.

## Personalization Protocol
- When a logged-in user interacts with Chat AI, the system should query their journal data.
- Cross-reference: preferred pairs, win rate, average RR, session performance, psychology patterns.
- Example personalized response: "Based on your journal, you've had 3 consecutive losses on GBP/JPY during Asian session. Consider focusing on London session GBP/USD where your win rate is 68%."

## Tags
#ChatAI #ChartAI #GPT4o #Credits #Personalization
