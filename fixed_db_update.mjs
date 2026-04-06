import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

async function run() {
  console.log("Removing Gold (H1) orders...");
  // Use ticker which doesn't have slash
  const { data: rmData, error: rmErr } = await supabase
    .from('signals')
    .delete()
    .eq('ticker', 'XAUUSD')
    .eq('timeframe', 'H1');
  if (rmErr) console.error("Error removing Gold from signals:", rmErr);
  else console.log("Removed Gold signals");

  console.log("Inserting Silver (15m) buy order...");
  const newSignal = {
    pair: 'XAG/USD',
    ticker: 'XAGUSD',
    source: 'TradingView Admin',
    direction: 'BUY',
    entry: 72.96,
    sl: 70.24,
    tp1: 75.67,
    tp2: 78.39,
    tp3: 81.1,
    current_sl: 70.24,
    tp1_hit: false,
    tp2_hit: false,
    tp3_hit: false,
    sl_hit: false,
    closed: false,
    timeframe: '15m',
    total_pips: 0,
    pip_multiplier: 100,
    check_interval_minutes: 15,
    status: 'ACTIVE',
    confluence: 'SMC 15m Markup: Break of Structure (BOS) confirms upward shift after sweeping Sell Side Liquidity (SSL). Imbalance (FVG) and clear Order Block (OB) identified for entry convergence. Algorithmic delivery expected to TP levels.'
  };

  const { data: inData, error: inErr } = await supabase
    .from('signals')
    .insert([newSignal]);
  
  if (inErr) console.error("Error inserting Silver:", inErr);
  else console.log("Inserted Silver successfully.");

  console.log("Removing Gold (H1) from journal_entries...");
  const { data: rmJournal, error: jErr } = await supabase
    .from('journal_entries')
    .delete()
    .eq('pair', 'XAU/USD')
    .eq('timeframe', 'H1');
  
  if (jErr) console.error("Error removing Gold from journal:", jErr);
  else console.log("Removed from journal.");

  process.exit();
}
run();
