import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

        if (!supabaseKey) {
            console.error("Missing SUPABASE_SERVICE_ROLE_KEY in environment.");
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

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

        // --- Brevo Email Integration ---
        const brevoApiKey = process.env.BREVO_API_KEY;
        if (brevoApiKey) {
            try {
                const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
                    method: 'POST',
                    headers: {
                        'accept': 'application/json',
                        'content-type': 'application/json',
                        'api-key': brevoApiKey
                    },
                    body: JSON.stringify({
                        sender: { email: 'morganjeff3111@gmail.com', name: 'Zen Pips' },
                        to: [{ email: email.toLowerCase().trim(), name: name || 'Valued Trader' }],
                        templateId: 1,
                        params: {
                            FIRSTNAME: name || 'Trader',
                            SUBJECT: 'Welcome to the Inner Circle 📈'
                        }
                    })
                });

                if (!brevoResponse.ok) {
                    const errorText = await brevoResponse.text();
                    console.error('Brevo API Error:', errorText);
                } else {
                    console.log('Successfully sent Brevo email to', email);
                }
            } catch (brevoErr) {
                console.error('Error sending email through Brevo:', brevoErr);
            }
        } else {
            console.warn('BREVO_API_KEY is not set. Email was not sent.');
        }

        return NextResponse.json({ success: true, lead: data });
    } catch (err) {
        console.error('Lead API error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
