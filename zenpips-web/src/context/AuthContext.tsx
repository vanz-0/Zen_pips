"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { supabase } from "@/lib/supabase"
import type { User, Session } from "@supabase/supabase-js"

interface AuthContextType {
    user: User | null
    session: Session | null
    profile: any | null
    loading: boolean
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    profile: null,
    loading: true,
    signOut: async () => { },
})

// ⚡ DEV BYPASS — set to true to skip auth on localhost for testing
const DEV_BYPASS = true

const MOCK_USER = {
    id: "825e206a-1c83-4041-8fb5-16440c004f18",
    email: "dev@zenpips.com",
    app_metadata: {},
    user_metadata: { full_name: "Dev Tester" },
    aud: "authenticated",
    created_at: new Date().toISOString(),
} as unknown as User

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(DEV_BYPASS ? MOCK_USER : null)
    const [session, setSession] = useState<Session | null>(null)
    const [profile, setProfile] = useState<any | null>(DEV_BYPASS ? { is_vip: true } : null)
    const [loading, setLoading] = useState(DEV_BYPASS ? false : true)

    const fetchProfile = async (userId: string) => {
        const { data, error } = await supabase
            .from('client_trading_profiles')
            .select('*')
            .eq('id', userId)
            .single()
        
        if (!error && data) {
            setProfile(data)
        }
    }

    useEffect(() => {
        if (DEV_BYPASS) return // skip real auth in dev mode

        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) fetchProfile(session.user.id)
            setLoading(false)
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session)
                setUser(session?.user ?? null)
                if (session?.user) fetchProfile(session.user.id)
                setLoading(false)
            }
        )

        return () => subscription.unsubscribe()
    }, [])

    const signOut = async () => {
        if (DEV_BYPASS) return
        await supabase.auth.signOut()
        setUser(null)
        setSession(null)
    }

    return (
        <AuthContext.Provider value={{ user, session, profile, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
