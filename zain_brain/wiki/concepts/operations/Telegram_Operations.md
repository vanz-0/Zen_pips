# Telegram Operations

## Channels & Bots
- **Private Community**: https://t.me/+zWQd9S4pAyMyNmY8
- **Support Bot**: https://t.me/zenpips_support_bot (@Zen_pips_bot)
- **Admin Bot**: `zenpips_admin_bot.py` — handles admin commands, signal broadcasts, and user management.
- **Admin Contact**: @MadDmakz

## Signal Broadcast Flow
1. New signal inserted into Supabase `signals` table.
2. `broadcast_signals.mjs` detects new signal and formats it for Telegram.
3. Message sent to private community with: pair, direction, entry, SL, TP1/TP2/TP3, chart screenshot.
4. `/api/telegram-broadcast` handles the API endpoint for web-triggered broadcasts.

## Chart Screenshot Distribution
- `upload_charts.mjs` uploads chart images to Supabase Storage.
- Public URLs are embedded in Telegram broadcast messages.
- Same images displayed in the website's #setups-and-charts channel.

## Bot Commands
| Command | Action |
|---|---|
| /start | Welcome message + link to dashboard |
| /signals | Show current active signals |
| /stats | Display bot performance statistics |
| /vip | VIP subscription information |

## Community Moderation
- `community_moderator.py` handles automated moderation.
- Filters spam, manages user reports, and auto-responds to common queries.

## Tags
#Telegram #Bot #Broadcast #Signals #Community
