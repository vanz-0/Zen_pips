import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

// Master Limit: 10 queries per week
const WEEKLY_LIMIT = 10;

function getClients() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const openaiApiKey = process.env.OPENAI_API_KEY!;
    
    if (!supabaseKey || !openaiApiKey) {
        throw new Error("Missing environment variables: SUPABASE_SERVICE_ROLE_KEY or OPENAI_API_KEY");
    }

    return {
        supabase: createClient(supabaseUrl, supabaseKey),
        openai: new OpenAI({ apiKey: openaiApiKey })
    };
}


export async function POST(req: Request) {
    try {
        const { supabase, openai } = getClients();
        const { message, userId } = await req.json()
        if (!message) return NextResponse.json({ error: "Empty" }, { status: 400 })

        // 1. Fetch User Profile for Rate Limiting (Skip if Admin or VIP)
        const { data: profile } = await supabase
            .from('client_trading_profiles')
            .select('*')
            .eq('id', userId)
            .single()

        const is_admin = profile?.telegram_id?.toString() === process.env.ADMIN_TELEGRAM_ID; 
        const is_vip = profile?.is_vip === true;
        
        // Check Global Limit (10 Calls)
        if (!is_admin && !is_vip && profile && (profile.ai_usage_total || 0) >= 10) {
            return NextResponse.json({ 
                reply: `🔴 UNLIMITED QUERIES REACHED. To continue using the Zen Institutional AI, please upgrade to a VIP plan at @Zen_pips_bot.`,
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
        - If the user is on their 9th message (Current Count: ${profile?.ai_usage_total || 0}), include a warning at the END like: "⚠️ Your next query will be your last."

        CONTEXT:
        ${context}`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "system", content: systemPrompt }, { role: "user", content: message }],
            temperature: 0.1
        });

        const reply = completion.choices[0].message.content;

        // 4. Update Global Count
        if (!is_admin && userId) {
            await supabase.from('client_trading_profiles')
                .update({ ai_usage_total: (profile?.ai_usage_total || 0) + 1 })
                .eq('id', userId)
        }

        return NextResponse.json({ reply });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
