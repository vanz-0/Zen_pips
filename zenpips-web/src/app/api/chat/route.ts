import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const openaiApiKey = process.env.OPENAI_API_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)
const openai = new OpenAI({ apiKey: openaiApiKey })

export async function POST(req: Request) {
    try {
        const { message } = await req.json()
        if (!message) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 })
        }

        // 1. Route the question
        const systemPrompt = `You are an intelligent router for the Zen Pips institutional knowledge base.
Classify the user's query into exactly ONE of five precise categories:

- 'sop': Questions about Zen Pips business, pricing, VIP group access, Telegram bot, rules for taking signals, subscriptions, and our operations.
- 'market_structure': Questions about BOS, CHoCH, market trends, highs/lows, and basic price action structure.
- 'liquidity_concepts': Questions about liquidity sweeps, BSL/SSL, Fair Value Gaps (FVG), Order Blocks (OB), and Inducements.
- 'trading_strategies': Questions about the AMD cycle, specific entry models, execution playbooks, and overall SMC/ICT strategy.
- 'psychology_mindset': Questions about trading discipline, emotion control, and general risk management philosophy.

Respond with ONLY the exact category string. No quotes or punctuation.`;

        const routeRes = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: message }
            ],
            max_tokens: 10,
            temperature: 0
        });

        let category = routeRes.choices[0].message.content?.trim().toLowerCase() || 'trading_strategies';
        const validCats = ['sop', 'market_structure', 'liquidity_concepts', 'trading_strategies', 'psychology_mindset'];
        if (!validCats.includes(category)) {
            category = 'trading_strategies';
        }

        console.log(`[RAG Router] Categorized as: ${category}`);

        // 2. Embed the user query
        const embedRes = await openai.embeddings.create({
            input: message,
            model: "text-embedding-3-small"
        });
        const queryEmbedding = embedRes.data[0].embedding;

        // 3. Search Supabase
        const { data: documents, error } = await supabase.rpc("match_documents", {
            query_embedding: queryEmbedding,
            match_count: 4,
            filter_category: category
        });

        if (error) {
            console.error("Supabase match_documents error:", error);
            throw error;
        }

        if (!documents || documents.length === 0) {
            return NextResponse.json({ reply: "I don't have enough institutional data on that topic. Please ask an admin via Telegram." });
        }

        // 4. Generate answer
        let context = "";
        documents.forEach((doc: any) => {
            const source = doc.metadata?.source || "Unknown";
            const page = doc.metadata?.page ? ` Page ${doc.metadata.page}` : "";
            context += `\n--- Source: ${source}${page} ---\n${doc.content}\n`;
        });

        const answerPrompt = `You are the Zen Pips Institutional Assistant.
Answer the user's question using ONLY the provided context below.
If the context does not contain the answer, say "I don't have enough institutional data to answer that. Please ask an admin."

Your Tone DNA:
- Bloomberg terminal feel. 
- Cold, precise, declarative, authoritative. 
- No fluff. No hype. No "I think maybe". 
- Say what the facts are. 
- Use SMC/ICT terminology naturally if relevant and if it exists in the context.

CONTEXT DATA:
${context}`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: answerPrompt },
                { role: "user", content: message }
            ],
            max_tokens: 500,
            temperature: 0.2
        });

        const reply = completion.choices[0].message.content;

        return NextResponse.json({ reply });
    } catch (error: any) {
        console.error("API error:", error);
        return NextResponse.json({ error: error.message || "Failed to process request" }, { status: 500 });
    }
}
