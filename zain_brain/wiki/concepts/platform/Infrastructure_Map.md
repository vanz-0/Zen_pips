# Zen Pips Institutional Infrastructure Map

This document maps all primary architectural components of the Zen Pips ecosystem into the ZAIN Brain for total operational awareness.

---

## 🏗️ 1. Infrastructure Core
- **Framework**: Next.js 14 (App Router)
- **Deployment**: Netlify (Production: `zenpips.netlify.app`)
- **Database**: Supabase (Project: `cablmdyiymmkhseqfhxq`)
    - **Auth**: Managed user sessions and institutional profile access.
    - **Realtime**: Used for community chat and instant signal broadcasting.
    - **Storage**: Hosts chart screenshots and educational vault PDFs.

## 🌉 2. The Bridge (MetaTrader 5)
- **Primary Interface**: MetaPhrase / `scripts/mt5_bridge.py`.
- **Function**: Executes signals generated on the dashboard or via TradingView directly to the client's MT5 terminal.
- **Protection Engine**: Autonomously manages risk (Trailing SL, TP locking).

## 💬 3. Community Presence
- **Web Community**: Discord-style interface with AI persona interaction (#market-news).
- **Telegram Hub**: Private signals group and support bot (@Zen_pips_bot).
- **Social Marketing**: Reddit, Quora, LinkedIn, and X (Twitter) automated outreach engines.

## 🎓 4. Intelligence & Education
- **ZAIN Brain**: Persistent Markdown-based memory (Karpathy pattern).
- **Educational Vault**: 4-tiered repository (Foundation to Elite) with 63+ resources.
- **Chart AI**: GPT-4o Vision identifying BOS, CHoCH, OBs, and FVGs in seconds.

## 💰 5. Commercial Model
- **Pricing**: $50/Month Membership (Coming Soon).
- **Token System**: $10 / $20 / $50 tiers for AI analysis credits.
- **Launch Status**: Entire project is currently **FREE** during the bootstrap phase.

---

## 🛠️ Operational Directives
ZAIN Brain monitors all `/directives/*.md` files to ensure:
1. Every signal extracted from a chart matches the 3-confluence protocol.
2. Every marketing post provides educational value before the CTA.
3. Every bot response is personalized via the client's trading journal.
