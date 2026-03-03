"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { SignalData } from "@/components/ui/trading-terminal"

export function useSignals() {
    const [signals, setSignals] = useState<SignalData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    const fetchSignals = async () => {
        try {
            const { data, error: fetchError } = await supabase
                .from('signals')
                .select('*')
                .order('created_at', { ascending: false })

            if (fetchError) throw fetchError
            if (data) setSignals(data as SignalData[])
        } catch (err) {
            console.error("Error fetching signals:", err)
            setError(err as Error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSignals()

        const channel = supabase
            .channel('signals_realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'signals' },
                () => {
                    fetchSignals()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    return { signals, loading, error, refresh: fetchSignals }
}
