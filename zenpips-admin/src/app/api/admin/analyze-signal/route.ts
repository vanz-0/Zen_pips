import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

export async function POST(req: Request) {
    try {
        const { imageBase64 } = await req.json()

        if (!imageBase64) {
            return NextResponse.json({ error: "No image provided" }, { status: 400 })
        }

        const systemPrompt = `You are an elite institutional trading AI. 
Analyze the provided TradingView chart screenshot and extract the specific trade parameters being set up.
Return ONLY a raw JSON object with no markdown formatting.

Format exactly like this (use null if you cannot find a value):
{
  "pair": "XAU/USD",
  "direction": "BUY" | "SELL",
  "entry": 2400.10,
  "sl": 2390.50,
  "tp1": 2410.00,
  "tp2": 2420.00,
  "tp3": 2430.00,
  "timeframe": "M5",
  "confluence": "Fair Value Gap + Liquidity Sweep"
}`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: systemPrompt },
                        { type: "image_url", image_url: { url: imageBase64 } }
                    ]
                }
            ],
            max_tokens: 300,
            temperature: 0,
        });

        const rawJson = response.choices[0].message.content?.trim() || "{}";
        // Strip markdown formatting if any
        const cleanJson = rawJson.replace(/```json/g, "").replace(/```/g, "");

        const parsed = JSON.parse(cleanJson);
        return NextResponse.json(parsed);

    } catch (error: any) {
        console.error("Analyze Signal Error:", error);
        return NextResponse.json({ error: error.message || "Failed to analyze image" }, { status: 500 });
    }
}
