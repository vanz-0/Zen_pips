# Data Storage & Supabase Schema

## Overview
Zen Pips uses **Supabase** for its primary data persistence. This creates a hybrid architecture where ZAIN Brain handles **knowledge/logic** and Supabase handles **live state/data**.

## Core Tables

### 1. `client_trading_profiles`
- **Purpose**: Stores user-specific settings, credentials, and metadata.
- **Fields**:
    - `user_id`: UUID (Primary Key)
    - `mt5_id`: MT5 account number linked to the bridge.
    - `membership_tier`: Recruit, Professional, Dominator.
    - `credits_remaining`: Used for Chart AI and Chat AI.
    - `onboarding_complete`: Boolean flag for UI flow.
    - `trading_stats`: JSON blob containing win rate, preferred pairs, etc. (syncs from Journal).

### 2. `signals`
- **Purpose**: Centralized trade signal repository.
- **Fields**:
    - `pair`, `direction`, `entry`, `sl`, `tp1`, `tp2`, `tp3`.
    - `status`: ACTIVE, CLOSED, CANCELLED.
    - `current_sl`: Used by Protection Engine for trailing stops.
    - `result_pips`: Total pips gained/lost upon closing.

### 3. `market_news`
- **Purpose**: Cached economic calendar from Forex Factory.
- **Fields**:
    - `event_date`, `event_time`, `currency`, `event_name`, `impact`.

### 4. `community_messages`
- **Purpose**: Real-time chat logs for the website dashboard.
- **Fields**:
    - `channel_id`: #general, #setups, #vip, #market-news.
    - `user_id`: Null for AI bot messages.
    - `content`, `metadata` (for chart images).

### 5. `trading_journal`
- **Purpose**: User-specific trade logs for AI analysis.
- **Fields**:
    - `user_id`, `pips`, `psychology`, `session`, `notes`.

## Security & Credentials
- All API keys and secrets are stored as server-side environment variables (`.env`).
- User passwords are managed by Supabase Auth (hashed/salted).
- MT5 credentials are encrypted at rest if stored.

## Tags
#Supabase #Database #Schema #UserMetadata #Security
