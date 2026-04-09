import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
    try {
        const { userId, taskType } = await req.json()
        if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 })

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        
        if (!supabaseKey) {
            return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data: profile } = await supabase
            .from('client_trading_profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 })

        const now = new Date();
        const lastClaim = profile.last_reward_claim ? new Date(profile.last_reward_claim) : new Date(0);
        const isSameDay = now.toDateString() === lastClaim.toDateString();

        if (isSameDay) {
            return NextResponse.json({ 
                error: "ALREADY_CLAIMED", 
                message: "🔴 ACCESS DENIED: Daily bonus protocols already executed for this session. Return in 24 hours." 
            }, { status: 403 })
        }

        // Grant 10 bonus credits and update last_reward_claim
        const { error } = await supabase.from('client_trading_profiles').update({
            bonus_credits: (profile.bonus_credits || 0) + 10,
            last_reward_claim: now.toISOString()
        }).eq('id', userId);

        if (error) throw error;

        return NextResponse.json({ 
            success: true, 
            message: "🚀 TARGET SECURED: 10 Extra AI Credits have been provisioned to your command center.",
            bonusAdded: 10 
        });

    } catch (error: any) {
        console.error("Reward Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
