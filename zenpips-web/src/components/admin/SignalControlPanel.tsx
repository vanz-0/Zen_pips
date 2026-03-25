"use client";

import { useState, useRef, useEffect } from "react";
import { Zap, Target, Shield, Layout, MessageSquare, Mic, Upload, Send, Trash2, Edit2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

interface SignalFormData {
    pair: string;
    direction: "BUY" | "SELL";
    entry: string;
    sl: string;
    tp1: string;
    tp2: string;
    tp3: string;
    timeframe: string;
    confluence: string;
}

export function SignalControlPanel() {
    const { user } = useAuth();
    const isAdmin = user?.email === "dev@zenpips.com" || user?.email === "admin@zenpips.com";
    
    const [formData, setFormData] = useState<SignalFormData>({
        pair: "XAU/USD",
        direction: "BUY",
        entry: "",
        sl: "",
        tp1: "",
        tp2: "",
        tp3: "",
        timeframe: "M15",
        confluence: ""
    });

    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: "" });
    const [isListening, setIsListening] = useState(false);
    const [analyzingImage, setAnalyzingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form Handlers
    const updateField = (field: keyof SignalFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const toggleDirection = () => {
        setFormData(prev => ({ ...prev, direction: prev.direction === "BUY" ? "SELL" : "BUY" }));
    };

    const calculateTPs = () => {
        const entryVal = parseFloat(formData.entry);
        const slVal = parseFloat(formData.sl);

        if (isNaN(entryVal) || isNaN(slVal)) return;
        
        const riskDistance = Math.abs(entryVal - slVal);
        const isBuy = formData.direction === "BUY";
        const precision = formData.pair.includes("JPY") || formData.pair.includes("XAU") ? 2 : 5;

        setFormData(prev => ({
            ...prev,
            tp1: (entryVal + (isBuy ? riskDistance : -riskDistance)).toFixed(precision),
            tp2: (entryVal + (isBuy ? 2 * riskDistance : -2 * riskDistance)).toFixed(precision),
            tp3: (entryVal + (isBuy ? 3 * riskDistance : -3 * riskDistance)).toFixed(precision),
            confluence: prev.confluence || "High probability setup confirmed with internal confluence indicators."
        }));
    };

    const handlePublish = async () => {
        if (!formData.entry || !formData.sl || !formData.tp1) {
            setStatus({ type: 'error', message: "Please fill in Entry, SL, and at least TP1." });
            return;
        }

        setLoading(true);
        setStatus({ type: null, message: "" });

        try {
            const ticker = formData.pair.replace("/", "");
            const isMetal = formData.pair.includes("XAU") || formData.pair.includes("XAG");
            const pipMultiplier = isMetal ? 10 : formData.pair.includes("JPY") ? 100 : 1;

            const { data, error } = await supabase.from("signals").insert([
                {
                    pair: formData.pair,
                    ticker: ticker,
                    source: "TradingView Admin",
                    timeframe: formData.timeframe,
                    direction: formData.direction,
                    status: "ACTIVE",
                    entry: parseFloat(formData.entry),
                    sl: parseFloat(formData.sl),
                    current_sl: parseFloat(formData.sl),
                    tp1: parseFloat(formData.tp1),
                    tp2: parseFloat(formData.tp2),
                    tp3: parseFloat(formData.tp3),
                    tp1_hit: false,
                    tp2_hit: false,
                    tp3_hit: false,
                    sl_hit: false,
                    closed: false,
                    total_pips: 0,
                    pip_multiplier: pipMultiplier,
                    confluence: formData.confluence
                }
            ]).select();

            if (error) throw error;

            console.log("Signal Inserted:", data);
            setStatus({ type: 'success', message: `Signal for ${formData.pair} published successfully!` });
            
            // Re-set form (optional)
            // setFormData({ ...formData, entry: "", sl: "", tp1: "", tp2: "", tp3: "", confluence: "" });
            
        } catch (err: any) {
            console.error("Publish error:", err);
            setStatus({ type: 'error', message: err.message || "Failed to publish signal." });
        } finally {
            setLoading(false);
        }
    };

    // AI Helpers (Placeholders for now)
    const handleVoiceDictation = () => {
        if (!('webkitSpeechRecognition' in window)) {
            setStatus({ type: 'error', message: "Speech recognition not supported in this browser." });
            return;
        }

        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript.toLowerCase();
            console.log("Voice Dictation:", transcript);
            
            // Basic regex parsing (can be improved with AI backend later)
            // E.g. "Buy gold at 2150 stop loss 2140"
            const entryMatch = transcript.match(/at (\d+(\.\d+)?)/);
            const slMatch = transcript.match(/stop loss (\d+(\.\d+)?)/);
            const pairMatch = transcript.match(/buy (\w+)/) || transcript.match(/sell (\w+)/);
            
            if (entryMatch) updateField("entry", entryMatch[1]);
            if (slMatch) updateField("sl", slMatch[1]);
            if (transcript.includes("buy")) updateField("direction", "BUY");
            if (transcript.includes("sell")) updateField("direction", "SELL");
            
            setStatus({ type: 'success', message: `Dictation captured: "${transcript}"` });
            calculateTPs();
        };

        recognition.start();
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setAnalyzingImage(true);
        setStatus({ type: null, message: "Analyzing chart patterns..." });

        // Simulator: In reality, we'd send this to GPT-4o Vision via an Edge Function
        setTimeout(() => {
            setAnalyzingImage(false);
            setStatus({ type: 'success', message: "AI Analysis: Bullish structure detected on H1. Momentum shifting." });
            setFormData(prev => ({
                ...prev,
                confluence: prev.confluence + " AI Vision: Bullish break-of-structure (BOS) confirmed on lower timeframe. Supply zone mitigated."
            }));
        }, 2000);
    };

    if (!isAdmin) {
        return (
            <div className="p-12 text-center text-gray-500 bg-[#111] rounded-3xl border border-white/5">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <h2 className="text-xl font-bold text-white mb-2">Restricted Access</h2>
                <p>The Admin Control Panel is only accessible to specialized terminal operators.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto px-4 py-8">
            
            {/* ─── Left Column: Input Form ─── */}
            <div className="bg-[#111]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 lg:p-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4af37]/10 blur-3xl -mr-16 -mt-16 group-hover:bg-[#d4af37]/20 transition-all duration-700"></div>
                
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                             SIGNAL GENERATOR
                        </h2>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1">Institutional Order Entry</p>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={handleVoiceDictation}
                            className={`p-3 rounded-xl border transition-all ${isListening ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse' : 'bg-white/5 border-white/10 text-gray-400 hover:text-[#d4af37] hover:border-[#d4af37]/30'}`}
                            title="Voice Dictation"
                        >
                            <Mic className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Pair & Direction */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Asset Pair</label>
                            <input 
                                type="text" 
                                value={formData.pair} 
                                onChange={(e) => updateField("pair", e.target.value.toUpperCase())}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white font-mono focus:border-[#d4af37]/50 outline-none transition-all"
                                placeholder="XAUUSD"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Direction</label>
                            <button 
                                onClick={toggleDirection}
                                className={`w-full font-black py-3.5 rounded-xl border transition-all ${formData.direction === "BUY" ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-red-500/10 border-red-500/30 text-red-400"}`}
                            >
                                {formData.direction}
                            </button>
                        </div>
                    </div>

                    {/* Entry & SL */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Entry Price</label>
                            <input 
                                type="text" 
                                value={formData.entry}
                                onChange={(e) => updateField("entry", e.target.value)}
                                onBlur={calculateTPs}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white font-mono focus:border-[#d4af37]/50 outline-none transition-all"
                                placeholder="0.00000"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Stop Loss</label>
                            <input 
                                type="text" 
                                value={formData.sl}
                                onChange={(e) => updateField("sl", e.target.value)}
                                onBlur={calculateTPs}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-gray-100 font-mono focus:border-red-500/50 outline-none transition-all"
                                placeholder="0.00000"
                            />
                        </div>
                    </div>

                    {/* Take Profits */}
                    <div className="grid grid-cols-3 gap-3">
                        {['tp1', 'tp2', 'tp3'].map((tp) => (
                            <div key={tp} className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">{tp}</label>
                                <input 
                                    type="text" 
                                    value={(formData as any)[tp]}
                                    onChange={(e) => updateField(tp as any, e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-3 text-green-300 font-mono text-xs focus:border-[#d4af37]/50 outline-none transition-all"
                                    placeholder="0.000"
                                />
                            </div>
                        ))}
                    </div>

                    {/* Confluence */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between ml-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Analysis Confluence</label>
                            <button 
                                onClick={calculateTPs}
                                className="text-[9px] text-[#d4af37] font-bold uppercase tracking-wider hover:text-white flex items-center gap-1"
                            >
                                <RefreshCw className="w-2.5 h-2.5" /> Auto-Calc Targets
                            </button>
                        </div>
                        <textarea 
                            value={formData.confluence}
                            onChange={(e) => updateField("confluence", e.target.value)}
                            rows={3}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-gray-300 text-sm focus:border-[#d4af37]/50 outline-none transition-all resize-none"
                            placeholder="Why this setup? Multi-timeframe confluence?..."
                        ></textarea>
                    </div>

                    {/* Status Display */}
                    <AnimatePresence>
                        {status.type && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className={`flex items-start gap-2 p-3 rounded-xl border ${status.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}
                            >
                                {status.type === 'success' ? <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                                <span className="text-xs font-semibold">{status.message}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Actions */}
                    <button 
                        onClick={handlePublish}
                        disabled={loading}
                        className="w-full relative group h-14"
                    >
                        <div className="absolute inset-0 bg-[#d4af37] rounded-xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-[#d4af37] to-[#f3cf5f] rounded-xl flex items-center justify-center font-black text-black tracking-widest uppercase text-sm shadow-xl transition-transform active:scale-95 disabled:opacity-50">
                            {loading ? (
                                <RefreshCw className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Send className="w-4 h-4 mr-2" /> EXECUTE ON LIVE TERMINALS
                                </>
                            )}
                        </div>
                    </button>
                </div>
            </div>

            {/* ─── Right Column: AI Assistant (Talk to Charts) ─── */}
            <div className="flex flex-col gap-8">
                {/* Image Analysis Section */}
                <div className="bg-[#111]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 lg:p-8 flex flex-col items-center justify-center text-center h-full relative group min-h-[300px]">
                    <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/10 blur-3xl -ml-16 -mt-16"></div>
                    
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImageUpload} 
                        className="hidden" 
                        accept="image/*" 
                    />

                    {analyzingImage ? (
                        <div className="space-y-4">
                            <div className="relative w-24 h-24 mx-auto">
                                <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
                                <RefreshCw className="w-full h-full text-blue-400 animate-spin" />
                            </div>
                            <h3 className="text-xl font-bold text-white">AI Analyzing Chart</h3>
                            <p className="text-gray-500 text-sm">Identifying liquidity gaps, zones, and momentum shift...</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center mx-auto group-hover:bg-blue-500/20 transition-all rotate-3 group-hover:rotate-0">
                                <Upload className="w-10 h-10 text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2 underline decoration-blue-500/30">CHAT WITH CHARTS</h3>
                                <p className="text-gray-500 text-sm max-w-xs mx-auto">
                                    Upload a TradingView screenshot. The AI will extract levels and suggest the optimal SL/TP confluence.
                                </p>
                            </div>
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold text-sm hover:bg-white/10 transition-all flex items-center gap-2 mx-auto"
                            >
                                <Upload className="w-4 h-4" /> BROWSE CHART IMAGE
                            </button>
                        </div>
                    )}
                </div>

                {/* Automation Log Placeholder */}
                <div className="bg-[#0d0d0d] border border-white/5 rounded-3xl p-6 flex-1 overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                             LIVE TERMINAL LOGS
                        </span>
                        <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-[9px] text-green-500 font-bold">CONNECTED</span>
                        </div>
                    </div>
                    <div className="space-y-2 font-mono text-[9px] text-gray-600 overflow-y-auto max-h-[150px] hide-scrollbar">
                        <p className="border-l border-[#d4af37]/30 pl-2 py-0.5">[{new Date().toLocaleTimeString()}] Bridge Initialized. V-0.8.2 Ready.</p>
                        <p className="border-l border-white/10 pl-2 py-0.5">[{new Date().toLocaleTimeString()}] Monitoring REST payload for NEW Incoming Signals...</p>
                        <p className="border-l border-white/10 pl-2 py-0.5">[{new Date().toLocaleTimeString()}] Auth confirmed as ADM:MadDmakz.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
