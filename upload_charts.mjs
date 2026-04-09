import { createClient } from '@supabase/supabase-js'; import fs from 'fs'; import dotenv from 'dotenv'; dotenv.config({ path: '.env' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const files = [
  { path: 'C:/Users/Admin/.gemini/antigravity/brain/f79a73aa-b6f6-4f35-862a-ab5259487820/media__1775747705142.png', dest: 'eurusd_buy_tp1_hit.png' },
  { path: 'C:/Users/Admin/.gemini/antigravity/brain/f79a73aa-b6f6-4f35-862a-ab5259487820/media__1775747719371.png', dest: 'gbpusd_buy_tp1_hit.png' },
  { path: 'C:/Users/Admin/.gemini/antigravity/brain/f79a73aa-b6f6-4f35-862a-ab5259487820/media__1775747730730.png', dest: 'gold_buy_setup_ny.png' },
  { path: 'C:/Users/Admin/.gemini/antigravity/brain/f79a73aa-b6f6-4f35-862a-ab5259487820/media__1775747742398.png', dest: 'silver_tp2_victory.png' },
  { path: 'C:/Users/Admin/.gemini/antigravity/brain/f79a73aa-b6f6-4f35-862a-ab5259487820/media__1775747751886.png', dest: 'btc_update_smc.png' }
];

async function upload() {
  for(let f of files) {
    const fileData = fs.readFileSync(f.path);
    const { data, error } = await supabase.storage.from('charts').upload(f.dest, fileData, { upsert: true, contentType: 'image/png' });
    if(error) console.error('Error uploading ' + f.dest + ':', error);
    else console.log('Successfully uploaded ' + f.dest);
  }
}
upload();

