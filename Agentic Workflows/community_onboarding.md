---
description: Community onboarding and local setup guide for Zen Pips
---

# Zen Pips: Talk to your Charts ⚡️

## The Vision
See a setup. Give the entry & SL. An AI-powered fleet of orders is automatically queued with perfect **1:1, 1:2, and 1:3** take-profits. Your SL moves to breakeven the moment TP1 hits — all hands-free.

## Quick Start (5 Minutes)

### 1. Get Your Broker Account
- Sign up with **HFM** (our recommended broker for raw spreads)
- Download and install the **HFM MT5 Terminal**
- Fund your account: **$100 minimum** / **$500 recommended** for proper risk management

### 2. Connect to Zen Pips
- Visit the [Zen Pips Portal](https://zenpips.netlify.app)
- Navigate to **Analytics & Broker**
- Enter your **HFM MT5 Account ID** and save

### 3. Local Machine Setup

**Requirements**: Windows 10/11, 4GB+ RAM, Python 3.10+

```bash
# Clone the repo
git clone https://github.com/your-repo/zenpips.git
cd zenpips

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Edit .env with your Supabase, Telegram, and MT5 credentials
```

**Critical MT5 Setting**: Enable "Algo Trading" in MT5 → Tools → Options → Expert Advisors → ✅ Allow Algorithmic Trading

### 4. Run the Ecosystem
```bash
# Terminal 1: MT5 Execution Bridge
python execution/mt5_bridge.py

# Terminal 2: TP1 Breakeven Monitor
python execution/tp1_breakeven_monitor.py
```

## How Signals Flow

1. **You analyze** a chart using SMC/ICT confluence
2. **You input** just the Entry and Stop Loss
3. **System auto-calculates** TP1 (1:1), TP2 (1:2), TP3 (1:3)
4. **Signal fires** to Supabase + Telegram VIP channel
5. **Bridge executes** 3 pending orders on your MT5
6. **When TP1 hits** → SL automatically moves to breakeven
7. **You ride TP2/TP3** completely risk-free

## What Runs Where

| Component | Location | Uptime |
|---|---|---|
| MT5 Bridge | Your Windows PC | While PC is on |
| TP1 Monitor | Your PC or Modal Cloud | 24/7 if on Modal |
| Price Monitor | Modal Cloud | 24/7 |
| Web Dashboard | Netlify | 24/7 |
| Database | Supabase | 24/7 |
