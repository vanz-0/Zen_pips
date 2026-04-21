import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  const now = new Date();
  const finnhubKey = process.env.FINNHUB_API_KEY;
  const twelveDataKey = process.env.TWELVE_DATA_API_KEY;
  let events: any = [];
  let analysis = "";
  let technicalConfluence = "";
  let activeBlackout = { isBlackout: false, start: "", end: "", reason: "" };

  const todayStr = now.toISOString().split('T')[0];

  try {
    const day = now.getUTCDay();
    const isWeekend = day === 0 || day === 6; // 0=Sun, 6=Sat

    // 1. Fetch live prices for Technical Confluence
    if (twelveDataKey) {
        try {
            const priceRes = await fetch(`https://api.twelvedata.com/price?symbol=EUR/USD,GBP/USD,XAU/USD,BTC/USD&apikey=${twelveDataKey}`);
            const prices = await priceRes.json();
            technicalConfluence = `Live Prices: EUR/USD: ${prices['EUR/USD']?.price || 'N/A'}, GBP/USD: ${prices['GBP/USD']?.price || 'N/A'}, Gold: ${prices['XAU/USD']?.price || 'N/A'}, BTC: ${prices['BTC/USD']?.price || 'N/A'}.`;
        } catch (pErr) {
            console.error("Price fetch failed:", pErr);
        }
    }

    // 2. Determine if we should trigger an AUTO-OPEN (Fresh Data Trigger)
    let triggerOpen = false;
    const tenMinsAgo = new Date(now.getTime() - 10 * 60 * 1000).toISOString();

    // Check for fresh signals (last 10 mins)
    const { data: freshSignals } = await supabase
      .from('signals')
      .select('id')
      .gt('created_at', tenMinsAgo)
      .limit(1);

    // Check for fresh news (last 10 mins)
    const { data: freshNews } = await supabase
      .from('market_news')
      .select('id')
      .gt('created_at', tenMinsAgo)
      .limit(1);

    if (freshSignals?.length || freshNews?.length) {
      triggerOpen = true;
    }

    // Fetch today's cached Forex Factory events from Supabase
    const { data: dbEvents, error: dbError } = await supabase
      .from('market_news')
      .select('*')
      .eq('event_date', todayStr);

    if (dbEvents && dbEvents.length > 0) {
        events = dbEvents.map((ev: any) => ({
            id: `news-${ev.id}`,
            currency: ev.currency,
            impact: ev.impact,
            event: ev.event_name,
            time: ev.event_time,
            forecast: ev.forecast,
            previous: ev.previous,
            source: "Forex Factory",
            sourceUrl: `https://www.forexfactory.com/calendar?day=${todayStr}`
        }));

        const openaiKey = process.env.OPENAI_API_KEY;
        if (openaiKey) {
            try {
            const eventSummary = events.map((e: any) => `${e.currency} ${e.event} (${e.impact})`).join(', ');
            const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                'Authorization': `Bearer ${openaiKey}`,
                'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                model: "gpt-4o",
                messages: [{
                    role: "system",
                    content: "You are a senior institutional FX analyst. Provide direct, instruction-giving trading conclusions based on the provided economic events and current price levels. Do not use markdown. Use plenty of emojis. Specifically explain the perspective for the 'Bears' (Downside risk) and 'Bulls' (Upside potential). Keep it concise and professional. Structure: [Event] - [Instruction] - [Bulls/Bears Confluence]."
                }, {
                    role: "user",
                    content: `Current Technical Context: ${technicalConfluence}. Events today: ${eventSummary}. Generate analysis and instructions.`
                }]
                })
            });
            const aiData = await aiResponse.json();
            analysis = aiData.choices[0].message.content;
            } catch (aiErr) {
            console.error("AI Analysis failed:", aiErr);
            analysis = "🚨 *ALERT*: High volatility expected. Avoid direct exposure during releases. Institutional liquidity grabs likely.";
            }
        }
    }

    // Handle empty events without mock data popups
    if (events.length === 0) {
      if (isWeekend) {
        return NextResponse.json({
          date: now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
          events: [],
          aiAnalysis: "FX Markets are currently closed for the weekend. Bitcoin and Crypto markets remain active with high institutional volatility. No high-impact FX events detected.",
          technicalSummary: technicalConfluence,
          activeBlackout: { isBlackout: false, start: "", end: "", reason: "Weekend Market Close" },
          triggerOpen: triggerOpen
        });
      }
      
      // Weekday System Equilibrium
      return NextResponse.json({
          date: now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
          events: [],
          aiAnalysis: "System is in institutional equilibrium. No high-impact volatility detected through the Forex Factory cross-check. Focus on core liquidity levels.",
          technicalSummary: technicalConfluence,
          activeBlackout: { isBlackout: false, start: "", end: "", reason: "" },
          triggerOpen: triggerOpen
      });
    }

    return NextResponse.json({
      date: now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      events: events,
      aiAnalysis: analysis,
      technicalSummary: technicalConfluence,
      activeBlackout: activeBlackout,
      triggerOpen: triggerOpen
    });

  } catch (err: any) {
    console.error("News API Error:", err);
    return NextResponse.json({ error: "Failed to fetch institutional news" }, { status: 500 });
  }
}

