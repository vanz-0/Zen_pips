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

// ⚡ DEV BYPASS — Set to true to automatically login as admin on localhost
const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost'
const DEV_BYPASS = isLocalhost

const MOCK_USER = {
    id: "c3abc54b-2801-4624-b8b3-c56accb5d20e",
    email: "merchzenith@gmail.com",
    app_metadata: {},
    user_metadata: { full_name: "Admin Tester" },
    aud: "authenticated",
    created_at: new Date().toISOString(),
} as unknown as User

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(DEV_BYPASS ? MOCK_USER : null)
    const [session, setSession] = useState<Session | null>(null)
    const [profile, setProfile] = useState<any | null>(DEV_BYPASS ? { 
        id: "c3abc54b-2801-4624-b8b3-c56accb5d20e",
        email: "merchzenith@gmail.com",
        is_vip: true, 
        is_admin: true,
        plan: 'VIP',
        ai_usage_total: 0 
    } : null)
    const [loading, setLoading] = useState(DEV_BYPASS ? false : true)

    const fetchProfile = async (userId: string) => {
        const { data, error } = await supabase
            .from('client_trading_profiles')
            .select('*')
            .eq('id', userId)
            .single()
        
        if (!error && data) {
            setProfile(data)
        } else if (error && error.code === 'PGRST116') {
            // Auto-create profile if missing
            const { data: newProfile } = await supabase.from('client_trading_profiles').insert({
                id: userId,
                is_vip: false,
                ai_usage_total: 0
            }).select().single()
            if (newProfile) setProfile(newProfile)
        }
    }

    useEffect(() => {
        if (DEV_BYPASS) return // skip real auth in dev mode

        supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) fetchProfile(session.user.id)
            setLoading(false)
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event: string, session: Session | null) => {
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
