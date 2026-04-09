import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

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
    return NextResponse.json({ error: "Method not fully implemented. Switching to Base64 JSON." }, { status: 405 });
}

export async function PUT(req: Request) {
    try {
        const { supabase, openai } = getClients();
        const { imageBase64, userId } = await req.json()
        
        if (!imageBase64) return NextResponse.json({ error: "No image received" }, { status: 400 })

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
                            message: `🔴 DAILY LIMIT REACHED: You have used your ${dailyLimit} AI credits for today. ${bonusToday > 0 ? '' : 'Complete social tasks to earn 10 extra credits or '}upgrade to VIP for unlimited institutional analysis.` 
                        }, { status: 403 });
                    }

                    // If it's a new day, reset the counter in the DB
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
        If it is NOT a chart (e.g., photo of a person, cat, car, unrelated UI, or non-trading screenshot), you MUST start your response with 'INVALID_CHART' and provide a brief explanation.
        
        If it IS a trading chart, analyze price action using Smart Money Concepts (SMC) and ICT logic.
        
        TONE: Confident yet open. Maintain a disciplined, professional Bloomberg-terminal tone.
        TYPOGRAPHY: Use proper Markdown headers and bullet points.

        OUTPUT FORMAT IF VALID:
        ## Institutional Analysis: [PAIR NAME]

        ### 1. Market Structure:
        - **Current Trend**: [Explain if Bearish/Bullish]
        - **Break of Structure (BOS)**: [Identify key levels]
        - **Change of Character (CHoCH)**: [Note potential shifts]

        ### 2. Liquidity:
        - **Buy Side Liquidity (BSL)**: [Identify pools above]
        - **Sell Side Liquidity (SSL)**: [Identify pools below]

        ### 3. Points of Interest (POIs):
        - **Fair Value Gap (FVG)**: [Locate imbalances]
        - **Order Blocks (OB)**: [Identify supply/demand zones]
        - **Breaker Blocks**: [Note broken OBs if any]

        ### 4. Verdict:
        - **Institutional Recommendation: [WAIT / BUY / SELL]**
        
        [Provide a clear, declarative reasoning for the verdict based on the confluences above. Mention risk management.]`;

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
            max_tokens: 1200,
            temperature: 0.2
        });

        const analysis = response.choices[0].message.content || "";

        // 2. Log Invalidation OR Process successful analysis
        if (analysis.startsWith('INVALID_CHART')) {
            return NextResponse.json({ error: "NOT_A_CHART", message: analysis.replace('INVALID_CHART', '').trim() });
        }

        // 3. Upload to Supabase Storage if it's a valid chart
        let imageUrl = "";
        try {
            const buffer = Buffer.from(imageBase64, 'base64');
            const fileName = `${userId || 'anon'}/${crypto.randomUUID()}.jpg`;
            const { data, error: uploadError } = await supabase.storage
                .from('charts')
                .upload(fileName, buffer, { contentType: 'image/jpeg' });

            if (data) {
                const { data: { publicUrl } } = supabase.storage.from('charts').getPublicUrl(fileName);
                imageUrl = publicUrl;
            } else if (uploadError) {
                console.error("Storage error:", uploadError);
            }
        } catch (e) {
            console.error("Upload process error:", e);
        }

        // 4. Record Analysis & Increment Usage Counter
        if (userId) {
            const { data: currentProfile } = await supabase.from('client_trading_profiles').select('ai_usage_total, last_ai_reset').eq('id', userId).single();
            const now = new Date();
            const lastReset = currentProfile?.last_ai_reset ? new Date(currentProfile.last_ai_reset) : new Date(0);
            const isSameDay = now.toDateString() === lastReset.toDateString();
            
            // Update profile usage
            await supabase.from('client_trading_profiles')
                .update({ 
                    ai_usage_total: (isSameDay ? (currentProfile?.ai_usage_total || 0) : 0) + 1,
                    last_ai_reset: now.toISOString()
                })
                .eq('id', userId);

            // Store in history
            await supabase.from('chart_analysis').insert({
                user_id: userId,
                image_url: imageUrl,
                analysis_text: analysis,
                pair: analysis.match(/Analysis: (.*)/)?.[1] || "Unknown",
                verdict: analysis.match(/Institutional Recommendation: (.*)\*\*/)?.[1] || "WAIT"
            });
        }

        return NextResponse.json({ analysis, imageUrl });

    } catch (error: any) {
        console.error("Vision Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
