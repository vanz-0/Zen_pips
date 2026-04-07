import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    const chat = [
        {
             user_id: '11111111-1111-1111-1111-111111111111', 
             content: "Gold pulling back to entry is actually a blessing. Going to load up another entry since it perfectly re-tapped the FVG. Thanks for moving stops to BE, Admin!"
        },
        {
             user_id: '22222222-2222-2222-2222-222222222222',
             content: "The BTC setup looks absolutely lethal. That's exactly where the liquidations are clustered. Copy-trader already triggered the position on my end 🤖🚀"
        },
        {
             user_id: '33333333-3333-3333-3333-333333333333', 
             content: "Honestly the session today is so relaxed. Hit TP3 on Silver, locked in profits, now just letting the algorithms do the heavy lifting. Zen Pips living up to the name 🧘‍♂️"
        }
    ];

    for (let m of chat) {
        await supabase.from('community_messages').insert({
            user_id: m.user_id,
            channel: 'general-chat',
            content: m.content
        });
    }
}

main();
