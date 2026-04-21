# Blog & News Section

## Blog (`/blog`)
- Marketing-oriented content hub for SEO and lead capture.
- Topics: SMC education, market analysis recaps, platform feature announcements.
- Each blog post should reference ZAIN Brain concepts for consistency.

## News Section (Dashboard)
- Powered by Forex Factory XML feed cached daily via `sync_forex_factory.py`.
- Data stored in Supabase `market_news` table.
- Fields: event_date, event_time, currency, event_name, impact (High/Medium/Low), source_url.
- NewsModal displays today's events on dashboard load.
- NewsAlertManager triggers 15-minute warning popups.
- News Agent generates multi-persona discussions in #market-news channel.

## News Pipeline
1. `sync_forex_factory.py` runs daily at 01:00 AM (cron) → caches week's events to Supabase.
2. `news_agent.py` runs each morning → reads ZAIN Brain + Supabase news → generates community discussion.
3. `NewsAlertManager.tsx` polls Supabase every 30 seconds → triggers popups 15 min before events.

## Tags
#Blog #News #ForexFactory #SEO #NewsAlert
