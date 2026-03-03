"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Book, Plus, TrendingUp, AlertCircle, CheckCircle2, XCircle, Brain } from "lucide-react"

export default function JournalPage() {
    const [showAdd, setShowAdd] = useState(false)

    const entries = [
        {
            id: 1,
            date: "2026-03-01",
            pair: "XAUUSD",
            direction: "BUY",
            pips: +45,
            outcome: "Profit",
            psychology: "Patient",
            mistake: "None",
            notes: "Institutional displacement confirmed on M15. Entered on FVG tap."
        },
        {
            id: 2,
            date: "2026-02-28",
            pair: "BTCUSD",
            direction: "SELL",
            pips: -30,
            outcome: "Loss",
            psychology: "FOMO",
            mistake: "Early Entry",
            notes: "Entered before break of structure. Lesson: Wait for confirmation."
        }
    ]

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-12 font-outfit">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
                            Trading Journal
                        </h1>
                        <p className="text-gray-400 mt-2">Log your journey. Refine your edge. Master the self.</p>
                    </div>
                    <button
                        onClick={() => setShowAdd(true)}
                        className="flex items-center gap-2 bg-yellow-500 text-black px-6 py-3 rounded-xl font-bold hover:bg-yellow-400 transition-all transform hover:scale-105 active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        New Entry
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: "Win Rate", value: "68%", icon: TrendingUp, color: "text-green-500" },
                        { label: "Avg Mistakes", value: "Early Entry", icon: Brain, color: "text-yellow-500" },
                        { label: "Total Logs", value: "42", icon: Book, color: "text-blue-500" },
                        { label: "Success Rate", value: "Institutional", icon: CheckCircle2, color: "text-purple-500" },
                    ].map((stat, i) => (
                        <div key={i} className="bg-[#111] p-4 rounded-xl border border-white/5 space-y-2">
                            <div className="flex items-center gap-2 text-gray-400">
                                <stat.icon className="w-4 h-4" />
                                <span className="text-xs uppercase tracking-wider">{stat.label}</span>
                            </div>
                            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Entries Table */}
                <div className="bg-[#111] rounded-2xl border border-white/5 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/5">
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
                                    <tr key={entry.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="p-4 text-sm text-gray-300">{entry.date}</td>
                                        <td className="p-4 font-bold">{entry.pair}</td>
                                        <td className={`p-4 font-semibold ${entry.direction === 'BUY' ? 'text-green-500' : 'text-red-500'}`}>
                                            {entry.direction}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tight ${entry.outcome === 'Profit' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                                                }`}>
                                                {entry.outcome}
                                            </span>
                                        </td>
                                        <td className={`p-4 font-mono ${entry.pips > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {entry.pips > 0 ? '+' : ''}{entry.pips}
                                        </td>
                                        <td className="p-4 text-sm text-gray-400 italic">
                                            {entry.mistake !== 'None' ? entry.mistake : <span className="text-gray-600">Perfect Execution</span>}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button className="text-gray-500 hover:text-white transition-colors">
                                                Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Add New Entry Modal (Placeholder Logic) */}
            <AnimatePresence>
                {showAdd && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-[#111] w-full max-w-2xl rounded-2xl border border-white/10 overflow-hidden"
                        >
                            <div className="p-6 border-b border-white/5 flex justify-between items-center">
                                <h3 className="text-xl font-bold">New Journal Entry</h3>
                                <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-white">
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-400 uppercase">Pair</label>
                                        <input type="text" placeholder="XAUUSD" className="w-full bg-black border border-white/10 rounded-lg p-2 focus:border-yellow-500 outline-none" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-400 uppercase">Outcome</label>
                                        <select className="w-full bg-black border border-white/10 rounded-lg p-2 focus:border-yellow-500 outline-none">
                                            <option>Profit</option>
                                            <option>Loss</option>
                                            <option>Break Even</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-400 uppercase">Psychological State & Mistakes</label>
                                    <textarea rows={3} placeholder="How did you feel? Was there FOMO?" className="w-full bg-black border border-white/10 rounded-lg p-2 focus:border-yellow-500 outline-none resize-none" />
                                </div>
                                <button
                                    onClick={() => setShowAdd(false)}
                                    className="w-full py-3 bg-yellow-500 text-black font-bold rounded-xl mt-4"
                                >
                                    Save Entry
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
