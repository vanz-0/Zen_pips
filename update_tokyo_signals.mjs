import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Import Telegram tool if available, else mock
let sendTelegramMessage = async (msg) => console.log("Telegram Msg:", msg);
try {
    const tel = await import('./telegram.mjs');
    sendTelegramMessage = tel.sendTelegramMessage;
} catch (e) {
    console.warn("Telegram module not found, using console log only.");
}

async function updateSignals() {
    console.log("--- Starting Tokyo Session Update ---");

    // 1. Close obsolete Gold SELL order
    const oldGoldId = '37950869-fd3f-4ad7-86f1-7ce67131cb2a';
    const { error: err1 } = await supabase
        .from('signals')
        .update({ closed: true, status: 'CLOSED (OVERRIDDEN BY BUY SETUP)' })
        .eq('id', oldGoldId);
    
    if (!err1) console.log("✅ Closed old Gold SELL signal.");

    // 2. Mark Bitcoin BUY as TOTAL VICTORY
    const btcId = '8efa3819-7b04-43f0-bc33-f6a323a6d56c';
    const { error: err2 } = await supabase
        .from('signals')
        .update({
            tp1_hit: true, tp2_hit: true, tp3_hit: true,
            closed: true, status: 'TOTAL VICTORY (ALL TPs HIT)',
            total_pips: 1123.5 // (75438 - 74314.5)
        })
        .eq('id', btcId);
    
    if (!err2) {
        console.log("✅ Updated Bitcoin to TOTAL VICTORY.");
        await sendTelegramMessage(`🏆 *TOTAL VICTORY: BTC/USD*\n\nAll Take Profit targets have been reached!\n💰 *Total Pips: +1,123.5*`);
    }

    // 3. Insert Silver Victory (since it wasn't tracked)
    const silverVictory = {
        pair: 'XAG/USD', ticker: 'XAGUSD', source: 'Institutional', timeframe: 'M15',
        direction: 'BUY', entry: 79.51, tp1: 79.84, tp2: 80.17, tp3: 80.49,
        sl: 79.19, current_sl: 79.19, pip_multiplier: 100,
        tp1_hit: true, tp2_hit: true, tp3_hit: true, sl_hit: false,
        closed: true, status: 'TOTAL VICTORY', total_pips: 98,
        confluence: 'Tokyo Session Liquidity Sweep'
    };
    const { error: err3 } = await supabase.from('signals').insert([silverVictory]);
    if (!err3) console.log("✅ Inserted Silver TOTAL VICTORY.");

    // 4. Insert New Gold BUY
    const newGold = {
        pair: 'XAU/USD', ticker: 'XAUUSD', source: 'Institutional', timeframe: 'M15',
        direction: 'BUY', entry: 4829.92, tp1: 4853.66, tp2: 4877.4, tp3: 4901.14,
        sl: 4806.18, current_sl: 4806.18, pip_multiplier: 10,
        tp1_hit: false, tp2_hit: false, tp3_hit: false, sl_hit: false,
        closed: false, status: 'ACTIVE', total_pips: 0,
        confluence: 'SMC Overriding Sell Bias'
    };
    const { error: err4 } = await supabase.from('signals').insert([newGold]);
    if (!err4) {
        console.log("✅ Inserted New Gold BUY.");
        await sendTelegramMessage(`🚀 *NEW SIGNAL: XAU/USD (Gold)*\n\n*Direction:* BUY 📈\n*Entry:* 4829.92\n\n🎯 TP1: 4853.66\n🎯 TP2: 4877.4\n🎯 TP3: 4901.14\n🛡️ SL: 4806.18`);
    }

    // 5. Insert New GBP/USD BUY
    // Using guessed targets based on markup boxes
    const newGbp = {
        pair: 'GBP/USD', ticker: 'GBPUSD', source: 'Institutional', timeframe: 'M15',
        direction: 'BUY', entry: 1.3586, tp1: 1.3607, tp2: 1.3628, tp3: 1.3649,
        sl: 1.3565, current_sl: 1.3565, pip_multiplier: 10000,
        tp1_hit: false, tp2_hit: false, tp3_hit: false, sl_hit: false,
        closed: false, status: 'ACTIVE', total_pips: 0,
        confluence: 'Tokyo High Expansion'
    };
    const { error: err5 } = await supabase.from('signals').insert([newGbp]);
    if (!err5) {
        console.log("✅ Inserted New GBP/USD BUY.");
        await sendTelegramMessage(`🚀 *NEW SIGNAL: GBP/USD*\n\n*Direction:* BUY 📈\n*Entry:* 1.3586\n\n🎯 TP3: 1.3649\n🛡️ SL: 1.3565`);
    }

    // 6. Insert New EUR/USD BUY
    const newEur = {
        pair: 'EUR/USD', ticker: 'EURUSD', source: 'Institutional', timeframe: 'M15',
        direction: 'BUY', entry: 1.1818, tp1: 1.1841, tp2: 1.1864, tp3: 1.1887,
        sl: 1.1795, current_sl: 1.1795, pip_multiplier: 10000,
        tp1_hit: false, tp2_hit: false, tp3_hit: false, sl_hit: false,
        closed: false, status: 'ACTIVE', total_pips: 0,
        confluence: 'Major Level Rejection'
    };
    const { error: err6 } = await supabase.from('signals').insert([newEur]);
    if (!err6) {
        console.log("✅ Inserted New EUR/USD BUY.");
        await sendTelegramMessage(`🚀 *NEW SIGNAL: EUR/USD*\n\n*Direction:* BUY 📈\n*Entry:* 1.1818\n\n🎯 TP3: 1.1887\n🛡️ SL: 1.1795`);
    }

    console.log("--- Update Complete ---");
}

updateSignals().catch(console.error);
