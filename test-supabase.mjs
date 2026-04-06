import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env' });
// also load .env.local if needed, but let's try .env first

async function testSupabase() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error("Missing Supabase credentials in .env");
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const email = 'test_setup@example.com';
    const { data, error } = await supabase
        .from('leads')
        .upsert(
            {
                email: email.toLowerCase().trim(),
                name: 'Test Setup',
                source: 'lead_magnet'
            },
            { onConflict: 'email' }
        )
        .select()
        .single();

    if (error) {
        console.error('🔴 Supabase error:', error);
    } else {
        console.log('🟢 Supabase success:', data);
    }
}

testSupabase();
