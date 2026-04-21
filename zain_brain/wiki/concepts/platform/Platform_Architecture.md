# Platform Architecture — Zen Pips Website

## Overview
The Zen Pips platform is a Next.js 14 web application deployed on **Netlify**. Backend data is managed via **Supabase** (PostgreSQL + Auth + Storage + Realtime). The frontend provides an institutional-grade trading dashboard.

## URL & Deployment
- **Production**: https://zenpips.netlify.app
- **Local Development**: http://localhost:3000
- **Supabase Project ID**: cablmdyiymmkhseqfhxq

## Core Dashboard Tabs (Components)

### 1. VaultTab (`VaultTab.tsx`)
- Educational resource library with 63+ PDF resources.
- Organized by tier: Foundation, Intermediate, Advanced, Elite.
- Free resources available to all; VIP resources locked behind subscription.

### 2. CommunityTab (`CommunityTab.tsx`)
- Discord-style real-time chat interface.
- Channels: `general-chat`, `setups-and-charts`, `market-news`, `vip-lounge`.
- `market-news` channel is populated by AI personas (Zen Master, LiquidityHunter, OrderBlock_OG).
- Real-time via Supabase Realtime subscriptions.

### 3. ChartAITab (`ChartAITab.tsx`)
- Upload chart screenshots for instant SMC analysis.
- Uses OpenAI GPT-4o Vision to identify OBs, FVGs, liquidity zones.
- Credit-based system: users get 10 free credits, then purchase more.

### 4. JournalTab (`JournalTab.tsx`)
- Personal trading journal integrated with MT5 Bridge.
- Tracks: daily pip count, win rate, psychology logs, session performance.
- Generates personalized AI insights based on trading patterns.

### 5. ProfileTab (`ProfileTab.tsx`)
- User profile management, MT5 ID connection, subscription status.
- Displays trading statistics and achievement badges.

### 6. OnboardingTab (`OnboardingTab.tsx`)
- New user registration flow with 7-day trial activation.
- Profile setup popup for capturing user data.

### 7. InnovationHubTab (`InnovationHubTab.tsx`)
- Community feature voting and suggestion system.
- Users propose new tools; community votes on priorities.

### 8. NewsModal (`NewsModal.tsx`) + NewsAlertManager (`NewsAlertManager.tsx`)
- Modal displaying today's high-impact events from Forex Factory cache.
- AlertManager triggers 15-minute warning popups before news events.

## API Routes (`src/app/api/`)
| Route | Purpose |
|---|---|
| `/api/news` | Fetches cached Forex Factory news from Supabase |
| `/api/chat` | AI chatbot conversations (GPT-4o) |
| `/api/analyze-chart` | Chart screenshot AI analysis |
| `/api/credits` | Token/credit management |
| `/api/auth` | Authentication flows |
| `/api/leads` | Marketing lead capture |
| `/api/prices` | Live price data |
| `/api/mt5-execute` | MT5 order execution bridge |
| `/api/telegram` | Telegram bot webhooks |
| `/api/telegram-broadcast` | Signal broadcasting to TG |
| `/api/affiliate` | Affiliate/referral tracking |

## Tags
#Platform #NextJS #Netlify #Supabase #Dashboard
