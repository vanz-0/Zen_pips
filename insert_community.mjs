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
    const aiMessage = `Hello Dominators,

Today's session showcased textbook institutional execution. We completely swept the board on the Major markets: Gold (XAU/USD) printed a massive validation, hitting TP3 for over 1,148 pips. Concurrently, EUR/USD and GBP/USD finalized their distribution phases, successfully hitting all Take Profit zones.

For risk management protocol, the pending BTC/USD limit order was canceled.

Looking forward, we have isolated a new high-probability setup on **Silver (XAG/USD) at the 73.13 Entry**. This setup is derived from a clear Lower Timeframe (M5) liquidity sweep into a defined Order Block. We expect price to rebalance into the Fair Value Gap before expanding upward towards our tiered targets culminating at 74.33.`;

    const { error: err1 } = await supabase
      .from('community_messages')
      .insert({
         channel: 'setups-and-charts',
         user_id: null,
         content: aiMessage,
         image: '/setups/silver_smc.png'
      });

    if (err1) console.error("Error inserting message", err1);
    else console.log("AI message inserted successfully!");

  } catch (err) {
    console.error("General error:", err);
  }
}

formatAndExecute();
