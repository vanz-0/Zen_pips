"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Newspaper, X, Zap, TrendingDown, TrendingUp, Clock, Globe, ShieldAlert } from "lucide-react"

interface NewsEvent {
    id: string
    currency: string
    impact: string
    event: string
    time: string
    forecast: string
    previous: string
}

export default function NewsModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const [newsData, setNewsData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (isOpen) {
            fetch('/api/news')
                .then(res => res.json())
                .then(data => {
                    setNewsData(data)
                    setLoading(false)
                })
        }
    }, [isOpen])

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-md"
                />

                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden glass rounded-[2rem] border border-white/10 shadow-2xl flex flex-col bg-[#050505]/40"
                >
                    {/* Header */}
                    <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-yellow-500/10 to-transparent">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-yellow-500 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
                                <Newspaper className="text-black w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-heading font-bold text-white tracking-tight">Institutional News Intel</h2>
                                <p className="text-xs text-neutral-400 uppercase tracking-widest font-semibold mt-1 flex items-center gap-2">
                                    <Globe className="w-3 h-3 text-yellow-500/50" />
                                    Live Global Economic Feed
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all group"
                        >
                            <X className="w-6 h-6 text-neutral-400 group-hover:text-white" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <div className="w-10 h-10 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin" />
                                <p className="text-neutral-500 uppercase tracking-widest text-[10px] font-bold">Parsing Market Data</p>
                            </div>
                        ) : (
                            <div className="space-y-10">
                                {/* AI Analysis Section */}
                                <section className="relative">
                                    <div className="absolute -inset-4 bg-yellow-500/5 rounded-[2rem] blur-xl" />
                                    <div className="relative glass-card p-6 border-yellow-500/20">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                            <h3 className="text-sm font-bold uppercase tracking-widest text-yellow-500">AI Institutional Insight</h3>
                                        </div>
                                        <p className="text-lg text-white leading-relaxed font-medium whitespace-pre-wrap">
                                            {newsData.aiAnalysis.replace(/\*\*/g, '')}
                                        </p>
                                        <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-6">
                                            <div className="flex items-center gap-2">
                                                <TrendingUp className="w-4 h-4 text-green-400" />
                                                <span className="text-[10px] uppercase font-bold text-neutral-500">Bulls Biased</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <TrendingDown className="w-4 h-4 text-red-400" />
                                                <span className="text-[10px] uppercase font-bold text-neutral-500">Bears Liquidated</span>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Events List */}
                                <section className="space-y-4">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 pl-2">High Impact Events</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {newsData.events.map((event: NewsEvent) => (
                                            <div key={event.id} className="glass-card p-5 border-white/5 hover:border-yellow-500/30 transition-all group">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-2 px-2 py-1 bg-yellow-500/10 rounded-md">
                                                        <span className="text-[10px] font-black text-yellow-500">{event.currency}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock className="w-3.5 h-3.5 text-neutral-500" />
                                                        <span className="text-[10px] font-bold text-neutral-400">
                                                            {new Date(event.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                                <h4 className="text-white font-bold text-sm mb-3 group-hover:text-yellow-400 transition-colors uppercase tracking-tight">
                                                    {event.event}
                                                </h4>
                                                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                                    <div className="space-y-1">
                                                        <p className="text-[9px] uppercase font-bold text-neutral-600 tracking-wider">Forecast</p>
                                                        <p className="text-xs font-mono text-neutral-300">{event.forecast}</p>
                                                    </div>
                                                    <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10">
                                                        <span className={`text-[9px] font-black uppercase ${event.impact === 'High' ? 'text-red-500 animate-pulse' : 'text-yellow-500'}`}>
                                                            {event.impact} IMPACT
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* Technical Confluence Footer */}
                                <footer className="pt-6 border-t border-white/5">
                                    <div className="flex items-center gap-2 mb-3">
                                        <ShieldAlert className="w-4 h-4 text-neutral-400" />
                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">Institutional Blackout Status</span>
                                    </div>
                                    <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                                        <p className="text-xs text-neutral-400 font-medium">
                                            {newsData.technicalSummary || "Analyzing market liquidity levels for institutional equilibrium..."}
                                        </p>
                                    </div>
                                </footer>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
