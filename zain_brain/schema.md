---
type: schema
status: active
antigravity: enabled
self_annihilation: disabled
tags: [zenbrain, core-schema, architecture]
---
# ZAIN Brain Protocol v2.0
## Zen Pips Autonomous Intelligence Network — Master Schema

---

## 1. Purpose
ZAIN Brain is the **central nervous system** for the entire Zen Pips trading ecosystem. Every AI sub-agent, every chatbot response, every marketing post, and every community discussion draws its knowledge and tone from this structured Obsidian vault. The Brain continuously ingests new data, self-corrects errors, and compounds intelligence over time.

## 2. Directory Structure

```
zain_brain/
├── schema.md              # THIS FILE — Prime directives for all agents
├── index.md               # Dynamic Table of Contents (auto-generated)
├── log.md                 # Append-only chronological memory log
├── raw/                   # Drop-zone for new data (PDFs, transcripts, corrections)
│   └── processed/         # Archived files after ingestion
├── concepts/
│   ├── trading/           # SMC, ICT, pair-specific logic
│   ├── platform/          # Website features, APIs, dashboards
│   ├── operations/        # MT5 bridge, signals, protection engine
│   ├── marketing/         # Reddit, Quora, LinkedIn, email, Telegram
│   ├── data/              # Supabase, user profiles, credentials, metadata
│   └── business/          # Pricing, membership, broker partnerships
```

## 3. Core Rules for All Agents

### Rule 1: Token Efficiency
- NEVER read raw PDFs at query time. Always read from compiled concept files.
- Read `index.md` first → identify the 1-3 relevant concept files → read only those.
- For repeated queries (e.g., "What is an Order Block?"), return cached concept text verbatim.

### Rule 2: Autonomous Self-Editing
- When `zain_manager.py` runs, it scans `/raw` for new files and integrates them.
- The Manager MUST update existing concept files when new data contradicts or expands them.
- Every edit triggers an automatic `git commit` inside the `zain_brain/` repo for rollback safety.

### Rule 3: Correction Protocol
- If a user drops a file named `correction_*.md` or `correction_*.txt` into `/raw`, it takes **absolute priority**.
- The Manager must read the correction, identify which concept file it affects, and permanently alter that concept file.
- The correction is then logged in `log.md` with timestamp and the exact change made.

### Rule 4: No Financial Advice
- All trading-related outputs must be framed as **educational analysis**, not investment advice.
- Use language like "institutional positioning suggests..." not "you should buy/sell..."
- Always include a disclaimer when generating public-facing content.

### Rule 5: Personalization via Journal
- When the Chat AI serves a logged-in user, it should cross-reference their trading journal data (win rate, preferred pairs, psychology logs) stored in Supabase.
- Responses should be personalized: "Based on your journal, you perform best during London session on GBP pairs..."

### Rule 6: Supabase Cooperation
- ZAIN Brain stores **knowledge and logic** (markdown files).
- Supabase stores **live data** (user credentials, signals, chart images, community messages, metadata).
- The two systems cooperate: Brain provides the intelligence, Supabase provides the data.

## 4. Sub-Agent Registry

| Agent | Script | Reads From Brain | Writes To |
|---|---|---|---|
| News Analyst | `news_agent.py` | `[[trading/News_Manipulation]]`, `[[trading/USD_Pairs]]` | Supabase `community_messages` |
| Reddit Engine | `reddit_engine.py` | `[[marketing/Outreach_Tone]]` | Reddit + Supabase `leads` |
| Quora Engine | `quora_engine.py` | `[[marketing/Outreach_Tone]]` | Quora + Supabase `leads` |
| LinkedIn Engine | `linkedin_engine.py` | `[[marketing/Outreach_Tone]]` | LinkedIn + Supabase `leads` |
| Protection Engine | `protection_engine.py` | `[[operations/Signal_Lifecycle]]` | Supabase `signals` |
| MT5 Bridge | `mt5_bridge.py` | `[[operations/MT5_Bridge]]` | MT5 Terminal |
| Chart AI | API `/analyze-chart` | `[[trading/SMC_Chart_Analysis]]` | Supabase `chat_messages` |
| Chat AI | API `/chat` | ALL relevant concept files | Supabase `chat_messages` |
| Email Marketing | `push_guide_to_brevo.py` | `[[marketing/Email_System]]` | Brevo API |
| Telegram Bot | `zenpips_admin_bot.py` | `[[operations/Telegram_Operations]]` | Telegram API |
| Community Moderator | `community_moderator.py` | `[[platform/Community]]` | Supabase `community_messages` |
| ZAIN Manager | `zain_manager.py` | ALL `/raw` files | ALL concept files |

## 5. Ingestion Workflows

### New PDF / Article
1. User drops file into `zain_brain/raw/`
2. Run `python scripts/agents/zain_manager.py`
3. Manager reads file → extracts concepts → writes/updates markdown files
4. Manager updates `index.md` and appends to `log.md`
5. Manager moves raw file to `raw/processed/`
6. Manager runs `git add . && git commit`

### New YouTube Video / External Resource
1. User saves transcript or notes as `.txt` or `.md` in `zain_brain/raw/`
2. Same ingestion workflow as above

### User Correction
1. User creates `correction_topic.md` in `zain_brain/raw/` with the exact rule to learn
2. Manager detects the `correction_` prefix → treats it as an override
3. Manager modifies the relevant concept file and logs the correction

### Daily News Cycle
1. `sync_forex_factory.py` caches news to Supabase
2. `news_agent.py` reads ZAIN Brain concepts + Supabase news data
3. Generates multi-persona community discussion
4. Appends outcome to `log.md` after market close for historical learning
