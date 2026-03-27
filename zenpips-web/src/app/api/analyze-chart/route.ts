import { NextResponse } from 'next/server'
import OpenAI from 'openai'

function getOpenAIClient() {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
        throw new Error('OPENAI_API_KEY environment variable is not set')
    }
    return new OpenAI({ apiKey })
}

export async function POST(req: Request) {
    try {
        const formData = await req.json(); // If you send as base64 JSON
        // Or if you send as true FormData, handle differently. 
        // For simplicity and to avoid complex Formidable/Next.js multi-part issues on some environments, 
        // I'll update the frontend to send as a JSON object with base64 string.
    } catch (e) {}

    // Fallback: If received a real Request, let's use a more robust way to handle multipart or standard JSON.
    // Let's go with Base64 for maximum reliability across serverless environments.
    return NextResponse.json({ error: "Method not fully implementation. Switching to Base64 JSON." }, { status: 405 });
}

// Robust Handler for Base64 Images
export async function PUT(req: Request) {
    try {
        const { imageBase64 } = await req.json()
        if (!imageBase64) return NextResponse.json({ error: "No image received" }, { status: 400 })

        const systemPrompt = `You are an Institutional Price Action Analyst. 
        Analyze the provided chart screenshot using SMC (Smart Money Concepts) or ICT logic.

        FOCUS ON:
        1. Market Structure: Identify current trend, BOS (Break of Structure), and CHoCH.
        2. Liquidity: Locate BSL (Buy Side Liquidity) and SSL (Sell Side Liquidity) pools.
        3. POIs: Identify fair value gaps (FVG), order blocks (OB), and breaker blocks.
        4. Verdict: Give a clear, declarative institutional recommendation (WAIT, BUY, or SELL) with reasoning.

        Maintain a professional, institutional Bloomberg-terminal tone.`;

        const openai = getOpenAIClient()
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: systemPrompt },
                        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
                    ]
                }
            ],
            max_tokens: 1000,
        });

        return NextResponse.json({ analysis: response.choices[0].message.content });

    } catch (error: any) {
        console.error("Vision Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
