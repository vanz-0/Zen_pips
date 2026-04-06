import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

async function check() {
    const { data: inData, error: inErr } = await supabase
        .from('signals')
        .select('*')
        .limit(2);
    console.log(JSON.stringify(inData, null, 2));
    console.log(inErr);
    process.exit();
}
check();
