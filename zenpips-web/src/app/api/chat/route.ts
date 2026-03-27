import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

// Master Limit: 10 queries per week
const WEEKLY_LIMIT = 10;
const ADMIN_USERNAME = process.env.ADMIN_TELEGRAM_USERNAME || 'MadDmakz';

function getSupabase() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    return createClient(supabaseUrl, supabaseKey)
}

function getOpenAI() {
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
}

export async function POST(req: Request) {
    try {
        const supabase = getSupabase()
        const openai = getOpenAI()

        const { message, userId } = await req.json()
        if (!message) return NextResponse.json({ error: "Empty" }, { status: 400 })

        // 1. Fetch User Profile for Rate Limiting (Skip if Admin)
        const { data: profile } = await supabase
            .from('client_trading_profiles')
            .select('*')
            .eq('id', userId)
            .single()

        const is_admin = profile?.telegram_id?.toString() === process.env.ADMIN_TELEGRAM_ID;

        // Reset weekly count if it's been more than 7 days
        if (profile) {
            const lastReset = new Date(profile.last_chat_reset)
            const now = new Date()
            const diffDays = (now.getTime() - lastReset.getTime()) / (1000 * 3600 * 24)
            if (diffDays > 7) {
                await supabase.from('client_trading_profiles').update({ weekly_chat_count: 0, last_chat_reset: now.toISOString() }).eq('id', userId)
                profile.weekly_chat_count = 0
            }
        }

        // Check Limit
        if (!is_admin && profile && profile.weekly_chat_count >= WEEKLY_LIMIT) {
            return NextResponse.json({
                reply: `🔴 UNLIMITED QUERIES REACHED. For further assistance, please contact @Zen_pips_bot and use the /help command to reach an admin directly.`,
                limitReached: true
            })
        }

        // 2. RAG Logic (Search Documents)
        const embedRes = await openai.embeddings.create({ input: message, model: "text-embedding-3-small" });
        const { data: documents } = await supabase.rpc("match_documents", {
            query_embedding: embedRes.data[0].embedding,
            match_count: 5
        });

        const context = documents?.map((d: any) => d.content).join("\n\n") || "No local data found.";

        // 3. AI Completion (Step-by-Step Institutional Mode)
        const systemPrompt = `You are the Zen Pips Institutional AI Assistant.
        Your primary knowledge comes from provided context (PDF strategies and business SOPs).

        DIRECTIONS:
        - If the user asks about the business, pricing, or setup (MT5, Copy Trader), provide a clear STEP-BY-STEP guide.
        - If they ask about trading (Gold, BTC, SMC), use highly technical language (BOS, CHoCH, Liquidity, FVG).
        - If the user is on their 9th message today (Current Count: ${profile?.weekly_chat_count || 0}), include a warning at the END like: "⚠️ Your next query will be your last for this week."

        CONTEXT:
        ${context}`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "system", content: systemPrompt }, { role: "user", content: message }],
            temperature: 0.1
        });

        const reply = completion.choices[0].message.content;

        // 4. Update Count
        if (!is_admin && userId) {
            await supabase.from('client_trading_profiles')
                .update({ weekly_chat_count: (profile?.weekly_chat_count || 0) + 1 })
                .eq('id', userId)
        }

        return NextResponse.json({ reply });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
