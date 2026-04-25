import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    console.log("--- Comprehensive Account & Signal Reorganization ---");

    // 1. Update EUR/USD and GBP/USD status
    console.log("[*] Updating EUR/USD (TP2) and GBP/USD (TP3/Closed) status...");
    await supabase.from('signals').update({ tp1_hit: true, tp2_hit: true, tp3_hit: true, closed: true, status: 'CLOSED (TP3 HIT)' }).eq('pair', 'GBP/USD').eq('closed', false);
    await supabase.from('signals').update({ tp1_hit: true, tp2_hit: true, status: 'ACTIVE (TP2 HIT)' }).eq('pair', 'EUR/USD').eq('closed', false);

    // 2. Flip Gold and Silver signals to SELL as requested by user
    console.log("[*] Flipping Gold and Silver signals to SELL direction...");
    const { data: goldSilverSignals } = await supabase.from('signals').select('*').in('pair', ['XAU/USD', 'XAG/USD']).eq('closed', false);
    
    if (goldSilverSignals) {
        for (const sig of goldSilverSignals) {
            if (sig.direction === "BUY") {
                // Symmetric flip: Swap SL and TP1, reverse TP2/TP3 logic
                const diff1 = Math.abs(sig.tp1 - sig.entry);
                const diff2 = Math.abs(sig.tp2 - sig.entry);
                const diff3 = Math.abs(sig.tp3 - sig.entry);
                
                const newSl = sig.entry + diff1;
                const newTp1 = sig.entry - diff1;
                const newTp2 = sig.entry - diff2;
                const newTp3 = sig.entry - diff3;

                await supabase.from('signals').update({
                    direction: "SELL",
                    sl: newSl,
                    current_sl: newSl,
                    tp1: newTp1,
                    tp2: newTp2,
                    tp3: newTp3,
                    confluence: sig.confluence + " (Direction flipped to SELL per user instruction)"
                }).eq('id', sig.id);
                console.log(`[OK] Flipped ${sig.pair} to SELL. New SL: ${newSl}, TP1: ${newTp1}`);
            }
        }
    }

    // 3. Reset FAILED events and redistribute
    console.log("[*] Resetting and redistributing copy events...");
    const { data: events } = await supabase.from('copy_events').select('*, signals(*)').in('status', ['PENDING', 'FAILED']);

    if (events) {
        for (const event of events) {
            const pair = event.signals ? event.signals.pair : "Unknown";
            let targetAccount = "24963323"; // $100 Account
            let lotSize = 0.01;

            if (pair === "ETH/USD") {
                targetAccount = "25113210"; // $1,000 Account
                lotSize = 0.33;
            }

            await supabase.from('copy_events')
                .update({ 
                    mt5_account_id: targetAccount,
                    lot_size: lotSize,
                    status: 'PENDING',
                    error_message: null
                })
                .eq('id', event.id);
            
            console.log(`[OK] ${pair} assigned to Account: ${targetAccount} | Lot: ${lotSize} | Status: PENDING`);
        }
    }

    console.log("--- All reorganizations applied ---");
}

main().catch(console.error);
