"use client"

import { motion } from "framer-motion"
import { 
    Terminal, Zap, TrendingUp, Activity, Globe, 
    Landmark, BarChart3, Shield, Download, ExternalLink,
    CheckCircle2, Info, ArrowRight, Gauge, Layers, Search
} from "lucide-react"

export default function ToolsGuidePage() {
    const tools = [
        { 
            title: "Zen Personal Journal", 
            desc: "The heartbeat of your trading career. Tracks Pips, ROI, and Psychology.", 
            link: "/?tab=journal", 
            icon: <BarChart3 className="w-8 h-8" />, 
            category: "INTERNAL",
            features: ["Equity Growth Tracking", "Emotional State Logging", "Trade Screenshot Storage"],
            action: "Open Journal"
        },
        { 
            title: "Zen Signal Indicator", 
            desc: "Custom MT5 Indicator for visualizing institutional order blocks.", 
            link: "https://t.me/Zen_pips_bot", 
            icon: <TrendingUp className="w-8 h-8" />, 
            category: "MT5 SOFTWARE",
            features: ["BOS/CHoCH Detection", "FVG Visualization", "Auto-Fibonacci Plotting"],
            action: "Get on Telegram"
        },
        { 
            title: "Zen MT5 Algorithm", 
            desc: "The Bridge Copier. Instantly replicates VIP signals to your account.", 
            link: "/?tab=chartai", 
            icon: <Terminal className="w-8 h-8" />, 
            category: "AUTOMATION",
            features: ["0ms Latency Execution", "Partial Profit Automation", "Break-Even Protection"],
            action: "Setup Copier"
        },
        { 
            title: "Innovation Hub", 
            desc: "Propose new tools and features for the Zen Pips development team.", 
            link: "/?tab=innovation", 
            icon: <Zap className="w-8 h-8 text-orange-400" />, 
            category: "R&D",
            features: ["Community Voting", "AI Tech Roadmaps", "Weekly Build Sprints"],
            action: "Propose Tool"
        },
        { 
            title: "MyFXBook", 
            desc: "Third-party audit tool for public performance verification.", 
            link: "https://myfxbook.com", 
            icon: <Activity className="w-8 h-8" />, 
            category: "ANALYTICS",
            features: ["Public Portfolio Auditing", "Drawdown Heatmaps", "Risk-of-Ruin Statistics"],
            action: "View Stats"
        },
        { 
            title: "Vantage Broker Portal", 
            desc: "Our recommended institutional-grade liquidity provider.", 
            link: "https://vigco.co/la-com-inv/TItFx2Oy", 
            icon: <Landmark className="w-8 h-8" />, 
            category: "BROKERAGE",
            features: ["Raw Spreads (0.0 Pips)", "Instant Withdrawals", "MT5 Premium Access"],
            action: "Broker Area"
        }
    ]

    return (
        <div className="min-h-screen bg-[#050505] text-white font-[family-name:var(--font-outfit)] selection:bg-yellow-500/30 p-12">
            <div className="max-w-6xl mx-auto space-y-16">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-white/5 pb-12">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-[0.2em]">
                            <Shield className="w-3 h-3" /> Technical Arsenal
                        </div>
                        <h1 className="text-5xl font-black italic tracking-tighter uppercase leading-none">
                            THE INSTITUTIONAL <br />
                            <span className="text-blue-400">TOOLS MANIFESTO</span>
                        </h1>
                        <p className="text-gray-500 max-w-xl text-sm font-medium">
                            A comprehensive directory of the technical stack used by Zen Pips Institutional. These tools form the "Zen Edge"—bringing speed, accuracy, and discipline to your trading journey.
                        </p>
                    </div>
                    <a href="/" className="px-8 py-4 bg-white text-black font-bold rounded-2xl hover:bg-blue-400 hover:text-white transition-all uppercase tracking-widest text-xs">Back to Dashboard</a>
                </div>

                {/* Tools Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {tools.map((tool, i) => (
                        <div key={i} className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden group flex flex-col justify-between">
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                {tool.icon}
                            </div>
                            <div className="space-y-4 relative z-10">
                                <div className="text-xs font-black tracking-widest text-blue-500 uppercase font-mono">{tool.category}</div>
                                <h3 className="text-2xl font-bold italic tracking-tight">{tool.title}</h3>
                                <p className="text-gray-500 text-xs leading-relaxed">{tool.desc}</p>
                                <div className="pt-4 space-y-2">
                                    {tool.features.map((f, j) => (
                                        <div key={j} className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase">
                                            <div className="w-1 h-1 bg-blue-500 rounded-full" /> {f}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <a 
                                href={tool.link}
                                target={tool.link.startsWith('http') ? "_blank" : "_self"}
                                className="w-full py-4 bg-white/[0.03] border border-white/10 rounded-2xl text-center text-[10px] font-bold uppercase tracking-widest hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all flex items-center justify-center gap-2"
                            >
                                {tool.action} <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    ))}
                </div>

                {/* Footer Insight */}
                <div className="p-8 bg-blue-500/5 border border-blue-500/10 rounded-3xl flex items-center gap-6">
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                        <Info className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                        <h4 className="font-bold text-blue-400">OPERATIONAL NOTE</h4>
                        <p className="text-xs text-gray-500 leading-relaxed uppercase font-bold tracking-tight">
                            Tools are meant to assist, not to lead. The psychology of the trader remains the most powerful tool in the arsenal. Use these systematically to reduce emotional friction.
                        </p>
                    </div>
                </div>

                <div className="text-center pt-12 border-t border-white/5">
                    <p className="text-[9px] text-gray-700 uppercase font-black tracking-[0.3em]">ZEN PIPS INSTITUTIONAL . TECHNICAL PROTOCOL . 2026</p>
                </div>
            </div>
        </div>
    )
}
