# Journal System

## Purpose
The Institutional Journal is a personal trading performance tracker integrated with the MT5 Bridge. It provides automated pip counting, psychological tracking, and AI-driven performance insights.

## Features
- **Automated Daily Pip Count**: Synced from MT5 via the bridge. Each closed trade's result is logged automatically.
- **Manual Entry**: Users can also manually log trades with pair, direction, entry, exit, pips, and notes.
- **Psychology Tracking**: After every trade, users log their emotional state (Confident, Anxious, Impulsive, Disciplined, etc.). Over time, the AI correlates emotional states with win/loss ratios.
- **Session Performance**: Tracks which sessions (Asian, London, NY) the user performs best in.
- **Win Rate & RR Tracking**: Rolling 7-day, 30-day, and all-time win rates displayed with average risk-to-reward ratios.

## AI Integration
- The Chat AI reads journal data to personalize responses.
- Weekly AI summary: "This week you took 12 trades. Win rate: 58%. Your best session was London on EUR/USD. Your worst session was Asian on GBP/JPY. Consider avoiding Asian session GBP trades."
- Psychology pattern detection: "You've marked 'Impulsive' on 4 of your last 5 losses. Consider implementing a 5-minute cooldown rule after each trade."

## Data Storage
- Supabase table: `trading_journal`
- Fields: user_id, date, pair, direction, entry, exit, pips, session, psychology, notes, created_at

## Tags
#Journal #Performance #Psychology #MT5 #Personalization
