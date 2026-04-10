# Zen Pips Antigravity Agent Manifesto

This document codifies the institutional standards for all AI agents (Antigravity instances) operating within the Zen Pips repository.

## 1. Institutional Governance
- **Capital Protection First**: All trades must have trailing stop logic. 
    - TP1 hit -> Secure partial profit/trail.
    - TP2 hit -> Move Stop Loss to Entry (Risk-Free).
- **Audit Integrity**: Run `npm run check` (systemcheck.py) before any major deployment to ensure Supabase, MT5, and Telegram are in sync.

## 2. Communication Standards
- **Community First**: Every market update or signal change must be broadcast to the Website Community Hub and Telegram Admin channel simultaneously.
- **Reporting**: Maintenance reports are routed through the dedicated **Support Bot** (Centralized Issue Tracking).

## 3. Technology Stack Priorities
- **Market Data**: Prefer the **TradingView MCP** (Playwright-based) over TwelveData for high-speed, accurate institutional charting.
- **Authentication**: Use the **Brevo API Bridge** for all user onboarding to ensure premium, branded delivery.

## 4. Execution Workflow
- Signals are processed through the `maintenance_cron.py` script.
- Execution is handled via the **MT5 Bridge** with `copy_events`.

---
*Codified on 2026-04-10 for the Zen Pips Dominators.*
