"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { supabase } from "@/lib/supabase"
import type { User, Session } from "@supabase/supabase-js"

interface AuthContextType {
    user: User | null
    session: Session | null
    loading: boolean
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    loading: true,
    signOut: async () => { },
})

// ⚡ DEV BYPASS — set to true to skip auth on localhost for testing
const DEV_BYPASS = true

const MOCK_USER = {
    id: "dev-test-user-000",
    email: "dev@zenpips.com",
    app_metadata: {},
    user_metadata: { full_name: "Dev Tester" },
    aud: "authenticated",
    created_at: new Date().toISOString(),
} as unknown as User

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(DEV_BYPASS ? MOCK_USER : null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(DEV_BYPASS ? false : true)

    useEffect(() => {
        if (DEV_BYPASS) return // skip real auth in dev mode

        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setUser(session?.user ?? null)
            setLoading(false)
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session)
                setUser(session?.user ?? null)
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
        <AuthContext.Provider value={{ user, session, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
