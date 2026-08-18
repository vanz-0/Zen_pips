import { NextRequest, NextResponse } from 'next/server';

// Map OANDA/BINANCE symbols to TwelveData format
function mapSymbol(symbol: string): string {
    const map: Record<string, string> = {
        'OANDA:EURUSD': 'EUR/USD',
        'OANDA:GBPUSD': 'GBP/USD',
        'OANDA:EURGBP': 'EUR/GBP',
        'OANDA:AUDUSD': 'AUD/USD',
        'OANDA:USDCHF': 'USD/CHF',
        'OANDA:USDCAD': 'USD/CAD',
        'OANDA:XAUUSD': 'XAU/USD',
        'OANDA:XAGUSD': 'XAG/USD',
        'OANDA:SPX500USD': 'SPX',
        'OANDA:NAS100USD': 'IXIC',
        'OANDA:UK100GBP': 'FTSE',
        'BINANCE:BTCUSDT': 'BTC/USD',
        'BINANCE:ETHUSDT': 'ETH/USD',
        'BINANCE:SOLUSDT': 'SOL/USD',
        'BINANCE:XRPUSDT': 'XRP/USD',
    };
    return map[symbol] || symbol;
}

export async function GET(req: NextRequest) {
    try {
        const apiKey = process.env.TWELVE_DATA_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'Missing API key' }, { status: 500 });
        }

        const { searchParams } = new URL(req.url);
        const rawSymbol = searchParams.get('symbol') || 'OANDA:EURUSD';
        const interval = searchParams.get('interval') || '15min';
        const outputsize = searchParams.get('outputsize') || '100';

        const symbol = mapSymbol(rawSymbol);

        const res = await fetch(
            `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=${interval}&outputsize=${outputsize}&apikey=${apiKey}&format=JSON`
        );
        const data = await res.json();

        if (data.status === 'error') {
            return NextResponse.json({ error: data.message || 'TwelveData error' }, { status: 400 });
        }

        // Transform to lightweight-charts format: { time, open, high, low, close }
        const candles = (data.values || [])
            .map((v: any) => {
                // TwelveData returns "YYYY-MM-DD HH:mm:ss"
                // Parse it as UTC to avoid local timezone offset issues on the server
                const unixTimeSeconds = Math.floor(new Date(v.datetime.replace(' ', 'T') + 'Z').getTime() / 1000);
                
                return {
                    time: unixTimeSeconds,
                    open: parseFloat(v.open),
                    high: parseFloat(v.high),
                    low: parseFloat(v.low),
                    close: parseFloat(v.close),
                };
            })
            .reverse(); // TwelveData returns newest first, Lightweight Charts needs oldest first

        return NextResponse.json({
            candles,
            symbol: data.meta?.symbol || symbol,
            interval: data.meta?.interval || interval,
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
            }
        });
    } catch (err) {
        console.error('Candles API error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
