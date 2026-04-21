# Marketing Outreach Tone & Strategy

## Voice & Brand Identity
- **Professional yet approachable.** We are institutional traders, not flashy gurus.
- **Never promise guaranteed returns.** Use language like "high-probability setups" and "institutional edge."
- **Educational first, promotional second.** Every post should provide genuine value before any CTA.
- Avoid: "Get rich quick," "100% win rate," "guaranteed profits," "$$$"
- Use: "Institutional precision," "Smart Money positioning," "liquidity engineering," "disciplined execution"

## Platform Engines

### Reddit Engine (`reddit_engine.py`)
- **Status**: ✅ Operational
- Targets subreddits: r/Forex, r/ForexTrading, r/Daytrading, r/KenyaFinance, r/AfricaInvestments
- Scrapes 10 posts → AI filters to top 3 most viable → generates institutional-tone replies.
- All CTAs link to: https://t.me/+zWQd9S4pAyMyNmY8

### Quora Engine (`quora_engine.py`)
- **Status**: ✅ Operational
- Targets finance/trading keywords with East Africa focus.
- Scrapes 10 questions → AI selects top 3 → generates expert answers with soft CTA.

### LinkedIn Engine (`linkedin_engine.py`)
- **Status**: ⏳ Blocked — Needs Apify Actor ID from user.
- Targets: Investment groups, Eastern Africa finance professionals.
- Same 10→3 AI filtering pipeline.

### Marketing Orchestrator (`marketing_orchestrator.py`)
- Coordinates all three engines in sequence.
- Manages rate limiting and credit tracking.

### Links Manager (`links_manager.py`)
- Rotates CTAs by lead temperature: Cold → Educational links, Warm → Community links, Hot → Action links.
- All hot CTAs converge to Telegram private community.

## Content Rules
- Maximum 10 scrape results per engine per cycle (credit efficiency).
- AI filters down to top 3 most viable leads.
- Never post identical content across platforms — each must be uniquely phrased.
- Include genuine value (market insight, educational tip) before any promotional link.

## Tags
#Marketing #Reddit #Quora #LinkedIn #Outreach #CopyWriting
