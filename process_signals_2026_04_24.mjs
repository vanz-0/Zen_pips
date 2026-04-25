import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { sendTelegramMessage } from './telegram.mjs';
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
    console.log("--- Zen Pips Institutional Signal Synchronisation ---");

    const pairsToClose = ["XAU/USD", "XAG/USD", "BTC/USD", "EUR/USD", "GBP/USD", "ETH/USD"];
    
    console.log("[*] Closing existing active signals for relevant pairs...");
    const { error: closeError } = await supabase
        .from('signals')
        .update({ status: 'ARCHIVED', closed: true })
        .in('pair', pairsToClose)
        .eq('closed', false);

    if (closeError) {
        console.error("Error closing old signals:", closeError.message);
    }

    const signals = [
        {
            pair: "XAU/USD", ticker: "XAUUSD", source: "Titan AI", timeframe: "M15",
            direction: "BUY", entry: 4715.29, sl: 4674.88, tp1: 4755.7, tp2: 4796.11, tp3: 4836.52,
            current_sl: 4674.88, pip_multiplier: 10, confluence: "Institutional Liquidity Sweep", lot_size: 0.01
        },
        {
            pair: "XAG/USD", ticker: "XAGUSD", source: "Titan AI", timeframe: "M15",
            direction: "BUY", entry: 76.06, sl: 75.02, tp1: 77.11, tp2: 78.16, tp3: 79.2,
            current_sl: 75.02, pip_multiplier: 10, confluence: "Demand Zone Validation", lot_size: 0.01
        },
        {
            pair: "BTC/USD", ticker: "BTCUSD", source: "Titan AI", timeframe: "M15",
            direction: "SELL", entry: 77518.5, sl: 77858, tp1: 77179, tp2: 76839.5, tp3: 76500,
            current_sl: 77858, pip_multiplier: 1, confluence: "Bearish Order Block Rejection", lot_size: 0.01
        },
        {
            pair: "EUR/USD", ticker: "EURUSD", source: "Titan AI", timeframe: "M15",
            direction: "BUY", entry: 1.16900, sl: 1.16720, tp1: 1.17020, tp2: 1.17175, tp3: 1.17300,
            current_sl: 1.16720, pip_multiplier: 10000, confluence: "London Session Sweep", lot_size: 0.01
        },
        {
            pair: "GBP/USD", ticker: "GBPUSD", source: "Titan AI", timeframe: "M15",
            direction: "BUY", entry: 1.34750, sl: 1.34580, tp1: 1.34910, tp2: 1.35060, tp3: 1.35210,
            current_sl: 1.34580, pip_multiplier: 10000, confluence: "Bullish Divergence on Lower Timeframes", lot_size: 0.01
        },
        {
            pair: "ETH/USD", ticker: "ETHUSD", source: "Titan AI", timeframe: "M15",
            direction: "BUY", entry: 2325.72, sl: 2310.15, tp1: 2334.95, tp2: 2347.35, tp3: 2359.75,
            current_sl: 2310.15, pip_multiplier: 1, confluence: "Market Order Rule Expansion", lot_size: 0.33
        }
    ];

    for (const sig of signals) {
        console.log(`[*] Processing ${sig.pair}...`);
        
        const { data: signalData, error: signalError } = await supabase
            .from('signals')
            .insert([{
                pair: sig.pair,
                ticker: sig.ticker,
                source: sig.source,
                timeframe: sig.timeframe,
                direction: sig.direction,
                entry: sig.entry,
                sl: sig.sl,
                tp1: sig.tp1,
                tp2: sig.tp2,
                tp3: sig.tp3,
                current_sl: sig.current_sl,
                pip_multiplier: sig.pip_multiplier,
                confluence: sig.confluence,
                status: 'ACTIVE',
                closed: false
            }])
            .select();

        if (signalError) {
            console.error(`Error inserting ${sig.pair}:`, signalError.message);
            continue;
        }

        const signalId = signalData[0].id;

        // Create copy_event for MT5 execution
        await supabase.from('copy_events').insert([{
            signal_id: signalId,
            status: 'PENDING',
            lot_size: sig.lot_size,
            mt5_account_id: process.env.MT5_LOGIN || '24963323'
        }]);

        // Telegram Broadcast
        const emoji = sig.direction === "BUY" ? "🚀" : "📉";
        const message = `${emoji} *NEW SIGNAL: ${sig.pair}*\n\n*Direction:* ${sig.direction}\n*Entry:* ${sig.entry}\n\n*Targets:* \n🎯 TP1: ${sig.tp1}\n🎯 TP2: ${sig.tp2}\n🎯 TP3: ${sig.tp3}\n\n*Stop Loss:* ${sig.sl}\n\n*Confluence:* ${sig.confluence}\n\n_Institutional execution triggered via Signal Bridge._`;
        
        await sendTelegramMessage(message);
        console.log(`[OK] ${sig.pair} processed and broadcasted.`);
    }

    // Community Update
    const summaryMessage = `Hello Dominators,

The Zen Pips Institutional Bridge has been synchronized with the latest high-fidelity signals. 

✅ Gold, Silver, and Bitcoin setups have been updated and placed in the new Vantage institutional account.
✅ EUR/USD and GBP/USD positions have been re-aligned for the current session.
✅ A special Market Order for Ethereum (ETH/USD) has been executed with a calculated 0.33 lot split across targets.

Stay disciplined. We follow the plan, not the emotion. 🧘‍♂️`;

    await supabase.from('community_messages').insert([{
        channel: 'setups-and-charts',
        content: summaryMessage
    }]);

    console.log("--- All tasks completed successfully ---");
}

main().catch(console.error);
