import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { sendTelegramMessage } from './telegram.mjs';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    console.log("1. Inserting Silver (XAG/USD) - TP1, TP2, TP3 Hit");
    const silver_data = {
        pair: "XAG/USD", ticker: "XAGUSD", source: "Titan AI", timeframe: "M5",
        direction: "SELL", entry: 72.75, tp1: 72.52, tp2: 72.29, tp3: 72.05,
        sl: 72.98, current_sl: 72.98, pip_multiplier: 100,
        tp1_hit: true, tp2_hit: true, tp3_hit: true, sl_hit: false,
        closed: true, status: "TOTAL VICTORY (ALL TPs HIT)", total_pips: 70, // (72.75 - 72.05)*100
        confluence: "SMC Structure Break"
    };
    await supabase.from('signals').insert([silver_data]);
    await sendTelegramMessage(`🏆 *TOTAL VICTORY: XAG/USD (Silver)*\n\nAll Take Profit targets have been successfully reached.\n\n🎯 *Entry:* 72.75\n🎯 *TP3 Hit:* 72.05\n💰 *Total Pips: +70*\n🔥 Institutional validation complete.`);

    console.log("2. Inserting Gold (XAU/USD) - TP1 Hit, Retracing");
    const gold_data = {
        pair: "XAU/USD", ticker: "XAUUSD", source: "Titan AI", timeframe: "M15",
        direction: "SELL", entry: 4653.97, tp1: 4635.27, tp2: 4616.58, tp3: 4597.88,
        sl: 4672.66, current_sl: 4653.97, pip_multiplier: 10,
        tp1_hit: true, tp2_hit: false, tp3_hit: false, sl_hit: false,
        closed: false, status: "TP1 HIT (Stop Loss at Break Even)", total_pips: 187, // (4653.97 - 4635.27)*10
        confluence: "Rejection at Asian High"
    };
    await supabase.from('signals').insert([gold_data]);
    await sendTelegramMessage(`⚡ *UPDATE: XAU/USD (Gold)*\n\n*TP1 successfully hit!* Price is retracing back to the entry point.\n\n🛡️ *Action:* Stop loss has been adjusted to Break Even (4653.97) to protect capital.\n🎯 *TP1 Profit Recorded.*`);

    console.log("3. Inserting GBP/USD - Live");
    const gbp_data = {
        pair: "GBP/USD", ticker: "GBPUSD", source: "Titan AI", timeframe: "M5",
        direction: "BUY", entry: 1.32296, tp1: 1.32450, tp2: 1.32600, tp3: 1.32800,
        sl: 1.32100, current_sl: 1.32100, pip_multiplier: 10000,
        tp1_hit: false, tp2_hit: false, tp3_hit: false, sl_hit: false,
        closed: false, status: "ACTIVE", total_pips: 0,
        confluence: "Tokyo Session Low Sweep"
    };
    await supabase.from('signals').insert([gbp_data]);
    await sendTelegramMessage(`🚀 *LIVE SIGNAL: GBP/USD*\n\n*Direction:* BUY 📈\n*Entry:* 1.32296\n\n*Targets:* \n🎯 TP1: 1.32450\n🎯 TP2: 1.32600\n🎯 TP3: 1.32800\n\n*Stop Loss:* 1.32100\n\n*Status:* ACTIVE in the market.`);

    console.log("4. Inserting EUR/USD - Live");
    const eur_data = {
        pair: "EUR/USD", ticker: "EURUSD", source: "Titan AI", timeframe: "M5",
        direction: "BUY", entry: 1.15370, tp1: 1.15500, tp2: 1.15650, tp3: 1.15800,
        sl: 1.15200, current_sl: 1.15200, pip_multiplier: 10000,
        tp1_hit: false, tp2_hit: false, tp3_hit: false, sl_hit: false,
        closed: false, status: "ACTIVE", total_pips: 0,
        confluence: "London Open Setup"
    };
    await supabase.from('signals').insert([eur_data]);
    await sendTelegramMessage(`🚀 *LIVE SIGNAL: EUR/USD*\n\n*Direction:* BUY 📈\n*Entry:* 1.15370\n\n*Targets:* \n🎯 TP1: 1.15500\n🎯 TP2: 1.15650\n🎯 TP3: 1.15800\n\n*Stop Loss:* 1.15200\n\n*Status:* ACTIVE in the market.`);


    console.log("5. Inserting Bitcoin (BTC/USD) - New Order");
    const btc_data = {
        pair: "BTC/USD", ticker: "BTCUSD", source: "Titan AI", timeframe: "M15",
        direction: "SELL", entry: 68810.0, tp1: 68025.5, tp2: 67241.0, tp3: 66456.5,
        sl: 69594.5, current_sl: 69594.5, pip_multiplier: 1,
        tp1_hit: false, tp2_hit: false, tp3_hit: false, sl_hit: false,
        closed: false, status: "PENDING", total_pips: 0,
        confluence: "Liquidation Hunt & Order Block"
    };
    await supabase.from('signals').insert([btc_data]);
    await sendTelegramMessage(`🚀 *NEW SIGNAL: BTC/USD (Bitcoin)*\n\n*Direction:* SELL 📉\n*Entry:* 68,810.0\n\n*Targets:* \n🎯 TP1: 68,025.5\n🎯 TP2: 67,241.0\n🎯 TP3: 66,456.5\n\n*Stop Loss:* 69,594.5\n\n*Confluence:* Institutional Liquidity Sweep & bearish displacement sequence.`);

    console.log("All signals inserted and broadcasted successfully.");
}

main().catch(console.error);
