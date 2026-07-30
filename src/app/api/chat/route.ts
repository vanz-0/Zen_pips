import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenAI } from '@google/genai'

// Master Limit: 10 queries per week
const WEEKLY_LIMIT = 10;

function getClients() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const geminiApiKey = process.env.GEMINI_API_KEY!;
    
    if (!supabaseKey || !geminiApiKey) {
        throw new Error("Missing environment variables: SUPABASE_SERVICE_ROLE_KEY or GEMINI_API_KEY");
    }

    return {
        supabase: createClient(supabaseUrl, supabaseKey),
        gemini: new GoogleGenAI({ apiKey: geminiApiKey })
    };
}


export async function POST(req: Request) {
    try {
        const { supabase, gemini } = getClients();
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

        // 2. RAG Logic (Search Documents) — gracefully degrade if unavailable
        let context = "No local data found.";
        try {
            const embedRes = await gemini.models.embedContent({
                model: "text-embedding-004",
                contents: [{ parts: [{ text: message }] }]
            });
            const embedding = embedRes.embeddings?.[0]?.values ?? [];
            if (embedding.length > 0) {
                const { data: documents } = await supabase.rpc("match_documents", {
                    query_embedding: embedding,
                    match_count: 5
                });
                if (documents && documents.length > 0) {
                    context = documents.map((d: any) => d.content).join("\n\n");
                }
            }
        } catch (ragErr: any) {
            console.warn("RAG lookup failed, continuing without context:", ragErr.message);
        }


        // 3. AI Completion (Step-by-Step Institutional Mode)
        const systemPrompt = `You are the Zen Pips Institutional AI Assistant.
Your primary knowledge comes from provided context (PDF strategies and business SOPs).

FORMATTING RULES (MANDATORY):
- Respond in PLAIN TEXT only. Do NOT use markdown syntax like **, ##, ###, -, backticks, or bullet points with dashes.
- Use numbered lists (1. 2. 3.) for step-by-step guides.
- Use line breaks to separate sections.
- Use ALL CAPS for emphasis instead of bold/italic markers.
- Keep responses concise and professional. Maximum 200 words unless the user asks for detail.

DIRECTIONS:
- If the user asks about the business, pricing, or setup (MT5, Copy Trader), provide a clear STEP-BY-STEP numbered guide.
- If they ask about trading (Gold, BTC, SMC), use highly technical language (BOS, CHoCH, Liquidity, FVG).
- If the user is on their 9th message (Current Count: ${profile?.ai_usage_total || 0}), include a warning at the END like: "Your next query will be your last. Upgrade to VIP for unlimited access."

CONTEXT:
${context}`;

        const completion = await gemini.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\nUser: ${message}` }] }],
            config: { temperature: 0.1 }
        });

        // Strip any residual markdown formatting from the reply
        const rawReply = completion.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const reply = rawReply
            .replace(/\*\*/g, '')
            .replace(/^#{1,3}\s/gm, '')
            .replace(/^- /gm, '• ')
            .replace(/`([^`]+)`/g, '$1')
            .trim();

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
