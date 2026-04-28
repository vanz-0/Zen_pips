"use client"

import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { supabase } from "@/lib/supabase"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, X, CheckCircle2, AlertCircle, Loader2, Crosshair, TrendingUp, TrendingDown, Clock, Users, Shield, Zap } from "lucide-react"

export default function ChartUploader() {
    const { profile, user } = useAuth()
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)
    const [aiChecking, setAiChecking] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [pair, setPair] = useState("XAUUSD")
    const [direction, setDirection] = useState<"BUY" | "SELL">("BUY")
    const [entry, setEntry] = useState("")
    const [sl, setSl] = useState("")
    const [lotSize, setLotSize] = useState("0.01")
    const [expiryHours, setExpiryHours] = useState("24")

    const [tp1, setTp1] = useState("")
    const [tp2, setTp2] = useState("")
    const [tp3, setTp3] = useState("")

    const [targetAccounts, setTargetAccounts] = useState<string[]>(["25113210"])

    const ACCOUNTS = [
        { id: "25113210", label: "Master", icon: "👑" },
        { id: "25131564", label: "Slave 1", icon: "1" },
        { id: "25131567", label: "Slave 2", icon: "2" },
        { id: "25131577", label: "Slave 3", icon: "3" },
        { id: "25131572", label: "Slave 4", icon: "4" }
    ]

    const PAIRS = [
        { label: "Gold (XAU/USD)", value: "XAUUSD" },
        { label: "Silver (XAG/USD)", value: "XAGUSD" },
        { label: "EUR/USD", value: "EURUSD" },
        { label: "GBP/USD", value: "GBPUSD" },
        { label: "EUR/GBP", value: "EURGBP" },
        { label: "AUD/USD", value: "AUDUSD" },
        { label: "USD/CHF", value: "USDCHF" },
        { label: "USD/CAD", value: "USDCAD" },
        { label: "S&P 500", value: "SPX500" },
        { label: "NASDAQ 100", value: "NAS100" },
        { label: "UK 100", value: "UK100" },
        { label: "BTC/USD", value: "BTCUSD" },
        { label: "ETH/USD", value: "ETHUSD" },
        { label: "SOL/USD", value: "SOLUSD" },
        { label: "XRP/USD", value: "XRPUSD" }
    ]

    useEffect(() => {
        if (entry && sl) {
            const e = parseFloat(entry)
            const s = parseFloat(sl)
            if (!isNaN(e) && !isNaN(s) && e !== s) {
                const diff = Math.abs(e - s)
                // Determine decimal precision from entry
                const decimals = entry.includes('.') ? entry.split('.')[1]?.length || 2 : 2
                if (direction === "BUY") {
                    setTp1((e + diff).toFixed(decimals))
                    setTp2((e + diff * 2).toFixed(decimals))
                    setTp3((e + diff * 3).toFixed(decimals))
                } else {
                    setTp1((e - diff).toFixed(decimals))
                    setTp2((e - diff * 2).toFixed(decimals))
                    setTp3((e - diff * 3).toFixed(decimals))
                }
            }
        } else {
            setTp1("")
            setTp2("")
            setTp3("")
        }
    }, [entry, sl, direction])

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0]
        if (selected) {
            if (!selected.type.startsWith('image/')) {
                setStatus({ type: 'error', message: "Please select an image file." })
                return
            }
            setFile(selected)
            const reader = new FileReader()
            reader.onloadend = () => setPreview(reader.result as string)
            reader.readAsDataURL(selected)
            setStatus(null)
        }
    }

    const validateChartWithAI = async (imageData: string): Promise<{ valid: boolean; reason: string; extracted?: any }> => {
        setAiChecking(true)
        try {
            const res = await fetch('/api/analyze-chart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: imageData, mode: 'verify_only', userId: user?.id })
            })
            const data = await res.json()
            if (data.isChart) {
                return { valid: true, reason: "", extracted: data.extractedData }
            }
            return { valid: false, reason: data.reason || "The AI could not confirm this is a valid trading chart." }
        } catch (err) {
            console.error("AI Validation failed:", err)
            return { valid: false, reason: "AI verification service is unavailable. Please try again shortly." }
        } finally {
            setAiChecking(false)
        }
    }

    const handleAIScan = async () => {
        if (!preview) return
        setStatus(null)
        const result = await validateChartWithAI(preview)
        if (result.valid && result.extracted) {
            const ext = result.extracted
            if (ext.pair) setPair(ext.pair.replace('/', '').toUpperCase())
            if (ext.direction) setDirection(ext.direction.toUpperCase() as "BUY" | "SELL")
            if (ext.entry) setEntry(ext.entry.toString())
            if (ext.sl) setSl(ext.sl.toString())
            if (ext.tp1) setTp1(ext.tp1.toString())
            if (ext.tp2) setTp2(ext.tp2.toString())
            if (ext.tp3) setTp3(ext.tp3.toString())
            setStatus({ type: 'success', message: "✨ AI Magic Scan complete! Fields populated." })
        } else if (!result.valid) {
            setStatus({ type: 'error', message: `⛔ Scan Failed: ${result.reason}` })
        }
    }

    const toggleAccount = (id: string) => {
        setTargetAccounts(prev =>
            prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
        )
    }

    const selectAllAccounts = () => {
        if (targetAccounts.length === ACCOUNTS.length) {
            setTargetAccounts(["25113210"])
        } else {
            setTargetAccounts(ACCOUNTS.map(a => a.id))
        }
    }

    const handleUpload = async () => {
        if (!file || !preview) {
            setStatus({ type: 'error', message: "Please upload a chart image." })
            return
        }
        if (!pair || !entry || !sl || targetAccounts.length === 0) {
            setStatus({ type: 'error', message: "Please fill all required fields and select at least one account." })
            return
        }

        setUploading(true)
        setStatus(null)

        const verification = await validateChartWithAI(preview)
        if (!verification.valid) {
            setStatus({
                type: 'error',
                message: `⛔ Chart Rejected: ${verification.reason}`
            })
            setUploading(false)
            return
        }

        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
            const monthYear = new Date().toISOString().substring(0, 7)
            const filePath = `${monthYear}/${fileName}`

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('signal_charts')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage.from('signal_charts').getPublicUrl(filePath)

            const { data: signalData, error: signalError } = await supabase.from('signals').insert({
                pair,
                ticker: pair.replace('/', ''),
                direction,
                entry: parseFloat(entry),
                sl: parseFloat(sl),
                current_sl: parseFloat(sl),
                tp1: parseFloat(tp1),
                tp2: parseFloat(tp2),
                tp3: parseFloat(tp3),
                status: 'ACTIVE',
                timeframe: '15m',
                source: 'institutional',
                image_url: publicUrl,
                target_accounts: targetAccounts,
                lot_size: parseFloat(lotSize),
                expiry_hours: parseInt(expiryHours)
            }).select().single()

            if (signalError) throw signalError

            const copyEvents = targetAccounts.map(acc => ({
                signal_id: signalData.id,
                mt5_account_id: acc,
                status: 'PENDING',
                lot_size: parseFloat(lotSize)
            }))

            const { error: copyError } = await supabase.from('copy_events').insert(copyEvents)
            if (copyError) throw copyError

            const { error: dbError } = await supabase.from('community_messages').insert({
                user_id: user?.id,
                content: `🚀 **Institutional ${direction} Setup on ${pair}**\n\nEntry: ${entry}\nSL: ${sl}\nTP1: ${tp1}\nTP2: ${tp2}\nTP3: ${tp3}\n\nA new institutional chart has been broadcasted to the network. Stay sharp.`,
                image: publicUrl,
                channel: 'setups-and-charts'
            })

            if (dbError) throw dbError

            setStatus({ type: 'success', message: "Signal dispatched to fleet successfully!" })
            setFile(null)
            setPreview(null)
            setEntry("")
            setSl("")
        } catch (error: any) {
            setStatus({ type: 'error', message: error.message || "Broadcast failed." })
        } finally {
            setUploading(false)
        }
    }

    const riskPips = entry && sl ? Math.abs(parseFloat(entry) - parseFloat(sl)) : 0

    return (
        <div className="space-y-6">
            {/* ── Section 1: Trade Setup ── */}
            <div className="bg-[#0a0a0a] rounded-2xl border border-white/[0.06] overflow-hidden">
                <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                        <Crosshair className="w-4 h-4 text-yellow-500" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white tracking-wide">Trade Setup</h3>
                        <p className="text-[10px] text-neutral-500 uppercase tracking-widest">Entry Parameters</p>
                    </div>
                </div>

                <div className="p-6 space-y-5">
                    {/* Row 1: Pair + Direction */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="text-[11px] text-neutral-500 font-semibold uppercase tracking-wider mb-2 block">
                                Asset Pair
                            </label>
                            <select
                                value={pair}
                                onChange={e => setPair(e.target.value)}
                                className="w-full bg-[#111] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm font-mono focus:border-yellow-500/40 outline-none transition-all cursor-pointer [color-scheme:dark]"
                            >
                                {PAIRS.map(p => (
                                    <option key={p.value} value={p.value} className="bg-[#111] text-white">{p.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label className="text-[11px] text-neutral-500 font-semibold uppercase tracking-wider mb-2 block">
                                Direction
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setDirection('BUY')}
                                    className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all border ${
                                        direction === 'BUY'
                                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                                            : 'bg-white/[0.02] border-white/[0.06] text-neutral-500 hover:text-neutral-300 hover:border-white/[0.12]'
                                    }`}
                                >
                                    <TrendingUp className="w-4 h-4" />
                                    BUY LONG
                                </button>
                                <button
                                    onClick={() => setDirection('SELL')}
                                    className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all border ${
                                        direction === 'SELL'
                                            ? 'bg-red-500/15 border-red-500/40 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.1)]'
                                            : 'bg-white/[0.02] border-white/[0.06] text-neutral-500 hover:text-neutral-300 hover:border-white/[0.12]'
                                    }`}
                                >
                                    <TrendingDown className="w-4 h-4" />
                                    SELL SHORT
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Entry + SL */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[11px] text-neutral-500 font-semibold uppercase tracking-wider mb-2 block">
                                Entry Price
                            </label>
                            <input
                                type="number"
                                step="any"
                                value={entry}
                                onChange={e => setEntry(e.target.value)}
                                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm font-mono focus:border-yellow-500/40 focus:bg-yellow-500/[0.02] outline-none transition-all"
                                placeholder="0.00000"
                            />
                        </div>
                        <div>
                            <label className="text-[11px] text-neutral-500 font-semibold uppercase tracking-wider mb-2 block">
                                Stop Loss
                            </label>
                            <input
                                type="number"
                                step="any"
                                value={sl}
                                onChange={e => setSl(e.target.value)}
                                className="w-full bg-white/[0.04] border border-red-500/20 rounded-xl px-4 py-3 text-white text-sm font-mono focus:border-red-500/40 focus:bg-red-500/[0.02] outline-none transition-all"
                                placeholder="0.00000"
                            />
                        </div>
                    </div>

                    {/* Row 3: Auto Targets */}
                    <div className="bg-white/[0.02] rounded-xl border border-white/[0.05] p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Zap className="w-3.5 h-3.5 text-yellow-500" />
                                <span className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider">
                                    Auto Targets (1:1 · 1:2 · 1:3 RR)
                                </span>
                            </div>
                            {riskPips > 0 && (
                                <span className="text-[10px] text-neutral-600 font-mono">
                                    Risk: {riskPips.toFixed(5)}
                                </span>
                            )}
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: "TP 1", value: tp1, ratio: "1:1" },
                                { label: "TP 2", value: tp2, ratio: "1:2" },
                                { label: "TP 3", value: tp3, ratio: "1:3" }
                            ].map(tp => (
                                <div key={tp.label} className="bg-black/40 rounded-lg p-3 text-center border border-white/[0.04]">
                                    <div className="flex items-center justify-center gap-1.5 mb-1">
                                        <span className="text-[9px] text-emerald-500/60 font-bold uppercase">{tp.label}</span>
                                        <span className="text-[8px] text-neutral-600">({tp.ratio})</span>
                                    </div>
                                    <span className="font-mono text-sm text-emerald-400 font-semibold">
                                        {tp.value || "—"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Section 2: Fleet & Risk ── */}
            <div className="bg-[#0a0a0a] rounded-2xl border border-white/[0.06] overflow-hidden">
                <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Users className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white tracking-wide">Fleet & Risk Management</h3>
                        <p className="text-[10px] text-neutral-500 uppercase tracking-widest">Accounts · Lot Size · Expiry</p>
                    </div>
                </div>

                <div className="p-6 space-y-5">
                    {/* Fleet Accounts */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-[11px] text-neutral-500 font-semibold uppercase tracking-wider">
                                Target Accounts
                            </label>
                            <button
                                onClick={selectAllAccounts}
                                className="text-[10px] text-yellow-500/70 hover:text-yellow-500 font-semibold uppercase tracking-wider transition-colors"
                            >
                                {targetAccounts.length === ACCOUNTS.length ? "Deselect All" : "Select All"}
                            </button>
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                            {ACCOUNTS.map(acc => (
                                <button
                                    key={acc.id}
                                    onClick={() => toggleAccount(acc.id)}
                                    className={`relative py-3 px-2 rounded-xl text-center transition-all border ${
                                        targetAccounts.includes(acc.id)
                                            ? 'bg-yellow-500/10 border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.05)]'
                                            : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]'
                                    }`}
                                >
                                    <span className={`block text-xs font-bold mb-0.5 ${
                                        targetAccounts.includes(acc.id) ? 'text-yellow-500' : 'text-neutral-500'
                                    }`}>
                                        {acc.icon === "👑" ? "👑" : acc.icon}
                                    </span>
                                    <span className={`block text-[10px] font-semibold ${
                                        targetAccounts.includes(acc.id) ? 'text-yellow-500/80' : 'text-neutral-600'
                                    }`}>
                                        {acc.label}
                                    </span>
                                    {targetAccounts.includes(acc.id) && (
                                        <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-yellow-500" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Lot + Expiry */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[11px] text-neutral-500 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <Shield className="w-3 h-3" /> Lot Size
                            </label>
                            <select
                                value={lotSize}
                                onChange={e => setLotSize(e.target.value)}
                                className="w-full bg-[#111] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm focus:border-yellow-500/40 outline-none transition-all cursor-pointer [color-scheme:dark]"
                            >
                                <option value="0.01" className="bg-[#111] text-white">0.01 — Micro</option>
                                <option value="0.05" className="bg-[#111] text-white">0.05 — Small</option>
                                <option value="0.1" className="bg-[#111] text-white">0.10 — Standard</option>
                                <option value="0.5" className="bg-[#111] text-white">0.50 — Aggressive</option>
                                <option value="1.0" className="bg-[#111] text-white">1.00 — Full</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[11px] text-neutral-500 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <Clock className="w-3 h-3" /> Order Expiry
                            </label>
                            <select
                                value={expiryHours}
                                onChange={e => setExpiryHours(e.target.value)}
                                className="w-full bg-[#111] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm focus:border-yellow-500/40 outline-none transition-all cursor-pointer [color-scheme:dark]"
                            >
                                <option value="2" className="bg-[#111] text-white">2 Hours</option>
                                <option value="4" className="bg-[#111] text-white">4 Hours</option>
                                <option value="8" className="bg-[#111] text-white">8 Hours</option>
                                <option value="12" className="bg-[#111] text-white">12 Hours</option>
                                <option value="24" className="bg-[#111] text-white">24 Hours</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Section 3: Chart Upload ── */}
            <div className="bg-[#0a0a0a] rounded-2xl border border-white/[0.06] overflow-hidden">
                <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <Upload className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white tracking-wide">Chart Markup</h3>
                        <p className="text-[10px] text-neutral-500 uppercase tracking-widest">Attach Setup Image</p>
                    </div>
                </div>

                <div className="p-6">
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative border-2 border-dashed rounded-xl transition-all cursor-pointer overflow-hidden ${
                            preview
                                ? 'border-yellow-500/30 bg-yellow-500/[0.03]'
                                : 'border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.02]'
                        } ${preview ? 'h-80' : 'h-48'}`}
                    >
                        {preview ? (
                            <>
                                <img src={preview} alt="Chart" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                <div className="absolute bottom-3 left-4 flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-yellow-500" />
                                        <span className="text-xs font-bold text-yellow-500">Chart Attached</span>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleAIScan(); }}
                                        disabled={aiChecking}
                                        className="px-4 py-2 bg-yellow-500 text-black rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-yellow-400 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                                    >
                                        {aiChecking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                                        Magic AI Scan
                                    </button>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }}
                                    className="absolute top-3 right-3 p-1.5 bg-black/60 backdrop-blur-sm rounded-lg text-white hover:bg-red-500/80 transition-colors"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center gap-2">
                                <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center">
                                    <Upload className="w-5 h-5 text-neutral-500" />
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-neutral-400 font-medium">Click to upload chart</p>
                                    <p className="text-[10px] text-neutral-600 mt-0.5">PNG, JPG or WebP · Max 10MB</p>
                                </div>
                            </div>
                        )}
                        <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
                    </div>
                </div>
            </div>

            {/* ── Status Message ── */}
            <AnimatePresence>
                {status && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className={`p-4 rounded-xl flex items-start gap-3 text-sm border ${
                            status.type === 'success'
                                ? 'bg-emerald-500/[0.06] text-emerald-400 border-emerald-500/20'
                                : 'bg-red-500/[0.06] text-red-400 border-red-500/20'
                        }`}
                    >
                        {status.type === 'success'
                            ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        }
                        <span>{status.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Dispatch Button ── */}
            <button
                disabled={!file || uploading || aiChecking || !entry || !sl || targetAccounts.length === 0}
                onClick={handleUpload}
                className="w-full py-4 bg-gradient-to-r from-yellow-500 via-yellow-500 to-amber-500 hover:from-yellow-400 hover:via-yellow-400 hover:to-amber-400 disabled:from-neutral-800 disabled:via-neutral-800 disabled:to-neutral-800 disabled:text-neutral-600 text-black font-black rounded-xl transition-all flex items-center justify-center gap-2.5 text-sm uppercase tracking-wider shadow-[0_4px_24px_rgba(234,179,8,0.15)] hover:shadow-[0_4px_32px_rgba(234,179,8,0.25)] disabled:shadow-none active:scale-[0.98]"
            >
                {uploading || aiChecking ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {aiChecking ? "AI Verification..." : "Dispatching to Fleet..."}
                    </>
                ) : (
                    <>
                        <Zap className="w-4 h-4" />
                        Confirm & Dispatch Signal
                    </>
                )}
            </button>

            <p className="text-[9px] text-center text-neutral-600 uppercase tracking-[0.2em] font-medium">
                Institutional Admin Access Only · Signals Deploy to MT5 Fleet Automatically
            </p>
        </div>
    )
}
