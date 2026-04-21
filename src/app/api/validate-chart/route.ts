import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { imageUrl, pair, entry, sl, tp1, tp2, tp3 } = await req.json();

        if (!imageUrl) {
            return NextResponse.json({ error: "Image URL is required" }, { status: 400 });
        }

        // Call OpenAI Vision API
        const openAiRes = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: `You are an expert institutional trading compliance officer. Your job is to strictly validate user-submitted trading chart screenshots. 
If the chart meets the criteria, return exactly "VALID". If it fails, return a short sentence explaining why it is "INVALID".

Criteria:
1. The pair ticker (e.g. ${pair}) must be visible (usually top left).
2. The image must show a clear price chart with candlesticks.
3. The price scale must be visible on the right.
4. Based on the price scale and candlesticks, the Entry (${entry}), Stop Loss (${sl}), and TP1 (${tp1}) levels must logically make sense on this chart.
5. The chart must look like a standard TradingView or MT5 setup.`
                    },
                    {
                        role: "user",
                        content: [
                            { type: "text", text: `Please validate this chart for a ${pair} trade at Entry ${entry}, SL ${sl}, and TP1 ${tp1}.` },
                            { type: "image_url", image_url: { url: imageUrl } }
                        ]
                    }
                ],
                max_tokens: 100
            })
        });

        if (!openAiRes.ok) {
            throw new Error(`OpenAI Error: ${await openAiRes.text()}`);
        }

        const data = await openAiRes.json();
        const responseText = data.choices[0].message.content.trim();

        if (responseText.toUpperCase() === "VALID" || responseText.toUpperCase().includes("VALID")) {
            return NextResponse.json({ success: true, validation: "VALID" });
        } else {
            return NextResponse.json({ error: `Validation Failed: ${responseText}` }, { status: 400 });
        }
    } catch (err: any) {
        console.error("Chart validation error:", err);
        return NextResponse.json({ error: "Internal server error during validation." }, { status: 500 });
    }
}
