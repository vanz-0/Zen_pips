import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
    try {
        const { imageUrl, pair, entry, sl, tp1, tp2, tp3 } = await req.json();

        if (!imageUrl) {
            return NextResponse.json({ error: "Image URL is required" }, { status: 400 });
        }

        const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

        const systemPrompt = `You are an expert institutional trading compliance officer. Your job is to strictly validate user-submitted trading chart screenshots. 
If the chart meets the criteria, return exactly "VALID". If it fails, return a short sentence explaining why it is "INVALID".

Criteria:
1. The pair ticker (e.g. ${pair}) must be visible (usually top left).
2. The image must show a clear price chart with candlesticks.
3. The price scale must be visible on the right.
4. Based on the price scale and candlesticks, the Entry (${entry}), Stop Loss (${sl}), and TP1 (${tp1}) levels must logically make sense on this chart.
5. The chart must look like a standard TradingView or MT5 setup.

Please validate this chart for a ${pair} trade at Entry ${entry}, SL ${sl}, and TP1 ${tp1}.`;

        // Fetch image and convert to base64 for Gemini
        const imgRes = await fetch(imageUrl);
        const imgBuffer = await imgRes.arrayBuffer();
        const base64Image = Buffer.from(imgBuffer).toString("base64");
        const mimeType = imgRes.headers.get("content-type") || "image/jpeg";

        const result = await gemini.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{
                role: "user",
                parts: [
                    { text: systemPrompt },
                    { inlineData: { mimeType, data: base64Image } }
                ]
            }]
        });

        const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";

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
