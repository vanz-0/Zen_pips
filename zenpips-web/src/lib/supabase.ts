import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export function createClient() {
    return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Global singleton for client-side usage.
// Safe during build: uses empty strings if env vars are missing,
// which prevents @supabase/ssr from throwing during prerender.
export const supabase = createClient()
