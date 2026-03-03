"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { BookOpen, Download, FileText, Lock, GraduationCap } from "lucide-react"

export default function VaultPage() {
    const [guides, setGuides] = useState([
        { id: 1, title: "Zen Pips: The Institutional Playbook", type: "PDF Strategy", level: "Elite", locked: false },
        { id: 2, title: "Market Structure Mastery", type: "PDF Guide", level: "Intermediate", locked: false },
        { id: 3, title: "Risk Management & Psychology", type: "PDF Guide", level: "Foundation", locked: false },
        { id: 4, title: "Advanced Orderflow Techniques", type: "Premium Course", level: "Elite", locked: true },
    ])

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-12 font-outfit">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-yellow-500 mb-2">
                            <GraduationCap className="w-6 h-6" />
                            <span className="text-sm font-bold uppercase tracking-widest">Education Hub</span>
                        </div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
                            The Dominator Vault
                        </h1>
                        <p className="text-gray-400 mt-2">Institutional-grade education for the selected few.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {guides.map((guide, i) => (
                        <motion.div
                            key={guide.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className="group relative bg-[#111] p-6 rounded-2xl border border-white/5 hover:border-yellow-500/50 transition-all cursor-pointer overflow-hidden"
                        >
                            {/* Glow effect */}
                            <div className="absolute -top-12 -right-12 w-24 h-24 bg-yellow-500/10 blur-3xl group-hover:bg-yellow-500/20 transition-all" />

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="bg-yellow-500/10 p-3 rounded-xl border border-yellow-500/20">
                                        <FileText className="w-6 h-6 text-yellow-500" />
                                    </div>
                                    {guide.locked && (
                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-md border border-white/10">
                                            <Lock className="w-3 h-3 text-gray-500" />
                                            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">LOCKED</span>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h3 className="text-xl font-bold text-white group-hover:text-yellow-500 transition-colors">
                                        {guide.title}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-xs text-gray-500">{guide.type}</span>
                                        <span className="w-1 h-1 bg-gray-700 rounded-full" />
                                        <span className="text-xs font-semibold text-yellow-500/80 uppercase tracking-wider">{guide.level}</span>
                                    </div>
                                </div>

                                <button
                                    disabled={guide.locked}
                                    className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${guide.locked
                                            ? 'bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed'
                                            : 'bg-white text-black hover:bg-yellow-500 transition-colors'
                                        }`}
                                >
                                    {guide.locked ? 'Unlock with Lifetime VIP' : 'Download Resources'}
                                    {!guide.locked && <Download className="w-4 h-4" />}
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Feature Banner */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    className="bg-gradient-to-br from-yellow-500/10 to-transparent p-8 rounded-3xl border border-yellow-500/10 flex flex-col md:flex-row items-center gap-8 justify-between"
                >
                    <div className="space-y-4 text-center md:text-left">
                        <h2 className="text-2xl font-bold">Want personalized mentorship?</h2>
                        <p className="text-gray-400 max-w-md">Join our weekly live breakdown sessions where we analyze institutional orderflow in real-time.</p>
                        <button className="bg-yellow-500 text-black px-8 py-3 rounded-xl font-bold hover:bg-yellow-400 transition-colors">
                            Apply for Mentorship
                        </button>
                    </div>
                    <div className="relative">
                        <div className="w-48 h-48 bg-yellow-500/20 blur-3xl absolute inset-0" />
                        <BookOpen className="w-32 h-32 text-yellow-500 relative z-10 opacity-50" />
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
