"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Book, Plus, TrendingUp, AlertCircle, CheckCircle2, XCircle,
    Brain, ArrowLeft, Loader2, Target, BarChart3, Flame, Calendar as CalendarIcon, ChevronLeft, ChevronRight,
    Zap, Clock, Shield, Trophy
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

// ─── Calendar Logic Helpers ───
const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
};

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
            .order("created_at", { ascending: false })

        if (!error && data) {
            setEntries(data as JournalEntry[])
        }
        setLoading(false)
    }, [user])

    // Calendar state
    const [currentDate, setCurrentDate] = useState(new Date());
    const daysInMonth = getDaysInMonth(currentDate.getMonth(), currentDate.getFullYear());
    const firstDay = getFirstDayOfMonth(currentDate.getMonth(), currentDate.getFullYear());
    
    const journaledDates = new Set(entries.map((e: any) => e.date));

    // ─── Institutional Performance Report Logic ───
    const currentMonthEntries = entries.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    });
    const currentMonthSignals = signals.filter(s => {
        const d = new Date(s.created_at);
        return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    });

    const monthPips = [...currentMonthEntries.map((e: any) => e.pips), ...currentMonthSignals.map((s: any) => s.total_pips || 0)].reduce((a: number, b: number) => a + b, 0);
    const monthWinRate = (currentMonthEntries.length + currentMonthSignals.length) > 0
        ? Math.round(([...currentMonthEntries, ...currentMonthSignals].filter((x: any) => (x as any).pips > 0 || (x as any).total_pips > 0).length / (currentMonthEntries.length + currentMonthSignals.length)) * 100)
        : 100;

    const topPair = currentMonthEntries.reduce((acc, e) => {
        acc[e.pair] = (acc[e.pair] || 0) + e.pips;
        return acc;
    }, {} as Record<string, number>);
    const bestPair = Object.entries(topPair).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    const commonMistakeMonth = currentMonthEntries.reduce((acc, e) => {
        if (e.mistake && e.mistake !== "None") acc[e.mistake] = (acc[e.mistake] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const monthMistake = Object.entries(commonMistakeMonth).sort((a, b) => b[1] - a[1])[0]?.[0] || "None";

    // Automated entry logic: Find signals taken but not journaled
    const pendingJournalSignals = signals.filter(s => 
        (s.status === 'ALL TPs HIT' || s.status === 'SL HIT' || s.status === 'CLOSED - BREAK EVEN') && 
        !entries.some(e => e.signal_id === s.id)
    );

    // Active trades feed — signals that are currently open
    const activeSignals = signals.filter(s => !s.closed && s.status !== 'CANCELLED');
    const closedSignals = signals.filter(s => s.closed || s.status === 'CANCELLED');

    // Stats — combined from journal entries + signals
    const journalWins = entries.filter(e => e.outcome === "Profit").length
    const journalLosses = entries.filter(e => e.outcome === "Loss").length
    const signalWins = closedSignals.filter(s => s.status?.includes('TP')).length
    const signalLosses = closedSignals.filter(s => s.status === 'STOPPED OUT').length
    const totalWins = journalWins + signalWins
    const totalLosses = journalLosses + signalLosses
    const totalTrades = totalWins + totalLosses
    const winRate = totalTrades > 0 ? Math.round((totalWins / totalTrades) * 100) : (activeSignals.length > 0 ? 100 : 0)
    const journalPips = entries.reduce((acc, e) => acc + e.pips, 0)
    const signalPips = signals.reduce((acc, s) => acc + (s.total_pips || 0), 0)
    const totalPips = journalPips + signalPips
    const commonMistake = entries.reduce((acc, e) => {
        if (e.mistake && e.mistake !== "None") {
            acc[e.mistake] = (acc[e.mistake] || 0) + 1
        }
        return acc
    }, {} as Record<string, number>)
    const topMistake = Object.entries(commonMistake).sort((a, b) => b[1] - a[1])[0]?.[0] || "Flawless"

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

    if (authLoading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="w-12 h-12 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="w-full text-[var(--foreground)] py-12 font-[family-name:var(--font-outfit)]">
            <div className="max-w-6xl mx-auto space-y-12">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-[var(--foreground)] to-[var(--text-muted)] bg-clip-text text-transparent font-[family-name:var(--font-outfit)]">Trading Journal</h1>
                        <p className="text-[var(--text-muted)] mt-2">Log your journey. Refine your edge. Master the self.</p>
                    </div>
                    <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-yellow-500 text-black px-6 py-3 rounded-xl font-bold hover:bg-yellow-400 transition-all transform hover:scale-105 active:scale-95">
                        <Plus className="w-5 h-5" />
                        New Entry
                    </button>
                </div>

                {/* 📊 Institutional Performance Report Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative p-8 rounded-3xl bg-gradient-to-br from-[var(--card-bg)] via-[var(--background)] to-[var(--card-bg)] border border-yellow-500/10 shadow-2xl overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Trophy className="w-40 h-40 text-yellow-500" />
                    </div>
                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-2 text-yellow-500 text-xs font-bold uppercase tracking-widest">
                            <Brain className="w-4 h-4" /> Automated Monthly Conclusion
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                            <div className="space-y-4">
                                <h3 className="text-lg sm:text-xl md:text-2xl font-bold italic">{currentDate.toLocaleString('default', { month: 'long' })} Performance Summary</h3>
                                <p className="text-[var(--text-muted)] text-sm leading-relaxed">
                                    Your institutional metrics for {currentDate.toLocaleString('default', { month: 'long' })} indicate a 
                                    <span className="text-yellow-500 font-bold"> {monthWinRate}% win rate</span>. 
                                    Execution was strongest on <span className="text-[var(--foreground)] font-bold">{bestPair}</span>. 
                                    We detected a primary leak in <span className="text-[var(--color-danger)] font-bold uppercase">{monthMistake}</span>.
                                </p>
                                <div className="flex gap-3">
                                    <div className="bg-[var(--panel-bg)] border border-[var(--border-color)] px-4 py-2 rounded-xl">
                                        <p className="text-[10px] text-[var(--text-muted)] uppercase">MONTHLY Net</p>
                                        <p className={`text-base sm:text-lg font-mono font-black ${monthPips >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>{monthPips > 0 ? '+' : ''}{Number(monthPips).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 3 })} Pips</p>
                                    </div>
                                    <div className="bg-[var(--panel-bg)] border border-[var(--border-color)] px-4 py-2 rounded-xl">
                                        <p className="text-[10px] text-[var(--text-muted)] uppercase">EXPECTANCY</p>
                                        <p className="text-lg font-mono font-black text-[var(--foreground)]">{monthWinRate > 50 ? 'POSITIVE' : 'NEUTRAL'}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-6 backdrop-blur-sm">
                                <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase mb-4 tracking-widest">Institutional Directives</h4>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3 text-xs text-[var(--text-muted)]">
                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1" />
                                        <span>Maintain current risk-per-trade of 1% on {bestPair}.</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-xs text-[var(--text-muted)]">
                                        <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-1" />
                                        <span>Wait for 15m BOS confirmation before scaling into holdings.</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-xs text-[var(--text-muted)]">
                                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1" />
                                        <span>Reduce {monthMistake} frequency to improve overall expectancy.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                        { label: "Active Trades", value: `${activeSignals.length}`, icon: Zap, color: "text-yellow-500" },
                        { label: "Win Rate", value: `${winRate}%`, icon: TrendingUp, color: "text-green-500" },
                        { label: "Total Pips", value: totalPips > 0 ? `+${Number(totalPips).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 3 })}` : `${Number(totalPips).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 3 })}`, icon: BarChart3, color: totalPips >= 0 ? "text-green-500" : "text-red-500" },
                        { label: "Total Logs", value: `${entries.length + signals.length}`, icon: Book, color: "text-[var(--color-info)]" },
                        { label: "Top Mistake", value: topMistake, icon: Brain, color: "text-yellow-500" },
                    ].map((stat, i: number) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-[var(--panel-bg)] p-4 rounded-xl border border-[var(--border-color)] space-y-2 hover:border-yellow-500/20 transition-colors">
                            <div className="flex items-center gap-2 text-[var(--text-muted)]">
                                <stat.icon className="w-4 h-4" />
                                <span className="text-xs uppercase tracking-wider">{stat.label}</span>
                            </div>
                            <p className={`text-lg sm:text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                        </motion.div>
                    ))}
                </div>

                {/* ═══ ACTIVE TRADES FEED ═══ */}
                {activeSignals.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Zap className="w-5 h-5 text-yellow-500" />
                            <h2 className="text-base sm:text-lg md:text-xl font-bold">Active Trades</h2>
                            <span className="ml-auto text-xs text-[var(--text-muted)] flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Live from Chart AI & Signals
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {activeSignals.map((sig, i) => {
                                return (
                                    <motion.div
                                        key={sig.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-2xl p-5 hover:border-yellow-500/20 transition-all relative overflow-hidden"
                                    >
                                        {/* Pulse indicator */}
                                        <div className="absolute top-4 right-4 flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                            <span className="text-[10px] text-green-500 uppercase font-bold tracking-widest">Live</span>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                                    sig.direction === 'BUY' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                                                }`}>{sig.direction}</span>
                                                <span className="text-lg font-bold text-[var(--foreground)]">{sig.pair}</span>
                                                <span className="text-[10px] text-[var(--text-muted)] font-mono">{sig.timeframe}</span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div className="bg-white/[0.03] rounded-lg p-2">
                                                    <p className="text-[10px] text-[var(--text-muted)] uppercase">Entry</p>
                                                    <p className="font-mono font-bold text-[var(--foreground)]">{sig.entry}</p>
                                                </div>
                                                <div className="bg-white/[0.03] rounded-lg p-2">
                                                    <p className="text-[10px] text-[var(--text-muted)] uppercase">Current SL</p>
                                                    <p className="font-mono font-bold text-[var(--foreground)]">{sig.current_sl}</p>
                                                </div>
                                            </div>

                                            {/* TP Progress */}
                                            <div className="space-y-1">
                                                {[{ label: 'TP1', value: sig.tp1, hit: sig.tp1_hit },
                                                  { label: 'TP2', value: sig.tp2, hit: sig.tp2_hit },
                                                  { label: 'TP3', value: sig.tp3, hit: sig.tp3_hit }].map((tp: any) => (
                                                    <div key={tp.label} className="flex items-center gap-2 text-xs">
                                                        <span className={`w-12 font-bold ${tp.hit ? 'text-green-500' : 'text-[var(--text-muted)]'}`}>{tp.label}</span>
                                                        <div className="flex-1 h-1.5 bg-[var(--panel-bg)] rounded-full overflow-hidden">
                                                            <div className={`h-full rounded-full transition-all duration-500 ${
                                                                tp.hit ? 'bg-green-500 w-full' : 'bg-gray-700 w-0'
                                                            }`} style={{ width: tp.hit ? '100%' : '0%' }} />
                                                        </div>
                                                        <span className={`font-mono text-[11px] ${tp.hit ? 'text-[var(--color-success)]' : 'text-[var(--text-muted)]'}`}>{tp.value}</span>
                                                        {tp.hit && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)]">
                                                <div className="flex items-center gap-1">
                                                    <Shield className={`w-3 h-3 ${sig.status === 'CANCELLED' ? 'text-[var(--text-muted)]' : 'text-yellow-500'}`} />
                                                    <span className={`text-[10px] uppercase font-bold ${
                                                    sig.status === 'CANCELLED' ? 'text-red-500/50' : 'text-[var(--text-muted)]'
                                                }`}>{sig.status === 'CANCELLED' ? 'INVALIDATED' : (sig.status || 'ACTIVE')}</span>
                                                </div>
                                                <span className={`text-sm font-bold font-mono ${
                                                    (sig.total_pips || 0) >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'
                                                }`}>{(sig.total_pips || 0) > 0 ? '+' : ''}{Math.round(sig.total_pips || 0)} pips</span>
                                            </div>

                                            {sig.confluence && (
                                                <p className="text-[10px] text-[var(--text-muted)] italic">🧠 {sig.confluence}</p>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Calendar Interface */}
                <div className="bg-[var(--panel-bg)] p-4 sm:p-8 rounded-3xl border border-[var(--border-color)] space-y-6 shadow-xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-yellow-500/10 p-2 rounded-lg">
                                <CalendarIcon className="w-5 h-5 text-yellow-500" />
                            </div>
                            <div>
                                <h2 className="text-base sm:text-lg md:text-xl font-bold">Discipline Tracker</h2>
                                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-black">Trade Continuity System</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-4">
                            <span className="text-sm font-bold text-[var(--text-muted)] font-mono">
                                {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </span>
                            <div className="flex bg-[var(--panel-bg)] rounded-xl p-1 border border-[var(--border-color)]">
                                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-2 hover:bg-[var(--border-color)] rounded-lg transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-2 hover:bg-[var(--border-color)] rounded-lg transition-colors"><ChevronRight className="w-4 h-4" /></button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 sm:gap-3">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d: string) => (
                            <div key={d} className="text-[8px] sm:text-[10px] text-[var(--text-muted)] uppercase font-black text-center mb-2 tracking-widest">{d}</div>
                        ))}
                        {Array.from({ length: firstDay }).map((_, i) => (
                            <div key={`empty-${i}`} className="aspect-square bg-transparent" />
                        ))}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const fullDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);

                            // ─── CRITICAL: Don't render future dates ───
                            const today = new Date();
                            today.setHours(23, 59, 59, 999);
                            if (fullDate > today) {
                                return (
                                    <div key={day} className="aspect-square rounded-lg sm:rounded-2xl border border-[var(--border-color)] bg-[#0a0a0a]/30 p-1 sm:p-3 flex flex-col justify-between opacity-30">
                                        <span className="text-[8px] sm:text-[10px] font-black opacity-20">{day}</span>
                                    </div>
                                );
                            }

                            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const isToday = new Date().toDateString() === fullDate.toDateString();
                            
                            // ─── Multi-Day Activity Logic ───
                            const dayEntries = entries.filter(e => e.date === dateStr);
                            const daySignalsStarted = signals.filter(s => s.created_at?.startsWith(dateStr));
                            
                            // Check for signals active on THIS day (held over from a previous day)
                            const dayStart = new Date(fullDate).setHours(0,0,0,0);
                            const dayEnd = new Date(fullDate).setHours(23,59,59,999);
                            
                            const holdingSignals = signals.filter(s => {
                                const created = new Date(s.created_at).getTime();
                                if (created > dayEnd) return false; // Signal didn't exist yet
                                if (s.created_at?.startsWith(dateStr)) return false; // Started this day, not "holding"
                                // For unclosed signals, cap active range at TODAY (not infinity)
                                const nowTs = Date.now();
                                const effectiveClose = s.closed 
                                    ? new Date(s.last_checked || s.created_at).getTime()
                                    : nowTs;
                                return effectiveClose >= dayStart;
                            });

                            // ─── Calculate TP-based pips for holding days ───
                            // On days a TP was hit, attribute those pips to that day
                            let holdingDayPips = 0;
                            let hadTPHitEvent = false;
                            
                            holdingSignals.forEach(s => {
                                const pipMultiplier = Number(s.pip_multiplier) || 10;
                                const entry = Number(s.entry) || 0;
                                const tp1 = Number(s.tp1) || 0;
                                const tp2 = Number(s.tp2) || 0;
                                
                                // Check if last_checked falls on THIS day (TP status likely changed this day)
                                const lastChecked = s.last_checked ? new Date(s.last_checked) : null;
                                const checkedOnThisDay = lastChecked && lastChecked.toDateString() === fullDate.toDateString();
                                
                                // TP1 hit: pips = |tp1 - entry| * multiplier
                                const tp1Pips = Math.abs(tp1 - entry) * pipMultiplier;
                                // TP2 hit: pips = |tp2 - tp1| * multiplier  (incremental gain)
                                const tp2Pips = Math.abs(tp2 - tp1) * pipMultiplier;
                                
                                // Determine what happened by this day based on signal status
                                if (s.tp2_hit) {
                                    // TP2 was hit at some point. If last_checked is on this day, attribute TP2 pips here
                                    if (checkedOnThisDay) {
                                        holdingDayPips += tp2Pips;
                                        hadTPHitEvent = true;
                                    } else if (s.tp1_hit && !checkedOnThisDay) {
                                        // TP hits happened but not necessarily today - show as profitable hold
                                        holdingDayPips += 0; // Still holding profitably
                                    }
                                } else if (s.tp1_hit) {
                                    // Only TP1 hit. If last_checked is today, TP1 was hit today
                                    if (checkedOnThisDay) {
                                        holdingDayPips += tp1Pips;
                                        hadTPHitEvent = true;
                                    }
                                }
                                
                                // If no specific TP event today but trade is active, it's just a hold day
                            });

                            const hasActivity = dayEntries.length > 0 || daySignalsStarted.length > 0 || holdingSignals.length > 0;
                            
                            // Calculate performance
                            const entryPips = dayEntries.reduce((acc, e) => acc + (e.pips || 0), 0);
                            const signalPips = daySignalsStarted.reduce((acc, s) => acc + (s.total_pips || 0), 0);
                            
                            // Determine day type
                            const isTradeStartDay = daySignalsStarted.length > 0 || dayEntries.length > 0;
                            const isHoldingWithTP = holdingSignals.length > 0 && hadTPHitEvent;
                            const isHoldingOnly = holdingSignals.length > 0 && !hadTPHitEvent && !isTradeStartDay;
                            const isActiveToday = isToday && holdingSignals.length > 0 && !hadTPHitEvent && !isTradeStartDay;
                            
                            const netPips = Math.round((entryPips + signalPips + holdingDayPips) * 1000) / 1000;
                            
                            // Determine label and color
                            let cellStyle = "bg-[#0a0a0a]/50 border-[var(--border-color)] text-gray-800 hover:border-[var(--border-color)]";
                            let label = "";
                            let sublabel = "";
                            
                            if (hasActivity) {
                                if (isActiveToday) {
                                    // Today with active orders - special glow
                                    cellStyle = "bg-orange-500/10 border-orange-500/40 text-[var(--color-warning)] shadow-[0_0_20px_rgba(249,115,22,0.25)]";
                                    label = "ACTIVE";
                                    sublabel = `${holdingSignals.length} ORDER${holdingSignals.length > 1 ? 'S' : ''}`;
                                } else if (isHoldingWithTP && holdingDayPips > 0) {
                                    // Day where a TP was hit - GREEN with pips
                                    cellStyle = "bg-green-500/10 border-green-500/30 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.1)]";
                                    label = `+${Number(holdingDayPips).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 3 })}`;
                                    sublabel = "TP SECURED";
                                } else if (isTradeStartDay && netPips > 0) {
                                    cellStyle = "bg-green-500/10 border-green-500/30 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.1)]";
                                    label = `+${Number(netPips).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 3 })}`;
                                    sublabel = `${dayEntries.length + daySignalsStarted.length} TRADE${(dayEntries.length + daySignalsStarted.length) > 1 ? 'S' : ''}`;
                                } else if (isTradeStartDay && netPips < 0) {
                                    cellStyle = "bg-red-500/10 border-red-500/30 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.1)]";
                                    label = `${Math.round(netPips)}`;
                                    sublabel = `${dayEntries.length + daySignalsStarted.length} TRADE${(dayEntries.length + daySignalsStarted.length) > 1 ? 'S' : ''}`;
                                } else if (isHoldingOnly) {
                                    cellStyle = "bg-blue-500/10 border-blue-500/30 text-[var(--color-info)] shadow-[0_0_15px_rgba(59,130,246,0.1)]";
                                    label = "HOLDING";
                                    sublabel = `${holdingSignals.length} ACTIVE`;
                                } else {
                                    cellStyle = "bg-gray-500/10 border-[var(--border-color)] text-[var(--text-muted)]";
                                    label = `${Math.round(netPips)}`;
                                    sublabel = "BREAK EVEN";
                                }
                            } else if (isToday) {
                                cellStyle = "bg-orange-500/10 border-orange-500/40 text-[var(--color-warning)] shadow-[0_0_20px_rgba(249,115,22,0.25)]";
                            }

                            return (
                                <motion.div
                                    key={day}
                                    whileHover={{ scale: 1.05 }}
                                    className={`aspect-square rounded-lg sm:rounded-2xl border p-1 sm:p-3 flex flex-col justify-between transition-all relative group cursor-pointer ${cellStyle}`}
                                    onClick={() => {
                                        if (dayEntries.length > 0) setSelectedEntry(dayEntries[0]);
                                        else if (daySignalsStarted.length > 0) {
                                            setForm(prev => ({ ...prev, date: dateStr, pair: daySignalsStarted[0].pair, pips: daySignalsStarted[0].total_pips || 0, outcome: (daySignalsStarted[0].total_pips || 0) > 0 ? 'Profit' : 'Loss' }));
                                            setShowAdd(true);
                                        } else {
                                            setForm(prev => ({ ...prev, date: dateStr }));
                                            setShowAdd(true);
                                        }
                                    }}
                                >
                                    <span className="text-[10px] font-black opacity-40">{day}</span>
                                    
                                    {hasActivity && (
                                        <div className="text-center space-y-0.5 hidden sm:block">
                                            <p className="text-[8px] sm:text-[10px] font-black leading-none tracking-tighter">
                                                {isActiveToday || isHoldingOnly ? (
                                                    <span className="flex items-center justify-center gap-0.5 sm:gap-1"><Shield className="w-1.5 h-1.5 sm:w-2 sm:h-2" /> {label}</span>
                                                ) : (
                                                    <span>{label}</span>
                                                )}
                                            </p>
                                            <p className="text-[5px] sm:text-[6px] uppercase font-black tracking-widest opacity-60 overflow-hidden line-clamp-1">
                                                {sublabel}
                                            </p>
                                        </div>
                                    )}
                                    
                                    {isToday && <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)] animate-ping" />}
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Pending Journals (Automated Feed) */}
                {pendingJournalSignals.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Flame className="w-5 h-5 text-orange-500" />
                            <h2 className="text-base sm:text-lg md:text-xl font-bold">Awaiting Your Analysis</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {pendingJournalSignals.map((sig: any) => (
                                <motion.div
                                    key={sig.id}
                                    whileHover={{ y: -2 }}
                                    className="bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-xl p-4 flex flex-col justify-between gap-4"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">{sig.pair}</p>
                                            <p className={`text-lg font-bold ${sig.status?.includes('TP') ? 'text-green-500' : 'text-red-500'}`}>
                                                {sig.status?.includes('TP') ? 'Profit Target Hit' : 'Exit Realized'}
                                            </p>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${sig.direction === 'BUY' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                            {sig.direction}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setForm({
                                                date: sig.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
                                                pair: sig.pair,
                                                direction: sig.direction as any,
                                                pips: sig.total_pips || 0,
                                                outcome: sig.status?.includes('TP') ? 'Profit' : 'Loss',
                                                psychology: "",
                                                mistake: "None",
                                                notes: "",
                                                signal_id: sig.id
                                            });
                                            setShowAdd(true);
                                        }}
                                        className="w-full py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 text-xs font-bold rounded-lg transition-colors border border-yellow-500/20"
                                    >
                                        Add Analysis to Journal
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Entries Table */}
                <div className="bg-[var(--panel-bg)] rounded-2xl border border-[var(--border-color)] overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center p-12">
                            <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
                        </div>
                    ) : entries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 gap-4">
                            <Book className="w-12 h-12 text-[var(--text-muted)]" />
                            <p className="text-[var(--text-muted)]">No journal entries yet. Start logging your trades!</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-500/20 scrollbar-track-transparent">
                            <table className="w-full text-left relative">
                                <thead>
                                    <tr className="border-b border-[var(--border-color)] bg-white/[0.03]">
                                        <th className="p-4 text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold">Date</th>
                                        <th className="p-4 text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold">Pair</th>
                                        <th className="p-4 text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold">Direction</th>
                                        <th className="p-4 text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold">Outcome</th>
                                        <th className="p-4 text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold">Pips</th>
                                        <th className="p-4 text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold">Mistake</th>
                                        <th className="p-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {entries.map((entry) => (
                                        <tr key={entry.id} className="hover:bg-white/[0.02] transition-colors group cursor-pointer" onClick={() => setSelectedEntry(entry)}>
                                            <td className="p-4 text-sm text-[var(--text-muted)]">{entry.date}</td>
                                            <td className="p-4 font-bold">{entry.pair}</td>
                                            <td className={`p-4 font-semibold ${entry.direction === "BUY" ? "text-green-500" : "text-red-500"}`}>{entry.direction}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tight ${entry.outcome === "Profit" ? "bg-green-500/10 text-green-500" : entry.outcome === "Loss" ? "bg-red-500/10 text-red-500" : "bg-gray-500/10 text-[var(--text-muted)]"}`}>
                                                    {entry.outcome}
                                                </span>
                                            </td>
                                            <td className={`p-4 font-mono ${entry.pips > 0 ? "text-[var(--color-success)]" : entry.pips < 0 ? "text-[var(--color-danger)]" : "text-[var(--text-muted)]"}`}>
                                                {entry.pips > 0 ? "+" : ""}{Number(entry.pips).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 3 })}
                                            </td>
                                            <td className="p-4 text-sm text-[var(--text-muted)] italic">
                                                {entry.mistake !== "None" ? entry.mistake : <span className="text-[var(--text-muted)]">Perfect Execution</span>}
                                            </td>
                                            <td className="p-4 text-right">
                                                <span className="text-[var(--text-muted)] group-hover:text-[var(--foreground)] transition-colors text-sm">Details →</span>
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
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} onClick={(e) => e.stopPropagation()} className="bg-[var(--card-bg)] w-full max-w-2xl rounded-2xl border border-[var(--border-color)] overflow-hidden max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center sticky top-0 bg-[var(--card-bg)] z-10">
                                <h3 className="text-base sm:text-lg md:text-xl font-bold">New Journal Entry</h3>
                                <button onClick={() => setShowAdd(false)} className="text-[var(--text-muted)] hover:text-[var(--foreground)]"><XCircle className="w-6 h-6" /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs text-[var(--text-muted)] uppercase font-bold">Date</label>
                                        <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full bg-[var(--panel-bg)] dark:[color-scheme:dark] [color-scheme:light] border border-[var(--border-color)] rounded-lg p-2.5 focus:border-yellow-500 outline-none text-[var(--foreground)]" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-[var(--text-muted)] uppercase font-bold">Pair</label>
                                        <input type="text" value={form.pair} onChange={(e) => setForm({ ...form, pair: e.target.value })} placeholder="XAUUSD" className="w-full bg-[var(--panel-bg)] dark:[color-scheme:dark] [color-scheme:light] border border-[var(--border-color)] rounded-lg p-2.5 focus:border-yellow-500 outline-none text-[var(--foreground)]" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs text-[var(--text-muted)] uppercase font-bold">Direction</label>
                                        <select value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value as "BUY" | "SELL" })} className="w-full bg-[var(--panel-bg)] dark:[color-scheme:dark] [color-scheme:light] border border-[var(--border-color)] rounded-lg p-2.5 focus:border-yellow-500 outline-none text-[var(--foreground)]">
                                            <option value="BUY">BUY</option>
                                            <option value="SELL">SELL</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-[var(--text-muted)] uppercase font-bold">Outcome</label>
                                        <select value={form.outcome} onChange={(e) => setForm({ ...form, outcome: e.target.value as "Profit" | "Loss" | "Break Even" })} className="w-full bg-[var(--panel-bg)] dark:[color-scheme:dark] [color-scheme:light] border border-[var(--border-color)] rounded-lg p-2.5 focus:border-yellow-500 outline-none text-[var(--foreground)]">
                                            <option>Profit</option>
                                            <option>Loss</option>
                                            <option>Break Even</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-[var(--text-muted)] uppercase font-bold">Pips (+/-)</label>
                                        <input type="number" value={form.pips} onChange={(e) => setForm({ ...form, pips: Number(e.target.value) })} className="w-full bg-[var(--panel-bg)] dark:[color-scheme:dark] [color-scheme:light] border border-[var(--border-color)] rounded-lg p-2.5 focus:border-yellow-500 outline-none text-[var(--foreground)]" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs text-[var(--text-muted)] uppercase font-bold">Psychology</label>
                                        <select value={form.psychology} onChange={(e) => setForm({ ...form, psychology: e.target.value })} className="w-full bg-[var(--panel-bg)] dark:[color-scheme:dark] [color-scheme:light] border border-[var(--border-color)] rounded-lg p-2.5 focus:border-yellow-500 outline-none text-[var(--foreground)]">
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
                                        <label className="text-xs text-[var(--text-muted)] uppercase font-bold">Mistake</label>
                                        <select value={form.mistake} onChange={(e) => setForm({ ...form, mistake: e.target.value })} className="w-full bg-[var(--panel-bg)] dark:[color-scheme:dark] [color-scheme:light] border border-[var(--border-color)] rounded-lg p-2.5 focus:border-yellow-500 outline-none text-[var(--foreground)]">
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
                                        <label className="text-xs text-[var(--text-muted)] uppercase font-bold">Link to Signal (Optional)</label>
                                        <select value={form.signal_id} onChange={(e) => setForm({ ...form, signal_id: e.target.value })} className="w-full bg-[var(--panel-bg)] dark:[color-scheme:dark] [color-scheme:light] border border-[var(--border-color)] rounded-lg p-2.5 focus:border-yellow-500 outline-none text-[var(--foreground)]">
                                            <option value="">No linked signal</option>
                                            {signals.map((s: any) => (
                                                <option key={s.id} value={s.id}>{s.pair} {s.direction} — {s.status}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <div className="space-y-1">
                                    <label className="text-xs text-[var(--text-muted)] uppercase font-bold">Reason & Mindset (Max 500 words)</label>
                                    <textarea rows={4} value={form.notes} onChange={(e) => {
                                        const words = e.target.value.split(/\s+/).filter(w => w.length > 0);
                                        if (words.length <= 500) {
                                            setForm({ ...form, notes: e.target.value });
                                        }
                                    }} placeholder="What was the reason for this profit or loss? What was on your mind when taking this trade? (Max 500 words)" className="w-full bg-[var(--panel-bg)] dark:[color-scheme:dark] [color-scheme:light] border border-[var(--border-color)] rounded-lg p-2.5 focus:border-yellow-500 outline-none resize-none text-[var(--foreground)] text-sm" />
                                    <p className="text-[10px] text-[var(--text-muted)] text-right">
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
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} onClick={(e) => e.stopPropagation()} className="bg-[var(--card-bg)] w-full max-w-lg rounded-2xl border border-[var(--border-color)] overflow-hidden">
                            <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center">
                                <h3 className="text-base sm:text-lg md:text-xl font-bold">{selectedEntry.pair} — {selectedEntry.date}</h3>
                                <button onClick={() => setSelectedEntry(null)} className="text-[var(--text-muted)] hover:text-[var(--foreground)]"><XCircle className="w-6 h-6" /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-[var(--text-muted)] uppercase">Direction</p>
                                        <p className={`font-bold ${selectedEntry.direction === "BUY" ? "text-green-500" : "text-red-500"}`}>{selectedEntry.direction}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--text-muted)] uppercase">Outcome</p>
                                        <p className={`font-bold ${selectedEntry.outcome === "Profit" ? "text-[var(--color-success)]" : selectedEntry.outcome === "Loss" ? "text-[var(--color-danger)]" : "text-[var(--text-muted)]"}`}>{selectedEntry.outcome}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--text-muted)] uppercase">Pips</p>
                                        <p className={`font-bold font-mono ${selectedEntry.pips >= 0 ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}`}>{selectedEntry.pips > 0 ? "+" : ""}{selectedEntry.pips}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--text-muted)] uppercase">Psychology</p>
                                        <p className="font-bold text-[var(--foreground)]">{selectedEntry.psychology || "—"}</p>
                                    </div>
                                </div>
                                {selectedEntry.mistake && selectedEntry.mistake !== "None" && (
                                    <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-3">
                                        <p className="text-xs text-[var(--color-danger)] uppercase font-bold mb-1">Mistake Identified</p>
                                        <p className="text-red-300">{selectedEntry.mistake}</p>
                                    </div>
                                )}
                                {selectedEntry.notes && (
                                    <div className="bg-white/[0.02] border border-[var(--border-color)] rounded-lg p-3">
                                        <p className="text-xs text-[var(--text-muted)] uppercase font-bold mb-1">Reason & Mindset</p>
                                        <p className="text-[var(--text-muted)] text-sm leading-relaxed">{selectedEntry.notes}</p>
                                    </div>
                                )}
                                <button onClick={() => handleDelete(selectedEntry.id)} className="w-full py-2.5 bg-red-500/10 text-[var(--color-danger)] font-semibold rounded-xl hover:bg-red-500/20 transition-colors border border-red-500/10 text-sm">
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
