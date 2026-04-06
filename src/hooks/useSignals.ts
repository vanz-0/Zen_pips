"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export interface Signal {
  id: string
  pair: string
  direction: "BUY" | "SELL"
  entry: number
  sl: number
  tp1: number
  tp2: number
  tp3: number
  current_sl: number
  tp1_hit: boolean
  tp2_hit: boolean
  tp3_hit: boolean
  sl_hit: boolean
  closed: boolean
  created_at: string
  timeframe: string
  total_pips: number
  status?: string
  confluence?: string
  pip_multiplier?: string | number
  last_checked?: string
  closed_at?: string
}

export function useSignals() {
  const [signals, setSignals] = useState<Signal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Initial Fetch
    const fetchSignals = async () => {
      const { data, error } = await supabase
        .from("signals")
        .select("*")
        .order("created_at", { ascending: false })
        .order("entry", { ascending: false })
      
      if (!error && data) {
        setSignals(data as Signal[])
      }
      setLoading(false)
    }

    fetchSignals()

    // 2. Real-Time Subscription (The Secret to your Speed)
    const channel = supabase
      .channel("signals-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "signals" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setSignals((prev) => [payload.new as Signal, ...prev])
          } else if (payload.eventType === "UPDATE") {
            setSignals((prev) =>
              prev.map((s) => (s.id === payload.new.id ? (payload.new as Signal) : s))
            )
          } else if (payload.eventType === "DELETE") {
             setSignals((prev) => prev.filter((s) => s.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { signals, loading }
}
