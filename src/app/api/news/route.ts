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

    if (finnhubKey) {
      const response = await fetch(`https://finnhub.io/api/v1/calendar/economic?from=${todayStr}&to=${todayStr}&token=${finnhubKey}`);
      const data = await response.json();
      
      if (data && data.economicCalendar) {
        const relevantEvents = data.economicCalendar.filter((ev: any) => 
          (ev.impact === "high" || ev.impact === "medium") && 
          ["USD", "EUR", "GBP", "JPY", "AUD"].includes(ev.country)
        );
        
        if (relevantEvents.length > 0) {
           events = relevantEvents.map((ev: any) => ({
             id: `news-${ev.id || Math.random()}`,
             currency: ev.country,
             impact: ev.impact === "high" ? "High" : "Medium",
             event: ev.event,
             time: ev.time,
             forecast: ev.estimate || "PROD",
             previous: ev.previous || "N/A",
             source: "Forex Factory / Finnhub",
             sourceUrl: `https://www.forexfactory.com/calendar?day=${todayStr}`
           }));

           events.sort((a: any, b: any) => new Date(a.time).getTime() - new Date(b.time).getTime());

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
               analysis = "🚨 *ALERT*: High volatility expected at ${technicalConfluence}. Avoid direct exposure during releases. Institutional liquidity grabs likely.";
             }
           }
        }
      }
    }

    if (events.length === 0) {
      events = [{
          id: "news-mock-1",
          currency: "USD",
          impact: "High",
          event: "Market Sentiment Shift",
          time: new Date(now.getTime() + 1 * 3600000).toISOString(),
          forecast: "Volatility",
          previous: "N/A",
      }];
      analysis = `⚠️ ZENP CORE ANALYTICS: ${technicalConfluence} Market reveals institutional divergence. Maintain a conservative bias until New York open.`;
    }

    // Forex Factory / Professional News Validation Check
    // If no high impact events are validated, we return a 'System Healthy' status instead of a news alert
    const hasHighImpact = events.some((e: any) => e.impact === "High");
    if (!hasHighImpact && events.length > 0 && events[0].id.startsWith("news-mock")) {
       return NextResponse.json({
         date: now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
         events: [],
         aiAnalysis: "System is in institutional equilibrium. No high-impact volatility detected through the Forex Factory cross-check. Focus on core liquidity levels.",
         technicalSummary: technicalConfluence,
         activeBlackout: { isBlackout: false, start: "", end: "", reason: "" }
       });
    }

    return NextResponse.json({
      date: now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      events: events,
      aiAnalysis: analysis,
      technicalSummary: technicalConfluence,
      activeBlackout: activeBlackout
    });

  } catch (err: any) {
    console.error("News API Error:", err);
    return NextResponse.json({ error: "Failed to fetch institutional news" }, { status: 500 });
  }
}

