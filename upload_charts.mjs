import { createClient } from '@supabase/supabase-js'; import fs from 'fs'; import dotenv from 'dotenv'; dotenv.config({ path: '.env' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// These are the ACTUAL chart screenshots from the user's latest upload (19:43:33 timestamp)
const files = [
  { path: 'C:/Users/Admin/.gemini/antigravity/brain/f79a73aa-b6f6-4f35-862a-ab5259487820/media__1775752884025.png', dest: 'xagusd_buy_tp1.png', pair: 'XAG/USD' },
  { path: 'C:/Users/Admin/.gemini/antigravity/brain/f79a73aa-b6f6-4f35-862a-ab5259487820/media__1775752884086.png', dest: 'xauusd_buy_tp1.png', pair: 'XAU/USD' },
  { path: 'C:/Users/Admin/.gemini/antigravity/brain/f79a73aa-b6f6-4f35-862a-ab5259487820/media__1775752884239.png', dest: 'eurusd_buy_tp3.png', pair: 'EUR/USD' },
  { path: 'C:/Users/Admin/.gemini/antigravity/brain/f79a73aa-b6f6-4f35-862a-ab5259487820/media__1775752884301.png', dest: 'btcusd_buy_tp1.png', pair: 'BTC/USD' },
  { path: 'C:/Users/Admin/.gemini/antigravity/brain/f79a73aa-b6f6-4f35-862a-ab5259487820/media__1775752884370.png', dest: 'gbpusd_buy_tp3.png', pair: 'GBP/USD' }
];

async function upload() {
  for(let f of files) {
    if (!fs.existsSync(f.path)) {
        console.error('File not found: ' + f.path);
        continue;
    }
    const fileData = fs.readFileSync(f.path);
    const { error } = await supabase.storage.from('charts').upload(f.dest, fileData, { upsert: true, contentType: 'image/png' });
    if(error) console.error('Error uploading ' + f.dest + ':', error);
    else {
      const { data: { publicUrl } } = supabase.storage.from('charts').getPublicUrl(f.dest);
      console.log(`✅ ${f.pair}: ${publicUrl}`);
    }
  }
}
upload();
