import { createClient } from '@supabase/supabase-js'; import fs from 'fs'; import dotenv from 'dotenv'; dotenv.config({ path: '.env' });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const files = [
  { path: 'C:/Users/Admin/.gemini/antigravity/brain/f79a73aa-b6f6-4f35-862a-ab5259487820/media__1775748014564.png', dest: 'silver_update_ny.png' },
  { path: 'C:/Users/Admin/.gemini/antigravity/brain/f79a73aa-b6f6-4f35-862a-ab5259487820/media__1775748023464.jpg', dest: 'gold_tp2_victory.jpg' },
  { path: 'C:/Users/Admin/.gemini/antigravity/brain/f79a73aa-b6f6-4f35-862a-ab5259487820/media__1775748031090.jpg', dest: 'eurusd_full_tp_cycle.jpg' },
  { path: 'C:/Users/Admin/.gemini/antigravity/brain/f79a73aa-b6f6-4f35-862a-ab5259487820/media__1775748039435.jpg', dest: 'btc_buy_setup.jpg' },
  { path: 'C:/Users/Admin/.gemini/antigravity/brain/f79a73aa-b6f6-4f35-862a-ab5259487820/media__1775748046105.jpg', dest: 'gbpusd_tp2_cycle.jpg' }
];

async function upload() {
  for(let f of files) {
    if (!fs.existsSync(f.path)) {
        console.error('File not found: ' + f.path);
        continue;
    }
    const fileData = fs.readFileSync(f.path);
    const { error } = await supabase.storage.from('charts').upload(f.dest, fileData, { upsert: true });
    if(error) console.error('Error uploading ' + f.dest + ':', error);
    else console.log('Successfully uploaded ' + f.dest);
  }
}
upload();
