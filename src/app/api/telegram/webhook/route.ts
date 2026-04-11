import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        
        // Handle Telegram 'message' update
        if (body.message && body.message.text) {
            const chatId = body.message.chat.id;
            const text = body.message.text;

            if (text.startsWith('/start')) {
                return await sendWelcomeMenu(chatId);
            }
        }

        return NextResponse.json({ ok: true });
    } catch (error: any) {
        console.error('Telegram Webhook Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function sendWelcomeMenu(chatId: number) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    const menu = {
        chat_id: chatId,
        text: `<b>🏆 Welcome to the Zen Pips Institutional Hub</b>\n\nYour terminal connection has been verified. Use the controls below to synchronize with our institutional flow and community resources.\n\n<i>Select an action to proceed:</i>`,
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "💎 Join Free Community", url: "https://t.me/Zen_pips_community" },
                    { text: "📣 Signal Channel", url: "https://t.me/zenpips" }
                ],
                [
                    { text: "📊 Signal Terminal", url: "https://zenpips.netlify.app/dashboard" },
                    { text: "🌐 Official Website", url: "https://zenpips.netlify.app" }
                ],
                [
                    { text: "🏦 Vantage Broker (Referral)", url: "https://vigco.co/la-com-inv/TItFx2Oy" }
                ],
                [
                    { text: "🚀 Live Signals Area", url: "https://zenpips.netlify.app/dashboard#signals" },
                    { text: "📖 Master Manual", url: "https://zenpips.netlify.app/Institutional_Master_Manual_2026.md" }
                ],
                [
                    { text: "👨‍💻 Contact Admin", url: "https://t.me/MadDmakz" }
                ]
            ]
        }
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(menu),
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Telegram API error: ${err}`);
    }

    return NextResponse.json({ ok: true });
}
