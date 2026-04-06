"use client"

import { motion } from "framer-motion"
import { 
    Zap, Shield, Cpu, BookOpen, Clock, Activity, 
    CheckCircle2, ArrowRight, Download, Printer, 
    Smartphone, Monitor, Globe, Mail, MessageSquare, 
    TrendingUp, BarChart3, PieChart, Users, Star, 
    CreditCard, Bitcoin, AlertCircle, Info, Landmark, 
    LineChart, LayoutDashboard, BrainCircuit, Terminal
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function GuidePage() {
    return (
        <div className="min-h-screen bg-[#050505] text-white font-[family-name:var(--font-outfit)] selection:bg-yellow-500/30">
            {/* ─── Navigation Header ─── */}
            <nav className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 print:hidden">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-[#d4af37] rounded-full p-0.5 shadow-2xl border border-yellow-600/30">
                            <div className="w-full h-full bg-[#0a0a0a] rounded-full overflow-hidden relative">
                                <Image 
                                    src="/logo.png" 
                                    alt="Zen Pips" 
                                    fill 
                                    className="object-contain scale-150" 
                                />
                            </div>
                        </div>
                        <span className="font-bold text-xl tracking-tighter uppercase italic text-white">Institutional <span className="text-yellow-500">Guide</span></span>
                    </div>
                    <div className="flex gap-4">
                        <button 
                            onClick={() => window.print()}
                            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/10 transition-all font-bold text-sm"
                        >
                            <Printer className="w-4 h-4" /> Print PDF
                        </button>
                        <a href="/" className="px-4 py-2 bg-yellow-500 text-black font-bold rounded-xl text-sm hover:brightness-110 transition-all">
                            DASHBOARD
                        </a>
                    </div>
                </div>
            </nav>

            <main className="max-w-5xl mx-auto px-6 py-12 md:py-20 space-y-24 pb-32">
                
                {/* ─── Hero Section ─── */}
                <section className="text-center space-y-6">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-xs font-bold uppercase tracking-widest"
                    >
                        <Star className="w-3 h-3 fill-yellow-500" /> Member Protocol 2026
                    </motion.div>
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-7xl font-black italic tracking-tighter leading-[0.9] text-[var(--foreground)]"
                    >
                        THE INSTITUTIONAL <br />
                        <span className="text-yellow-500 drop-shadow-[0_0_30px_rgba(212,175,55,0.3)]">MARKET STRUCTURE</span> <br />
                        COMMAND GUIDE
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed pt-4"
                    >
                        Welcome to the elite 1%. This guide outlines the exact protocols for navigating the Zen Pips ecosystem—from Telegram alerts to automated MT5 execution and AI-driven chart analysis.
                    </motion.p>
                </section>

                {/* ─── Section 1: The Gateway Ecosystem ─── */}
                <section className="space-y-12">
                    <div className="flex items-center gap-4 border-l-4 border-yellow-500 pl-6">
                        <h2 className="text-3xl font-black uppercase italic tracking-tight">01. The Ecosystem</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { 
                                icon: <Smartphone className="text-blue-400" />, 
                                title: "Telegram Channel", 
                                desc: "Your primary alert source. Instant notifications for Entry, SL, and multiple TP levels." 
                            },
                            { 
                                icon: <LayoutDashboard className="text-yellow-500" />, 
                                title: "Web Command Center", 
                                desc: "Your central hub for journaling, education, and real-time portfolio analytics." 
                            },
                            { 
                                icon: <Terminal className="text-green-500" />, 
                                title: "The MT5 Bridge", 
                                desc: "Automated copier linking our institutional signals directly to your brokerage account." 
                            }
                        ].map((item, i) => (
                            <div key={i} className="bg-[#0a0a0a] border border-white/5 p-8 rounded-3xl space-y-4 hover:border-yellow-500/30 transition-all">
                                <div className="p-3 bg-white/5 rounded-2xl w-fit">{item.icon}</div>
                                <h3 className="text-xl font-bold">{item.title}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ─── Section 2: Telegram Signal Mastery ─── */}
                <section className="space-y-12 bg-white/[0.02] border border-white/5 rounded-[3rem] p-8 md:p-12">
                    <div className="flex items-center gap-4">
                        <MessageSquare className="w-8 h-8 text-yellow-500" />
                        <h2 className="text-3xl font-black uppercase italic tracking-tight">02. Signal Protocol</h2>
                    </div>
                    <div className="space-y-8">
                        <p className="text-gray-400 leading-relaxed">
                            Our signals are high-probability entries based on Institutional Orderflow and Liquidity Sweeps. Here is how to execute them correctly:
                        </p>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            <div className="space-y-6">
                                <div className="p-6 bg-black rounded-2xl border border-white/10 font-mono text-sm space-y-2">
                                    <p className="text-yellow-500 font-bold tracking-widest">🚨 ZEN PIPS VIP ALERT</p>
                                    <p>📊 <strong>Pair:</strong> XAU/USD</p>
                                    <p>🎯 <strong>Action:</strong> BUY LIMIT</p>
                                    <p>🕒 <strong>Timeframe:</strong> 15m (NY Session)</p>
                                    <br />
                                    <p className="bg-white/5 p-2 rounded">🔽 ENTRY: 2410.50</p>
                                    <p className="text-red-400">🚫 SL: 2405.00</p>
                                    <br />
                                    <p className="text-green-400">✅ TP 1: 2415.50 (+50 Pips)</p>
                                    <p className="text-green-400">✅ TP 2: 2422.00 (+115 Pips)</p>
                                </div>
                                <div className="flex items-start gap-4">
                                    <Info className="w-5 h-5 text-yellow-500 shrink-0 mt-1" />
                                    <p className="text-xs text-gray-500 italic">Example of an institutional signal. Note the clear Entry, SL, and multiple Take Profit levels.</p>
                                </div>
                            </div>
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <h4 className="text-lg font-bold flex items-center gap-2">
                                        <CheckCircle2 className="w-5 h-5 text-green-500" /> The Rule of Phase Extraction
                                    </h4>
                                    <ul className="space-y-4 text-sm text-gray-400 pl-7 list-disc">
                                        <li><strong>TP1 HIT:</strong> Secure 50% partial profits and MOVE SL TO BREAKEVEN (Entry). The trade is now risk-free.</li>
                                        <li><strong>TP2 HIT:</strong> Secure the remaining 50% or trail SL to TP1 to capture maximum trend extension.</li>
                                        <li><strong>TP3 HIT:</strong> Full extraction. Exit market and step away from the charts.</li>
                                    </ul>
                                </div>
                                <div className="p-5 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl">
                                    <p className="text-xs text-yellow-500 font-bold leading-relaxed">
                                        ⚠️ WARNING: We never risk more than 1-2% of equity per trade. Discipline is more important than the signal itself.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─── Section 3: The Dashboard Mastery ─── */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-8 order-2 lg:order-1">
                        <div className="flex items-center gap-4">
                            <Monitor className="w-8 h-8 text-blue-400" />
                            <h2 className="text-3xl font-black uppercase italic tracking-tight">03. Web Mastery</h2>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold">The Institutional Journal</h3>
                                <p className="text-sm text-gray-500">Every trade must be logged. Tracking your pips and emotional state is the only way to professional consistency.</p>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold">The Education Vault</h3>
                                <p className="text-sm text-gray-500">Access hours of institutional content (SMC, ICT, Psychology) to build your own technical edge.</p>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold">Bridge Analytics</h3>
                                <p className="text-sm text-gray-500">Connect your HFM account via your 8-digit Login ID. 100% cloud-automated synchronization.</p>
                            </div>
                        </div>
                    </div>
                    <div className="relative order-1 lg:order-2">
                         <div className="aspect-square bg-gradient-to-br from-yellow-500/20 via-transparent to-blue-500/20 rounded-full blur-3xl absolute inset-0 -z-10" />
                         <div className="bg-[#0d0d0d] border border-white/10 rounded-[2rem] p-8 shadow-2xl space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="w-32 h-2 bg-white/10 rounded-full" />
                                <div className="w-8 h-8 rounded-full bg-yellow-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="h-24 bg-white/5 rounded-2xl" />
                                <div className="h-24 bg-white/5 rounded-2xl" />
                                <div className="h-32 col-span-2 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-center justify-center">
                                    <BarChart3 className="w-8 h-8 text-yellow-500 opacity-50" />
                                </div>
                            </div>
                         </div>
                    </div>
                </section>

                {/* ─── Section 4: Chart AI Vision ─── */}
                <section className="space-y-12">
                    <div className="flex items-center gap-4">
                        <BrainCircuit className="w-8 h-8 text-purple-400" />
                        <h2 className="text-3xl font-black uppercase italic tracking-tight">04. AI Vision Intelligence</h2>
                    </div>
                    <div className="bg-gradient-to-br from-[#111] to-black border border-white/5 rounded-3xl p-8 md:p-12 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-6">
                                <p className="text-gray-400">
                                    Our proprietary <strong className="text-white">Zen Vision Engine</strong> allows you to upload any chart screenshot for instant institutional structure analysis.
                                </p>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-purple-500/30 transition-all">
                                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">1</div>
                                        <p className="text-xs font-bold uppercase tracking-widest text-gray-300">Upload TradingView Screenshot</p>
                                    </div>
                                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-purple-500/30 transition-all">
                                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">2</div>
                                        <p className="text-xs font-bold uppercase tracking-widest text-gray-300">AI Identifies BOS/CHoCH/FVG</p>
                                    </div>
                                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-purple-500/30 transition-all">
                                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">3</div>
                                        <p className="text-xs font-bold uppercase tracking-widest text-gray-300">Get Probabilistic Alpha Bias</p>
                                    </div>
                                </div>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-0 bg-purple-500/20 blur-[100px] group-hover:bg-purple-500/40 transition-all duration-1000" />
                                <div className="relative bg-black/40 border border-white/10 p-6 rounded-3xl flex flex-col items-center justify-center gap-6 backdrop-blur-xl">
                                    <Cpu className="w-12 h-12 text-purple-400 animate-pulse" />
                                    <div className="text-center space-y-2">
                                        <p className="text-purple-400 font-mono text-[10px] uppercase font-bold tracking-widest">Neural Link Active</p>
                                        <p className="text-xs text-gray-500 italic max-w-[200px]">"Analyze higher timeframes for macro bias before executing local sessions."</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─── Section 5: The Zen Advantage ─── */}
                <section className="space-y-12">
                    <div className="flex items-center gap-4 border-l-4 border-blue-500 pl-6">
                        <h2 className="text-3xl font-black uppercase italic tracking-tight">05. The Zen Advantage</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-[#111] p-8 rounded-3xl border border-blue-500/10 space-y-6">
                            <h3 className="text-2xl font-bold flex items-center gap-2 text-blue-400">
                                <Shield className="w-6 h-6" /> Why Zen Pips?
                            </h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Most retail groups gamble on indicators. We operate as a professional firm. Zen Pips provides tools found nowhere else:
                            </p>
                            <ul className="space-y-4 text-xs font-bold uppercase tracking-widest">
                                <li className="flex items-center gap-3 text-gray-300"><Zap className="w-4 h-4 text-yellow-500" /> Prop-Firm Compatible Risk (1%)</li>
                                <li className="flex items-center gap-3 text-gray-300"><Cpu className="w-4 h-4 text-blue-400" /> Vision AI Market Structuralist</li>
                                <li className="flex items-center gap-3 text-gray-300"><Terminal className="w-4 h-4 text-green-500" /> Zero-Latency MT5 Bridge</li>
                                <li className="flex items-center gap-3 text-gray-300"><Users className="w-4 h-4 text-purple-400" /> 1:1 Elite Mentorship Ecosystem</li>
                            </ul>
                        </div>
                        <div className="bg-yellow-500 text-black p-8 rounded-3xl space-y-6 flex flex-col justify-between">
                            <div>
                                <h3 className="text-2xl font-black uppercase italic tracking-tighter">Membership Deal</h3>
                                <p className="text-black font-bold uppercase tracking-widest text-[10px] mt-2 border-b border-black/10 pb-4">Institutional Subscription</p>
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-5xl font-black tracking-tighter">$50 / MONTH</h4>
                                <p className="text-xs font-bold italic">Billed exclusively via USDT (TRC20/BEP20)</p>
                            </div>
                            <a href="https://t.me/MadDmakz" className="w-full bg-black text-white py-4 rounded-2xl font-black text-center uppercase tracking-widest shadow-2xl hover:scale-[1.02] transition-all">
                                GET STARTED FREE
                            </a>
                        </div>
                    </div>
                </section>

                {/* ─── Section 6: Operations & Tools ─── */}
                <section className="space-y-12">
                    <div className="flex items-center gap-4">
                        <Landmark className="w-8 h-8 text-yellow-500" />
                        <h2 className="text-3xl font-black uppercase italic tracking-tight">06. Operational Log</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-6">
                            <h4 className="text-lg font-bold">The Daily Dominator Routine</h4>
                            <div className="space-y-4">
                                {[
                                    { time: "08:00 AM", task: "Check Forex Factory for News (Red Folders)." },
                                    { time: "09:00 AM", task: "Analyze Macro bias on XAU/USD (Daily/4H)." },
                                    { time: "LO/NY Open", task: "Receive Zen Signals & Executed via Bridge." },
                                    { time: "05:00 PM", task: "Log all trades in the Zen Journal." }
                                ].map((step, i) => (
                                    <div key={i} className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <span className="text-yellow-500 font-mono font-bold text-xs shrink-0">{step.time}</span>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-tight">{step.task}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-6">
                            <h4 className="text-lg font-bold italic tracking-tight">Must-Have Tools</h4>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { name: "Forex Factory", url: "https://forexfactory.com", icon: "🌍" },
                                    { name: "MyFXBook", url: "https://myfxbook.com", icon: "📊" },
                                    { name: "Binance", url: "https://binance.com", icon: "🪙" },
                                    { name: "TradingView", url: "https://tradingview.com", icon: "📈" }
                                ].map((tool, i) => (
                                    <a key={i} href={tool.url} target="_blank" className="p-4 bg-black border border-white/10 rounded-2xl flex items-center justify-center gap-3 hover:bg-yellow-500 hover:text-black hover:border-yellow-500 transition-all font-bold text-xs uppercase tracking-widest text-center">
                                        <span>{tool.icon}</span> {tool.name}
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─── Footer: Contact ─── */}
                <section className="text-center space-y-8 pt-20 border-t border-white/5">
                    <div className="w-20 h-20 bg-yellow-500/10 border-2 border-yellow-500/30 rounded-full flex items-center justify-center mx-auto">
                        <MessageSquare className="w-10 h-10 text-yellow-500" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-3xl font-black italic uppercase tracking-tighter">Stay Exclusive. Move in Silence.</h3>
                        <p className="text-gray-500 max-w-sm mx-auto text-sm leading-relaxed uppercase font-bold tracking-widest">
                            Official institutional support is available 24/5 on Telegram.
                        </p>
                    </div>
                    <div className="flex justify-center gap-6">
                        <a href="https://t.me/MadDmakz" className="text-yellow-500 hover:text-white font-bold transition-all uppercase tracking-widest text-xs flex items-center gap-2">
                            @MadDmakz <ArrowRight className="w-4 h-4" />
                        </a>
                        <a href="https://zenpips.com" className="text-yellow-500 hover:text-white font-bold transition-all uppercase tracking-widest text-xs flex items-center gap-2">
                            zenpips.com <ArrowRight className="w-4 h-4" />
                        </a>
                    </div>
                    <p className="text-[9px] text-gray-700 uppercase font-black tracking-widest">Copyright © 2026 ZEN PIPS INSTITUTIONAL . ALL RIGHTS SECURED.</p>
                </section>

            </main>

            {/* Float Menu for Print only visible on screen */}
            <div className="fixed bottom-10 right-10 print:hidden">
                <button 
                    onClick={() => window.print()}
                    className="w-16 h-16 bg-yellow-500 text-black rounded-full shadow-[0_0_50px_rgba(212,175,55,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                >
                    <Download className="w-7 h-7" />
                </button>
            </div>
        </div>
    )
}
