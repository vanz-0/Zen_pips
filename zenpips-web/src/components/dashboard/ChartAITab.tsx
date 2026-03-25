"use client"

import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { Cpu, Zap, Shield, Users, Activity, Settings, ToggleLeft, ToggleRight, Loader2, CheckCircle2 } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { supabase } from "@/lib/supabase"
import { useSignals, Signal } from "@/hooks/useSignals"
import { useRouter } from "next/navigation"

export function ChartAITab() {
  const { user, loading: authLoading } = useAuth()
  const { signals } = useSignals()
  const router = useRouter()

  const [profile, setProfile] = useState<any>(null)
  const [chartAiActive, setChartAiActive] = useState(false)
  const [lotSize, setLotSize] = useState("0.01")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [executingId, setExecutingId] = useState<string | null>(null)

  // 1. Fetch User Profile & Settings
  const fetchProfile = useCallback(async () => {
    if (!user) return
    const { data, error } = await supabase
      .from("client_trading_profiles")
      .select("*")
      .eq("id", user.id) // Assuming profile ID matches Auth ID, or linked via separate field
      .single()

    if (!error && data) {
      setProfile(data)
      setChartAiActive(data.chart_ai_active)
      setLotSize(data.chart_ai_lot_size?.toString() || "0.01")
    } else if (error && error.code === 'PGRST116') {
        // Profile doesn't exist? Create a default one
        console.log("No profile found. Creating default for user:", user.id)
        const { data: newProfile } = await supabase.from('client_trading_profiles').insert({
            id: user.id, // Direct link to Auth ID
            chart_ai_active: false,
            chart_ai_lot_size: 0.01,
            risk_profile: 'Balanced'
        }).select().single()
        if (newProfile) setProfile(newProfile)
    }
  }, [user])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  // Filter signals
  const activeSignals = signals.filter(s => !s.closed)
  
  // Build activity timeline
  const activityEvents = signals.slice(0, 10).flatMap(sig => {
    const events: { icon: string; text: string; color: string; time: string }[] = []
    const time = new Date(sig.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    events.push({ icon: "🎯", text: `Signal: ${sig.direction} ${sig.pair} @ ${sig.entry}`, color: "text-[#d4af37]", time })
    if (sig.tp1_hit) events.push({ icon: "✅", text: `TP1 hit: ${sig.pair}`, color: "text-green-400", time })
    if (sig.sl_hit) events.push({ icon: "🛑", text: `SL hit: ${sig.pair}`, color: "text-red-400", time })
    return events
  })

  const handleToggle = async () => {
    const newState = !chartAiActive
    setChartAiActive(newState)
    await supabase.from('client_trading_profiles').update({ chart_ai_active: newState }).eq('id', user?.id)
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    const { error } = await supabase.from('client_trading_profiles').update({ 
        chart_ai_lot_size: parseFloat(lotSize) 
    }).eq('id', user?.id)
    
    setSaving(false)
    if (!error) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
    }
  }

  const handleExecuteSignal = async (sig: Signal) => {
    if (!profile) return
    setExecutingId(sig.id)
    
    // THE DYNAMIC LINK: Every user now populates their own unique copy event
    const { error } = await supabase.from('copy_events').insert({
      signal_id: sig.id,
      subscriber_id: profile.id, 
      status: 'USER_TRIGGERED',
      created_at: new Date().toISOString()
    })

    setTimeout(() => {
        setExecutingId(null)
        if (!error) {
            alert(`🚀 EXECUTION SENT: ${sig.pair} order transmitted to your local MT5.`)
        } else {
            console.error(error)
            alert(`❌ FAILED: ${error.message}`)
        }
    }, 800)
  }

  if (authLoading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-yellow-500" /></div>
  if (!user) return (
    <div className="flex flex-col items-center justify-center py-24 gap-6">
      <Cpu className="w-16 h-16 text-yellow-500/30" />
      <h2 className="text-2xl font-bold text-white">Chart AI Access Required</h2>
      <button onClick={() => router.push("/auth")} className="bg-yellow-500 text-black px-8 py-3 rounded-xl font-bold">Log In</button>
    </div>
  )

  return (
    <div className="w-full text-white py-12 font-[family-name:var(--font-outfit)]">
      <div className="max-w-6xl mx-auto space-y-8 px-4">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-[#d4af37] bg-clip-text text-transparent flex items-center gap-3">
              <Cpu className="w-10 h-10 text-blue-400" /> Chart AI
            </h1>
            <p className="text-gray-400 mt-2">Professional trade copier and risk management engine.</p>
          </div>
          <div className="flex items-center gap-4 bg-[#111] p-4 rounded-2xl border border-white/5">
            <div className={`w-3 h-3 rounded-full ${chartAiActive ? "bg-green-500 shadow-[0_0_10px_green]" : "bg-red-500"}`} />
            <span className={`text-sm font-bold ${chartAiActive ? "text-green-400" : "text-red-400"}`}>
              {chartAiActive ? "CLIENT CONNECTED" : "CLIENT DISCONNECTED"}
            </span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Active", value: activeSignals.length, color: "text-blue-400", icon: <Activity className="w-4 h-4" /> },
            { label: "Copied", value: profile?.total_copied || 0, color: "text-[#d4af37]", icon: <Zap className="w-4 h-4" /> },
            { label: "Risk Profile", value: profile?.risk_profile || "Balanced", color: "text-white", icon: <Shield className="w-4 h-4" /> },
            { label: "MT5 Status", value: "Online", color: "text-green-400", icon: <Settings className="w-4 h-4" /> },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#111] p-5 rounded-2xl border border-white/5">
              <div className="flex items-center gap-2 text-gray-500 text-[10px] uppercase mb-2 font-bold">{stat.icon} {stat.label}</div>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Settings - Left 1/3 */}
          <div className="bg-[#111] rounded-2xl border border-white/5 p-6 space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2 text-gray-300">
                <Settings className="w-4 h-4" /> Copier Settings
            </h3>
            
            <div className="space-y-4">
                <div className="p-4 bg-black/30 rounded-xl border border-white/5 flex items-center justify-between group cursor-pointer" onClick={handleToggle}>
                    <span className="text-sm font-semibold">Auto-Copy Mode</span>
                    {chartAiActive ? <ToggleRight className="text-green-400 w-8 h-8" /> : <ToggleLeft className="text-gray-600 w-8 h-8" />}
                </div>
                
                <div className="space-y-1.5 pt-2">
                    <label className="text-[10px] text-gray-500 uppercase font-bold">Default Lot Size</label>
                    <select value={lotSize} onChange={(e) => setLotSize(e.target.value)} className="w-full bg-black p-3 rounded-xl border border-white/10 text-sm outline-none focus:border-yellow-500/50 transition-colors cursor-pointer">
                        <option value="0.01">0.01 (Micro)</option>
                        <option value="0.02">0.02</option>
                        <option value="0.05">0.05 (Mini)</option>
                        <option value="0.10">0.10 (Standard)</option>
                        <option value="0.50">0.50</option>
                        <option value="1.00">1.00 (Standard Lot)</option>
                    </select>
                </div>

                <button 
                  onClick={handleSaveSettings} 
                  disabled={saving} 
                  className={`w-full py-4 mt-2 font-bold rounded-xl text-sm transition-all ${saved ? 'bg-green-500 text-white' : 'bg-[#d4af37] text-black hover:scale-[1.02]'}`}
                >
                    {saving ? <Loader2 className="animate-spin w-4 h-4 mx-auto" /> : saved ? <div className="flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4"/> Settings Saved</div> : "Save Trading Profile"}
                </button>
            </div>
          </div>

          {/* Active Signals List - Middle 1/3 */}
          <div className="md:col-span-1 space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-gray-300">
                <Zap className="w-4 h-4 text-yellow-500" /> Pending Execution
            </h3>
            <div className="space-y-3">
                {activeSignals.length === 0 ? (
                    <div className="py-16 bg-[#111] rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center text-gray-500 text-sm gap-3">
                         <Activity className="w-8 h-8 opacity-20" />
                         No pending signals found.
                    </div>
                ) : (
                    activeSignals.map(sig => (
                        <div key={sig.id} className="bg-[#111] rounded-2xl border border-white/5 p-5 relative overflow-hidden transition-all hover:border-white/20 group">
                            <div className={`absolute top-0 left-0 w-1 h-full ${sig.direction === 'BUY' ? 'bg-green-500' : 'bg-red-500'}`} />
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="text-xl font-bold font-mono tracking-wider">{sig.pair}</span>
                                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-1 flex items-center gap-2">
                                        <span className={sig.direction === 'BUY' ? 'text-green-500' : 'text-red-500'}>{sig.direction}</span> 
                                        <span>•</span> 
                                        <span>ENTRY @ {sig.entry}</span>
                                    </div>
                                </div>
                                <span className="text-[9px] font-mono bg-white/5 px-2 py-1 rounded text-gray-400 border border-white/5">{sig.timeframe}</span>
                            </div>
                            <button 
                                onClick={() => handleExecuteSignal(sig)} 
                                disabled={executingId === sig.id}
                                className={`w-full py-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-3 ${executingId === sig.id ? 'bg-gray-800 text-gray-500' : 'bg-white/5 hover:bg-yellow-500 hover:text-black border border-white/10 group-hover:border-yellow-500/50'}`}
                            >
                                {executingId === sig.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-4 h-4 text-yellow-500 group-hover:text-black" />}
                                {executingId === sig.id ? "TRANSMITTING..." : "EXECUTE ON MT5"}
                            </button>
                        </div>
                    ))
                )}
            </div>
          </div>

          {/* Activity Feed - Right 1/3 */}
          <div className="bg-[#111] rounded-2xl border border-white/5 flex flex-col h-[520px] overflow-hidden">
             <div className="p-5 border-b border-white/5 flex items-center justify-between bg-black/20">
                <h3 className="text-sm font-bold flex items-center gap-2">
                    <Activity className="w-4 h-4 text-green-400" /> Network Activity
                </h3>
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-green-500 font-bold font-mono tracking-tighter">LIVE</span>
                </div>
             </div>
             <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
                {activityEvents.map((evt, i) => (
                    <motion.div 
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={i} 
                        className="flex items-start gap-4 p-4 rounded-xl bg-black/40 border border-white/5 hover:bg-white/5 transition-colors"
                    >
                        <span className="text-sm mt-0.5">{evt.icon}</span>
                        <div className="flex-1 min-w-0">
                            <p className={`text-[11px] font-mono font-bold leading-tight ${evt.color}`}>{evt.text}</p>
                            <span className="text-[9px] text-gray-600 block mt-1.5 font-medium">{evt.time}</span>
                        </div>
                    </motion.div>
                ))}
             </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-gradient-to-br from-[#111] to-black p-10 rounded-3xl border border-blue-500/10 shadow-2xl">
            <h3 className="text-xl font-bold mb-8 flex items-center gap-3"><Shield className="w-6 h-6 text-blue-400" /> Automated Risk Protocol (1:1/1:2/1:3)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { title: "PHASE 1 (1:1 RR)", desc: "Initial target. When hit, stop loss is auto-moved to entry price (Breakeven)." },
                    { title: "PHASE 2 (1:2 RR)", desc: "Momentum target. 50% of the position is closed to lock in profits." },
                    { title: "PHASE 3 (1:3 RR)", desc: "Final trend exhaustion. Full move captured and trade officially cleared." }
                ].map((item, i) => (
                    <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/5 relative">
                        <div className="text-blue-400 font-bold text-xs mb-3 tracking-widest uppercase">{item.title}</div>
                        <p className="text-xs text-gray-400 leading-relaxed font-medium">{item.desc}</p>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  )
}
