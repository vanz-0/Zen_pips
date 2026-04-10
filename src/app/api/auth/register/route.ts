import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Supabase Admin for sensitive operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { email, password, full_name } = await req.json();

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Create User in Supabase (Service Role bypasses email auto-send if configured)
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { full_name }
    });

    if (createError) throw createError;

    // 2. Generate Confirmation Link
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email,
      options: { redirectTo: `${new URL(req.url).origin}/dashboard` }
    });

    if (linkError) throw linkError;

    // 3. Load Institutional Email Template
    const templatePath = path.join(process.cwd(), 'public/emails/welcome.html');
    let htmlContent = fs.readFileSync(templatePath, 'utf8');

    // Replace Placeholders
    htmlContent = htmlContent
      .replace('{{NAME}}', full_name)
      .replace('{{EMAIL}}', email)
      .replace('{{PASSWORD}}', password)
      .replace('{{CONFIRMATION_URL}}', linkData.properties.action_link);

    // 4. Send via Brevo API
    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY!
      },
      body: JSON.stringify({
        sender: { name: 'Zen Pips Institutional', email: 'support@zenpips.com' },
        to: [{ email, name: full_name }],
        subject: 'Welcome to Zen Pips - Institutional Access Initialized',
        htmlContent: htmlContent
      })
    });

    if (!brevoResponse.ok) {
        const errData = await brevoResponse.json();
        throw new Error(`Brevo Error: ${JSON.stringify(errData)}`);
    }

    return NextResponse.json({ success: true, message: 'Institutional welcome email sent.' });

  } catch (error: any) {
    console.error('Registration Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
