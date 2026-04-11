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

    // 1. Pre-Flight: Check if user already exists to prevent duplicates
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
        console.error('List Users Error:', listError);
    } else {
        const existingUser = users.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
        if (existingUser) {
            return NextResponse.json({ 
                error: 'Account already exists. Please log in or reset your password if you forgotten it.' 
            }, { status: 409 });
        }
    }

    // 2. Generate Confirmation Link & Create User
    // Use the production URL (NEXT_PUBLIC_SITE_URL) to prevent localhost drift
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://zenpips.netlify.app';
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email,
      password,
      options: { 
        redirectTo: `${siteUrl}/api/auth/callback/onboard`,
        data: { full_name } // Include metadata
      }
    });

    if (linkError) throw linkError;

    // 2. Load Institutional Email Template
    const templatePath = path.join(process.cwd(), 'public/emails/welcome.html');
    let htmlContent = fs.readFileSync(templatePath, 'utf8');

    // Replace Placeholders
    htmlContent = htmlContent
      .replace('{{NAME}}', full_name)
      .replace('{{EMAIL}}', email)
      .replace('{{CONFIRMATION_URL}}', linkData.properties.action_link);

    // 3. Send via Brevo API
    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY!
      },
      body: JSON.stringify({
        sender: { name: 'Zenpips Team', email: 'zenithbrainiac@gmail.com' },
        to: [{ email, name: full_name }],
        subject: 'Welcome to Zenpips - Institutional Access Initialized',
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
