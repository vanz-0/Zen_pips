import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    console.log("--- Zen Pips Bridge: Live Bitcoin Signal ---");
    
    const btc_data = {
        pair: "BTC/USD",
        ticker: "BTCUSD",
        source: "Titan AI",
        timeframe: "M15",
        direction: "BUY",
        entry: 64935.5,
        tp1: 65794.43,
        tp2: 66653.36,
        tp3: 67512.29,
        sl: 64076.57,
        current_sl: 64076.57,
        pip_multiplier: 1,
        status: "ACTIVE",
        confluence: "Titan AI & LuxAlgo Sessions"
    };

    console.log("[1/3] Inserting BTC/USD Signal into 'signals' table...");
    const { data: signal, error: signalError } = await supabase
        .from('signals')
        .insert([btc_data])
        .select()
        .single();

    if (signalError) {
        console.error("Error inserting signal:", signalError);
        return;
    }
    console.log(`[OK] Signal inserted. ID: ${signal.id}`);

    const event_data = {
        signal_id: signal.id,
        subscriber_id: "11111111-1111-1111-1111-111111111111", // Standard test profile
        status: "PENDING",
        mt5_account_id: process.env.MT5_LOGIN || "25803510",
        lot_size: 0.01
    };

    console.log("[2/3] Creating execution event in 'copy_events' table...");
    const { data: event, error: eventError } = await supabase
        .from('copy_events')
        .insert([event_data])
        .select()
        .single();

    if (eventError) {
        console.error("Error creating event:", eventError);
        return;
    }
    console.log(`[OK] Event created. ID: ${event.id}`);

    // 3. Broadcast to Telegram
    const { sendTelegramMessage } = await import('./telegram.mjs');
    const telegramMsg = `🚀 *NEW INSTITUTIONAL SIGNAL: BTC/USD*\n\n*Direction:* BUY 📈\n*Entry:* 64935.5\n\n🎯 *TP1:* 65794.43\n🎯 *TP2:* 66653.36\n🎯 *TP3:* 67512.29\n🛑 *SL:* 64076.57\n\n_Titan AI & LuxAlgo Sessions_`;
    
    await sendTelegramMessage(telegramMsg);
    console.log("✅ Full Pipeline Triggered: Signal -> execution -> Telegram Broadcast");

    console.log("[3/3] Signal Bridge Triggered. Bridge script should pick this up within 2 seconds.");
    console.log("--- Deployment Complete ---");
}

main().catch(console.error);
