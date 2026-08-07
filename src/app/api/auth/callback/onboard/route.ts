import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/?tab=profile';

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )

    // 1. Confirm the session using the user client to set cookies
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.user) {
      const email = data.user.email!;
      const full_name = data.user.user_metadata?.full_name || 'Trader';

      // 2. Trigger the Master Guide Email via Brevo
      try {
        const guidePath = path.join(process.cwd(), 'public/emails/master_guide.html');
        let htmlContent = '';
        
        // Fallback if file doesn't exist yet (we will create it next)
        if (fs.existsSync(guidePath)) {
            htmlContent = fs.readFileSync(guidePath, 'utf8');
            htmlContent = htmlContent.replace('{{NAME}}', full_name);
        }

        if (htmlContent) {
            await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'api-key': process.env.BREVO_API_KEY!
                },
                body: JSON.stringify({
                    sender: { name: 'Zenpips Team', email: 'evansumakaz@gmail.com' },
                    to: [{ email, name: full_name }],
                    subject: 'Zen Pips: Your Institutional Master Guide & Manual',
                    htmlContent: htmlContent
                })
            });
        }
      } catch (e) {
        console.error('Guide Email Error:', e);
      }

      // 3. Redirect to Dashboard with setup flag
      return NextResponse.redirect(`${origin}${next}?first_login=true`);
    }
  }

  // Fallback to login if something fails
  return NextResponse.redirect(`${origin}/auth`);
}
