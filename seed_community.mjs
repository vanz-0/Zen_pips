import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    console.log("Seeding Setups and Charts...");
    
    // Arrays for the 5 images mapped to some technical analysis text
    const charts = [
        {
            image: '/signal_charts/media__1775524790356.png',
            content: "🔥 **GBP/USD: Tokyo Session Low Sweep**\n\nThe distribution phase is nearly complete. We just swept the Tokyo session lows and left significant imbalance above. Entry zones hold solid structure. Risk management paramaters attached."
        },
        {
            image: '/signal_charts/media__1775524790397.png',
            content: "🔥 **EUR/USD: London Open Setup**\n\nIdentical correlation to cable. Price is respecting the institutional order block built during the overnight session. Accumulation -> Manipulation -> Distribution in full effect. Wait for the M5 displacement."
        },
        {
            image: '/signal_charts/media__1775524790508.png',
            content: "💎 **XAG/USD (Silver): SMC Structure Break**\n\nTotal Victory achieved. Our sell limit tapped the exact wick and dropped violently through all three Take Profit zones. 70 pips secured. Observe how it respected the FVG."
        },
        {
            image: '/signal_charts/media__1775524790534.png',
            content: "⚡ **XAU/USD (Gold): Rejection at Asian High**\n\nTP1 smashed for +1,500 points. We are currently retracing back to entry but stops are safe at Break Even. The higher timeframe order flow remains heavily bearish until the 4550 liquidity pool is tapped."
        },
        {
            image: '/signal_charts/media__1775524903889.png',
            content: "🚨 **NEW ORDER: BTC/USD Liquidation Hunt**\n\nWe tracked massive limit order walls resting below 68k. We're stepping in for the sell-off. Strict risk parameters in place. Observe the marked up sell zones."
        }
    ];

    for (let c of charts) {
        const { error } = await supabase.from('community_messages').insert({
            user_id: '00000000-0000-0000-0000-000000000000',
            channel: 'setups-and-charts',
            content: c.content,
            image: c.image
        });
        if (error) console.error("Error inserting chart:", error);
    }
    
    console.log("Seeding General Chatter...");
    
    const chat = [
        {
             user_id: null,
             content: "Market session remains highly jocular. Institutional volume increasing...",
        },
        {
             user_id: '1e19d268-d064-42f8-9a8c-1e24bc1c9e82', // Random UUID just for visually simulating a trader
             content: "Gold pulling back to entry is actually a blessing. Going to load up another entry since it perfectly re-tapped the FVG. Thanks for moving stops to BE, Admin!"
        },
        {
             user_id: '4bd9f120-d3ea-44a3-aa6a-6cd880dc17eb',
             content: "The BTC setup looks absolutely lethal. That's exactly where the liquidations are clustered. Copy-trader already triggered the position on my end 🤖🚀"
        },
        {
             user_id: '9f270da6-beeb-4d51-93e5-ca03816ee342', // Anonymous generic
             content: "Honestly the session today is so relaxed. Hit TP3 on Silver, locked in profits, now just letting the algorithms do the heavy lifting. Zen Pips living up to the name 🧘‍♂️"
        },
        {
             user_id: '00000000-0000-0000-0000-000000000000',
             content: "Stay disciplined team. Don't overleverage the GBP/USD setup. We are waiting for the New York overlap volume to kick in before looking for continuation. Keep your risk strictly at 1%."
        }
    ];

    for (let m of chat) {
        const { error } = await supabase.from('community_messages').insert({
            user_id: m.user_id,
            channel: 'general-chat',
            content: m.content
        });
        if (error) console.error("Error inserting chatter:", error);
    }

    console.log("Community seeding completed successfully.");
}

main().catch(console.error);
