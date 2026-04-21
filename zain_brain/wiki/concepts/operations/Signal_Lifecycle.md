# Signal Lifecycle & Directives

## Signal Creation Flow
1. Admin captures chart screenshot from TradingView.
2. Screenshot uploaded via ChartAI or admin dashboard.
3. AI extracts: pair, direction, entry, SL, TP1/TP2/TP3 (using `process_signal.md` directive).
4. Signal inserted into Supabase `signals` table with `status: ACTIVE`, `closed: false`.
5. Broadcast triggered to Telegram community + website signal feed.

## Directives System (`/directives/`)
Pre-written operational playbooks that agents follow:

| Directive | Purpose |
|---|---|
| `process_signal.md` | Extract signal data from chart screenshots |
| `signal_processing.md` | End-to-end signal pipeline |
| `monitor_signals.md` | Active signal monitoring rules |
| `daily_reset.md` | Daily maintenance and cleanup procedures |
| `automation_targets.md` | What should be automated vs manual |
| `content_templates.md` | Marketing content templates |
| `manage_subscriptions.md` | Subscription management rules |
| `support_bot_content.md` | Bot response templates |

## System Health Check (`systemcheck.py`)
- The "God Script" that monitors all autonomous components.
- Checks: MT5 Bridge status, TV Agent, Protection Engine, Supabase connectivity.
- Reports overall system health to admin.

## Tags
#Signals #Directives #Lifecycle #SystemCheck #Automation
