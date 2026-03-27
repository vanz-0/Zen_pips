"use client";

import Image from "next/image";
import { BarChart2, Shield, TrendingUp, Zap, Target, Users, Clock, ExternalLink, Menu, X, LogIn, BookOpen, History, User, GraduationCap, MessageCircle, Home as HomeIcon, Lock } from "lucide-react";
import { Particles } from "@/components/ui/particles";
import { GlowCard } from "@/components/ui/glow-card";
import { TradingTerminal } from "@/components/ui/trading-terminal";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { SignalData } from "@/components/ui/trading-terminal";
import { useSignals } from "@/hooks/useSignals";
import { useAuth } from "@/context/AuthContext";
import { ProfileTab } from "@/components/dashboard/ProfileTab";
import { JournalTab } from "@/components/dashboard/JournalTab";
import { VaultTab } from "@/components/dashboard/VaultTab";
import { ChartAITab } from "@/components/dashboard/ChartAITab";
import { SignalControlPanel } from "@/components/admin/SignalControlPanel";
import { OnboardingTab } from "@/components/dashboard/OnboardingTab";
import { LeadMagnetSection } from "@/components/marketing/LeadMagnetSection";
import { useRouter } from "next/navigation";

function FadeInSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.7, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function Home() {
  const { signals } = useSignals();
  const { user, profile, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"journal" | "vault" | "profile" | "chartai" | "admin" | "help" | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  // Derived stats
  const totalPipsToday = signals.reduce((acc, sig) => acc + (sig.total_pips || 0), 0);
  const winRate = signals.length > 0
    ? Math.round((signals.filter(s => s.total_pips > 0).length / signals.length) * 100)
    : 100;
  const activeCount = signals.filter(s => !s.closed).length;

  const handleNavClick = (tab: "journal" | "vault" | "profile" | "chartai" | "admin" | "help" | null) => {
    if (tab && !user) {
      router.push("/auth");
      return;
    }
    setActiveTab(tab);
    setMenuOpen(false);
    if (tab) {
      // Scroll to dashboard section
      setTimeout(() => document.getElementById("dashboard-section")?.scrollIntoView({ behavior: "smooth" }), 100);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] overflow-hidden relative font-[family-name:var(--font-inter)] selection:bg-[#d4af37] selection:text-black flex flex-col">

      {/* Particle Background */}
      <Particles
        className="absolute inset-0 z-0"
        quantity={80}
        color="#d4af37"
        size={0.6}
        staticity={30}
        ease={80}
      />

      {/* Subtle Grid Overlay */}
      <div className="absolute inset-0 z-[1] bg-[linear-gradient(to_right,#141414_1px,transparent_1px),linear-gradient(to_bottom,#141414_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30"></div>

      {/* Grain Overlay */}
      <div className="fixed inset-0 z-[2] opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }}></div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Zen Pips" width={40} height={40} className="rounded-full" />
            <span className="font-[family-name:var(--font-outfit)] font-bold text-2xl tracking-tighter text-white">
              ZEN<span className="text-[#d4af37]">PIPS</span>
            </span>
          </div>
          {/* Desktop nav links */}
          <div className="hidden md:flex gap-8 text-sm font-medium text-gray-400">
            {user ? (
              <>
                <button onClick={() => handleNavClick(null)} className="hover:text-white transition-colors duration-300">Home</button>
                <button onClick={() => { setActiveTab("vault"); handleNavClick("vault"); }} className={`hover:text-white transition-colors duration-300 ${activeTab === 'vault' ? 'text-yellow-500 font-bold' : ''}`}>Vault</button>
                <button onClick={() => { setActiveTab("journal"); handleNavClick("journal"); }} className={`hover:text-white transition-colors duration-300 ${activeTab === 'journal' ? 'text-yellow-500 font-bold' : ''}`}>Journal</button>
                <button onClick={() => { setActiveTab("help"); handleNavClick("help"); }} className={`hover:text-[#d4af37] transition-colors duration-300 font-bold ${activeTab === 'help' ? 'text-[#d4af37]' : 'text-gray-300'}`}>Setup Guide</button>
                <button onClick={() => { setActiveTab("profile"); handleNavClick("profile"); }} className={`hover:text-white transition-colors duration-300 ${activeTab === 'profile' ? 'text-yellow-500 font-bold' : ''}`}>Analytics</button>
                <button onClick={() => { setActiveTab("chartai"); handleNavClick("chartai"); }} className={`hover:text-[#d4af37] transition-colors duration-300 font-semibold ${activeTab === 'chartai' ? 'text-[#d4af37]' : ''}`}>Chart AI</button>
                <a href="/blog" className="hover:text-white transition-colors duration-300">Edu</a>
                {user?.email === "dev@zenpips.com" ? (
                  <button onClick={() => { setActiveTab("admin"); handleNavClick("admin"); }} className={`hover:text-red-400 transition-colors duration-300 border border-red-500/20 px-3 py-1 rounded-lg bg-red-500/5 ${activeTab === 'admin' ? 'bg-red-500/20 text-red-500' : ''}`}>Partners</button>
                ) : (
                  <button disabled className="text-gray-500 border border-gray-800 px-3 py-1 rounded-lg bg-gray-900/50 cursor-not-allowed">Partners (Soon)</button>
                )}
              </>
            ) : (
              <>
                <a href="#features" className="hover:text-white transition-colors duration-300">Features</a>
                <a href="#results" className="hover:text-white transition-colors duration-300">Results</a>
                <a href="#pricing" className="hover:text-white transition-colors duration-300">Pricing</a>
              </>
            )}
          </div>
          {/* Hamburger Toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
          </button>
        </div>

        {/* Dropdown Menu Panel */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden border-t border-white/5 bg-[#0a0a0a]/95 backdrop-blur-2xl"
            >
              <div className="max-w-7xl mx-auto px-6 py-4 grid grid-cols-2 md:grid-cols-6 gap-3">
                {/* Home */}
                <button
                  onClick={() => handleNavClick(null)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-yellow-500/30 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                    <HomeIcon className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-white group-hover:text-yellow-500 transition-colors">Home</p>
                    <p className="text-[10px] text-gray-500">Main hub</p>
                  </div>
                </button>

                {/* Journal */}
                <button
                  onClick={() => handleNavClick("journal")}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-yellow-500/30 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-white group-hover:text-yellow-500 transition-colors">Journal</p>
                    <p className="text-[10px] text-gray-500">Log trades</p>
                  </div>
                </button>

                {/* Vault */}
                <button
                  onClick={() => handleNavClick("vault")}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-yellow-500/30 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <GraduationCap className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-white group-hover:text-yellow-500 transition-colors">Vault</p>
                    <p className="text-[10px] text-gray-500">Education</p>
                  </div>
                </button>

                {/* Edu Blog */}
                <a
                  href="/blog"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-yellow-500/30 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-pink-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-white group-hover:text-yellow-500 transition-colors">Knowledge Base</p>
                    <p className="text-[10px] text-gray-500">Read the Blog</p>
                  </div>
                </a>

                {/* Setup Guide */}
                <button
                  onClick={() => handleNavClick("help")}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#d4af37]/[0.05] hover:bg-[#d4af37]/[0.12] border border-[#d4af37]/20 hover:border-[#d4af37]/40 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#d4af37]/10 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-[#d4af37]" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-white group-hover:text-[#d4af37] transition-colors">Setup Guide</p>
                    <p className="text-[10px] text-gray-500">Go Live Guide</p>
                  </div>
                </button>

                {/* Trade History */}
                <button
                  onClick={() => handleNavClick("journal")}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-yellow-500/30 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <History className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-white group-hover:text-yellow-500 transition-colors">Trade History</p>
                    <p className="text-[10px] text-gray-500">All signals</p>
                  </div>
                </button>

                {/* Profile */}
                <button
                  onClick={() => handleNavClick("profile")}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-yellow-500/30 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-yellow-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-white group-hover:text-yellow-500 transition-colors">Analytics</p>
                    <p className="text-[10px] text-gray-500">Broker & Settings</p>
                  </div>
                </button>

                {/* Chart AI */}
                <button
                  onClick={() => handleNavClick("chartai")}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-500/[0.05] hover:bg-blue-500/[0.12] border border-blue-500/20 hover:border-blue-500/40 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <BarChart2 className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">Chart AI</p>
                    <p className="text-[10px] text-gray-500">Copy Trading</p>
                  </div>
                </button>

                {/* Blog / Edu */}
                <a
                  href="/blog"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-purple-500/[0.05] hover:bg-purple-500/[0.12] border border-purple-500/20 hover:border-purple-500/40 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-white group-hover:text-purple-400 transition-colors">Education</p>
                    <p className="text-[10px] text-gray-500">Trading Blog</p>
                  </div>
                </a>

                {/* Admin (Only if Dev) */}
                {user?.email === "dev@zenpips.com" ? (
                  <button
                    onClick={() => handleNavClick("admin")}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/[0.05] hover:bg-red-500/[0.12] border border-red-500/20 hover:border-red-500/40 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-red-400" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-white group-hover:text-red-400 transition-colors">Partners Portal</p>
                      <p className="text-[10px] text-gray-500">Institutional Onboarding</p>
                    </div>
                  </button>
                ) : (
                  <button disabled className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-900/50 border border-gray-800 opacity-50 cursor-not-allowed text-left">
                    <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-400">Partners (Soon)</p>
                      <p className="text-[10px] text-gray-600">Institutional Onboarding</p>
                    </div>
                  </button>
                )}

                {/* Free Group */}
                <a
                  href="https://t.me/Zen_pips_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-[#d4af37]/30 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#d4af37]/10 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-[#d4af37]" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-white group-hover:text-[#d4af37] transition-colors">Free Group</p>
                    <p className="text-[10px] text-gray-500">Telegram</p>
                  </div>
                </a>
              </div>

              {/* Login nudge if not authenticated */}
              {!user && (
                <div className="max-w-7xl mx-auto px-6 pb-4">
                  <button
                    onClick={() => { router.push("/auth"); setMenuOpen(false); }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 font-semibold text-sm hover:bg-yellow-500/20 transition-all"
                  >
                    <LogIn className="w-4 h-4" />
                    Log In / Sign Up to Unlock Dashboard
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Trading Terminal (Full-viewport Hero) */}
      <section className="relative z-10">
        <TradingTerminal />
      </section>

      {user && activeTab ? (
        <section id="dashboard-section" className="relative z-10 py-12 px-6 max-w-7xl mx-auto border-t border-white/5 flex-1 w-full min-h-[60vh]">
          {/* Unified Dashboard Navigation */}
          {/* Removed redundant Unified Dashboard Navigation */}

          {/* Active Tab Content */}
          <FadeInSection delay={0.1}>
            <div className="w-full bg-[#0a0a0a]">
              {activeTab === "journal" && (
                profile?.is_vip ? <JournalTab /> : (
                  <div className="flex flex-col items-center justify-center p-20 bg-[#111] rounded-3xl border border-white/5 text-center">
                    <Lock className="w-16 h-16 text-yellow-500 mb-6 opacity-20" />
                    <h2 className="text-3xl font-bold mb-4">Institutional Journaling</h2>
                    <p className="text-gray-400 max-w-sm mx-auto mb-8">Access the multi-timeframe journal to track your metrics like a professional. VIP Exclusive.</p>
                    <a href="https://t.me/Zen_pips_bot" className="px-8 py-3 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400 transition-all">Unlock with VIP</a>
                  </div>
                )
              )}
              {activeTab === "vault" && <VaultTab />}
              {activeTab === "profile" && <ProfileTab />}
              {activeTab === "help" && <OnboardingTab />}
              {activeTab === "chartai" && (
                profile?.is_vip ? <ChartAITab /> : (
                  <div className="flex flex-col items-center justify-center p-20 bg-[#111] rounded-3xl border border-white/5 text-center">
                    <BarChart2 className="w-16 h-16 text-blue-500 mb-6 opacity-20" />
                    <h2 className="text-3xl font-bold mb-4">Chart AI Intelligence</h2>
                    <p className="text-gray-400 max-w-sm mx-auto mb-8">Let GPT-4o Vision analyze your chart markups for institutional liquidity and structural traps. VIP Exclusive.</p>
                    <a href="https://t.me/Zen_pips_bot" className="px-8 py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-400 transition-all">Unlock Vision Engine</a>
                  </div>
                )
              )}
              {activeTab === "admin" && <SignalControlPanel />}
            </div>
          </FadeInSection>
        </section>
      ) : (
        <section className="flex-1">
          {/* Features Bento Grid */}
          <section id="features" className="relative z-10 py-24 px-6 max-w-7xl mx-auto border-t border-white/5">
            <FadeInSection>
              <div className="text-center md:text-left mb-16">
                <h2 className="font-[family-name:var(--font-outfit)] text-3xl md:text-5xl font-bold text-white mb-4">
                  The <span className="text-[#d4af37]">Advantage.</span>
                </h2>
                <p className="text-gray-400 max-w-xl text-lg">
                  We strip away the noise and focus purely on high-probability setups, giving you the institutional edge.
                </p>
              </div>
            </FadeInSection>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FadeInSection className="md:col-span-2" delay={0.1}>
                <GlowCard glowColor="gold" className="h-full">
                  <div className="w-12 h-12 bg-[#d4af37]/10 rounded-full flex items-center justify-center mb-6">
                    <Zap className="w-6 h-6 text-[#d4af37]" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Sniper Entries</h3>
                  <p className="text-gray-400 leading-relaxed max-w-md">
                    We send pinpoint BUY/SELL targets directly to your Telegram. We only trade when the setup perfectly aligns with our confluence models during London/NY sessions.
                  </p>
                </GlowCard>
              </FadeInSection>

              <FadeInSection delay={0.2}>
                <GlowCard glowColor="blue" className="h-full">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
                    <Shield className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Capital Preservation</h3>
                  <p className="text-gray-400 leading-relaxed">
                    We advocate 1% max risk per trade. Our stop-losses are calculated mathematically to avoid market sweeps.
                  </p>
                </GlowCard>
              </FadeInSection>

              <FadeInSection delay={0.3}>
                <GlowCard glowColor="green" className="h-full">
                  <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
                    <TrendingUp className="w-6 h-6 text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Compound Growth</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Consistency over gambling. Our monthly net pip targets are built to scale funded accounts steadily.
                  </p>
                </GlowCard>
              </FadeInSection>

              <FadeInSection className="md:col-span-2" delay={0.4}>
                <GlowCard glowColor="purple" className="h-full">
                  <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center mb-6">
                    <BarChart2 className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Daily Institutional Breakdown</h3>
                  <p className="text-gray-400 leading-relaxed max-w-md">
                    Before we ever place a trade, you receive our macro bias, liquidity zones, and structural markups. You aren&apos;t just copying; you are learning market dominance.
                  </p>
                </GlowCard>
              </FadeInSection>
            </div>
          </section>

          {/* Results / Social Proof Section */}
          <section id="results" className="relative z-10 py-24 px-6 max-w-7xl mx-auto border-t border-white/5">
            <FadeInSection>
              <div className="text-center mb-16">
                <h2 className="font-[family-name:var(--font-outfit)] text-3xl md:text-5xl font-bold text-white mb-4">
                  Real <span className="text-[#d4af37]">Results.</span> No Filters.
                </h2>
                <p className="text-gray-400 max-w-xl mx-auto text-lg">
                  Verified pip counts from our live Telegram channel. Every number is backed by posted signals.
                </p>
              </div>
            </FadeInSection>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
              {[
                { value: `+${totalPipsToday.toLocaleString()}`, label: "Pips Today", color: "text-[#d4af37]" },
                { value: `${winRate}%`, label: "Win Rate", color: "text-white" },
                { value: signals.length.toString(), label: "Signals Today", color: "text-white" },
                { value: activeCount > 0 ? "LIVE" : "MONITORING", label: activeCount > 0 ? "Active Now" : "Systems Check", color: activeCount > 0 ? "text-green-500" : "text-blue-400", glow: activeCount > 0 },
              ].map((stat, i) => (
                <FadeInSection key={stat.label} delay={0.1 * i}>
                  <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 text-center hover:border-[#d4af37]/20 transition-colors">
                    <div className={`text-3xl md:text-4xl font-bold ${stat.color} font-mono mb-2`}>{stat.value}</div>
                    <div className="text-sm text-gray-500 uppercase tracking-wider">{stat.label}</div>
                  </div>
                </FadeInSection>
              ))}
            </div>

            {/* Recent Signal Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {signals.slice(0, 3).map((sig, i) => (
                <FadeInSection key={sig.id} delay={0.1 * (i + 1)}>
                  <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 hover:border-green-500/20 transition-all h-full">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[#d4af37] font-bold text-lg">{sig.pair} <span className="text-xs text-gray-500">{sig.timeframe}</span></span>
                      <span className={`text-[10px] font-mono px-3 py-1 rounded-full border ${sig.status === "ACTIVE"
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        : "bg-green-500/10 text-green-400 border-green-500/20"
                        }`}>
                        {sig.status}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-500">Entry</span><span className="text-white font-mono">{sig.entry.toLocaleString()}</span></div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Result</span>
                        <span className={`${sig.total_pips >= 0 ? "text-green-400" : "text-red-400"} font-mono font-bold`}>
                          {sig.total_pips > 0 ? "+" : ""}{sig.total_pips.toLocaleString()} Pips
                        </span>
                      </div>
                      <div className="pt-2 border-t border-white/5">
                        <p className="text-[10px] text-gray-600 italic leading-relaxed">{sig.confluence}</p>
                      </div>
                    </div>
                  </div>
                </FadeInSection>
              ))}
            </div>
          </section>

          {/* Lead Magnet Section */}
          <LeadMagnetSection />

          {/* Pricing Section */}
          <section id="pricing" className="relative z-10 py-24 px-6 max-w-7xl mx-auto border-t border-white/5">
            <FadeInSection>
              <div className="text-center mb-16">
                <h2 className="font-[family-name:var(--font-outfit)] text-3xl md:text-5xl font-bold text-white mb-4">
                  Join the <span className="text-[#d4af37]">Inner Circle.</span>
                </h2>
                <p className="text-gray-400 max-w-xl mx-auto text-lg">
                  Automated crypto checkout. Instant access after validation.
                </p>
              </div>
            </FadeInSection>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FadeInSection delay={0.1}>
                <div className="bg-[#141414] border border-white/10 rounded-3xl p-8 flex flex-col hover:-translate-y-2 transition-transform duration-300 h-full">
                  <h3 className="text-xl font-bold text-white mb-2">1 Month Access</h3>
                  <p className="text-gray-500 mb-6">Test the waters.</p>
                  <div className="text-4xl font-bold text-white mb-8">$50<span className="text-lg text-gray-500 font-normal">/mo</span></div>
                  <ul className="space-y-4 mb-8 flex-1">
                    <li className="flex items-center gap-3 text-gray-300"><div className="w-1.5 h-1.5 rounded-full bg-[#d4af37]"></div> Daily VIP Signals</li>
                    <li className="flex items-center gap-3 text-gray-300"><div className="w-1.5 h-1.5 rounded-full bg-[#d4af37]"></div> London/NY Analysis</li>
                  </ul>
                  <a href="https://t.me/Zen_pips_bot" target="_blank" rel="noopener noreferrer" className="block text-center w-full py-4 rounded-xl border border-white/20 text-white font-medium hover:bg-white/5 transition-colors">Start Now</a>
                </div>
              </FadeInSection>

              <FadeInSection delay={0.2}>
                <div className="bg-gradient-to-b from-[#1f1f1f] to-[#141414] border border-[#d4af37] shadow-[0_0_30px_rgba(212,175,55,0.15)] rounded-3xl p-8 flex flex-col relative transform hover:-translate-y-2 transition-transform duration-300 md:-translate-y-4 h-full">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#d4af37] text-black text-xs font-bold uppercase tracking-wider py-1 px-4 rounded-full">Most Popular</div>
                  <h3 className="text-xl font-bold text-white mb-2">6 Months Access</h3>
                  <p className="text-gray-500 mb-6">Commit to the process.</p>
                  <div className="text-4xl font-bold text-white mb-8">$250<span className="text-lg text-gray-500 font-normal"> ($41/mo)</span></div>
                  <ul className="space-y-4 mb-8 flex-1">
                    <li className="flex items-center gap-3 text-gray-300"><div className="w-1.5 h-1.5 rounded-full bg-[#d4af37]"></div> Daily VIP Signals</li>
                    <li className="flex items-center gap-3 text-gray-300"><div className="w-1.5 h-1.5 rounded-full bg-[#d4af37]"></div> London/NY Analysis</li>
                    <li className="flex items-center gap-3 text-gray-300"><div className="w-1.5 h-1.5 rounded-full bg-[#d4af37]"></div> Bonus: Risk Planner</li>
                  </ul>
                  <a href="https://t.me/Zen_pips_bot" target="_blank" rel="noopener noreferrer" className="block text-center w-full py-4 rounded-xl bg-[#d4af37] text-black font-bold hover:brightness-110 transition-colors">Secure Spot</a>
                </div>
              </FadeInSection>

              <FadeInSection delay={0.3}>
                <div className="bg-[#141414] border border-white/10 rounded-3xl p-8 flex flex-col hover:-translate-y-2 transition-transform duration-300 h-full">
                  <h3 className="text-xl font-bold text-white mb-2">1 Year Access</h3>
                  <p className="text-gray-500 mb-6">Become a Dominator.</p>
                  <div className="text-4xl font-bold text-white mb-8">$450<span className="text-lg text-gray-500 font-normal"> ($37/mo)</span></div>
                  <ul className="space-y-4 mb-8 flex-1">
                    <li className="flex items-center gap-3 text-gray-300"><div className="w-1.5 h-1.5 rounded-full bg-[#d4af37]"></div> Everything in 6-Mo</li>
                    <li className="flex items-center gap-3 text-gray-300"><div className="w-1.5 h-1.5 rounded-full bg-[#d4af37]"></div> 1-on-1 Portfolio review</li>
                  </ul>
                  <a href="https://t.me/Zen_pips_bot" target="_blank" rel="noopener noreferrer" className="block text-center w-full py-4 rounded-xl border border-white/20 text-white font-medium hover:bg-white/5 transition-colors">Go Annual</a>
                </div>
              </FadeInSection>
            </div>
          </section>

          {/* Get Started / Broker Section */}
          <section id="broker" className="relative z-10 py-24 px-6 max-w-7xl mx-auto border-t border-white/5">
            <FadeInSection>
              <div className="text-center mb-16">
                <h2 className="font-[family-name:var(--font-outfit)] text-3xl md:text-5xl font-bold text-white mb-4">
                  Get <span className="text-[#d4af37]">Set Up.</span>
                </h2>
                <p className="text-gray-400 max-w-xl mx-auto text-lg">
                  Everything you need to start executing trades in under 10 minutes.
                </p>
              </div>
            </FadeInSection>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <FadeInSection delay={0.1}>
                <a href="https://www.hfm.com/ke/en/?refid=30508914" target="_blank" rel="noopener noreferrer"
                  className="group bg-gradient-to-br from-white/5 to-white/0 border border-white/10 p-8 rounded-3xl hover:border-[#d4af37]/40 hover:shadow-[0_0_40px_rgba(212,175,55,0.1)] transition-all duration-300 flex flex-col items-start h-full">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-[#d4af37]/10 rounded-full flex items-center justify-center">
                      <Target className="w-6 h-6 text-[#d4af37]" />
                    </div>
                    <span className="text-xs bg-[#d4af37]/10 text-[#d4af37] px-3 py-1 rounded-full font-semibold uppercase tracking-wider">Step 1</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Open Your Broker</h3>
                  <p className="text-gray-400 mb-6 leading-relaxed">
                    We exclusively use <strong className="text-white">HFM</strong> for institutional-grade spreads on Gold and Bitcoin. Raw spreads. Fast execution. Regulated.
                  </p>
                  <div className="mt-auto flex items-center gap-2 text-[#d4af37] font-semibold group-hover:gap-3 transition-all">
                    Open HFM Account <ExternalLink className="w-4 h-4" />
                  </div>
                </a>
              </FadeInSection>

              <FadeInSection delay={0.2}>
                <a href="https://www.binance.com/referral/earn-together/refer2earn-usdc/claim?hl=en&ref=GRO_28502_E50OE&utm_source=default" target="_blank" rel="noopener noreferrer"
                  className="group bg-gradient-to-br from-white/5 to-white/0 border border-white/10 p-8 rounded-3xl hover:border-yellow-500/40 hover:shadow-[0_0_40px_rgba(234,179,8,0.1)] transition-all duration-300 flex flex-col items-start h-full">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center">
                      <Clock className="w-6 h-6 text-yellow-400" />
                    </div>
                    <span className="text-xs bg-yellow-500/10 text-yellow-400 px-3 py-1 rounded-full font-semibold uppercase tracking-wider">Step 2</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Get USDT via Binance</h3>
                  <p className="text-gray-400 mb-6 leading-relaxed">
                    Purchase <strong className="text-white">USDT</strong> via card or bank transfer, then send it via TRC-20 to join our VIP room instantly.
                  </p>
                  <div className="mt-auto flex items-center gap-2 text-yellow-400 font-semibold group-hover:gap-3 transition-all">
                    Create Binance Account <ExternalLink className="w-4 h-4" />
                  </div>
                </a>
              </FadeInSection>
            </div>

            <FadeInSection delay={0.3}>
              <div className="mt-12 text-center">
                <div className="inline-flex items-center gap-3 bg-[#141414] border border-white/10 rounded-full px-8 py-4">
                  <Users className="w-5 h-5 text-[#d4af37]" />
                  <span className="text-gray-400">Step 3:</span>
                  <a href="https://t.me/Zen_pips_bot" target="_blank" rel="noopener noreferrer" className="text-[#d4af37] font-bold hover:underline">
                    Message @Zen_pips to unlock VIP
                  </a>
                </div>
              </div>
            </FadeInSection>
          </section>
        </section>
      )}

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Image src="/logo.png" alt="Zen Pips" width={36} height={36} className="rounded-full" />
                <span className="font-[family-name:var(--font-outfit)] font-bold text-xl tracking-wide text-white">ZENPIPS</span>
              </div>
              <p className="text-gray-500 text-sm max-w-md leading-relaxed">
                The elite trading community built on precision, discipline, and institutional-grade analysis. XAU/USD and BTC/USD specialists.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Quick Links</h4>
              <ul className="space-y-3 text-sm text-gray-500">
                <li><a href="https://t.me/Zen_pips_bot" target="_blank" rel="noopener noreferrer" className="hover:text-[#d4af37] transition-colors">Join VIP</a></li>
                <li><a href="https://www.hfm.com/ke/en/?refid=30508914" target="_blank" rel="noopener noreferrer" className="hover:text-[#d4af37] transition-colors">Open Broker (HFM)</a></li>
                <li><a href="https://www.binance.com/referral/earn-together/refer2earn-usdc/claim?hl=en&ref=GRO_28502_E50OE&utm_source=default" target="_blank" rel="noopener noreferrer" className="hover:text-[#d4af37] transition-colors">Buy USDT (Binance)</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Community</h4>
              <ul className="space-y-3 text-sm text-gray-500">
                <li><a href="https://t.me/Zen_pips_bot" target="_blank" rel="noopener noreferrer" className="hover:text-[#d4af37] transition-colors">Free Telegram Group</a></li>
                <li><a href="https://t.me/MadDmakz" target="_blank" rel="noopener noreferrer" className="hover:text-[#d4af37] transition-colors">Contact Admin</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-600 text-xs max-w-lg text-center md:text-left">
              Trading foreign exchange on margin carries a high level of risk and may not be suitable for all investors. Past performance is not indicative of future results. This community is for educational purposes only.
            </p>
            <div className="text-xs text-gray-600">&copy; 2026 Zen Pips. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </main>
  );
}
