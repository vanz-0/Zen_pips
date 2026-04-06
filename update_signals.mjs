import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function formatAndExecute() {
  try {
    // 1. Update XAU/USD order cdfce83f-b006-4572-aa1a-b352f43a1bad
    const { error: err1 } = await supabase
      .from('signals')
      .update({
        tp1_hit: true,
        tp2_hit: true,
        tp3_hit: true,
        closed: true,
        status: 'TOTAL VICTORY (ALL TPs HIT)',
        total_pips: 1148.5,
      })
      .eq('id', 'cdfce83f-b006-4572-aa1a-b352f43a1bad');

    if (err1) console.error("Error updating XAU", err1);
    else console.log("XAU updated");

    // 2. Update GBP/USD order 14f26a73-d4a6-4965-aa98-f3cf1af82009
    const { error: err2 } = await supabase
      .from('signals')
      .update({
        tp3_hit: true,
        status: 'TOTAL VICTORY (ALL TPs HIT)',
        total_pips: 55, // 1.32723 - 1.32173 = 55 pips
      })
      .eq('id', '14f26a73-d4a6-4965-aa98-f3cf1af82009');

    if (err2) console.error("Error updating GBP", err2);
    else console.log("GBP updated");

    // 3. Find and Delete pending BTC/USD order
    const { data: btcOrders } = await supabase
      .from('signals')
      .select('*')
      .eq('pair', 'BTC/USD')
      .eq('closed', false);

    if (btcOrders && btcOrders.length > 0) {
      for (const order of btcOrders) {
        if (order.status.includes('PENDING') || order.tp1_hit === false) {
           await supabase.from('signals').delete().eq('id', order.id);
           console.log("Deleted BTC pending order", order.id);
        }
      }
    } else {
        console.log("No pending BTC orders found to delete.");
    }

    // 4. Insert new Silver (XAG/USD) pending order
    const newSilver = {
      pair: 'XAG/USD',
      ticker: 'XAGUSD',
      source: 'TradingView Admin',
      timeframe: 'M5',
      direction: 'BUY',
      entry: 73.13,
      tp1: 73.53,
      tp2: 73.93,
      tp3: 74.33,
      sl: 72.72,
      current_sl: 72.72,
      pip_multiplier: 100,
      tp1_hit: false,
      tp2_hit: false,
      tp3_hit: false,
      sl_hit: false,
      closed: false,
      status: 'PENDING',
      total_pips: 0,
      check_interval_minutes: 15,
      confluence: 'SMC Liquidity Sweep & Displacement'
    };

    const { error: errIns } = await supabase.from('signals').insert([newSilver]);

    if (errIns) console.error("Error inserting Silver", errIns);
    else console.log("New Silver inserted successfully");

  } catch (err) {
    console.error("General error:", err);
  }
}

formatAndExecute();
