"use client";

import Image from "next/image";
import { BarChart2, Shield, TrendingUp, Zap, Target, Users, Clock, ExternalLink } from "lucide-react";
import { Particles } from "@/components/ui/particles";
import { GlowCard } from "@/components/ui/glow-card";
import { TradingTerminal } from "@/components/ui/trading-terminal";
import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { SignalData } from "@/components/ui/trading-terminal";
import { supabase } from "@/lib/supabase";

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
  const [signals, setSignals] = useState<SignalData[]>([]);

  // Fetch signals from Supabase 
  useEffect(() => {
    const fetchSignals = async () => {
      const { data, error } = await supabase
        .from('signals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching signals from page:", error);
      } else if (data) {
        setSignals(data as SignalData[]);
      }
    };

    fetchSignals();

    // Subscribe to live updates
    const channel = supabase
      .channel('home_signals_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'signals' }, (payload) => {
        fetchSignals();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Derived stats
  const totalPipsToday = signals.reduce((acc, sig) => acc + (sig.total_pips || 0), 0);
  const winRate = signals.length > 0
    ? Math.round((signals.filter(s => s.total_pips > 0).length / signals.length) * 100)
    : 100;
  const activeCount = signals.filter(s => !s.closed).length;

  return (
    <main className="min-h-screen bg-[#0a0a0a] overflow-hidden relative font-[family-name:var(--font-inter)] selection:bg-[#d4af37] selection:text-black">

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
          <div className="hidden md:flex gap-8 text-sm font-medium text-gray-400">
            <a href="#features" className="hover:text-white transition-colors duration-300">Features</a>
            <a href="/vault" className="hover:text-white transition-colors duration-300">Vault</a>
            <a href="/journal" className="hover:text-white transition-colors duration-300">Journal</a>
            <a href="/profile" className="hover:text-white transition-colors duration-300">Profile</a>
          </div>
          <a
            href="https://t.me/Zen_pips"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:scale-105 active:scale-95 duration-200"
          >
            Join Free Group
          </a>
        </div>
      </nav>

      {/* Trading Terminal (Full-viewport Hero) */}
      <section className="relative z-10">
        <TradingTerminal />
      </section>

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
              <a href="https://t.me/Zen_pips" target="_blank" rel="noopener noreferrer" className="block text-center w-full py-4 rounded-xl border border-white/20 text-white font-medium hover:bg-white/5 transition-colors">Start Now</a>
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
              <a href="https://t.me/Zen_pips" target="_blank" rel="noopener noreferrer" className="block text-center w-full py-4 rounded-xl bg-[#d4af37] text-black font-bold hover:brightness-110 transition-colors">Secure Spot</a>
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
              <a href="https://t.me/Zen_pips" target="_blank" rel="noopener noreferrer" className="block text-center w-full py-4 rounded-xl border border-white/20 text-white font-medium hover:bg-white/5 transition-colors">Go Annual</a>
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
              <a href="https://t.me/Zen_pips" target="_blank" rel="noopener noreferrer" className="text-[#d4af37] font-bold hover:underline">
                Message @Zen_pips to unlock VIP
              </a>
            </div>
          </div>
        </FadeInSection>
      </section>

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
                <li><a href="https://t.me/Zen_pips" target="_blank" rel="noopener noreferrer" className="hover:text-[#d4af37] transition-colors">Join VIP</a></li>
                <li><a href="https://www.hfm.com/ke/en/?refid=30508914" target="_blank" rel="noopener noreferrer" className="hover:text-[#d4af37] transition-colors">Open Broker (HFM)</a></li>
                <li><a href="https://www.binance.com/referral/earn-together/refer2earn-usdc/claim?hl=en&ref=GRO_28502_E50OE&utm_source=default" target="_blank" rel="noopener noreferrer" className="hover:text-[#d4af37] transition-colors">Buy USDT (Binance)</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Community</h4>
              <ul className="space-y-3 text-sm text-gray-500">
                <li><a href="https://t.me/Zen_pips" target="_blank" rel="noopener noreferrer" className="hover:text-[#d4af37] transition-colors">Free Telegram Group</a></li>
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
