import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const apiKey = process.env.TWELVE_DATA_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'Missing TWELVE_DATA_API_KEY' }, { status: 500 });
        }

        const symbols = "XAU/USD,XAG/USD,BTC/USD,GBP/USD,EUR/USD,ETH/USD";
        const res = await fetch(`https://api.twelvedata.com/price?symbol=${symbols}&apikey=${apiKey}`);
        const data = await res.json();

        // Convert TwelveData response into a map of symbol -> price (number)
        const prices: Record<string, number> = {};
        Object.entries(data).forEach(([symbol, info]: [string, any]) => {
            if (info?.price) {
                prices[symbol] = parseFloat(info.price);
            }
        });

        return NextResponse.json({ prices });
    } catch (err) {
        console.error('Prices API error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
