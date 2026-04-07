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
  const [lastImageUrl, setLastImageUrl] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

    const [history, setHistory] = useState<any[]>([])
    const [loadingHistory, setLoadingHistory] = useState(false)

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
                risk_profile: 'Balanced',
                ai_usage_total: 0
            }).select().single()
            if (newProfile) setProfile(newProfile)
        }
    }, [user])

    const fetchHistory = useCallback(async () => {
        if (!user) return
        setLoadingHistory(true)
        const { data, error } = await supabase
            .from("chart_analysis")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })

        if (!error && data) setHistory(data)
        setLoadingHistory(false)
    }, [user])

    useEffect(() => {
        fetchProfile()
        fetchHistory()
    }, [fetchProfile, fetchHistory])

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
    if (!selectedFile || !user) return
    
    // Check Limit locally first
    const isVip = profile?.is_vip || profile?.plan === 'VIP'
    if (!isVip && (profile?.ai_usage_total || 0) >= 10) {
        setAnalysisResult("🔴 LIMIT REACHED: You have used your 10 free AI credits. Upgrade to VIP to unlock unlimited institutional analysis.")
        return
    }

    setIsAnalyzing(true)
    setAnalysisResult(null)

    try {
      const reader = new FileReader()
      const base64Promise = new Promise((resolve) => {
        reader.onload = () => {
          const base64String = (reader.result as string).split(',')[1]
          resolve(base64String)
        }
      })
      reader.readAsDataURL(selectedFile)
      const base64Image = await base64Promise

      const response = await fetch('/api/analyze-chart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Image, userId: user.id }),
      })

      const data = await response.json()
      if (data.analysis) {
        setAnalysisResult(data.analysis)
        if (data.imageUrl) {
            setLastImageUrl(data.imageUrl)
            // Ensure it's saved in history state immediately
            fetchHistory()
        }
        fetchProfile() // Refresh count
      } else if (data.error === "NOT_A_CHART") {
        setAnalysisResult(`🔴 VERIFICATION FAILED: ${data.message || "This image does not appear to be a trading chart. Please upload a valid screenshot to maintain institutional data integrity."}`)
        setSelectedFile(null)
      } else if (data.error === "LIMIT_REACHED") {
        setAnalysisResult(data.message)
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

  const handleShareToCommunity = async () => {
    if (!analysisResult || !lastImageUrl || !user) return
    setIsSharing(true)
    
    try {
        const { error } = await supabase.from('community_messages').insert({
            user_id: user.id,
            content: `🎯 AI ANALYSIS SHARED:\n\n${analysisResult.split('### 4. Verdict:')[0].trim()}`,
            image: lastImageUrl,
            channel: 'setups-and-charts'
        })

        if (!error) {
            alert("🚀 SHARED: Your analysis has been broadcast to the #setups-and-charts community hub.")
        }
    } catch (e) {
        console.error("Sharing error:", e)
    } finally {
        setIsSharing(false)
    }
  }

  // Helper for professional typography
  const renderAnalysis = (text: string) => {
      return text.split('\n').map((line, i) => {
          if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold text-[var(--color-info)] mt-6 mb-3 uppercase tracking-tighter italic">{line.replace('## ', '')}</h2>
          if (line.startsWith('### ')) return <h3 key={i} className="text-md font-bold text-[var(--foreground)] mt-4 mb-2 uppercase tracking-wide border-l-2 border-blue-500 pl-3">{line.replace('### ', '')}</h3>
          if (line.startsWith('- **')) {
              const [title, desc] = line.split(': ')
              return (
                  <div key={i} className="mb-2 text-[12px] leading-relaxed">
                      <span className="text-[var(--color-info)] font-bold">{title.replace('- **', '').replace('**', '')}</span>: 
                      <span className="text-[var(--text-muted)] ml-1">{desc}</span>
                  </div>
              )
          }
          if (line.includes('Institutional Recommendation:')) {
              const isSell = line.includes('SELL')
              const isBuy = line.includes('BUY')
              return (
                  <div key={i} className={`my-6 p-4 rounded-xl border font-bold text-center uppercase tracking-widest ${isSell ? 'bg-red-500/10 border-red-500/30 text-[var(--color-danger)]' : isBuy ? 'bg-green-500/10 border-green-500/30 text-[var(--color-success)]' : 'bg-blue-500/10 border-blue-500/30 text-[var(--color-info)]'}`}>
                      {line}
                  </div>
              )
          }
          return <p key={i} className="text-[11px] text-[var(--text-muted)] leading-relaxed mb-1">{line}</p>
      })
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
    if (sig.tp1_hit) events.push({ icon: "✅", text: `TP1 hit: ${sig.pair}`, color: "text-[var(--color-success)]", time })
    if (sig.sl_hit) events.push({ icon: "🛑", text: `SL hit: ${sig.pair}`, color: "text-[var(--color-danger)]", time })
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
    setExecutingId(sig.id)
    
    // 1. Insert Execution Request into Supabase
    const { data: req, error: insError } = await supabase.from('copy_events').insert({
      signal_id: sig.id,
      subscriber_id: profile?.id || user?.id, // Fallback to user.id if profile not yet loaded
      status: 'PENDING'
    }).select().single()

    if (insError) {
        console.error("Manual execution error:", insError)
        alert(`❌ FAILED: Could not transmit signal. ${insError.message}`)
        setExecutingId(null)
        return
    }

    // 2. Poll for Bridge Response (Max 10 seconds)
    let attempts = 0
    const pollInterval = setInterval(async () => {
        attempts++
        const { data: update, error: pollError } = await supabase
            .from('copy_events')
            .select('*')
            .eq('id', req.id)
            .single()

        if (pollError) {
            console.error("Polling error:", pollError)
            return
        }

        if (update?.status === 'SUCCESS') {
            clearInterval(pollInterval)
            setExecutingId(null)
            alert(`✅ SIGNAL EXECUTED: ${sig.pair} order successfully placed in your MetaTrader 5 terminal.`)
        } else if (update?.status === 'FAILED') {
            clearInterval(pollInterval)
            setExecutingId(null)
            alert(`❌ MT5 ERROR: ${update.error_message || "Terminal configuration error."}\n\nEnsure your Zen Pips Bridge (Python) is running and your MT5 has 'Algo Trading' enabled.`)
        } else if (attempts > 20) { // 10 seconds timeout
            clearInterval(pollInterval)
            setExecutingId(null)
            alert(`⚠️ BRIDGE TIMEOUT: The MT5 Bridge is not responding. Check if your Python execution script is running and connected.`)
        }
    }, 500)
  }

  if (authLoading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-yellow-500" /></div>
  if (!user) return (
    <div className="flex flex-col items-center justify-center py-24 gap-6">
      <Cpu className="w-16 h-16 text-yellow-500/30" />
      <h2 className="text-2xl font-bold text-[var(--foreground)]">Chart AI Access Required</h2>
      <button onClick={() => router.push("/auth")} className="bg-yellow-500 text-black px-8 py-3 rounded-xl font-bold">Log In</button>
    </div>
  )

  const isVip = profile?.is_vip || profile?.plan === 'VIP'
  const usageCount = profile?.ai_usage_total || 0
  const creditsRemaining = Math.max(0, 10 - usageCount)

  return (
    <div className="w-full text-[var(--foreground)] py-12 font-[family-name:var(--font-outfit)]">
      <div className="max-w-6xl mx-auto space-y-8 px-4">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-[#d4af37] bg-clip-text text-transparent flex items-center gap-3">
              <Cpu className="w-10 h-10 text-[var(--color-info)]" /> Chart AI
            </h1>
            <p className="text-[var(--text-muted)] mt-2">Professional trade copier and risk management engine.</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-4 bg-[var(--panel-bg)] p-4 rounded-2xl border border-[var(--border-color)]">
                <div className={`w-3 h-3 rounded-full ${chartAiActive ? "bg-green-500 shadow-[0_0_10px_green]" : "bg-red-500"}`} />
                <span className={`text-sm font-bold ${chartAiActive ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}`}>
                {chartAiActive ? "CLIENT CONNECTED" : "CLIENT DISCONNECTED"}
                </span>
            </div>
            {!isVip && (
                <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
                    <Zap className="w-3 h-3 text-yellow-500" /> {creditsRemaining} / 10 Free AI Credits Remaining
                </div>
            )}
          </div>
        </div>

        {/* Level 1: Core Stats and Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
                { label: "Active", value: activeSignals.length, color: "text-[var(--color-info)]", icon: <Activity className="w-4 h-4" /> },
                { label: "Copied", value: profile?.total_copied || 0, color: "text-[#d4af37]", icon: <Zap className="w-4 h-4" /> },
                { label: "Risk Profile", value: profile?.risk_profile || "Balanced", color: "text-[var(--foreground)]", icon: <Shield className="w-4 h-4" /> },
                { label: "Status", value: isVip ? "PREMIUM" : "FREE", color: isVip ? "text-yellow-500" : "text-[var(--text-muted)]", icon: <Settings className="w-4 h-4" /> },
            ].map((stat) => (
                <div key={stat.label} className="bg-[var(--panel-bg)] p-5 rounded-2xl border border-[var(--border-color)]">
                <div className="flex items-center gap-2 text-[var(--text-muted)] text-[10px] uppercase mb-2 font-bold">{stat.icon} {stat.label}</div>
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                </div>
            ))}
            </div>
            
            <div className="bg-[var(--panel-bg)] rounded-2xl border border-[var(--border-color)] p-5">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold flex items-center gap-2"><Settings className="w-3 h-3" /> Copier Config</span>
                    <button onClick={handleSaveSettings} disabled={saving} className={`text-[9px] font-bold px-3 py-1 rounded-lg ${saved ? 'bg-green-500' : 'bg-yellow-500 text-black hover:scale-105 transition-all'}`}>
                        {saving ? "SAVING..." : saved ? "SAVED" : "SAVE"}
                    </button>
                </div>
                <div className="flex items-center justify-between gap-4">
                    <select value={lotSize} onChange={(e) => setLotSize(e.target.value)} className="flex-1 bg-[var(--background)] p-2 rounded-lg border border-[var(--border-color)] text-xs outline-none focus:border-yellow-500/50">
                        <option value="0.01">0.01 Lot</option>
                        <option value="0.05">0.05 Lot</option>
                        <option value="0.10">0.10 Lot</option>
                        <option value="0.50">0.50 Lot</option>
                        <option value="1.00">1.00 Lot</option>
                    </select>
                    <button onClick={handleToggle} className="p-2 bg-[var(--background)] rounded-lg border border-[var(--border-color)]">
                        {chartAiActive ? <ToggleRight className="text-[var(--color-success)] w-6 h-6" /> : <ToggleLeft className="text-[var(--text-muted)] w-6 h-6" />}
                    </button>
                </div>
            </div>
        </div>

        {/* Level 2: AI Vision / Signal Execution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* AI Vision Analysis Area */}
            <div className="lg:col-span-2 bg-[var(--panel-bg)] rounded-3xl border border-[var(--border-color)] overflow-hidden flex flex-col min-h-[500px]">
                <div className="p-6 border-b border-[var(--border-color)] bg-[var(--card-bg)] flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-3">
                            <ScanLine className="w-6 h-6 text-[var(--color-info)]" /> AI Visual Intelligence
                        </h2>
                        <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest mt-1">Upload chart screenshot for instant analysis</p>
                    </div>
                    {previewUrl && (
                        <button onClick={clearImage} className="p-2 hover:bg-red-500/10 text-[var(--text-muted)] hover:text-[var(--color-danger)] rounded-xl transition-all">
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                <div className="flex-1 p-6 flex flex-col gap-6 relative">
                    {!previewUrl ? (
                        <div className="flex-1 flex flex-col gap-4">
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 border-2 border-dashed border-[var(--border-color)] rounded-3xl flex flex-col items-center justify-center gap-4 hover:bg-[var(--panel-bg)] hover:border-blue-500/30 transition-all cursor-pointer group p-12 text-center"
                        >
                            <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center text-[var(--color-info)] group-hover:scale-110 transition-transform">
                                <ImageIcon className="w-10 h-10" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-[var(--foreground)]">Drop Chart Screenshot</h3>
                                <p className="text-xs text-[var(--text-muted)] mt-1">Supports PNG, JPG (e.g., TradingView charts)</p>
                            </div>
                            <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
                        </div>
                        {/* Disclaimer / Requirements */}
                        <div className="bg-yellow-500/5 border border-yellow-500/15 rounded-2xl p-4">
                            <div className="flex items-start gap-3">
                                <Shield className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest mb-2">Chart Requirements for Accurate Analysis</p>
                                    <ul className="text-[10px] text-[var(--text-muted)] space-y-1 leading-relaxed">
                                        <li>• <span className="text-[var(--foreground)] font-semibold">Visible candlesticks</span> — Ensure price action is clearly rendered, not cropped</li>
                                        <li>• <span className="text-[var(--foreground)] font-semibold">Timeframe label</span> — The chart timeframe (M15, H1, H4, D1) must be visible</li>
                                        <li>• <span className="text-[var(--foreground)] font-semibold">Pair / Asset name</span> — XAUUSD, EURUSD, BTCUSD, etc. should appear on the chart</li>
                                        <li>• <span className="text-[var(--foreground)] font-semibold">Key levels & markings</span> — Include any drawn support/resistance, FVGs, or OBs if applicable</li>
                                        <li>• <span className="text-[var(--foreground)] font-semibold">Clean screenshot</span> — Avoid cropping mid-candle or including unrelated UI elements</li>
                                    </ul>
                                    <p className="text-[9px] text-[var(--text-muted)] mt-2 italic">Non-chart images will be automatically rejected to preserve AI credit usage.</p>
                                </div>
                            </div>
                        </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                            <div className="relative rounded-2xl overflow-hidden border border-[var(--border-color)] bg-black aspect-video md:aspect-auto">
                                <img src={previewUrl} alt="Chart Preview" className="w-full h-full object-contain" />
                                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex justify-center">
                                    {!isAnalyzing && !analysisResult && (
                                        <button 
                                            onClick={handleAnalyzeChart}
                                            className="px-6 py-3 bg-blue-500 hover:bg-blue-400 text-[var(--foreground)] rounded-xl font-bold flex items-center gap-2 shadow-2xl hover:scale-105 transition-all outline-none"
                                        >
                                            <Cpu className="w-4 h-4" /> ANALYZE MARKET STRUCTURE
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            <div className="bg-[var(--panel-bg)] rounded-2xl border border-[var(--border-color)] flex flex-col overflow-hidden h-fit max-h-[500px]">
                                <div className="p-4 border-b border-[var(--border-color)] bg-[var(--card-bg)] flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Terminal className="w-4 h-4 text-[var(--color-success)]" />
                                        <span className="text-[10px] font-mono font-bold uppercase tracking-tighter">Analysis Terminal</span>
                                    </div>
                                    {!isVip && <span className="text-[9px] text-yellow-500 font-bold uppercase">{creditsRemaining} CREDITS LEFT</span>}
                                </div>
                                <div className="flex-1 p-6 font-mono text-[11px] leading-relaxed text-[var(--foreground)] overflow-y-auto custom-scrollbar bg-gradient-to-b from-[var(--background)] to-[var(--background)]">
                                    {isAnalyzing ? (
                                        <div className="flex flex-col items-center justify-center p-12 gap-4 text-[var(--color-info)]">
                                            <Loader2 className="w-8 h-8 animate-spin" />
                                            <span className="animate-pulse">DECODING PRICE ACTION...</span>
                                        </div>
                                    ) : analysisResult ? (
                                        <div className="space-y-4">
                                            <div className="space-y-1">
                                                {renderAnalysis(analysisResult)}
                                            </div>
                                            {lastImageUrl && !analysisResult.includes("VERIFICATION FAILED") && (
                                                <button 
                                                    onClick={handleShareToCommunity}
                                                    disabled={isSharing}
                                                    className="w-full py-3 bg-[var(--background)] border border-blue-500/30 text-blue-400 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-blue-500/10 transition-all flex items-center justify-center gap-2"
                                                >
                                                    {isSharing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                                    {isSharing ? "BROADCASTING..." : "SHARE TO COMMUNITY HUB"}
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-12 gap-2 text-[var(--text-muted)]">
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
            <div className="flex flex-col gap-4 h-full">
                <div className="bg-[var(--card-bg)] rounded-3xl border border-[var(--border-color)] p-6 flex flex-col flex-1 min-h-[300px] max-h-[500px]">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold flex items-center gap-2 text-[var(--foreground)]">
                                <Zap className="w-4 h-4 text-yellow-500" /> MT5 Autoentry Signals
                            </h3>
                            <div className="group relative">
                                <AlertCircle className="w-4 h-4 text-[var(--text-muted)] cursor-help" />
                                <div className="absolute left-0 bottom-full mb-2 w-64 p-4 bg-[var(--background)] border border-yellow-500/20 rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none text-xs leading-relaxed text-[var(--foreground)]">
                                    <p className="font-bold text-yellow-500 mb-2">INSTITUTIONAL PROTOCOL</p>
                                    <ul className="space-y-1">
                                        <li>• Split Volume Execution (3 Orders)</li>
                                        <li>• TP1 hit moves SL to Breakeven</li>
                                        <li>• Late entries after TP1 disabled</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                        {activeSignals.length === 0 ? (
                            <div className="py-16 flex flex-col items-center justify-center text-[var(--text-muted)] text-sm gap-3 opacity-30">
                                <Activity className="w-8 h-8" />
                                No pending signals.
                            </div>
                        ) : (
                            activeSignals.map(sig => {
                                const isTp1Passed = sig.tp1_hit || (sig.status?.includes("TP1")) || (sig.status?.includes("HIT"));
                                return (
                                    <div key={sig.id} className="bg-[var(--background)]/40 rounded-2xl border border-[var(--border-color)] p-4 relative overflow-hidden group hover:border-yellow-500/30 transition-all">
                                        <div className={`absolute top-0 left-0 w-1 h-full ${sig.direction === 'BUY' ? 'bg-green-500' : 'bg-red-500'}`} />
                                        
                                        {isTp1Passed && (
                                            <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] z-20 flex flex-col items-center justify-center text-center p-4">
                                                <Shield className="w-5 h-5 text-red-500 mb-1" />
                                                <p className="text-[var(--color-danger)] font-bold text-[9px] uppercase tracking-tighter">Opportunity Passed</p>
                                            </div>
                                        )}

                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <span className="text-lg font-bold font-mono tracking-wider">{sig.pair}</span>
                                                <div className="text-[9px] text-[var(--text-muted)] uppercase font-bold tracking-widest mt-1">
                                                    <span className={sig.direction === 'BUY' ? 'text-green-500' : 'text-red-500'}>{sig.direction}</span> • ENTRY @ {sig.entry}
                                                </div>
                                            </div>
                                        </div>
                                        {!isTp1Passed && (
                                            <button 
                                                onClick={() => handleExecuteSignal(sig)} 
                                                disabled={executingId === sig.id}
                                                className={`w-full py-3 rounded-xl font-bold text-[10px] transition-all flex items-center justify-center gap-2 ${executingId === sig.id ? 'bg-[var(--card-bg)] text-[var(--text-muted)]' : 'bg-[var(--panel-bg)] hover:bg-yellow-500 hover:text-black border border-[var(--border-color)] group-hover:border-yellow-500/50'}`}
                                            >
                                                {executingId === sig.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                                                {executingId === sig.id ? "THINKING..." : "EXECUTE"}
                                            </button>
                                        )}
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
                
                {/* Network Feed Small */}
                <div className="bg-[var(--panel-bg)] rounded-3xl border border-[var(--border-color)] p-6 h-[180px] overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Network Feed</span>
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    </div>
                    <div className="space-y-2 overflow-y-hidden">
                         {activityEvents.slice(0, 3).map((evt, i) => (
                              <div key={i} className="text-[10px] font-mono text-[var(--text-muted)] border-l border-[var(--border-color)] pl-3 py-1">
                                  <span className={evt.color}>{evt.text}</span>
                              </div>
                         ))}
                    </div>
                </div>
            </div>
        </div>

        {/* Level 3: Institutional Protocol */}
        <div className="bg-gradient-to-br from-[var(--card-bg)] to-[var(--background)] p-10 rounded-3xl border border-blue-500/10 shadow-2xl">
            <h3 className="text-xl font-bold mb-8 flex items-center gap-3 text-[var(--foreground)]"><Shield className="w-6 h-6 text-[var(--color-info)]" /> Institutional Protocol (1:1/1:2/1:3)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                {[
                    { phase: "PHASE 1", rr: "1:1 RR", desc: "Initial Draw. Stop Loss moves to Breakeven." },
                    { phase: "PHASE 2", rr: "1:2 RR", desc: "Partial TP. 50% Volume Liquidated." },
                    { phase: "PHASE 3", rr: "1:3 RR", desc: "Full Extraction. 100% Volume Liquidated." }
                ].map((item, i) => (
                    <div key={i} className="p-6 rounded-2xl bg-[var(--background)]/50 border border-[var(--border-color)]">
                        <div className="text-[var(--color-info)] font-bold text-[10px] tracking-widest mb-1">{item.phase}</div>
                        <div className="text-2xl font-black text-[var(--foreground)] mb-2">{item.rr}</div>
                        <p className="text-[10px] text-[var(--text-muted)] leading-relaxed uppercase">{item.desc}</p>
                    </div>
                ))}
            </div>
        </div>

        {/* Level 4: Analysis History */}
        <div className="bg-[var(--panel-bg)] rounded-3xl border border-[var(--border-color)] p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-3 text-[var(--foreground)]">
                        <FileText className="w-6 h-6 text-[var(--color-info)]" /> Institutional History
                    </h3>
                    <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest mt-1">Archived SMC Markups & Analysis</p>
                </div>
                {history.length > 0 && <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-[10px] font-bold uppercase">{history.length} RECORDS</span>}
            </div>

            {loadingHistory ? (
                <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
            ) : history.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-[var(--text-muted)] gap-4 opacity-30 border-2 border-dashed border-[var(--border-color)] rounded-3xl">
                    <ImageIcon className="w-12 h-12" />
                    <p className="font-bold text-sm uppercase">No archived markups found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {history.map((item) => (
                        <div key={item.id} className="group relative bg-[var(--background)]/40 rounded-2xl border border-[var(--border-color)] overflow-hidden hover:border-blue-500/30 transition-all">
                            <div className="aspect-video relative overflow-hidden bg-black">
                                <img src={item.image_url} alt={item.pair} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 flex flex-col justify-end">
                                    <div className="text-xs font-bold text-white mb-1 uppercase tracking-tighter italic">{item.pair}</div>
                                    <div className="flex items-center justify-between">
                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${item.verdict === 'BUY' ? 'bg-green-500/20 text-green-500' : item.verdict === 'SELL' ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'}`}>
                                            {item.verdict}
                                        </span >
                                        <span className="text-[8px] text-white/40 uppercase font-bold">{new Date(item.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4">
                                <button 
                                    onClick={() => { setAnalysisResult(item.analysis_text); setPreviewUrl(item.image_url); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                    className="w-full py-2 bg-[var(--panel-bg)] hover:bg-blue-500 hover:text-black rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all"
                                >
                                    RECALL DATA
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  )
}
