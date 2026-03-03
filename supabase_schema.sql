-- ==========================================
-- ZEN PIPS ECOSYSTEM: SUPABASE SCHEMA (V1)
-- Run this entire script in the Supabase SQL Editor
-- ==========================================

-- 1. Signals Table (Central Source of Truth for Vercel & Modal)
CREATE TABLE IF NOT EXISTS public.signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    pair TEXT NOT NULL,
    ticker TEXT NOT NULL,
    source TEXT DEFAULT 'metals',
    timeframe TEXT NOT NULL,
    direction TEXT NOT NULL, -- 'BUY' or 'SELL'
    entry NUMERIC NOT NULL,
    tp1 NUMERIC NOT NULL,
    tp2 NUMERIC NOT NULL,
    tp3 NUMERIC NOT NULL,
    sl NUMERIC NOT NULL,
    current_sl NUMERIC NOT NULL,
    pip_multiplier NUMERIC DEFAULT 100,
    tp1_hit BOOLEAN DEFAULT FALSE,
    tp2_hit BOOLEAN DEFAULT FALSE,
    tp3_hit BOOLEAN DEFAULT FALSE,
    sl_hit BOOLEAN DEFAULT FALSE,
    closed BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'ACTIVE',
    total_pips NUMERIC DEFAULT 0,
    check_interval_minutes INTEGER DEFAULT 15,
    confluence TEXT
);

-- 2. Client MT5 Trading Profiles (For Modal Auto-Execution)
CREATE TABLE IF NOT EXISTS public.client_trading_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_id BIGINT NOT NULL UNIQUE,
    mt5_account_id TEXT,
    risk_profile TEXT DEFAULT 'Conservative',
    total_profit NUMERIC DEFAULT 0.0,
    total_loss NUMERIC DEFAULT 0.0,
    win_rate NUMERIC DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 3. Users / CRM Table (Managed by Modal Telegram Bot)
CREATE TABLE IF NOT EXISTS public.users (
    telegram_id BIGINT PRIMARY KEY,
    username TEXT,
    first_name TEXT,
    wallet_address_used TEXT,
    is_vip BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 4. Subscriptions (Managed by Modal Bot / Payments)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_id BIGINT REFERENCES public.users(telegram_id),
    plan_type TEXT NOT NULL, -- '1_month', '6_months', '12_months', 'lifetime'
    status TEXT DEFAULT 'pending_txid', -- 'active', 'expired', 'pending_txid'
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    txid_hash TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 5. Support Interactions (Managed by Modal Bot / Human Admin)
CREATE TABLE IF NOT EXISTS public.support_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_id BIGINT REFERENCES public.users(telegram_id),
    message_type TEXT NOT NULL, -- 'question', 'payment_receipt', 'support'
    content TEXT NOT NULL,
    answered_by_bot BOOLEAN DEFAULT FALSE,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 6. Content Links (Managed by Vercel Admin, Read by Modal Bot)
CREATE TABLE IF NOT EXISTS public.content_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL, -- 'pdf_guide', 'onboarding_video', 'proof_of_profits'
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 7. FAQ Bot Knowledge Base (RAG Data for Modal Bot)
CREATE TABLE IF NOT EXISTS public.bot_faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_trigger TEXT NOT NULL,
    answer_response TEXT NOT NULL,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 8. Marketing Assets (Managed/Read by Vercel Website)
CREATE TABLE IF NOT EXISTS public.marketing_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL, -- 'blog_post', 'email_list', 'site_cta'
    title TEXT,
    content_or_url TEXT,
    published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Disable Row Level Security (RLS) initially so backend scripts and Next.js can easily read/write while we build.
-- Note: Vercel frontend will use the Anon Key but we will enable RLS restrictions once testing is complete.
ALTER TABLE public.signals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_trading_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_interactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_links DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_faqs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_assets DISABLE ROW LEVEL SECURITY;
