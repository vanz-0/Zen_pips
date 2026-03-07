"use client"

import { useState, useRef } from "react"
import { motion } from "framer-motion"
import { Upload, Zap, Send, ShieldAlert, Loader2, ImagePlus } from "lucide-react"

export default function AdminDashboard() {
    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [isBroadcasting, setIsBroadcasting] = useState(false)

    const [formData, setFormData] = useState({
        pair: "",
        direction: "BUY",
        entry: "",
        sl: "",
        tp1: "",
        tp2: "",
        tp3: "",
        timeframe: "M5",
        confluence: ""
    })

    const [statusMsg, setStatusMsg] = useState({ type: "", text: "" })
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (event) => {
            setSelectedImage(event.target?.result as string)
            setStatusMsg({ type: "", text: "" })
        }
        reader.readAsDataURL(file)
    }

    const analyzeScreenshot = async () => {
        if (!selectedImage) return
        setIsAnalyzing(true)
        setStatusMsg({ type: "info", text: "Vision AI analyzing institutional data..." })

        try {
            const res = await fetch("/api/admin/analyze-signal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageBase64: selectedImage })
            })
            const data = await res.json()

            if (data.error) throw new Error(data.error)

            setFormData({
                pair: data.pair || "",
                direction: data.direction || "BUY",
                entry: data.entry?.toString() || "",
                sl: data.sl?.toString() || "",
                tp1: data.tp1?.toString() || "",
                tp2: data.tp2?.toString() || "",
                tp3: data.tp3?.toString() || "",
                timeframe: data.timeframe || "M5",
                confluence: data.confluence || ""
            })

            setStatusMsg({ type: "success", text: "Screenshot successfully extracted." })
        } catch (err: any) {
            console.error(err)
            setStatusMsg({ type: "error", text: "Failed to extract parameters from image." })
        } finally {
            setIsAnalyzing(false)
        }
    }

    const handleBroadcast = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsBroadcasting(true)
        setStatusMsg({ type: "info", text: "Executing broadcast to ecosystem..." })

        try {
            const res = await fetch("/api/admin/broadcast-signal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            })

            const data = await res.json()

            if (data.error) throw new Error(data.error)

            setStatusMsg({ type: "success", text: "Signal LIVE in Supabase and Telegram!" })
            setSelectedImage(null)
            // Reset after 3 seconds
            setTimeout(() => setStatusMsg({ type: "", text: "" }), 3000)

        } catch (err: any) {
            console.error(err)
            setStatusMsg({ type: "error", text: err.message || "Broadcast failed" })
        } finally {
            setIsBroadcasting(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-12 font-outfit">

            {/* Header */}
            <header className="mb-12 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
                        <ShieldAlert className="text-red-500 w-8 h-8" />
                        ADMIN <span className="text-gray-500 font-light">COMMAND CENTER</span>
                    </h1>
                    <p className="text-gray-400">Institutional Signal Distribution</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-7xl mx-auto">

                {/* Left Column: Vision AI */}
                <div className="space-y-6">
                    <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
                        <h2 className="text-xl font-medium mb-4 flex items-center gap-2">
                            <Zap className="text-yellow-500 w-5 h-5" />
                            Vision AI Auto-Extractor
                        </h2>

                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-white/20 rounded-xl h-64 flex flex-col items-center justify-center cursor-pointer hover:border-yellow-500/50 hover:bg-yellow-500/5 transition-all overflow-hidden relative group"
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                className="hidden"
                                accept="image/*"
                            />

                            {selectedImage ? (
                                <img src={selectedImage} alt="Setup" className="w-full h-full object-cover opacity-80 group-hover:opacity-50 transition-opacity" />
                            ) : (
                                <>
                                    <ImagePlus className="w-12 h-12 text-gray-600 mb-4" />
                                    <p className="text-gray-400">Drop TradingView screenshot here</p>
                                </>
                            )}

                            {selectedImage && (
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="bg-black/80 px-4 py-2 rounded-lg font-medium text-sm">Replace Image</span>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={analyzeScreenshot}
                            disabled={!selectedImage || isAnalyzing}
                            className="w-full mt-6 bg-white/5 hover:bg-white/10 text-white border border-white/10 p-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin text-yellow-500" /> : <Zap className="w-5 h-5 text-yellow-500" />}
                            {isAnalyzing ? "Extracting institutional parameters..." : "Extract Setups via Vision AI"}
                        </button>
                    </div>

                    {statusMsg.text && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className={`p-4 rounded-xl border ${statusMsg.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' : statusMsg.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-blue-500/10 border-blue-500/30 text-blue-400'} font-medium text-sm`}
                        >
                            {statusMsg.text}
                        </motion.div>
                    )}
                </div>

                {/* Right Column: Signal Form */}
                <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
                    <h2 className="text-xl font-medium mb-6">Signal Verification</h2>

                    <form onSubmit={handleBroadcast} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider">Pair</label>
                                <input
                                    required
                                    value={formData.pair}
                                    onChange={e => setFormData({ ...formData, pair: e.target.value.toUpperCase() })}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-yellow-500 outline-none"
                                    placeholder="XAU/USD"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider">Direction</label>
                                <select
                                    value={formData.direction}
                                    onChange={e => setFormData({ ...formData, direction: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-yellow-500 outline-none appearance-none"
                                >
                                    <option value="BUY">BUY</option>
                                    <option value="SELL">SELL</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider text-blue-400">Entry Level</label>
                                <input required type="number" step="any" value={formData.entry} onChange={e => setFormData({ ...formData, entry: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none" placeholder="2400.00" />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider text-red-400">Stop Loss</label>
                                <input required type="number" step="any" value={formData.sl} onChange={e => setFormData({ ...formData, sl: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none" placeholder="2395.00" />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider text-green-400">TP 1</label>
                                <input required type="number" step="any" value={formData.tp1} onChange={e => setFormData({ ...formData, tp1: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none" placeholder="2405.00" />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider text-green-500">TP 2</label>
                                <input type="number" step="any" value={formData.tp2} onChange={e => setFormData({ ...formData, tp2: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider text-green-600">TP 3</label>
                                <input type="number" step="any" value={formData.tp3} onChange={e => setFormData({ ...formData, tp3: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider">Analysis / Confluence</label>
                                <input value={formData.confluence} onChange={e => setFormData({ ...formData, confluence: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none" placeholder="Fair Value Gap / OTE..." />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isBroadcasting}
                            className="w-full bg-yellow-500 hover:bg-yellow-400 text-black p-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors mt-8 disabled:opacity-50"
                        >
                            {isBroadcasting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            BROADCAST TO NETWORK
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
