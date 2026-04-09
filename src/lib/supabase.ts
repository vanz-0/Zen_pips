import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export function createClient() {
    if (!supabaseUrl || !supabaseAnonKey) {
        // Return a dummy client during build if variables are missing
        // This prevents @supabase/ssr from throwing an error during prerender
        return {
            auth: {},
            from: () => ({ select: () => ({ data: [], error: null }) }),
        } as any;
    }
    return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Global singleton for client-side usage.
export const supabase = createClient()
