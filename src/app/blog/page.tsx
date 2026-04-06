"use client";

import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Clock, Tag, ExternalLink } from "lucide-react";
import Image from "next/image";

import Link from "next/link";

const POSTS = [
  {
    id: 7,
    title: "Navigating the Gold Rush: Why Retail Keeps Shorting the Trend",
    excerpt: "A deep macro analysis of why XAU/USD continues to defy traditional retail resistance levels and how to ride the institutional momentum.",
    date: "Scheduled: April 5, 2026 09:15 AM",
    tag: "Market Update",
    image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=2670&auto=format&fit=crop"
  },
  {
    id: 6,
    title: "The Pivot to Autonomous AI in Forex Execution",
    excerpt: "How institutional trading desks are graduating from traditional EAs to agentic AI models that analyze sentiment and market structure in real-time.",
    date: "April 4, 2026",
    tag: "Tech & Logic",
    image: "/blog/ai_execution_1775265444067.png"
  },
  {
    id: 5,
    title: "MT5 Institutional Setup: PC & Mobile Guide",
    excerpt: "Everything you need to configure your MetaTrader 5 terminal for institutional flow. Step-by-step connection to the Zen Pips copy-trader system.",
    date: "April 3, 2026",
    tag: "Setup Guide",
    image: "/blog/mt5_setup_1775265048321.png"
  },
  {
    id: 4,
    title: "Gold Surges Past Targets: The Anatomy of Momentum",
    excerpt: "An analysis of the recent XAU/USD breakout, how institutional volume drove the price through TP2, and why trailing stop losses are vital.",
    date: "April 1, 2026",
    tag: "Market Update",
    image: "/blog/gold_surge_1775265109137.png"
  },
  {
    id: 1,
    title: "Institutional Liquidity: Beyond the Retail Trap",
    excerpt: "Learn how market makers hunt retail stop losses and how you can position your orders alongside the smart money.",
    date: "March 26, 2026",
    tag: "Strategy",
    image: "/blog/institutional_liquidity_1775265123377.png"
  },
  {
    id: 2,
    title: "The Power of Three: Accumulation, Manipulation, Distribution",
    excerpt: "Master the AMD cycle to determine exactly where the market is going before the high-volume expansion occurs.",
    date: "March 20, 2026",
    tag: "Core Logic",
    image: "/blog/power_of_three_1775265137679.png"
  },
  {
    id: 3,
    title: "Zen Risk Management: The 1% Rule",
    excerpt: "The math behind why risking more than 1% per trade is the primary reason retail traders fail.",
    date: "March 15, 2026",
    tag: "Psychology",
    image: "/blog/zen_risk_1775265150310.png"
  }
];

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white selection:bg-[#d4af37] selection:text-black">
      {/* 🧭 NAVIGATION OVERLAY (Transparent) */}
      <nav className="absolute top-0 w-full z-50 px-6 py-6 flex justify-end items-center bg-gradient-to-b from-[#0a0a0a] to-transparent">
        <Link href="/" className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors">Back to Terminal</Link>
      </nav>

      {/* ⚡ TRANSITION BANNER (Exclusive to Blog) */}
      <div className="bg-yellow-500 text-black py-3 px-6 text-center font-black tracking-widest uppercase text-[10px] sticky top-0 z-[60] border-b border-black/10">
        <div className="flex items-center justify-center gap-4 flex-wrap">
            <span className="flex items-center gap-2 animate-pulse">🎯 LIVE TRADING TERMINAL IS NOW ACCESSIBLE ON NETLIFY</span>
            <Link 
              href="/" 
              className="bg-black text-yellow-500 px-4 py-1.5 rounded-full hover:bg-zinc-900 transition-all inline-flex items-center gap-2 border border-black/5 hover:scale-105"
            >
                OPEN MAIN DASHBOARD <ExternalLink className="w-3 h-3" />
            </Link>
        </div>
      </div>



      <div className="max-w-7xl mx-auto px-6 py-24 relative z-10">
        <header className="mb-16 text-center mt-8 space-y-8 flex flex-col items-center">
            <Link href="/" className="group inline-block">
                <div className="relative w-32 h-32 bg-[#d4af37] rounded-full p-2 shadow-[0_0_50px_rgba(212,175,55,0.3)] border border-yellow-600/30 flex items-center justify-center transition-all hover:scale-110 active:scale-95 group">
                    <div className="w-full h-full bg-[#0a0a0a] rounded-full overflow-hidden relative">
                        <Image 
                            src="/logo.png" 
                            alt="Zen Pips" 
                            fill 
                            className="object-contain" 
                            priority
                        />
                    </div>
                </div>
            </Link>

            <div className="max-w-2xl">
                <h1 className="text-4xl md:text-7xl font-black mb-4 font-outfit uppercase tracking-tighter">
                    ZEN<span className="text-yellow-500">PIPS</span> BLOG
                </h1>
                <p className="text-gray-400 max-w-xl mx-auto text-lg leading-relaxed font-inter">
                    Institutional-grade insights and structural analysis. Macro-economic flow and real-time execution logic.
                </p>
            </div>
        </header>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {POSTS.map((post, i) => (
                <motion.article 
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white/[0.03] border border-white/5 rounded-3xl overflow-hidden hover:border-yellow-500/30 transition-all group flex flex-col h-full"
                >
                    <div className="relative h-48 w-full overflow-hidden">
                        <Image 
                            src={post.image} 
                            alt={post.title} 
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-60 group-hover:opacity-100"
                        />
                        <div className="absolute top-4 left-4">
                            <span className="bg-yellow-500 text-black text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                                {post.tag}
                            </span>
                        </div>
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                        <div className="flex items-center gap-4 text-[10px] text-gray-500 mb-4 font-mono">
                            <span className="flex items-center gap-1.5 uppercase"><Clock className="w-3 h-3" /> {post.date}</span>
                            <span className="flex items-center gap-1.5 uppercase"><BookOpen className="w-3 h-3" /> 5 min read</span>
                        </div>
                        <h3 className="text-xl font-bold mb-3 group-hover:text-yellow-500 transition-colors leading-tight font-outfit">
                            {post.title}
                        </h3>
                        <p className="text-sm text-gray-400 leading-relaxed mb-6 flex-1 font-inter">
                            {post.excerpt}
                        </p>
                        <button className="flex items-center gap-2 text-yellow-500 font-bold text-xs uppercase tracking-widest hover:gap-3 transition-all">
                            Read Insight <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>
                </motion.article>
            ))}
        </div>

        {/* Secondary CTA Area */}
        <div className="mt-24 p-8 md:p-16 rounded-[40px] bg-gradient-to-br from-yellow-500/10 to-transparent border border-white/5 text-center relative overflow-hidden">
            <div className="relative z-10">
                <h2 className="text-3xl md:text-5xl font-black mb-6 uppercase tracking-tight">Institutional Dominance. Live Access.</h2>
                <p className="text-gray-400 max-w-xl mx-auto mb-10 text-lg leading-relaxed font-inter">
                    Our institutional terminal is now fully synchronized with the live London and NY sessions.
                </p>
                <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                    <Link href="/" className="px-10 py-4 bg-yellow-500 text-black font-black uppercase tracking-widest rounded-2xl hover:bg-yellow-400 transition-all shadow-[0_0_30px_-5px_rgba(234,179,8,0.4)]">
                        Access Terminal
                    </Link>
                    <a href="https://t.me/Zen_pips_bot" target="_blank" rel="noopener noreferrer" className="px-10 py-4 bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-all">
                        Join Community
                    </a>
                </div>
            </div>
            {/* Background design elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 blur-[100px] z-0"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 blur-[100px] z-0"></div>
        </div>
      </div>

      <footer className="py-12 border-t border-white/5 text-center mt-24">
        <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em]">
            ZENPIPS · Institutional Analytics · {new Date().getFullYear()}
        </p>
      </footer>
    </main>
  );
}
