"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Book, Plus, TrendingUp, AlertCircle, CheckCircle2, XCircle,
    Brain, ArrowLeft, Loader2, Target, BarChart3, Flame
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { useSignals } from "@/hooks/useSignals"

interface JournalEntry {
    id: string
    user_id: string
    date: string
    pair: string
    direction: "BUY" | "SELL"
    pips: number
    outcome: "Profit" | "Loss" | "Break Even"
    psychology: string
    mistake: string
    notes: string
    signal_id?: string | null
    created_at: string
}

export function JournalTab() {
    const { user, loading: authLoading } = useAuth()
    const { signals } = useSignals()
    const router = useRouter()
    const [showAdd, setShowAdd] = useState(false)
    const [entries, setEntries] = useState<JournalEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null)

    // Form state
    const [form, setForm] = useState({
        date: new Date().toISOString().split("T")[0],
        pair: "",
        direction: "BUY" as "BUY" | "SELL",
        pips: 0,
        outcome: "Profit" as "Profit" | "Loss" | "Break Even",
        psychology: "",
        mistake: "None",
        notes: "",
        signal_id: "" as string,
    })

    const fetchEntries = useCallback(async () => {
        if (!user) return
        const { data, error } = await supabase
            .from("journal_entries")
            .select("*")
            .eq("user_id", user.id)
            .order("date", { ascending: false })

        if (!error && data) {
            setEntries(data as JournalEntry[])
        }
        setLoading(false)
    }, [user])

    useEffect(() => {
        if (user) fetchEntries()
    }, [user, fetchEntries])

    const handleSave = async () => {
        if (!user || !form.pair) return
        setSaving(true)
        const { error } = await supabase.from("journal_entries").insert({
            user_id: user.id,
            date: form.date,
            pair: form.pair.toUpperCase(),
            direction: form.direction,
            pips: form.pips,
            outcome: form.outcome,
            psychology: form.psychology,
            mistake: form.mistake,
            notes: form.notes,
            signal_id: form.signal_id || null,
        })
        setSaving(false)
        if (!error) {
            setShowAdd(false)
            setForm({
                date: new Date().toISOString().split("T")[0],
                pair: "", direction: "BUY", pips: 0, outcome: "Profit",
                psychology: "", mistake: "None", notes: "", signal_id: "",
            })
            fetchEntries()
        }
    }

    const handleDelete = async (id: string) => {
        await supabase.from("journal_entries").delete().eq("id", id)
        setSelectedEntry(null)
        fetchEntries()
    }

    // Stats
    const wins = entries.filter(e => e.outcome === "Profit").length
    const losses = entries.filter(e => e.outcome === "Loss").length
    const winRate = entries.length > 0 ? Math.round((wins / entries.length) * 100) : 0
    const totalPips = entries.reduce((acc, e) => acc + e.pips, 0)
    const commonMistake = entries.reduce((acc, e) => {
        if (e.mistake && e.mistake !== "None") {
            acc[e.mistake] = (acc[e.mistake] || 0) + 1
        }
        return acc
    }, {} as Record<string, number>)
    const topMistake = Object.entries(commonMistake).sort((a, b) => b[1] - a[1])[0]?.[0] || "None"

    // Signals analysis
    const signalPairs = new Set(signals.map(s => s.pair))
    const takenSignals = entries.filter(e => e.signal_id || signalPairs.has(e.pair))
    const missedSignals = signals.filter(
        s => !entries.some(e => e.signal_id === s.id || (e.pair === s.pair && e.date === s.created_at?.split("T")[0]))
    )

    if (authLoading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="w-12 h-12 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin" />
            </div>
        )
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-6">
                <Book className="w-16 h-16 text-yellow-500/30" />
                <h2 className="text-2xl font-bold text-white">Access Restricted</h2>
                <p className="text-gray-400 text-center max-w-sm">Log in to access your Trading Journal.</p>
                <button onClick={() => router.push("/auth")} className="bg-yellow-500 text-black px-8 py-3 rounded-xl font-bold hover:bg-yellow-400 transition-all">
                    Log In / Sign Up
                </button>
            </div>
        )
    }

    return (
        <div className="w-full text-white py-12 font-[family-name:var(--font-outfit)]">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">Trading Journal</h1>
                        <p className="text-gray-400 mt-2">Log your journey. Refine your edge. Master the self.</p>
                    </div>
                    <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-yellow-500 text-black px-6 py-3 rounded-xl font-bold hover:bg-yellow-400 transition-all transform hover:scale-105 active:scale-95">
                        <Plus className="w-5 h-5" />
                        New Entry
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: "Win Rate", value: `${winRate}%`, icon: TrendingUp, color: "text-green-500" },
                        { label: "Total Pips", value: totalPips > 0 ? `+${totalPips}` : `${totalPips}`, icon: BarChart3, color: totalPips >= 0 ? "text-green-500" : "text-red-500" },
                        { label: "Total Logs", value: `${entries.length}`, icon: Book, color: "text-blue-400" },
                        { label: "Top Mistake", value: topMistake, icon: Brain, color: "text-yellow-500" },
                    ].map((stat, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-[#111] p-4 rounded-xl border border-white/5 space-y-2 hover:border-yellow-500/20 transition-colors">
                            <div className="flex items-center gap-2 text-gray-400">
                                <stat.icon className="w-4 h-4" />
                                <span className="text-xs uppercase tracking-wider">{stat.label}</span>
                            </div>
                            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Signal Analysis Bar */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#111] p-4 rounded-xl border border-white/5 flex items-center gap-3">
                        <div className="p-2 bg-green-500/10 rounded-lg"><Target className="w-5 h-5 text-green-500" /></div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wider">Signals Taken</p>
                            <p className="text-xl font-bold text-green-400">{takenSignals.length}</p>
                        </div>
                    </div>
                    <div className="bg-[#111] p-4 rounded-xl border border-white/5 flex items-center gap-3">
                        <div className="p-2 bg-red-500/10 rounded-lg"><AlertCircle className="w-5 h-5 text-red-500" /></div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wider">Signals Missed</p>
                            <p className="text-xl font-bold text-red-400">{missedSignals.length}</p>
                        </div>
                    </div>
                    <div className="bg-[#111] p-4 rounded-xl border border-white/5 flex items-center gap-3">
                        <div className="p-2 bg-yellow-500/10 rounded-lg"><Flame className="w-5 h-5 text-yellow-500" /></div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wider">Win Streak</p>
                            <p className="text-xl font-bold text-yellow-400">
                                {entries.reduce((streak, e) => e.outcome === "Profit" ? streak + 1 : 0, 0)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Entries Table */}
                <div className="bg-[#111] rounded-2xl border border-white/5 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center p-12">
                            <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
                        </div>
                    ) : entries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 gap-4">
                            <Book className="w-12 h-12 text-gray-600" />
                            <p className="text-gray-400">No journal entries yet. Start logging your trades!</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/[0.03]">
                                        <th className="p-4 text-xs uppercase tracking-wider text-gray-400 font-semibold">Date</th>
                                        <th className="p-4 text-xs uppercase tracking-wider text-gray-400 font-semibold">Pair</th>
                                        <th className="p-4 text-xs uppercase tracking-wider text-gray-400 font-semibold">Direction</th>
                                        <th className="p-4 text-xs uppercase tracking-wider text-gray-400 font-semibold">Outcome</th>
                                        <th className="p-4 text-xs uppercase tracking-wider text-gray-400 font-semibold">Pips</th>
                                        <th className="p-4 text-xs uppercase tracking-wider text-gray-400 font-semibold">Mistake</th>
                                        <th className="p-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {entries.map((entry) => (
                                        <tr key={entry.id} className="hover:bg-white/[0.02] transition-colors group cursor-pointer" onClick={() => setSelectedEntry(entry)}>
                                            <td className="p-4 text-sm text-gray-300">{entry.date}</td>
                                            <td className="p-4 font-bold">{entry.pair}</td>
                                            <td className={`p-4 font-semibold ${entry.direction === "BUY" ? "text-green-500" : "text-red-500"}`}>{entry.direction}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tight ${entry.outcome === "Profit" ? "bg-green-500/10 text-green-500" : entry.outcome === "Loss" ? "bg-red-500/10 text-red-500" : "bg-gray-500/10 text-gray-400"}`}>
                                                    {entry.outcome}
                                                </span>
                                            </td>
                                            <td className={`p-4 font-mono ${entry.pips > 0 ? "text-green-400" : entry.pips < 0 ? "text-red-400" : "text-gray-400"}`}>
                                                {entry.pips > 0 ? "+" : ""}{entry.pips}
                                            </td>
                                            <td className="p-4 text-sm text-gray-400 italic">
                                                {entry.mistake !== "None" ? entry.mistake : <span className="text-gray-600">Perfect Execution</span>}
                                            </td>
                                            <td className="p-4 text-right">
                                                <span className="text-gray-500 group-hover:text-white transition-colors text-sm">Details →</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Add New Entry Modal */}
            <AnimatePresence>
                {showAdd && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} onClick={(e) => e.stopPropagation()} className="bg-[#111] w-full max-w-2xl rounded-2xl border border-white/10 overflow-hidden max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-white/5 flex justify-between items-center sticky top-0 bg-[#111] z-10">
                                <h3 className="text-xl font-bold">New Journal Entry</h3>
                                <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-white"><XCircle className="w-6 h-6" /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-400 uppercase font-bold">Date</label>
                                        <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full bg-black border border-white/10 rounded-lg p-2.5 focus:border-yellow-500 outline-none text-white" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-400 uppercase font-bold">Pair</label>
                                        <input type="text" value={form.pair} onChange={(e) => setForm({ ...form, pair: e.target.value })} placeholder="XAUUSD" className="w-full bg-black border border-white/10 rounded-lg p-2.5 focus:border-yellow-500 outline-none text-white" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-400 uppercase font-bold">Direction</label>
                                        <select value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value as "BUY" | "SELL" })} className="w-full bg-black border border-white/10 rounded-lg p-2.5 focus:border-yellow-500 outline-none text-white">
                                            <option value="BUY">BUY</option>
                                            <option value="SELL">SELL</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-400 uppercase font-bold">Outcome</label>
                                        <select value={form.outcome} onChange={(e) => setForm({ ...form, outcome: e.target.value as "Profit" | "Loss" | "Break Even" })} className="w-full bg-black border border-white/10 rounded-lg p-2.5 focus:border-yellow-500 outline-none text-white">
                                            <option>Profit</option>
                                            <option>Loss</option>
                                            <option>Break Even</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-400 uppercase font-bold">Pips (+/-)</label>
                                        <input type="number" value={form.pips} onChange={(e) => setForm({ ...form, pips: Number(e.target.value) })} className="w-full bg-black border border-white/10 rounded-lg p-2.5 focus:border-yellow-500 outline-none text-white" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-400 uppercase font-bold">Psychology</label>
                                        <select value={form.psychology} onChange={(e) => setForm({ ...form, psychology: e.target.value })} className="w-full bg-black border border-white/10 rounded-lg p-2.5 focus:border-yellow-500 outline-none text-white">
                                            <option value="">Select...</option>
                                            <option>Patient</option>
                                            <option>Disciplined</option>
                                            <option>FOMO</option>
                                            <option>Revenge Trading</option>
                                            <option>Overconfident</option>
                                            <option>Fearful</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-400 uppercase font-bold">Mistake</label>
                                        <select value={form.mistake} onChange={(e) => setForm({ ...form, mistake: e.target.value })} className="w-full bg-black border border-white/10 rounded-lg p-2.5 focus:border-yellow-500 outline-none text-white">
                                            <option>None</option>
                                            <option>Early Entry</option>
                                            <option>Late Entry</option>
                                            <option>No Stop Loss</option>
                                            <option>Moved Stop Loss</option>
                                            <option>Overleveraged</option>
                                            <option>Against Trend</option>
                                        </select>
                                    </div>
                                </div>
                                {/* Link to Signal */}
                                {signals.length > 0 && (
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-400 uppercase font-bold">Link to Signal (Optional)</label>
                                        <select value={form.signal_id} onChange={(e) => setForm({ ...form, signal_id: e.target.value })} className="w-full bg-black border border-white/10 rounded-lg p-2.5 focus:border-yellow-500 outline-none text-white">
                                            <option value="">No linked signal</option>
                                            {signals.map(s => (
                                                <option key={s.id} value={s.id}>{s.pair} {s.direction} — {s.status}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-400 uppercase font-bold">Reason & Mindset (Max 500 words)</label>
                                    <textarea rows={4} value={form.notes} onChange={(e) => {
                                        const words = e.target.value.split(/\s+/).filter(w => w.length > 0);
                                        if (words.length <= 500) {
                                            setForm({ ...form, notes: e.target.value });
                                        }
                                    }} placeholder="What was the reason for this profit or loss? What was on your mind when taking this trade? (Max 500 words)" className="w-full bg-black border border-white/10 rounded-lg p-2.5 focus:border-yellow-500 outline-none resize-none text-white text-sm" />
                                    <p className="text-[10px] text-gray-500 text-right">
                                        {form.notes.split(/\s+/).filter(w => w.length > 0).length}/500 words
                                    </p>
                                </div>
                                <button onClick={handleSave} disabled={saving || !form.pair} className="w-full py-3 bg-yellow-500 text-black font-bold rounded-xl mt-4 hover:bg-yellow-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                    Save Entry
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Entry Detail Modal */}
            <AnimatePresence>
                {selectedEntry && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedEntry(null)}>
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} onClick={(e) => e.stopPropagation()} className="bg-[#111] w-full max-w-lg rounded-2xl border border-white/10 overflow-hidden">
                            <div className="p-6 border-b border-white/5 flex justify-between items-center">
                                <h3 className="text-xl font-bold">{selectedEntry.pair} — {selectedEntry.date}</h3>
                                <button onClick={() => setSelectedEntry(null)} className="text-gray-400 hover:text-white"><XCircle className="w-6 h-6" /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase">Direction</p>
                                        <p className={`font-bold ${selectedEntry.direction === "BUY" ? "text-green-500" : "text-red-500"}`}>{selectedEntry.direction}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase">Outcome</p>
                                        <p className={`font-bold ${selectedEntry.outcome === "Profit" ? "text-green-400" : selectedEntry.outcome === "Loss" ? "text-red-400" : "text-gray-400"}`}>{selectedEntry.outcome}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase">Pips</p>
                                        <p className={`font-bold font-mono ${selectedEntry.pips >= 0 ? "text-green-400" : "text-red-400"}`}>{selectedEntry.pips > 0 ? "+" : ""}{selectedEntry.pips}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase">Psychology</p>
                                        <p className="font-bold text-white">{selectedEntry.psychology || "—"}</p>
                                    </div>
                                </div>
                                {selectedEntry.mistake && selectedEntry.mistake !== "None" && (
                                    <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-3">
                                        <p className="text-xs text-red-400 uppercase font-bold mb-1">Mistake Identified</p>
                                        <p className="text-red-300">{selectedEntry.mistake}</p>
                                    </div>
                                )}
                                {selectedEntry.notes && (
                                    <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
                                        <p className="text-xs text-gray-400 uppercase font-bold mb-1">Reason & Mindset</p>
                                        <p className="text-gray-300 text-sm leading-relaxed">{selectedEntry.notes}</p>
                                    </div>
                                )}
                                <button onClick={() => handleDelete(selectedEntry.id)} className="w-full py-2.5 bg-red-500/10 text-red-400 font-semibold rounded-xl hover:bg-red-500/20 transition-colors border border-red-500/10 text-sm">
                                    Delete Entry
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
