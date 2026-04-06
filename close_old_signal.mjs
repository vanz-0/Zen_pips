import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

async function run() {
  console.log("Closing old Silver H1 signal to prevent conflict...");
  const { data, error } = await supabase
    .from('signals')
    .update({ closed: true, status: 'CLOSED MENUAL' })
    .eq('pair', 'XAG/USD')
    .eq('timeframe', 'H1');
  
  if (error) console.error("Error setting closed:", error);
  else console.log("Successfully closed old H1 signal.");

  process.exit();
}
run();
