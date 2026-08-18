import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function listUsers() {
    const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (error) {
        console.error('Error:', error);
        return;
    }

    const users = data.users;
    console.log(`\n📊 TOTAL REGISTERED USERS: ${users.length}\n`);
    console.log('─'.repeat(70));
    users.forEach((u, i) => {
        const confirmed = u.email_confirmed_at ? '✅' : '⏳';
        const date = new Date(u.created_at).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
        console.log(`${String(i+1).padStart(2, ' ')}. ${confirmed} ${u.email?.padEnd(40)} | Joined: ${date}`);
    });
    console.log('─'.repeat(70));
    const confirmed = users.filter(u => u.email_confirmed_at).length;
    const unconfirmed = users.filter(u => !u.email_confirmed_at).length;
    console.log(`\n✅ Confirmed:   ${confirmed}`);
    console.log(`⏳ Unconfirmed: ${unconfirmed}`);
    console.log(`📧 Total:       ${users.length}\n`);
}

listUsers();
