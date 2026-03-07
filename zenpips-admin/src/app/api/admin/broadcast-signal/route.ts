import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const telegramToken = process.env.TELEGRAM_BOT_TOKEN!
const vipChannelId = process.env.ZENPIPS_CHANNEL_ID!

const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { pair, direction, entry, sl, tp1, tp2, tp3, timeframe, confluence } = body

        if (!pair || !direction || !entry || !sl || !tp1) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        const ticker = pair.replace("/", "")
        const pipMultiplier = (pair.includes("JPY") || pair.includes("XAG")) ? 100 : (pair.includes("XAU") ? 10 : 1)

        // 1. Insert to Supabase directly
        const supabaseData = {
            pair,
            ticker,
            source: "Web Admin Dashboard",
            timeframe: timeframe || "M5",
            direction,
            status: "ACTIVE",
            entry: parseFloat(entry),
            tp1: parseFloat(tp1),
            tp2: tp2 ? parseFloat(tp2) : null,
            tp3: tp3 ? parseFloat(tp3) : null,
            sl: parseFloat(sl),
            current_sl: parseFloat(sl),
            tp1_hit: false,
            tp2_hit: false,
            tp3_hit: false,
            sl_hit: false,
            closed: false,
            total_pips: 0,
            pip_multiplier: pipMultiplier,
            confluence: confluence || "Standard Setup"
        }

        const { data: inserted, error: dbError } = await supabase
            .from('signals')
            .insert(supabaseData)
            .select()

        if (dbError) {
            console.error("Supabase insert error:", dbError)
            return NextResponse.json({ error: "Failed to save to database", details: dbError.message }, { status: 500 })
        }

        // 2. Broadcast to Telegram
        const actionEmoji = direction === "BUY" ? "🟢" : "🔴"
        const telegramMsg = `⚡️ <b>NEW SIGNAL</b> ⚡️\n\n${actionEmoji} <b>${pair} | ${direction}</b>\n⏱ Timeframe: ${timeframe || 'M5'}\n\n🎯 <b>Entry:</b> ${entry}\n🛑 <b>SL:</b> ${sl}\n\n✅ <b>TP1:</b> ${tp1}\n${tp2 ? `✅ <b>TP2:</b> ${tp2}\n` : ''}${tp3 ? `✅ <b>TP3:</b> ${tp3}\n` : ''}\n🧠 <i>Analysis:</i> ${confluence || 'System Setup'}\n\n#ZENPIPS #SIGNAL`

        const telegramUrl = `https://api.telegram.org/bot${telegramToken}/sendMessage`

        // Attempt Telegram Broadcast 
        const tgResponse = await fetch(telegramUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: vipChannelId,
                text: telegramMsg,
                parse_mode: "HTML"
            })
        })

        if (!tgResponse.ok) {
            console.error("Telegram broadcast failed. Note: DB Insert succeeded.", await tgResponse.text())
            // We still return success since DB write worked, but warn the user
            return NextResponse.json({ success: true, warning: 'Database updated but Telegram broadcast failed. Please check config.', data: inserted })
        }

        return NextResponse.json({ success: true, message: "Signal distributed across the entire ecosystem.", data: inserted })

    } catch (error: any) {
        console.error("Broadcast Signal Error:", error);
        return NextResponse.json({ error: error.message || "Failed to broadcast signal" }, { status: 500 });
    }
}
