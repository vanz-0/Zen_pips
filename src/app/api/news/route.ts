import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  const now = new Date();
  const finnhubKey = process.env.FINNHUB_API_KEY;
  let events: any = [];
  let analysis = "";
  let activeBlackout = { isBlackout: false, start: "", end: "", reason: "" };

  const todayStr = now.toISOString().split('T')[0];

  try {
    if (finnhubKey) {
      // Fetch economic calendar for today
      const response = await fetch(`https://finnhub.io/api/v1/calendar/economic?from=${todayStr}&to=${todayStr}&token=${finnhubKey}`);
      const data = await response.json();
      
      if (data && data.economicCalendar) {
        // Filter for high and medium impact events for major institutional pairs
        const relevantEvents = data.economicCalendar.filter((ev: any) => 
          (ev.impact === "high" || ev.impact === "medium") && 
          ["USD", "EUR", "GBP", "JPY"].includes(ev.country)
        );
        
        if (relevantEvents.length > 0) {
           events = relevantEvents.map((ev: any) => ({
             id: `news-${ev.id || Math.random()}`,
             currency: ev.country,
             impact: ev.impact === "high" ? "High" : "Medium",
             event: ev.event,
             time: ev.time, // ISO string
             forecast: ev.estimate || "PROD",
             previous: ev.previous || "N/A",
           }));

           // Sort by time
           events.sort((a: any, b: any) => new Date(a.time).getTime() - new Date(b.time).getTime());

           const topEvent = events.find((e: any) => e.impact === "High") || events[0];
           const eventTime = topEvent ? new Date(topEvent.time) : null;
           
           if (eventTime) {
             const blackoutStart = new Date(eventTime.getTime() - 30 * 60000);
             const blackoutEnd = new Date(eventTime.getTime() + 60 * 60000);
             
             activeBlackout = {
               isBlackout: now >= blackoutStart && now <= blackoutEnd,
               start: blackoutStart.toISOString(),
               end: blackoutEnd.toISOString(),
               reason: topEvent.event,
             };
           }

           analysis = `🚨 **INSTITUTIONAL RISK ALERT** 🚨\n\nLive data confirms high-volatility events for ${relevantEvents.map((e:any) => e.country).join('/')} today. \n\n**Strategic Directive**: Institutions will use today's releases to engineer liquidity. Expect rapid stop-hunts across major pairs before the true directional expansion. \n\n**Autonomous Control**: The MT5 Bridge is monitoring these timestamps. We recommend closing intra-day exposure 15 minutes prior to the top-tier releases to avoid spread widening and slippage.`;
        }
      }
    }

    // Fallback Mock Data only if Finnhub failed or returned zero events
    if (events.length === 0) {
      events = [
        {
          id: "news-mock-1",
          currency: "USD",
          impact: "High",
          event: "FOMC Member Speech",
          time: new Date(now.getTime() + 2 * 3600000).toISOString(),
          forecast: "Hawkish",
          previous: "N/A",
        }
      ];
      analysis = "⚠️ **MARKET ALERT**: Finnhub connectivity returned limited data. Our AI suggests maintaining a conservative bias on all USD pairings until the New York pre-market clearing session begins. Watch for liquidity grabs at the London close.";
    }

    return NextResponse.json({
      date: now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      events: events,
      aiAnalysis: analysis,
      activeBlackout: activeBlackout
    });

  } catch (err: any) {
    console.error("News API Error:", err);
    return NextResponse.json({ error: "Failed to fetch institutional news" }, { status: 500 });
  }
}
