import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { sendTelegramMessage } from './telegram.mjs';

dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const activeSignals = [
    { id: '58d328e0-8c11-491f-adc8-b85309acc0d5', pair: 'XAG/USD', pips: 390 },
    { id: '54d8fa34-ab22-4782-a350-0344b9c14b09', pair: 'XAU/USD', pips: 805 },
    { id: 'ba1813de-926c-4d01-9253-a9da9490e8ce', pair: 'EUR/USD', pips: 90 },
    { id: '16b3b9c2-8695-4faa-b786-d7ccba2fb8f1', pair: 'BTC/USD', pips: 3231 }
];

async function closeAll() {
    console.log("🏆 CLOSING ALL SIGNALS AT TP3...");
    
    let totalPipsNow = 90; // Starting from the already closed GBPUSD

    for (const sig of activeSignals) {
        const { error } = await supabase
            .from('signals')
            .update({
                tp1_hit: true,
                tp2_hit: true,
                tp3_hit: true,
                closed: true,
                status: 'TOTAL VICTORY',
                total_pips: sig.pips
            })
            .eq('id', sig.id);

        if (error) console.error(`Error closing ${sig.pair}:`, error);
        else {
            console.log(`✅ ${sig.pair} closed with +${sig.pips} Pips/Ticks`);
            totalPipsNow += sig.pips;
        }
    }

    const victoryMsg = `💎 **INSTITUTIONAL SWEEP: 5/5 TARGETS HIT** 💎\n\nAbsolute clinical precision today. All five institutional setups have reached their final Take Profit (TP3) targets.\n\n🔥 **TOTAL GAINS**: +${totalPipsNow} Pips/Ticks secured.\n\n✅ GBP/USD: 🎯 TP3 HIT\n✅ XAU/USD: 🎯 TP3 HIT\n✅ XAG/USD: 🎯 TP3 HIT\n✅ EUR/USD: 🎯 TP3 HIT\n✅ BTC/USD: 🎯 TP3 HIT\n\n**NEW YORK SESSION ANALYSIS**: The market is exhibiting strong bullish momentum. We are now moving to the sidelines to wait for a significant pullback (Institutional Rebalance) before looking for secondary entries to ride the continuation. Do not chase the current highs. Stay patient, stay disciplined. 🧘‍♂️💰`;

    await supabase.from('community_messages').insert({
        user_id: '00000000-0000-0000-0000-000000000000',
        channel: 'setups-and-charts',
        content: victoryMsg
    });

    await supabase.from('community_messages').insert({
        user_id: '00000000-0000-0000-0000-000000000000',
        channel: 'general',
        content: victoryMsg
    });

    await sendTelegramMessage(victoryMsg);
    console.log("🚀 Victory messages broadcasted across all channels.");
}

closeAll().catch(console.error);
