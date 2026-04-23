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
    console.log("--- Zen Pips Bridge Test: Bitcoin Signal ---");
    
    const btc_data = {
        pair: "BTC/USD",
        ticker: "BTCUSD",
        source: "Titan AI",
        timeframe: "M15",
        direction: "SELL",
        entry: 75550,
        tp1: 74880,
        tp2: 74210,
        tp3: 73540,
        sl: 76220,
        current_sl: 76220,
        pip_multiplier: 1,
        status: "ACTIVE",
        confluence: "Institutional Liquidity Sweep & bearish displacement sequence (Image Test)"
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
        mt5_account_id: "24963323" // From .env
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
    const telegramMsg = `🚀 *NEW INSTITUTIONAL SIGNAL: BTC/USD*\n\n*Direction:* SELL 📉\n*Entry:* 75,550\n\n🎯 *TP1:* 74,880\n🎯 *TP2:* 74,210\n🎯 *TP3:* 73,540\n🛑 *SL:* 76,220\n\n_Institutional Liquidity Sweep & bearish displacement sequence (Image Test)_`;
    
    await sendTelegramMessage(telegramMsg);
    console.log("✅ Full Pipeline Triggered: Signal -> execution -> Telegram Broadcast");

    console.log("[3/3] Signal Bridge Triggered. Bridge script should pick this up within 2 seconds.");
    console.log("--- Test Deployment Complete ---");
}

main().catch(console.error);
