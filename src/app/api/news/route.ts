import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  const now = new Date();
  const finnhubKey = process.env.FINNHUB_API_KEY;
  let mockNews: any = [];
  let analysis = "";
  let activeBlackout = { isBlackout: false, start: "", end: "", reason: "" };

  const todayStr = now.toISOString().split('T')[0];

  try {
    if (finnhubKey) {
      // Finnhub API Integration logic
      // Note: Finnhub requires premium for full economic calendar sometimes, but this structure fits the standard payload
      const response = await fetch(`https://finnhub.io/api/v1/calendar/economic?from=${todayStr}&to=${todayStr}&token=${finnhubKey}`);
      const data = await response.json();
      
      if (data && data.economicCalendar) {
        // Filter for high impact events for major pairs
        const highImpact = data.economicCalendar.filter((ev: any) => ev.impact === "high" && ["USD", "EUR", "GBP"].includes(ev.country));
        
        if (highImpact.length > 0) {
           mockNews = highImpact.slice(0, 3).map((ev: any) => ({
             id: `news-${ev.id || Math.random()}`,
             currency: ev.country,
             impact: "High",
             event: ev.event,
             time: new Date(ev.time).toISOString(),
             forecast: ev.estimate || "N/A",
             previous: ev.previous || "N/A",
           }));

           // Auto-calculate blackout based on the closest event
           const closestEvent = highImpact[0];
           const eventTime = new Date(closestEvent.time);
           activeBlackout = {
             isBlackout: now >= new Date(eventTime.getTime() - 30 * 60000) && now <= new Date(eventTime.getTime() + 60 * 60000),
             start: new Date(eventTime.getTime() - 30 * 60000).toISOString(),
             end: new Date(eventTime.getTime() + 60 * 60000).toISOString(),
             reason: closestEvent.event,
           }

           analysis = `🚨 **AI MARKET BIAS & RISK ASSESSMENT** 🚨\n\nHigh impact data detected today for ${closestEvent.country}: ${closestEvent.event}. \n\n**Educational Insight**: News events like this introduce massive liquidity sweeps. Institutions use this volatility to grab stops above and below the current range before moving the market in the true intended direction. Trading directly during the release is gambling, not trading.\n\n**Action**: Autonomous MT5 bridge will enforce a strict trading blackout window starting 30 minutes before and ending 1 hour after the release to protect capital against spread widening and slippage. It is highly advisable to close open day trades or set tight stop-losses for capital protection.`;
        }
      }
    }

    // Fallback to Mock Data if Finnhub is not set up or returned no high impact events today
    if (mockNews.length === 0) {
      const eventTime = new Date(now.getTime() + 10 * 60000); // peak event in 10 mins
      const blackoutStart = new Date(eventTime.getTime() - 30 * 60000); 
      const blackoutEnd = new Date(eventTime.getTime() + 60 * 60000); 

      mockNews = [
        {
          id: "news-test-1",
          currency: "USD",
          impact: "High",
          event: "Core CPI m/m",
          time: eventTime.toISOString(),
          forecast: "0.3%",
          previous: "0.4%",
        }
      ];

      analysis = `🚨 **AI MARKET BIAS & RISK ASSESSMENT** 🚨\n\nToday features heavy USD volatility. The Core CPI data is highly anticipated. If CPI comes in hotter than forecasted (0.3%), expect immediate bearish momentum on EURUSD, GBPUSD, and XAUUSD. \n\n**Educational Insight**: News events like CPI often cause massive whipsaws. Institutions use this to stop out retail traders on both sides before establishing the real trend. We wait for the dust to settle.\n\n**Action**: Autonomous MT5 bridge will enforce a strict trading blackout window starting 30 minutes before and ending 1 hour after the release. Close trades or set tight stop-losses.`;

      activeBlackout = {
        isBlackout: now >= blackoutStart && now <= blackoutEnd,
        start: blackoutStart.toISOString(),
        end: blackoutEnd.toISOString(),
        reason: "Core CPI m/m",
      }
    }

    // -- Community Discussion Trigger --
    // We only post once per day. To do this, we query simply.
    const { data: existingMessages } = await supabase
      .from('community_messages')
      .select('id')
      .eq('channel', 'general')
      .contains('content', `📰 **Daily News Briefing** (${todayStr})`)
      .limit(1);

    if (!existingMessages || existingMessages.length === 0) {
       // Insert the discussion starter
       // Assuming user_id of an admin or a bot placeholder '856df12d-3eaf-4cd6-a400-a1a8a63ca693'
       await supabase.from('community_messages').insert({
          user_id: '856df12d-3eaf-4cd6-a400-a1a8a63ca693', // admin or system id
          channel: 'general',
          content: `📰 **Daily News Briefing** (${todayStr})\n\n${analysis}\n\n*Discussion: How are you managing risk today? Dropping trades or holding with tight SLs?*`
       });
    }

    return NextResponse.json({
      date: todayStr,
      events: mockNews,
      aiAnalysis: analysis,
      activeBlackout: activeBlackout
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
