"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Cpu, Zap, Shield, Activity, Settings, ToggleLeft, ToggleRight, Loader2, CheckCircle2, ImageIcon, ScanLine, FileText, Send, AlertCircle, X, Terminal } from "lucide-react"
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

  // Chart Analysis States
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 1. Fetch User Profile & Settings
  const fetchProfile = useCallback(async () => {
    if (!user) return
    const { data, error } = await supabase
      .from("client_trading_profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (!error && data) {
      setProfile(data)
      setChartAiActive(data.chart_ai_active)
      setLotSize(data.chart_ai_lot_size?.toString() || "0.01")
    } else if (error && error.code === 'PGRST116') {
        const { data: newProfile } = await supabase.from('client_trading_profiles').insert({
            id: user.id,
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setAnalysisResult(null)
    }
  }

  const handleAnalyzeChart = async () => {
    if (!selectedFile) return
    setIsAnalyzing(true)
    setAnalysisResult(null)

    try {
      // 1. Convert to Base64 for ultimate reliability
      const reader = new FileReader()
      const base64Promise = new Promise((resolve) => {
        reader.onload = () => {
          const base64String = (reader.result as string).split(',')[1]
          resolve(base64String)
        }
      })
      reader.readAsDataURL(selectedFile)
      const base64Image = await base64Promise

      // 2. Call the new Vision Engine API
      const response = await fetch('/api/analyze-chart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Image }),
      })

      const data = await response.json()
      if (data.analysis) {
        setAnalysisResult(data.analysis)
      } else {
        setAnalysisResult("AI Analysis failed. System offline or image too large.")
      }
    } catch (error) {
      console.error("Analysis error:", error)
      setAnalysisResult("An unexpected error occurred during analysis.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const clearImage = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setAnalysisResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

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

        {/* Level 1: Core Stats and Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
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
            
            <div className="bg-[#111] rounded-2xl border border-white/5 p-5">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] text-gray-500 uppercase font-bold flex items-center gap-2"><Settings className="w-3 h-3" /> Copier Config</span>
                    <button onClick={handleSaveSettings} disabled={saving} className={`text-[9px] font-bold px-3 py-1 rounded-lg ${saved ? 'bg-green-500' : 'bg-yellow-500 text-black hover:scale-105 transition-all'}`}>
                        {saving ? "SAVING..." : saved ? "SAVED" : "SAVE"}
                    </button>
                </div>
                <div className="flex items-center justify-between gap-4">
                    <select value={lotSize} onChange={(e) => setLotSize(e.target.value)} className="flex-1 bg-black p-2 rounded-lg border border-white/10 text-xs outline-none focus:border-yellow-500/50">
                        <option value="0.01">0.01 Lot</option>
                        <option value="0.05">0.05 Lot</option>
                        <option value="0.10">0.10 Lot</option>
                        <option value="0.50">0.50 Lot</option>
                        <option value="1.00">1.00 Lot</option>
                    </select>
                    <button onClick={handleToggle} className="p-2 bg-black rounded-lg border border-white/10">
                        {chartAiActive ? <ToggleRight className="text-green-400 w-6 h-6" /> : <ToggleLeft className="text-gray-600 w-6 h-6" />}
                    </button>
                </div>
            </div>
        </div>

        {/* Level 2: AI Vision / Signal Execution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* AI Vision Analysis Area */}
            <div className="lg:col-span-2 bg-[#111] rounded-3xl border border-white/5 overflow-hidden flex flex-col min-h-[500px]">
                <div className="p-6 border-b border-white/5 bg-black/20 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-3">
                            <ScanLine className="w-6 h-6 text-blue-400" /> AI Visual Intelligence
                        </h2>
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-1">Upload chart screenshot for instant analysis</p>
                    </div>
                    {previewUrl && (
                        <button onClick={clearImage} className="p-2 hover:bg-red-500/10 text-gray-500 hover:text-red-400 rounded-xl transition-all">
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                <div className="flex-1 p-6 flex flex-col gap-6 relative">
                    {!previewUrl ? (
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center gap-4 hover:bg-white/5 hover:border-blue-500/30 transition-all cursor-pointer group p-12 text-center"
                        >
                            <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                <ImageIcon className="w-10 h-10" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-white">Drop Chart Screenshot</h3>
                                <p className="text-xs text-gray-500 mt-1">Supports PNG, JPG (e.g., TradingView charts)</p>
                            </div>
                            <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black aspect-video md:aspect-auto">
                                <img src={previewUrl} alt="Chart Preview" className="w-full h-full object-contain" />
                                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex justify-center">
                                    {!isAnalyzing && !analysisResult && (
                                        <button 
                                            onClick={handleAnalyzeChart}
                                            className="px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white rounded-xl font-bold flex items-center gap-2 shadow-2xl hover:scale-105 transition-all outline-none"
                                        >
                                            <Cpu className="w-4 h-4" /> ANALYZE MARKET STRUCTURE
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            <div className="bg-[#0a0a0a] rounded-2xl border border-white/5 flex flex-col overflow-hidden h-[400px]">
                                <div className="p-4 border-b border-white/5 bg-black/40 flex items-center gap-2">
                                    <Terminal className="w-4 h-4 text-green-400" />
                                    <span className="text-[10px] font-mono font-bold uppercase tracking-tighter">Analysis Terminal</span>
                                </div>
                                <div className="flex-1 p-4 font-mono text-[11px] leading-relaxed text-gray-300 overflow-y-auto custom-scrollbar">
                                    {isAnalyzing ? (
                                        <div className="flex flex-col items-center justify-center h-full gap-4 text-blue-400">
                                            <Loader2 className="w-8 h-8 animate-spin" />
                                            <span className="animate-pulse">DECODING PRICE ACTION...</span>
                                        </div>
                                    ) : analysisResult ? (
                                        <div className="whitespace-pre-wrap">{analysisResult}</div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-600">
                                            <AlertCircle className="w-6 h-6 opacity-30" />
                                            <span>READY FOR SCAN</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Signal Execution - Sidebar */}
            <div className="space-y-4">
                <div className="bg-[#111] rounded-3xl border border-white/5 p-6 flex flex-col h-full max-h-[500px]">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-gray-300 mb-6">
                        <Zap className="w-4 h-4 text-yellow-500" /> Pending Signals
                    </h3>
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                        {activeSignals.length === 0 ? (
                            <div className="py-16 flex flex-col items-center justify-center text-gray-500 text-sm gap-3 opacity-30">
                                <Activity className="w-8 h-8" />
                                No pending signals.
                            </div>
                        ) : (
                            activeSignals.map(sig => (
                                <div key={sig.id} className="bg-black/40 rounded-2xl border border-white/5 p-4 relative overflow-hidden group hover:border-yellow-500/30 transition-all">
                                    <div className={`absolute top-0 left-0 w-1 h-full ${sig.direction === 'BUY' ? 'bg-green-500' : 'bg-red-500'}`} />
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <span className="text-lg font-bold font-mono tracking-wider">{sig.pair}</span>
                                            <div className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mt-1">
                                                <span className={sig.direction === 'BUY' ? 'text-green-500' : 'text-red-500'}>{sig.direction}</span> • ENTRY @ {sig.entry}
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleExecuteSignal(sig)} 
                                        disabled={executingId === sig.id}
                                        className={`w-full py-3 rounded-xl font-bold text-[10px] transition-all flex items-center justify-center gap-2 ${executingId === sig.id ? 'bg-gray-800 text-gray-500' : 'bg-white/5 hover:bg-yellow-500 hover:text-black border border-white/10 group-hover:border-yellow-500/50'}`}
                                    >
                                        {executingId === sig.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                                        {executingId === sig.id ? "THINKING..." : "EXECUTE"}
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                
                {/* Network Feed Small */}
                <div className="bg-[#111] rounded-3xl border border-white/5 p-6 h-[180px] overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] text-gray-500 uppercase font-bold">Network Feed</span>
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    </div>
                    <div className="space-y-2 overflow-y-hidden">
                         {activityEvents.slice(0, 3).map((evt, i) => (
                             <div key={i} className="text-[10px] font-mono text-gray-400 border-l border-white/10 pl-3 py-1">
                                 <span className={evt.color}>{evt.text}</span>
                             </div>
                         ))}
                    </div>
                </div>
            </div>
        </div>

        {/* Level 3: Institutional Protocol */}
        <div className="bg-gradient-to-br from-[#111] to-black p-10 rounded-3xl border border-blue-500/10 shadow-2xl">
            <h3 className="text-xl font-bold mb-8 flex items-center gap-3"><Shield className="w-6 h-6 text-blue-400" /> Institutional Protocol (1:1/1:2/1:3)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                {[
                    { phase: "PHASE 1", rr: "1:1 RR", desc: "Initial Draw. Stop Loss moves to Breakeven." },
                    { phase: "PHASE 2", rr: "1:2 RR", desc: "Partial TP. 50% Volume Liquidated." },
                    { phase: "PHASE 3", rr: "1:3 RR", desc: "Full Extraction. 100% Volume Liquidated." }
                ].map((item, i) => (
                    <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/5">
                        <div className="text-blue-400 font-bold text-[10px] tracking-widest mb-1">{item.phase}</div>
                        <div className="text-2xl font-black text-white mb-2">{item.rr}</div>
                        <p className="text-[10px] text-gray-500 leading-relaxed uppercase">{item.desc}</p>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  )
}
