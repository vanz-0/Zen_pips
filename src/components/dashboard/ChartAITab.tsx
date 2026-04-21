"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Cpu, Zap, Shield, Activity, Settings, Loader2, ImageIcon, FileText, Send, AlertCircle, X, Terminal } from "lucide-react"
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
  const [isVip, setIsVip] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [executingId, setExecutingId] = useState<string | null>(null)
  
  // Chart Analysis States
  const [analysisMode, setAnalysisMode] = useState<'upload' | 'live' | 'link'>('upload')
  const [selectedPair, setSelectedPair] = useState("OANDA:EURUSD")
  const [customLink, setCustomLink] = useState("")
  
  const CORE_PAIRS = [
    { label: "Bitcoin (BTC/USDT)", value: "BINANCE:BTCUSDT" },
    { label: "Ethereum (ETH/USDT)", value: "BINANCE:ETHUSDT" },
    { label: "Euro (EUR/USD)", value: "OANDA:EURUSD" },
    { label: "Pound (GBP/USD)", value: "OANDA:GBPUSD" },
    { label: "Gold (XAU/USD)", value: "OANDA:XAUUSD" },
    { label: "Silver (XAG/USD)", value: "OANDA:XAGUSD" },
    { label: "Nasdaq 100", value: "OANDA:NAS100USD" },
    { label: "S&P 500", value: "OANDA:SPX500USD" },
    { label: "UK 100", value: "OANDA:UK100GBP" },
    { label: "Solana (SOL/USDT)", value: "BINANCE:SOLUSDT" },
    { label: "Ripple (XRP/USDT)", value: "BINANCE:XRPUSDT" },
  ]

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [lastImageUrl, setLastImageUrl] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [showLotConfirm, setShowLotConfirm] = useState<any>(null)
  const [blackout, setBlackout] = useState<{ isBlackout: boolean, reason: string }>({ isBlackout: false, reason: "" })
  const [showNewsDetail, setShowNewsDetail] = useState(false)

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
      setIsVip(data.is_vip || data.plan === 'VIP')
      setIsAdmin(data.is_admin)
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
    fetch('/api/news').then(res => res.json()).then(data => {
      if (data?.activeBlackout?.isBlackout) {
        setBlackout({ isBlackout: true, reason: data.activeBlackout.reason || "News Event" })
      }
    }).catch(err => console.log(err))
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
    
    const dailyLimit = 10 + (profile?.bonus_credits || 0)
    const isVipUser = profile?.is_vip || profile?.plan === 'VIP' || isAdmin
    if (!isVipUser && (profile?.ai_usage_total || 0) >= dailyLimit) {
      setAnalysisResult("🔴 LIMIT REACHED: You have used your daily AI credits. Upgrade to VIP or complete social tasks to unlock more.")
      return
    }

    setIsAnalyzing(true)
    setAnalysisResult(null)

    try {
      const reader = new FileReader()
      const base64Promise = new Promise<string>((resolve) => {
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
          fetchHistory()
        }
        fetchProfile()
      } else {
        setAnalysisResult(data.message || "AI Analysis failed. System offline or image too large.")
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
      if (analysisMode === 'live') {
        const pairSimple = selectedPair.split(':')[1] || selectedPair;
        await supabase.from('community_messages')
           .delete()
           .eq('channel', 'setups-and-charts')
           .ilike('content', `%[${pairSimple}]%`)
      }

      const tag = analysisMode === 'live' ? `[${selectedPair.split(':')[1] || selectedPair}] ` : '';
      const targetChannel = isAdmin ? 'setups-and-charts' : 'pending-setups';
      const { error } = await supabase.from('community_messages').insert({
        user_id: user.id,
        content: `🎯 AI ANALYSIS SHARED:\n\n${tag}${analysisResult.split('### 4. Verdict:')[0].trim()}`,
        image: lastImageUrl,
        channel: targetChannel
      })

      if (!error) {
        if (isAdmin) {
          alert("🚀 SHARED: Your analysis has been broadcast to the community hub.")
        } else {
          alert("✅ SUBMITTED: Your analysis has been sent to the Admin team for review. It will appear in the community feed once approved.")
        }
      }
    } catch (e) {
      console.error("Sharing error:", e)
    } finally {
      setIsSharing(false)
    }
  }

  const clearImage = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setAnalysisResult(null)
    setCustomLink("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleExecuteSignal = async (sig: Signal) => {
    // Risk gate: Confirm high lot sizes
    if (parseFloat(lotSize) > 0.1 && !showLotConfirm) {
      setShowLotConfirm(sig)
      return
    }

    setExecutingId(sig.id)
    setShowLotConfirm(null)

    // 1. Insert into copy_events (Pickable by local Python bridge)
    const { data: req, error: insError } = await supabase.from('copy_events').insert({
      signal_id: sig.id,
      subscriber_id: user?.id,
      status: 'PENDING',
      mt5_account_id: profile?.mt5_account_id,
      lot_size: parseFloat(lotSize)
    }).select().single()

    if (insError) {
      console.error("Signal insertion error:", insError);
      alert(`❌ FAILED: Could not transmit signal. ${insError.message || ""}`)
      setExecutingId(null)
      return
    }

    // 2. Head-start for Python bridge (3 seconds)
    console.log("[MT5] Waiting for local bridge head-start...");
    await new RegExp('', '').exec('') // dummy wait or just use setTimeout
    
    // Better: use a small delay before triggering cloud fallback
    setTimeout(async () => {
      // Check if already processed by Python
      const { data: current } = await supabase.from('copy_events').select('status').eq('id', req.id).single()
      
      if (current?.status === 'PENDING') {
        console.log("[MT5] No local pick-up. Triggering MetaAPI Cloud Fallback...");
        try {
          const cloudRes = await fetch('/api/mt5-execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              signal_id: sig.id,
              pair: sig.pair,
              direction: sig.direction,
              entry: sig.entry,
              sl: sig.sl,
              tp: sig.tp1, // Defaulting to TP1 for the order
              lot_size: lotSize
            })
          });
          const cloudData = await cloudRes.json();
          if (!cloudRes.ok) throw new Error(cloudData.error || 'Execution failed');
        } catch (err: any) {
          console.error("[Fallback Failed]", err);
        }
      }
    }, 3000);

    // 3. Status Polling (Watcher for both Python & Cloud)
    let attempts = 0
    const pollInterval = setInterval(async () => {
      attempts++
      const { data: update } = await supabase
        .from('copy_events')
        .select('*')
        .eq('id', req.id)
        .single()

      if (update?.status === 'SUCCESS') {
        clearInterval(pollInterval)
        setExecutingId(null)
        alert(`✅ SIGNAL EXECUTED: ${sig.pair} order successfully placed (Ticket: ${update.mt5_ticket}).`)
      } else if (update?.status === 'FAILED') {
        clearInterval(pollInterval)
        setExecutingId(null)
        alert(`❌ MT5 ERROR: ${update.error_message || "Terminal configuration error."}`)
      } else if (attempts > 30) { // Extended to 30s to allow for cloud cold-start
        clearInterval(pollInterval)
        setExecutingId(null)
        alert(`⚠️ BRIDGE TIMEOUT: Signal transmission pending. Check MT5 terminal.`)
      }
    }, 1000)
  }

  const renderAnalysis = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold text-blue-400 mt-6 mb-3 uppercase tracking-tighter italic">{line.replace('## ', '')}</h2>
      if (line.startsWith('### ')) return <h3 key={i} className="text-md font-bold text-white mt-4 mb-2 uppercase tracking-wide border-l-2 border-blue-500 pl-3">{line.replace('### ', '')}</h3>
      if (line.startsWith('- **')) {
        const [title, desc] = line.split(': ')
        return (
          <div key={i} className="mb-2 text-[12px] leading-relaxed">
            <span className="text-blue-400 font-bold">{title.replace('- **', '').replace('**', '')}</span>: 
            <span className="text-gray-400 ml-1">{desc}</span>
          </div>
        )
      }
      if (line.includes('Institutional Recommendation:')) {
        const isSell = line.includes('SELL')
        const isBuy = line.includes('BUY')
        return (
          <div key={i} className={`my-6 p-4 rounded-xl border font-bold text-center uppercase tracking-widest ${isSell ? 'bg-red-500/10 border-red-500/30 text-red-500' : isBuy ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-blue-500/10 border-blue-500/30 text-blue-400'}`}>
            {line}
          </div>
        )
      }
      return <p key={i} className="text-[11px] text-gray-400 leading-relaxed mb-1">{line}</p>
    })
  }

  if (authLoading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-yellow-500" /></div>
  if (!user) return (
    <div className="flex flex-col items-center justify-center py-24 gap-6">
      <Cpu className="w-16 h-16 text-yellow-500/30" />
      <h2 className="text-2xl font-bold text-white">Chart AI Access Required</h2>
      <button onClick={() => router.push("/auth")} className="bg-yellow-500 text-black px-8 py-3 rounded-xl font-bold">Log In</button>
    </div>
  )

  const activeSignals = signals.filter(s => !s.closed)
  const usageCount = profile?.ai_usage_total || 0
  const dailyLimit = 10 + (profile?.bonus_credits || 0)
  const creditsRemaining = dailyLimit - usageCount
  const chartAiActiveStatus = profile?.chart_ai_active || false

  return (
    <div className="w-full text-white py-12 font-[family-name:var(--font-outfit)]">
      <div className="max-w-6xl mx-auto space-y-8 px-4">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-[#d4af37] bg-clip-text text-transparent flex items-center gap-3 font-[family-name:var(--font-outfit)]">
              <Cpu className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-blue-400" /> Chart AI
            </h1>
            <p className="text-gray-400 mt-2 text-sm sm:text-base md:text-lg leading-relaxed">Professional trade copier, providing AI-Driven Signal Entry Validation and Deep Character Analysis / Markups.</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-4 bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                <div className={`w-3 h-3 rounded-full ${chartAiActiveStatus ? "bg-green-500 shadow-[0_0_10px_green]" : "bg-red-500"}`} />
                <span className={`text-sm font-bold ${chartAiActiveStatus ? "text-green-500" : "text-red-500"}`}>
                {chartAiActiveStatus ? "CLIENT CONNECTED" : "CLIENT DISCONNECTED"}
                </span>
            </div>
          </div>
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Mode Toggle */}
            <div className="flex bg-zinc-900 rounded-xl p-1 border border-zinc-800 mb-6 font-[family-name:var(--font-outfit)]">
              <button onClick={() => { setAnalysisMode('upload'); clearImage(); }} className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${analysisMode === 'upload' ? 'bg-blue-500 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>Image Upload</button>
              <button onClick={() => { setAnalysisMode('live'); clearImage(); }} className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${analysisMode === 'live' ? 'bg-blue-500 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>Live Chart</button>
              <button onClick={() => { setAnalysisMode('link'); clearImage(); }} className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${analysisMode === 'link' ? 'bg-blue-500 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>Published Link</button>
            </div>

            {!previewUrl ? (
              <div className="space-y-6">
                {analysisMode === 'upload' && (
                  <div 
                    className="bg-zinc-900 border-2 border-dashed border-zinc-800 rounded-3xl p-12 text-center flex flex-col items-center gap-6 hover:border-blue-500/50 transition-all cursor-pointer group"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-all">
                      <ImageIcon className="w-10 h-10 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg md:text-xl font-bold mb-2">Upload Analysis Chart</h3>
                      <p className="text-gray-400 text-sm max-w-sm mx-auto">Drag & drop or click to select a screenshot of your SMC or price action analysis.</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="px-4 py-2 bg-black border border-zinc-800 rounded-xl text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                        PNG/JPG SUPPORTED
                      </div>
                    </div>
                  </div>
                )}

                {analysisMode === 'live' && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6">
                     <h3 className="text-xl font-bold">Select Live Asset</h3>
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                       {CORE_PAIRS.map(pair => (
                         <button 
                           key={pair.value}
                           onClick={() => setSelectedPair(pair.value)}
                           className={`p-4 rounded-xl border text-sm font-bold transition-all ${selectedPair === pair.value ? 'bg-blue-500/10 border-blue-500 text-blue-400' : 'bg-black/40 border-zinc-800 text-zinc-400 hover:border-zinc-600'}`}
                         >
                           {pair.label}
                         </button>
                       ))}
                     </div>
                     <button
                        onClick={() => {
                            setAnalysisResult("⏳ SYSTEM: The Browser Subagent has been queued. Please ask the AI agent to extract and analyze the live chart for " + (selectedPair.split(':')[1] || selectedPair) + " in your dialog.")
                            setPreviewUrl(`live:${selectedPair}`)
                        }}
                        className="w-full py-4 bg-blue-500 text-white rounded-xl font-bold uppercase tracking-widest flex justify-center items-center gap-2 hover:bg-blue-400 shadow-lg shadow-blue-500/20"
                     >
                        <Cpu className="w-5 h-5"/> Fetch Live Data
                     </button>
                  </div>
                )}

                {analysisMode === 'link' && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6">
                     <h3 className="text-xl font-bold">TradingView Public Link</h3>
                     <p className="text-sm text-zinc-400">Paste your published markup link to sync with your dashboard.</p>
                     <input 
                       type="text" 
                       value={customLink}
                       onChange={e => setCustomLink(e.target.value)}
                       placeholder="https://www.tradingview.com/chart/..."
                       className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-white focus:outline-none focus:border-blue-500"
                     />
                     <button
                        onClick={() => {
                            if(!customLink) return;
                            setAnalysisResult("⏳ SYSTEM: Custom URL fetched. Please ask the AI agent to analyze this URL in your dialog.")
                            setPreviewUrl(`link:${customLink}`)
                        }}
                        className="w-full py-4 bg-blue-500 text-white rounded-xl font-bold uppercase tracking-widest flex justify-center items-center gap-2 hover:bg-blue-400 shadow-lg shadow-blue-500/20"
                     >
                        <Cpu className="w-5 h-5"/> Extract Markup Data
                     </button>
                  </div>
                )}

                <div className="bg-yellow-500/5 border border-yellow-500/15 rounded-2xl p-4 mt-6">
                  <div className="flex items-start gap-3">
                    <Shield className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest mb-2">Chart Requirements</p>
                      <ul className="text-[10px] text-gray-400 space-y-1 leading-relaxed">
                        <li>• Visible candlesticks — Ensure price action is clearly rendered</li>
                        <li>• Timeframe label — (M15, H1, H4, D1) must be visible</li>
                        <li>• Pair / Asset name — XAUUSD, EURUSD, etc. should appear</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-black aspect-video md:aspect-auto min-h-[400px]">
                  {previewUrl?.startsWith('live:') ? (
                    <iframe src={`https://s.tradingview.com/widgetembed/?symbol=${previewUrl.replace('live:', '')}&interval=H1&theme=dark`} className="w-full h-full min-h-[400px]" frameBorder="0"></iframe>
                  ) : previewUrl?.startsWith('link:') ? (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-4 p-8 text-center min-h-[400px]">
                       <FileText className="w-16 h-16 opacity-50" />
                       <span className="text-xs break-all bg-black border border-zinc-800 p-2 rounded-lg">{previewUrl.replace('link:', '')}</span>
                    </div>
                  ) : (
                    <img src={previewUrl || ''} alt="Chart Preview" className="w-full h-full object-contain min-h-[400px]" />
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex justify-center">
                    {!isAnalyzing && !analysisResult && analysisMode === 'upload' && (
                      <button 
                        onClick={handleAnalyzeChart}
                        className="px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white rounded-xl font-bold flex items-center gap-2 shadow-2xl hover:scale-105 transition-all outline-none"
                      >
                        <Cpu className="w-4 h-4" /> ANALYZE MARKET
                      </button>
                    )}
                    {analysisResult && (
                      <button 
                        onClick={clearImage}
                        className="px-6 py-3 bg-red-500/20 border border-red-500/30 text-red-500 rounded-xl font-bold flex items-center gap-2 hover:bg-red-500/30 transition-all outline-none"
                      >
                        <X className="w-4 h-4" /> CLEAR
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="bg-zinc-900 rounded-2xl border border-zinc-800 flex flex-col overflow-hidden h-full max-h-[600px]">
                  <div className="p-4 border-b border-zinc-800 bg-black/40 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-green-500" />
                      <span className="text-[10px] font-mono font-bold uppercase tracking-tighter">Terminal</span>
                    </div>
                    {!isVip && <span className="text-[9px] text-yellow-500 font-bold uppercase">{creditsRemaining} CREDITS</span>}
                  </div>
                  <div className="flex-1 p-6 font-mono text-[11px] leading-relaxed text-white overflow-y-auto custom-scrollbar bg-black">
                    {isAnalyzing ? (
                      <div className="flex flex-col items-center justify-center p-12 gap-4 text-blue-400">
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
                            className="w-full py-3 bg-black border border-blue-500/30 text-blue-400 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-blue-500/10 transition-all flex items-center justify-center gap-2"
                          >
                            {isSharing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                            {isSharing ? "BROADCASTING..." : "SHARE TO COMMUNITY"}
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-12 gap-2 text-gray-500">
                        <AlertCircle className="w-6 h-6 opacity-30" />
                        <span>READY FOR SCAN</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 h-full max-h-[700px]">
            <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-6 flex flex-col h-full min-h-[300px] overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2 text-white relative">
                  <Zap className="w-4 h-4 text-yellow-500" /> Signals
                  {blackout.isBlackout && (
                    <div className="relative ml-2 z-[60]">
                       <button onClick={() => setShowNewsDetail(!showNewsDetail)} className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)] cursor-pointer border border-red-400" title="News Analysis Post" />
                       {showNewsDetail && (
                          <div className="absolute top-full left-0 mt-2 w-64 bg-zinc-900 border border-red-500/30 rounded-xl p-4 shadow-2xl z-50 animate-in fade-in zoom-in duration-200">
                             <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-2 border-b border-red-500/20 pb-2">News Analysis Post</p>
                             <p className="text-[11px] text-zinc-300 leading-relaxed font-mono">High impact activity: {blackout.reason}.<br/><br/>Execution paused 30m before and 1hr after. See community feed for full AI educational insight.</p>
                          </div>
                       )}
                    </div>
                  )}
                </h3>
                
                {/* Lot Size Controller */}
                <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-zinc-800">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Lot</span>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0.01"
                    value={lotSize}
                    onChange={(e) => setLotSize(e.target.value)}
                    className="w-16 bg-transparent text-white font-mono text-xs font-bold focus:outline-none border-b border-zinc-700 focus:border-yellow-500"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {activeSignals.length === 0 ? (
                  <div className="py-16 flex flex-col items-center justify-center text-gray-500 text-sm gap-3 opacity-30">
                    No signals.
                  </div>
                ) : (
                  activeSignals.map((sig: any) => {
                    const isTpPassed = sig.tp1_hit || sig.status?.includes("HIT") || sig.status?.includes("TP")
                    return (
                        <div key={sig.id} className="bg-black/40 rounded-2xl border border-zinc-800 p-4 relative overflow-hidden group hover:border-yellow-500/30 transition-all">
                            <div className={`absolute top-0 left-0 w-1 h-full ${sig.direction === 'BUY' ? 'bg-green-500' : 'bg-red-500'}`} />
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <span className="text-lg font-bold font-mono tracking-wider">{sig.pair}</span>
                                    <div className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mt-1">
                                        <span className={sig.direction === 'BUY' ? 'text-green-500' : 'text-red-500'}>{sig.direction}</span> • ENTRY @ {sig.entry}
                                    </div>
                                </div>
                            </div>
                            {!isTpPassed && (
                                <div className="space-y-2 mt-2">
                                  <button 
                                      onClick={() => handleExecuteSignal(sig)} 
                                      disabled={executingId === sig.id}
                                      className={`w-full py-3 rounded-xl font-bold text-[10px] transition-all flex items-center justify-center gap-2 ${executingId === sig.id ? 'bg-zinc-800 text-zinc-500' : 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500 hover:text-black border border-yellow-500/30'}`}
                                  >
                                      {executingId === sig.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                                      EXECUTE ON MT5
                                  </button>
                                  <button 
                                      onClick={() => {
                                        const text = `🎯 **ZEN PIPS SETUP**\nPair: ${sig.pair}\nDirection: ${sig.direction}\nEntry: ${sig.entry}\nSL: ${sig.sl}\nTP1: ${sig.tp1}`
                                        navigator.clipboard.writeText(text)
                                        alert("Copied to clipboard!")
                                      }} 
                                      className="w-full py-3 rounded-xl font-bold text-[10px] bg-zinc-800 hover:bg-blue-500 hover:text-white border border-zinc-700 transition-all flex items-center justify-center gap-2"
                                  >
                                      <FileText className="w-3 h-3" />
                                      COPY SETUP
                                  </button>
                                </div>
                            )}
                        </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          {/* Risk Confirmation Modal */}
          {showLotConfirm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl">
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="text-xl font-bold text-white uppercase italic tracking-tighter">High Risk Warning</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    Executing with <span className="text-white font-bold">{lotSize} lots</span> exceeds standard safety parameters for small accounts. Confirm adherence to institutional risk protocols?
                  </p>
                  <div className="flex gap-3 w-full mt-4">
                    <button 
                      onClick={() => setShowLotConfirm(null)}
                      className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold text-xs transition-all"
                    >
                      CANCEL
                    </button>
                    <button 
                      onClick={() => handleExecuteSignal(showLotConfirm)}
                      className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-xs transition-all shadow-lg shadow-red-600/20"
                    >
                      CONFIRM RISK
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
