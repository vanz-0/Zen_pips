"use client";

import { useState } from "react";
import { Zap, Send, RefreshCw, CheckCircle2, AlertCircle, Mic, BarChart2, ChevronDown, ChevronUp } from "lucide-react";
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

// ─── Trade Thesis Config ───
const THESIS_OPTIONS = {
    strategy: {
        label: "📐 Strategy",
        choices: ["Order Block", "FVG / Fair Value Gap", "BOS / Break of Structure", "CHoCH", "EQH/EQL Sweep", "Liquidity Grab", "Premium/Discount", "OTE / Optimal Trade Entry"]
    },
    priceAction: {
        label: "🕯️ Price Action",
        choices: ["Bearish Engulfing", "Bullish Engulfing", "Pin Bar / Rejection", "Inside Bar", "Strong Impulse Candle", "Doji Reversal", "Fakeout / Stop Hunt"]
    },
    session: {
        label: "🌍 Session",
        choices: ["London Open", "NY Open", "Asian Session", "London Close", "Pre-Market", "NFP / High Impact"]
    },
    bias: {
        label: "🧭 Higher TF Bias",
        choices: ["Daily Bearish", "Daily Bullish", "Weekly Bearish", "Weekly Bullish", "Monthly Key Level", "Range / Consolidation"]
    },
    news: {
        label: "📰 News / Macro",
        choices: ["No News", "CPI Data", "NFP", "Fed Speech", "DXY Correlation", "Risk Off Flow", "Risk On Flow", "Geopolitical Event"]
    }
};

function ThesisSection({
    section,
    selected,
    onToggle
}: {
    section: keyof typeof THESIS_OPTIONS;
    selected: string[];
    onToggle: (section: keyof typeof THESIS_OPTIONS, value: string) => void;
}) {
    const [open, setOpen] = useState(section === "strategy");
    const cfg = THESIS_OPTIONS[section];

    return (
        <div className="border border-white/5 rounded-2xl overflow-hidden">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
            >
                <span className="text-[11px] font-bold text-gray-300 uppercase tracking-widest">{cfg.label}</span>
                <div className="flex items-center gap-2">
                    {selected.length > 0 && (
                        <span className="text-[9px] font-black text-[#d4af37] bg-[#d4af37]/10 px-2 py-0.5 rounded-full">{selected.length}</span>
                    )}
                    {open ? <ChevronUp className="w-3.5 h-3.5 text-gray-500" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-500" />}
                </div>
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 py-3 flex flex-wrap gap-2">
                            {cfg.choices.map(choice => (
                                <button
                                    key={choice}
                                    onClick={() => onToggle(section, choice)}
                                    className={`text-[10px] font-semibold px-3 py-1.5 rounded-full border transition-all ${
                                        selected.includes(choice)
                                            ? "bg-[#d4af37]/20 border-[#d4af37]/50 text-[#d4af37]"
                                            : "bg-white/[0.03] border-white/10 text-gray-500 hover:border-white/20 hover:text-gray-300"
                                    }`}
                                >
                                    {choice}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
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

    const [thesis, setThesis] = useState<Record<keyof typeof THESIS_OPTIONS, string[]>>({
        strategy: [],
        priceAction: [],
        session: [],
        bias: [],
        news: []
    });

    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: "success" | "error" | null; message: string }>({ type: null, message: "" });
    const [isListening, setIsListening] = useState(false);

    const updateField = (field: keyof SignalFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const toggleDirection = () => {
        setFormData(prev => ({ ...prev, direction: prev.direction === "BUY" ? "SELL" : "BUY" }));
    };

    const toggleThesis = (section: keyof typeof THESIS_OPTIONS, value: string) => {
        setThesis(prev => {
            const current = prev[section];
            const updated = current.includes(value)
                ? current.filter(v => v !== value)
                : [...current, value];
            const newThesis = { ...prev, [section]: updated };

            // Auto-build confluence string from selections
            const allSelected: string[] = [];
            for (const key of Object.keys(newThesis) as (keyof typeof THESIS_OPTIONS)[]) {
                allSelected.push(...newThesis[key]);
            }
            if (allSelected.length > 0) {
                setFormData(f => ({ ...f, confluence: allSelected.join(" | ") }));
            }
            return newThesis;
        });
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
        }));
    };

    const handlePublish = async () => {
        if (!formData.entry || !formData.sl || !formData.tp1) {
            setStatus({ type: "error", message: "Please fill in Entry, SL, and at least TP1." });
            return;
        }
        setLoading(true);
        setStatus({ type: null, message: "" });
        try {
            const ticker = formData.pair.replace("/", "");
            const isMetal = formData.pair.includes("XAU") || formData.pair.includes("XAG");
            const pipMultiplier = isMetal ? 10 : formData.pair.includes("JPY") ? 100 : 1;

            const { error } = await supabase.from("signals").insert([{
                pair: formData.pair, ticker, source: "Partners Portal", timeframe: formData.timeframe,
                direction: formData.direction, status: "ACTIVE",
                entry: parseFloat(formData.entry), sl: parseFloat(formData.sl),
                current_sl: parseFloat(formData.sl), tp1: parseFloat(formData.tp1),
                tp2: parseFloat(formData.tp2), tp3: parseFloat(formData.tp3),
                tp1_hit: false, tp2_hit: false, tp3_hit: false, sl_hit: false,
                closed: false, total_pips: 0, pip_multiplier: pipMultiplier,
                confluence: formData.confluence || "High-probability setup. Structure confirmed."
            }]);

            if (error) throw error;
            setStatus({ type: "success", message: `✅ Signal for ${formData.pair} broadcast to all partners!` });
        } catch (err: any) {
            setStatus({ type: "error", message: err.message || "Failed to publish signal." });
        } finally {
            setLoading(false);
        }
    };

    const handleVoiceDictation = () => {
        if (!("webkitSpeechRecognition" in window)) {
            setStatus({ type: "error", message: "Speech recognition not supported in this browser." });
            return;
        }
        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.continuous = false; recognition.lang = "en-US";
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (event: any) => {
            const t = event.results[0][0].transcript.toLowerCase();
            const entryMatch = t.match(/at (\d+(\.\d+)?)/);
            const slMatch = t.match(/stop loss (\d+(\.\d+)?)/);
            if (entryMatch) updateField("entry", entryMatch[1]);
            if (slMatch) updateField("sl", slMatch[1]);
            if (t.includes("buy")) updateField("direction", "BUY");
            if (t.includes("sell")) updateField("direction", "SELL");
            setStatus({ type: "success", message: `Dictation: "${t}"` });
            setTimeout(calculateTPs, 100);
        };
        recognition.start();
    };

    if (!isAdmin) {
        return (
            <div className="p-12 text-center text-gray-500 bg-[#111] rounded-3xl border border-white/5">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <h2 className="text-xl font-bold text-white mb-2">Partners Only</h2>
                <p>The Partners Portal is only accessible to institutional operators and certified analysts.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto px-4 py-8">

            {/* ─── Left Column: Signal Entry ─── */}
            <div className="bg-[#111]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 lg:p-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4af37]/10 blur-3xl -mr-16 -mt-16 group-hover:bg-[#d4af37]/20 transition-all duration-700" />

                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight">SIGNAL DEPLOYMENT</h2>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1">Institutional Partner Entry</p>
                    </div>
                    <button
                        onClick={handleVoiceDictation}
                        className={`p-3 rounded-xl border transition-all ${isListening ? "bg-red-500/20 border-red-500 text-red-400 animate-pulse" : "bg-white/5 border-white/10 text-gray-400 hover:text-[#d4af37] hover:border-[#d4af37]/30"}`}
                        title="Voice Dictation"
                    >
                        <Mic className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-5">
                    {/* Pair & Direction */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Asset Pair</label>
                            <input type="text" value={formData.pair}
                                onChange={(e) => updateField("pair", e.target.value.toUpperCase())}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white font-mono focus:border-[#d4af37]/50 outline-none transition-all"
                                placeholder="XAU/USD" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Direction</label>
                            <button onClick={toggleDirection}
                                className={`w-full font-black py-3.5 rounded-xl border transition-all ${formData.direction === "BUY" ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-red-500/10 border-red-500/30 text-red-400"}`}>
                                {formData.direction}
                            </button>
                        </div>
                    </div>

                    {/* Timeframe */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Timeframe</label>
                        <div className="flex gap-2 flex-wrap">
                            {["M5", "M15", "M30", "H1", "H4", "D1"].map(tf => (
                                <button key={tf} onClick={() => updateField("timeframe", tf)}
                                    className={`px-4 py-2 rounded-xl text-xs font-black border transition-all ${formData.timeframe === tf ? "bg-[#d4af37]/20 border-[#d4af37]/50 text-[#d4af37]" : "bg-white/[0.03] border-white/10 text-gray-500 hover:border-white/20 hover:text-white"}`}>
                                    {tf}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Entry & SL */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Entry Price</label>
                            <input type="text" value={formData.entry}
                                onChange={(e) => updateField("entry", e.target.value)}
                                onBlur={calculateTPs}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white font-mono focus:border-[#d4af37]/50 outline-none transition-all"
                                placeholder="0.00" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Stop Loss</label>
                            <input type="text" value={formData.sl}
                                onChange={(e) => updateField("sl", e.target.value)}
                                onBlur={calculateTPs}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-gray-100 font-mono focus:border-red-500/50 outline-none transition-all"
                                placeholder="0.00" />
                        </div>
                    </div>

                    {/* TPs */}
                    <div className="grid grid-cols-3 gap-3">
                        {(["tp1", "tp2", "tp3"] as const).map((tp, i) => (
                            <div key={tp} className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">TP {i + 1}</label>
                                <input type="text" value={formData[tp]}
                                    onChange={(e) => updateField(tp, e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-3 text-green-300 font-mono text-xs focus:border-[#d4af37]/50 outline-none transition-all"
                                    placeholder="0.00" />
                            </div>
                        ))}
                    </div>

                    {/* Confluence (auto-filled by thesis, but editable) */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between ml-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Narrative / Edge</label>
                            <button onClick={calculateTPs} className="text-[9px] text-[#d4af37] font-bold uppercase tracking-wider hover:text-white flex items-center gap-1">
                                <RefreshCw className="w-2.5 h-2.5" /> Auto-Calc TPs
                            </button>
                        </div>
                        <textarea value={formData.confluence}
                            onChange={(e) => updateField("confluence", e.target.value)}
                            rows={2}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-gray-300 text-sm focus:border-[#d4af37]/50 outline-none transition-all resize-none"
                            placeholder="Auto-filled by Trade Thesis below, or type manually..." />
                    </div>

                    {/* Status */}
                    <AnimatePresence>
                        {status.type && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                                className={`flex items-start gap-2 p-3 rounded-xl border ${status.type === "success" ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-red-500/10 border-red-500/30 text-red-400"}`}>
                                {status.type === "success" ? <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                                <span className="text-xs font-semibold">{status.message}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Broadcast */}
                    <button onClick={handlePublish} disabled={loading} className="w-full relative group h-14">
                        <div className="absolute inset-0 bg-[#d4af37] rounded-xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#d4af37] to-[#f3cf5f] rounded-xl flex items-center justify-center font-black text-black tracking-widest uppercase text-sm shadow-xl transition-transform active:scale-95 disabled:opacity-50">
                            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4 mr-2" /> BROADCAST TO LIVE PARTNERS</>}
                        </div>
                    </button>
                </div>
            </div>

            {/* ─── Right Column: Trade Thesis Validator + Terminal ─── */}
            <div className="flex flex-col gap-6">

                {/* Trade Thesis Form */}
                <div className="bg-[#111]/80 border border-white/5 rounded-3xl p-6 shadow-2xl">
                    <div className="mb-5">
                        <h3 className="text-sm font-black text-white tracking-tight flex items-center gap-2">
                            <BarChart2 className="w-4 h-4 text-[#d4af37]" /> TRADE THESIS VALIDATOR
                        </h3>
                        <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">Select your confluences — narrative auto-builds</p>
                    </div>

                    <div className="space-y-2">
                        {(Object.keys(THESIS_OPTIONS) as (keyof typeof THESIS_OPTIONS)[]).map(section => (
                            <ThesisSection
                                key={section}
                                section={section}
                                selected={thesis[section]}
                                onToggle={toggleThesis}
                            />
                        ))}
                    </div>

                    {/* Summary chips */}
                    {Object.values(thesis).flat().length > 0 && (
                        <div className="mt-4 pt-4 border-t border-white/5">
                            <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-2 font-bold">Active Confluences ({Object.values(thesis).flat().length})</p>
                            <div className="flex flex-wrap gap-1.5">
                                {Object.values(thesis).flat().map(item => (
                                    <span key={item} className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20">
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Live Terminal */}
                <div className="bg-[#0d0d0d] border border-white/5 rounded-3xl p-6 flex-1 overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">LIVE TERMINAL LOGS</span>
                        <div className="flex gap-1 items-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[9px] text-green-500 font-bold">CONNECTED</span>
                        </div>
                    </div>
                    <div className="space-y-2 font-mono text-[9px] text-gray-600 overflow-y-auto max-h-[150px] hide-scrollbar">
                        <p className="border-l border-[#d4af37]/30 pl-2 py-0.5">[{new Date().toLocaleTimeString()}] Partner Bridge Initialized. V-0.9.0 Ready.</p>
                        <p className="border-l border-white/10 pl-2 py-0.5">[{new Date().toLocaleTimeString()}] Monitoring REST payload for NEW Incoming Signals...</p>
                        <p className="border-l border-white/10 pl-2 py-0.5">[{new Date().toLocaleTimeString()}] Auth confirmed as PARTNER:MadDmakz.</p>
                        <p className="border-l border-green-500/30 pl-2 py-0.5 text-green-600">[{new Date().toLocaleTimeString()}] Thesis Validator online. Autonomous BE-Monitor active.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
