import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const payload = await req.json();
        const { message, channelId } = payload;
        
        if (!message) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const targetChannel = channelId || process.env.TELEGRAM_CHANNEL_ID;

        if (!botToken || !targetChannel) {
            console.warn("Telegram credentials not configured. Skipping broadcast.");
            // We return success true so the UI doesn't crash if they haven't set up the env variables yet.
            return NextResponse.json({ success: true, warning: "Telegram credentials missing" });
        }

        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: targetChannel,
                text: message,
                // Using HTML parse mode so basic formatting works.
                parse_mode: 'HTML'
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Telegram API responded with ${response.status}: ${err}`);
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error("Telegram broadcast error:", e);
        return NextResponse.json({ error: e.message || "Failed to broadcast to Telegram" }, { status: 500 });
    }
}
