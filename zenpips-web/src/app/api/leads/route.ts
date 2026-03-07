import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, name, source, utm_source, utm_medium, utm_campaign } = body;

        if (!email || !email.includes('@')) {
            return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('leads')
            .upsert(
                {
                    email: email.toLowerCase().trim(),
                    name: name || null,
                    source: source || 'landing_page',
                    utm_source: utm_source || null,
                    utm_medium: utm_medium || null,
                    utm_campaign: utm_campaign || null,
                },
                { onConflict: 'email' }
            )
            .select()
            .single();

        if (error) {
            console.error('Lead capture error:', error);
            return NextResponse.json({ error: 'Failed to save lead' }, { status: 500 });
        }

        return NextResponse.json({ success: true, lead: data });
    } catch (err) {
        console.error('Lead API error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
