import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import crypto from 'crypto'

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
    return PUT(req);
}

export async function PUT(req: Request) {
    try {
        const { supabase, openai } = getClients();
        const { imageBase64, image, userId, mode } = await req.json()
        
        const finalImage = imageBase64 || image;
        if (!finalImage) return NextResponse.json({ error: "No image received" }, { status: 400 })

        // 1. Verify Usage Limit (Skip if Admin or VIP)
        if (userId) {
            const { data: profile } = await supabase
                .from('client_trading_profiles')
                .select('*')
                .eq('id', userId)
                .single()

            if (profile) {
                const is_admin = profile.is_admin === true || profile.telegram_id?.toString() === process.env.ADMIN_TELEGRAM_ID;
                const is_vip = profile.is_vip === true;

                if (!is_admin && !is_vip) {
                    const now = new Date();
                    const lastReset = profile.last_ai_reset ? new Date(profile.last_ai_reset) : new Date(0);
                    const isSameDay = now.toDateString() === lastReset.toDateString();

                    let usageToday = isSameDay ? (profile.ai_usage_total || 0) : 0;
                    let bonusToday = isSameDay ? (profile.bonus_credits || 0) : 0;
                    const dailyLimit = 10 + bonusToday;

                    if (usageToday >= dailyLimit) {
                        return NextResponse.json({ 
                            error: "LIMIT_REACHED",
                            message: `🔴 DAILY LIMIT REACHED: You have used your ${dailyLimit} AI credits for today.` 
                        }, { status: 403 });
                    }

                    if (!isSameDay) {
                        await supabase.from('client_trading_profiles')
                            .update({ 
                                ai_usage_total: 0, 
                                bonus_credits: 0, 
                                last_ai_reset: now.toISOString() 
                            })
                            .eq('id', userId);
                    }
                }
            }
        }

        const systemPrompt = `You are the Zen Pips Institutional AI Analyst.

CRITICAL FIRST STEP: Determine if the image is a trading chart screenshot (e.g., TradingView, MT4/5, Binance, etc.).
If it is NOT a chart, start your response with exactly 'INVALID_CHART' followed by a brief reason.

If it IS a trading chart, analyze the price action in depth.

FORMATTING RULES (MANDATORY):
- Use PLAIN TEXT only. Do NOT use markdown syntax like **, ##, ###, -, or backticks.
- Structure your response using these exact section headers on their own line:
  1. MARKET STRUCTURE
  2. KEY LEVELS
  3. CONFLUENCE FACTORS
  4. INSTITUTIONAL RECOMMENDATION
- Under each section, write clear sentences. Use line breaks between points.
- For the INSTITUTIONAL RECOMMENDATION section, clearly state BUY, SELL, or WAIT with reasoning.
- Do NOT include any JSON in your visible analysis text.

CRITICAL: You MUST also extract structured data. Place it at the VERY END of your response inside a JSON code block:
\`\`\`json
{
  "pair": "XAUUSD",
  "direction": "BUY",
  "entry": 2350.50,
  "sl": 2340.00,
  "tp1": 2360.00,
  "tp2": 2370.00,
  "tp3": 2380.00,
  "isChart": true
}
\`\`\`
If you cannot find a value, use null. The JSON block will be stripped from the display — it is for internal use only.`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: systemPrompt },
                        { type: "image_url", image_url: { url: finalImage.startsWith('data:') ? finalImage : `data:image/jpeg;base64,${finalImage}` } }
                    ]
                }
            ],
            max_tokens: 1200,
            temperature: 0.1
        });

        const rawAnalysis = response.choices[0].message.content || "";

        if (rawAnalysis.startsWith('INVALID_CHART')) {
            return NextResponse.json({ isChart: false, reason: rawAnalysis.replace('INVALID_CHART', '').trim() });
        }

        // Extract JSON block for structured data
        let extractedData: any = { isChart: true };
        const jsonMatch = rawAnalysis.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
            try {
                extractedData = { ...extractedData, ...JSON.parse(jsonMatch[1]) };
            } catch (e) {
                console.error("JSON parse error:", e);
            }
        }

        // Strip JSON block and any remaining markdown artifacts from the display text
        const analysis = rawAnalysis
            .replace(/```json[\s\S]*?```/g, '')
            .replace(/```[\s\S]*?```/g, '')
            .replace(/\*\*/g, '')
            .replace(/^#{1,3}\s/gm, '')
            .trim();

        // 3. Upload to Supabase Storage
        let imageUrl = "";
        try {
            const pureBase64 = finalImage.replace(/^data:image\/\w+;base64,/, "");
            const buffer = Buffer.from(pureBase64, 'base64');
            const fileName = `${userId || 'anon'}/${crypto.randomUUID()}.jpg`;
            const { data, error: uploadError } = await supabase.storage
                .from('charts')
                .upload(fileName, buffer, { contentType: 'image/jpeg' });

            if (data) {
                const { data: { publicUrl } } = supabase.storage.from('charts').getPublicUrl(fileName);
                imageUrl = publicUrl;
            }
        } catch (e) {
            console.error("Upload error:", e);
        }

        // 4. Record Analysis & Increment Usage Counter
        if (userId) {
            const { data: currentProfile } = await supabase.from('client_trading_profiles').select('ai_usage_total, last_ai_reset').eq('id', userId).single();
            const now = new Date();
            const lastReset = currentProfile?.last_ai_reset ? new Date(currentProfile.last_ai_reset) : new Date(0);
            const isSameDay = now.toDateString() === lastReset.toDateString();
            
            await supabase.from('client_trading_profiles')
                .update({ 
                    ai_usage_total: (isSameDay ? (currentProfile?.ai_usage_total || 0) : 0) + 1,
                    last_ai_reset: now.toISOString()
                })
                .eq('id', userId);

            await supabase.from('chart_analysis').insert({
                user_id: userId,
                image_url: imageUrl,
                analysis_text: analysis,
                pair: extractedData.pair || "Unknown",
                verdict: extractedData.direction || "WAIT"
            });
        }

        return NextResponse.json({ analysis, imageUrl, extractedData, isChart: true, cleanAnalysis: true });

    } catch (error: any) {
        console.error("Vision Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
