# ZAIN Metadata & User Integrity Strategy

## Overview
To maintain an elite institutional environment, ZAIN Brain actively tracks **metadata** regarding trade execution and AI usage. This data is not just for logging; it is used to refine the Brain's own predictive accuracy and to issue warnings to non-serious contributors.

---

## 1. Trade Metadata (The Journal Protocol)
Every order entered via the Zen Pips dashboard or MetaTrader 5 Bridge MUST include the following metadata fields in the user's journal:
- **Session Timestamp**: London, NY, or Asian (Calculated automatically from execution time).
- **Confluence Badge**: Which SMC rules were met? (OB, FVG, MSS, Liquidity Sweep).
- **Psychology Metadata**: A mandatory "Sentiment" tag (e.g., Disciplined, Fearful, Impulsive).
- **Pair Horizon**: Relationship to the 40+ tracked Vantage instruments.

### Purpose:
The ZAIN Brain analyzes this metadata monthly to generate **Personalized Edge Reports**. 
*Example: "User @TraderX is 82% accurate during London Open on GBP/USD when using a 15M OB entry, but only 12% accurate on Crypto weekends."*

---

## 2. Meta AI Usage & Seriousness Scoring
ZAIN Brain monitors all interactions with the Chart AI and Chat AI to distinguish between "Serious Institutional Analysis" and "Platform Noise".

### Integrity Tiers:
- **Tier 1 (Serious)**: Consistent analysis of high-probability SMC setups. High user engagement with journal syncing.
- **Tier 2 (Testing)**: New users exploring features.
- **Tier 3 (Non-Serious)**: Users attempting to "spam" the AI with non-chart images, nonsensical queries, or low-effort gambling-style bets.

### The Warning System:
If a user's **Seriousness Score** drops below a threshold (20% of interactions classified as non-serious):
1. **First Warning**: Auto-generated bot message advising them to review the Institutional Guide.
2. **Second Warning**: Temporary 24-hour lockout from the Chart AI engine.
3. **Third Warning**: Permanent flag in the community, restricting them from posting in #setups-and-charts until they pass a "Basic SMC Competency Test" in the Vault.

---

## 3. Deployment Logic
- Metadata is stored in Supabase (`trading_journal` and `user_integrity_logs`).
- ZAIN Brain reads the aggregate data daily to rewrite the "Community Quality" concept file.

## Tags
#Metadata #SeriousnessScore #JournalLogic #Integrity #Supabase
