import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function check() {
    console.log("Checking DB Status...");
    try {
        // 1. Check client_trading_profiles
        const { data: profiles, error: profileErr } = await supabase
            .from('client_trading_profiles')
            .select('*')
            .limit(5);
        console.log("--- Profiles ---");
        console.log(profiles ? `${profiles.length} profiles found.` : profileErr);
        if (profiles && profiles.length > 0) {
            console.log("Sample Profile:", profiles[0]);
        }

        // 2. Check auth users
        const { data: users, error: userErr } = await supabase.auth.admin.listUsers();
        console.log("\n--- Users ---");
        console.log(users ? `${users.users.length} users found.` : userErr);

    } catch (e) {
        console.error(e);
    }
}

check();
