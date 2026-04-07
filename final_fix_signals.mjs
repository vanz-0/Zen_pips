import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { sendTelegramMessage } from './telegram.mjs';
dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function finalFix() {
  console.log("Starting FINAL signal status synchronization...");

  // 1. EUR/USD Full Victory
  // ID found: 6cdede40-2c38-4a9b-9526-9d68c5369239 (Current: TP1 HIT)
  const { error: err1 } = await supabase
    .from('signals')
    .update({
      tp1_hit: true,
      tp2_hit: true,
      tp3_hit: true,
      closed: true,
      status: 'TOTAL VICTORY (ALL TPs HIT)'
    })
    .eq('id', '6cdede40-2c38-4a9b-9526-9d68c5369239');
  
  if (!err1) console.log("EUR/USD updated to TOTAL VICTORY");

  // 2. GBP/USD Ensure all TP flags are true
  // ID found previously: ea652318-1bdb-4ed3-8d8f-782da7fcb6e1
  const { error: err2 } = await supabase
    .from('signals')
    .update({
      tp1_hit: true,
      tp2_hit: true,
      tp3_hit: true,
      closed: true,
      status: 'TOTAL VICTORY (ALL TPs HIT)'
    })
    .eq('id', 'ea652318-1bdb-4ed3-8d8f-782da7fcb6e1');
  
  if (!err2) console.log("GBP/USD updated with ALL TP flags");

  // 3. Gold (XAU/USD) Update from any 'Closed Manual' state to 'TOTAL VICTORY / TP3 HIT'
  // ID: 95f6d3df-bf69-4332-9a8f-f3baa51c56bf was Entry 4640.89
  const { error: err3 } = await supabase
    .from('signals')
    .update({
      tp1_hit: true,
      tp2_hit: true,
      tp3_hit: true,
      closed: true,
      status: 'TOTAL VICTORY (TP3 HIT)'
    })
    .eq('id', '95f6d3df-bf69-4332-9a8f-f3baa51c56bf');
  if (!err3) console.log("Gold updated to TOTAL VICTORY (TP3 HIT)");

  // 4. Silver (XAG/USD) - First Pending Order
  // ID: e7439d0a-dbe6-42d0-ae6a-5deda75b5c0a (Entry: 73.13)
  // Activated -> Hit TP1 -> Retraced to BE
  const { error: err4 } = await supabase
    .from('signals')
    .update({
      tp1_hit: true,
      tp2_hit: false,
      tp3_hit: false,
      closed: true,
      status: 'TP1 HIT (CLOSED AT BREAKEVEN)',
      total_pips: 40 // (73.53 - 73.13)*100
    })
    .eq('id', 'e7439d0a-dbe6-42d0-ae6a-5deda75b5c0a');
  if (!err4) console.log("Silver (73.13) updated to TP1 HIT & CLOSED BE");

  // 5. Broadcast Correction to Telegram
  const correctionMsg = `⚖️ *INSTITUTIONAL SIGNAL RE-CALIBRATION*

Today's session results have been fully synchronized with the 1% risk-management protocol:

✅ *EUR/USD*: TOTAL VICTORY (Targets 1, 2, & 3 Hit)
✅ *GBP/USD*: TOTAL VICTORY (Targets 1, 2, & 3 Hit)
✅ *XAU/USD*: TOTAL VICTORY (TP3 Targets Secured)
⚠️ *XAG/USD (73.13)*: TP1 HIT. Partial profits taken, remainder closed at Breakeven.
📈 *XAG/USD (72.96)*: Active & Monitoring.

Dashboard is now 100% accurate. Keep moving in silence.`;

  await sendTelegramMessage(correctionMsg);
  console.log("Broadcast correction sent!");
}

finalFix();
