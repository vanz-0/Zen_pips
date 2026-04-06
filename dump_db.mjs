import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

async function check() {
    const { data: inData, error: inErr } = await supabase
        .from('signals')
        .select('*')
        .order('created_at', { ascending: false });
    
    fs.writeFileSync('db_out.json', JSON.stringify({ inData, inErr }, null, 2));
    process.exit();
}
check();
