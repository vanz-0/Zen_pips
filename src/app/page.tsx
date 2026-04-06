"use client";

import Image from "next/image";
import { BarChart2, Shield, TrendingUp, Zap, Target, Users, Clock, ExternalLink, Menu, X, LogIn, BookOpen, History, User, GraduationCap, MessageCircle, Home as HomeIcon, Lock, LogOut, Lightbulb, Sun, Moon } from "lucide-react";
import { Particles } from "@/components/ui/particles";
import { GlowCard } from "@/components/ui/glow-card";
import { TradingTerminal } from "@/components/ui/trading-terminal";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect, useMemo } from "react";
import { SignalData } from "@/components/ui/trading-terminal";
import { useSignals } from "@/hooks/useSignals";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { ProfileTab } from "@/components/dashboard/ProfileTab";
import { JournalTab } from "@/components/dashboard/JournalTab";
import { VaultTab } from "@/components/dashboard/VaultTab";
import { ChartAITab } from "@/components/dashboard/ChartAITab";
import { CommunityTab } from "@/components/dashboard/CommunityTab";
import { SignalControlPanel } from "@/components/admin/SignalControlPanel";
import { OnboardingTab } from "@/components/dashboard/OnboardingTab";
import { InnovationHubTab } from "@/components/dashboard/InnovationHubTab";
import { LeadMagnetSection } from "@/components/marketing/LeadMagnetSection";
import { ProfileSetupPopup } from "@/components/dashboard/ProfileSetupPopup";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

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

function DashboardContent() {
  const { signals } = useSignals();
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<"journal" | "vault" | "profile" | "chartai" | "admin" | "help" | "community" | "innovation" | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Derived stats
  const totalPipsToday = Math.round(signals
    .filter(s => {
      const createdDate = new Date(s.created_at);
      const today = new Date();
      return createdDate.toDateString() === today.toDateString();
    })
    .reduce((acc, sig) => acc + (Number(sig.total_pips) || 0), 0));

  const grandTotalPips = Math.round(signals.reduce((acc, sig) => acc + (Number(sig.total_pips) || 0), 0));
  
  const winRate = signals.length > 0
    ? Math.round((signals.filter(s => Number(s.total_pips) > 0).length / signals.length) * 100)
    : 100;
  const activeCount = signals.filter(s => !s.closed).length;

  // Sync tab with URL
  useEffect(() => {
    const tab = searchParams.get('tab') as any;
    if (tab && ["journal", "vault", "profile", "chartai", "admin", "help", "community", "innovation"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Handle manual navigation
  const handleNavClick = (tab: "journal" | "vault" | "profile" | "chartai" | "admin" | "help" | "community" | "innovation" | null) => {
    if (tab && !user) {
      router.push("/auth");
      return;
    }
    setActiveTab(tab);
    setMenuOpen(false);
    
    // URL update without jumping scroll
    if (tab) {
        const newUrl = window.location.pathname + `?tab=${tab}`;
        window.history.pushState({ path: newUrl }, '', newUrl);
    } else {
        const newUrl = window.location.pathname;
        window.history.pushState({ path: newUrl }, '', newUrl);
    }
  };

  return (
    <main className={`bg-[var(--background)] relative font-[family-name:var(--font-inter)] selection:bg-[#d4af37] selection:text-black flex flex-col ${activeTab ? 'h-screen overflow-hidden' : 'min-h-screen overflow-x-hidden'} transition-colors duration-300`}>

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
      <div className="absolute inset-0 z-[1] bg-[linear-gradient(to_right,var(--border-color)_1px,transparent_1px),linear-gradient(to_bottom,var(--border-color)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30"></div>

      {/* Grain Overlay */}
      <div className="fixed inset-0 z-[2] opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }}></div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--border-color)]">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => handleNavClick(null)}
              className="relative w-11 h-11 bg-[#d4af37] rounded-full p-0.5 shadow-md border border-yellow-600/30 flex items-center justify-center transition-transform hover:scale-105 outline-none"
            >
              <div className="w-full h-full bg-[#0a0a0a] rounded-full overflow-hidden relative">
                <Image 
                  src="/logo.png" 
                  alt="Zen Pips" 
                  fill 
                  className="object-contain" 
                  priority
                />
              </div>
            </button>
          </div>
          {/* Desktop nav links */}
          <div className="hidden lg:flex gap-8 text-sm font-medium text-[var(--text-muted)]">
            {user ? (
              <>
                <button onClick={() => handleNavClick(null)} className="hover:text-[var(--foreground)] transition-colors duration-300">Home</button>
                <button onClick={() => handleNavClick("help")} className={`hover:text-[#d4af37] transition-colors duration-300 font-bold ${activeTab === 'help' ? 'text-[#d4af37]' : 'text-[var(--text-muted)]'}`}>Setup Guide</button>
                <button onClick={() => handleNavClick("profile")} className={`hover:text-[var(--foreground)] transition-colors duration-300 ${activeTab === 'profile' ? 'text-yellow-500 font-bold' : ''}`}>Analytics</button>
                <button onClick={() => handleNavClick("chartai")} className={`hover:text-[#d4af37] transition-colors duration-300 font-semibold ${activeTab === 'chartai' ? 'text-[#d4af37]' : ''}`}>Chart AI</button>
                <button onClick={() => handleNavClick("innovation")} className={`hover:text-[#d4af37] transition-colors duration-300 font-semibold ${activeTab === 'innovation' ? 'text-[#d4af37]' : ''}`}>Innovation Hub</button>
                <button onClick={() => handleNavClick("community")} className={`hover:text-[var(--foreground)] transition-colors duration-300 ${activeTab === 'community' ? 'text-yellow-500 font-bold' : ''}`}>Community</button>
                <button onClick={() => handleNavClick("vault")} className={`hover:text-[var(--foreground)] transition-colors duration-300 ${activeTab === 'vault' ? 'text-yellow-500 font-bold' : ''}`}>Vault</button>
                <button onClick={() => handleNavClick("journal")} className={`hover:text-[var(--foreground)] transition-colors duration-300 ${activeTab === 'journal' ? 'text-yellow-500 font-bold' : ''}`}>Journal</button>
                <a href="/blog" className="hover:text-[var(--foreground)] transition-colors duration-300 font-semibold px-3 py-1 rounded-lg bg-[var(--card-bg)] border border-[var(--border-color)]">Blog</a>
              </>
            ) : (
              <>
                <a href="#features" className="hover:text-[var(--foreground)] transition-colors duration-300">Features</a>
                <a href="#results" className="hover:text-[var(--foreground)] transition-colors duration-300">Results</a>
                <a href="#pricing" className="hover:text-[var(--foreground)] transition-colors duration-300">Pricing</a>
              </>
            )}
          </div>
          {/* Hamburger Toggle & Profile - Only visible on mobile/tablet */}
          <div className="flex items-center gap-2 md:gap-4 z-[110]">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] hover:bg-yellow-500/10 transition-all text-[var(--foreground)]"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-2 p-1 rounded-full bg-[var(--card-bg)] border border-[var(--border-color)] hover:bg-[var(--accent-glow)] transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#d4af37] to-yellow-600 flex items-center justify-center text-black font-bold">
                    {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'Z'}
                  </div>
                </button>

                <AnimatePresence>
                  {profileMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-3 w-64 bg-[var(--panel-bg)] backdrop-blur-xl border border-[var(--border-color)] rounded-2xl shadow-2xl p-4 flex flex-col gap-3"
                    >
                      <div className="flex items-center gap-3 pb-3 border-b border-[var(--border-color)]">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#d4af37] to-yellow-600 flex flex-shrink-0 items-center justify-center text-black font-bold text-lg">
                          {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'Z'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[var(--foreground)] truncate">{user?.user_metadata?.full_name || 'Trader'}</p>
                          <p className="text-xs text-[var(--text-muted)] truncate">{user?.email}</p>
                        </div>
                      </div>
                      
                      <button onClick={() => { handleNavClick("profile"); setProfileMenuOpen(false); }} className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--accent-glow)] px-3 py-2 rounded-lg transition-colors text-left">
                        <User className="w-4 h-4" /> Edit Profile
                      </button>
                      <button onClick={() => { handleNavClick("chartai"); setProfileMenuOpen(false); }} className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--accent-glow)] px-3 py-2 rounded-lg transition-colors text-left">
                        <BarChart2 className="w-4 h-4 text-[var(--color-info)]" /> Copy Trade Setup
                      </button>
                      <button onClick={() => { signOut(); setProfileMenuOpen(false); }} className="flex items-center gap-2 text-sm text-[var(--color-danger)] hover:text-red-300 hover:bg-red-500/10 px-3 py-2 rounded-lg transition-colors text-left">
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <a href="/auth" className="hidden lg:flex px-6 py-2 rounded-xl bg-yellow-500 text-black font-bold text-sm hover:bg-yellow-400 transition-all">
                GET ACCESS
              </a>
            )}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden relative w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--card-bg)] hover:bg-[var(--accent-glow)] border border-[var(--border-color)] transition-all duration-200"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="w-5 h-5 text-[var(--foreground)]" /> : <Menu className="w-5 h-5 text-[var(--foreground)]" />}
            </button>
          </div>
        </div>

        {/* Dropdown Menu Panel */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden border-t border-[var(--border-color)] bg-[var(--background)]/95 backdrop-blur-2xl"
            >
              <div className="max-w-7xl mx-auto px-6 py-4 grid grid-cols-2 md:grid-cols-6 gap-3">
                {/* Home */}
                <button
                  onClick={() => handleNavClick(null)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--card-bg)] hover:bg-[var(--accent-glow)] border border-[var(--border-color)] hover:border-yellow-500/30 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                    <HomeIcon className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-[var(--foreground)] group-hover:text-yellow-500 transition-colors">Home</p>
                    <p className="text-[10px] text-[var(--text-muted)]">Main hub</p>
                  </div>
                </button>

                {/* Setup Guide */}
                <button
                  onClick={() => handleNavClick("help")}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#d4af37]/[0.05] hover:bg-[#d4af37]/[0.12] border border-[#d4af37]/20 hover:border-[#d4af37]/40 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#d4af37]/10 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-[#d4af37]" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-[var(--foreground)] group-hover:text-[#d4af37] transition-colors">Setup Guide</p>
                    <p className="text-[10px] text-[var(--text-muted)]">Go Live Guide</p>
                  </div>
                </button>

                {/* Profile / Analytics */}
                <button
                  onClick={() => handleNavClick("profile")}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-[var(--border-color)] hover:border-yellow-500/30 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-yellow-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-[var(--foreground)] group-hover:text-yellow-500 transition-colors">Analytics</p>
                    <p className="text-[10px] text-[var(--text-muted)]">Broker & Settings</p>
                  </div>
                </button>

                {/* Chart AI */}
                <button
                  onClick={() => handleNavClick("chartai")}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-500/[0.05] hover:bg-blue-500/[0.12] border border-blue-500/20 hover:border-blue-500/40 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <BarChart2 className="w-4 h-4 text-[var(--color-info)]" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-[var(--foreground)] group-hover:text-[var(--color-info)] transition-colors">Chart AI</p>
                    <p className="text-[10px] text-[var(--color-info)]">Copy Trading</p>
                  </div>
                </button>

                {/* Innovation Hub */}
                <button
                  onClick={() => handleNavClick("innovation")}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-orange-500/[0.05] hover:bg-orange-500/[0.12] border border-orange-500/20 hover:border-orange-500/40 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <Lightbulb className="w-4 h-4 text-[var(--color-warning)]" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-[var(--foreground)] group-hover:text-[var(--color-warning)] transition-colors">Innovation</p>
                    <p className="text-[10px] text-[var(--text-muted)]">Propose Tools</p>
                  </div>
                </button>

                {/* Community */}
                <button
                  onClick={() => handleNavClick("community")}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-500/[0.05] hover:bg-green-500/[0.12] border border-green-500/20 hover:border-green-500/40 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-[var(--color-success)]" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-[var(--foreground)] group-hover:text-[var(--color-success)] transition-colors">Community</p>
                    <p className="text-[10px] text-[var(--text-muted)]">Live Chat</p>
                  </div>
                </button>

                {/* Vault */}
                <button
                  onClick={() => handleNavClick("vault")}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-[var(--border-color)] hover:border-yellow-500/30 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <GraduationCap className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-[var(--foreground)] group-hover:text-yellow-500 transition-colors">Vault</p>
                    <p className="text-[10px] text-[var(--text-muted)]">Education</p>
                  </div>
                </button>

                {/* Journal */}
                <button
                  onClick={() => handleNavClick("journal")}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-[var(--border-color)] hover:border-yellow-500/30 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-[var(--color-info)]" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-[var(--foreground)] group-hover:text-yellow-500 transition-colors">Journal</p>
                    <p className="text-[10px] text-[var(--text-muted)]">Log trades</p>
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
                    <p className="text-sm font-semibold text-[var(--foreground)] group-hover:text-purple-400 transition-colors">Blog</p>
                    <p className="text-[10px] text-[var(--text-muted)]">Trading Blog</p>
                  </div>
                </a>

                {/* Free Group */}
                <a
                  href="https://t.me/Zen_pips_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-[var(--border-color)] hover:border-[#d4af37]/30 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#d4af37]/10 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-[#d4af37]" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-[var(--foreground)] group-hover:text-[#d4af37] transition-colors">Free Group</p>
                    <p className="text-[10px] text-[var(--text-muted)]">Telegram</p>
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
        {/* Profile Setup / Trial Trigger Overlay */}
        <ProfileSetupPopup />

      </nav>

      {/* Main Content Area */}
      <section className={`flex-1 ${activeTab ? 'overflow-y-auto' : ''}`}>
        {/* Trading Terminal (Full-viewport Hero) - Only shown on Home */}
        {!activeTab && (
          <section className="relative z-10 w-full min-h-screen">
              <TradingTerminal />
          </section>
        )}

        {/* Community Tab — Full viewport Discord layout (no padding, no footer) */}
        {user && activeTab === "community" && (
          <section className="fixed top-[73px] bottom-0 left-0 right-0 z-40 bg-[var(--background)] flex flex-col overflow-hidden">
            <CommunityTab />
          </section>
        )}
        
        {/* Other Tabs */}
        {user && activeTab && activeTab !== "community" && (
          <section id="dashboard-section" className="relative z-10 py-8 sm:py-12 px-4 sm:px-6 max-w-7xl mx-auto border-t border-[var(--border-color)] w-full min-h-[60vh] pb-32">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full bg-[var(--background)]"
              >
                {activeTab === "journal" && (
                  profile?.is_vip ? <JournalTab /> : (
                    <div className="flex flex-col items-center justify-center p-8 sm:p-14 md:p-20 bg-[var(--card-bg)] rounded-3xl border border-[var(--border-color)] text-center">
                      <Lock className="w-12 h-12 sm:w-16 sm:h-16 text-yellow-500 mb-6 opacity-20" />
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 text-[var(--foreground)]">Institutional Journaling</h2>
                      <p className="text-[var(--text-muted)] max-w-sm mx-auto mb-8 text-sm sm:text-base">Access the multi-timeframe journal to track your metrics like a professional. VIP Exclusive.</p>
                      <a href="https://t.me/Zen_pips_bot" className="px-6 sm:px-8 py-3 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400 transition-all text-sm sm:text-base">Unlock with VIP</a>
                    </div>
                  )
                )}
                {activeTab === "vault" && <VaultTab onNavigate={(t) => setActiveTab(t)} />}
                {activeTab === "profile" && <ProfileTab />}
                {activeTab === "help" && <OnboardingTab />}
                {activeTab === "innovation" && <InnovationHubTab onNavigate={(t) => setActiveTab(t)} />}
                {activeTab === "chartai" && <ChartAITab />}
                {activeTab === "admin" && <SignalControlPanel />}
              </motion.div>
            </AnimatePresence>
          </section>
        )}

        {/* Landing Page Content (only shown if no tab is active) */}
        {!activeTab && (
          <div className="flex-1">
            {/* Features Bento Grid */}
            <section id="features" className="relative z-10 py-24 px-6 max-w-7xl mx-auto border-t border-[var(--border-color)]">
              <FadeInSection>
                <div className="text-center md:text-left mb-16">
                  <h2 className="font-[family-name:var(--font-outfit)] text-3xl md:text-5xl font-bold text-[var(--foreground)] mb-4">
                    The <span className="text-[#d4af37]">Advantage.</span>
                  </h2>
                  <p className="text-[var(--text-muted)] max-w-xl text-lg">
                    We strip away the noise and focus purely on high-probability setups, giving you the institutional edge.
                  </p>
                </div>
              </FadeInSection>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FadeInSection className="md:col-span-2" delay={0.1}>
                <GlowCard glowColor="gold" className="h-full bg-black/80">
                  <div className="w-12 h-12 bg-[#d4af37]/20 rounded-full flex items-center justify-center mb-6">
                    <Zap className="w-6 h-6 text-yellow-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Sniper Entries</h3>
                  <p className="text-gray-300 leading-relaxed max-w-md">
                    We send pinpoint BUY/SELL targets directly to your Telegram. We only trade when the setup perfectly aligns with our confluence models during London/NY sessions.
                  </p>
                </GlowCard>
              </FadeInSection>

              <FadeInSection delay={0.2}>
                <GlowCard glowColor="blue" className="h-full bg-black/80">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-6">
                    <Shield className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Capital Preservation</h3>
                  <p className="text-gray-300 leading-relaxed">
                    We advocate 1% max risk per trade. Our stop-losses are calculated mathematically to avoid market sweeps.
                  </p>
                </GlowCard>
              </FadeInSection>

              <FadeInSection delay={0.3}>
                <GlowCard glowColor="green" className="h-full bg-black/80">
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                    <TrendingUp className="w-6 h-6 text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Compound Growth</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Consistency over gambling. Our monthly net pip targets are built to scale funded accounts steadily.
                  </p>
                </GlowCard>
              </FadeInSection>

              <FadeInSection className="md:col-span-2" delay={0.4}>
                <GlowCard glowColor="purple" className="h-full bg-black/80">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mb-6">
                    <BarChart2 className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Daily Institutional Breakdown</h3>
                  <p className="text-gray-300 leading-relaxed max-w-md">
                    Before we ever place a trade, you receive our macro bias, liquidity zones, and structural markups. You aren&apos;t just copying; you are learning market dominance.
                  </p>
                </GlowCard>
              </FadeInSection>
            </div>
          </section>

          {/* Results / Social Proof Section */}
          <section id="results" className="relative z-10 py-24 px-6 max-w-7xl mx-auto border-t border-[var(--border-color)]">
            <FadeInSection>
              <div className="text-center mb-16">
                <h2 className="font-[family-name:var(--font-outfit)] text-3xl md:text-5xl font-bold text-[var(--foreground)] mb-4">
                  Real <span className="text-[#d4af37]">Results.</span> No Filters.
                </h2>
                <p className="text-[var(--text-muted)] max-w-xl mx-auto text-lg">
                  Verified pip counts from our live Telegram channel. Every number is backed by posted signals.
                </p>
              </div>
            </FadeInSection>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-16">
              {[
                { value: `+${grandTotalPips.toLocaleString()}`, label: "Grand Total Pips", color: "text-[#d4af37]" },
                { value: `+${totalPipsToday.toLocaleString()}`, label: "Pips Today", color: "text-[var(--foreground)]" },
                { value: `${winRate}%`, label: "Win Rate", color: "text-[var(--foreground)]" },
                { value: activeCount > 0 ? "LIVE" : "MONITORING", label: activeCount > 0 ? "Active Now" : "Systems Check", color: activeCount > 0 ? "text-[var(--color-success)]" : "text-[var(--color-info)]", glow: activeCount > 0 },
              ].map((stat, i) => (
                <FadeInSection key={stat.label} delay={0.1 * i}>
                  <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-4 sm:p-6 text-center hover:border-[#d4af37]/20 transition-colors">
                    <div className={`text-lg sm:text-2xl md:text-4xl lg:text-5xl font-extrabold ${stat.color} font-mono mb-2 sm:mb-3 tracking-tight`}>{stat.value}</div>
                    <div className="text-[10px] sm:text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider">{stat.label}</div>
                  </div>
                </FadeInSection>
              ))}
            </div>

            {/* Recent Signal Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {signals.slice(0, 3).map((sig, i) => (
                <FadeInSection key={sig.id} delay={0.1 * (i + 1)}>
                  <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-6 hover:border-green-500/20 transition-all h-full">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[#d4af37] font-bold text-lg">{sig.pair} <span className="text-xs text-[var(--text-muted)]">{sig.timeframe}</span></span>
                      <span className={`text-[10px] font-mono px-3 py-1 rounded-full border ${sig.status === "ACTIVE"
                        ? "bg-blue-500/10 text-[var(--color-info)] border-blue-500/20"
                        : "bg-green-500/10 text-[var(--color-success)] border-green-500/20"
                        }`}>
                        {sig.status}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-[var(--text-muted)]">Entry</span><span className="text-[var(--foreground)] font-mono">{sig.entry.toLocaleString()}</span></div>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">Result</span>
                        <span className={`${sig.total_pips >= 0 ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"} font-mono font-bold`}>
                          {sig.total_pips > 0 ? "+" : ""}{Math.round(sig.total_pips).toLocaleString()} Pips
                        </span>
                      </div>
                      <div className="pt-2 border-t border-[var(--border-color)]">
                        <p className="text-[10px] text-[var(--text-muted)] italic leading-relaxed">{sig.confluence}</p>
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
          <section id="pricing" className="relative z-10 py-24 px-6 max-w-7xl mx-auto border-t border-[var(--border-color)]">
            <FadeInSection>
              <div className="text-center mb-16">
                <h2 className="font-[family-name:var(--font-outfit)] text-3xl md:text-5xl font-bold text-[var(--foreground)] mb-4">
                  Join the <span className="text-[#d4af37]">Inner Circle.</span>
                </h2>
                <p className="text-[var(--text-muted)] max-w-xl mx-auto text-lg">
                  Automated crypto checkout. Instant access after validation.
                </p>
              </div>
            </FadeInSection>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FadeInSection delay={0.1}>
                <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-8 flex flex-col hover:-translate-y-2 transition-transform duration-300 h-full relative overflow-hidden group">
                  <div className="absolute top-4 right-4 bg-yellow-500 text-black text-[10px] font-black px-2 py-1 rounded italic animate-pulse shadow-lg">50% OFF</div>
                  <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">1 Month Access</h3>
                  <p className="text-[var(--text-muted)] mb-6 text-sm">New Recruit Protocol. Secure your edge today.</p>
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-8 flex items-baseline gap-2 flex-wrap">
                    <span className="text-sm sm:text-lg line-through opacity-30 text-[var(--text-muted)] font-mono">$50</span>
                    $25<span className="text-sm sm:text-lg text-[var(--text-muted)] font-normal">/mo</span>
                  </div>
                  <ul className="space-y-4 mb-8 flex-1">
                    <li className="flex items-center gap-3 text-[var(--text-muted)] text-sm"><div className="w-1.5 h-1.5 rounded-full bg-[#d4af37]"></div> Daily VIP Signals (XAU/BTC)</li>
                    <li className="flex items-center gap-3 text-[var(--text-muted)] text-sm"><div className="w-1.5 h-1.5 rounded-full bg-[#d4af37]"></div> London/NY Analysis Breakdown</li>
                    <li className="flex items-center gap-3 text-[var(--text-muted)] text-sm"><div className="w-1.5 h-1.5 rounded-full bg-[#d4af37]"></div> Institutional Community Access</li>
                  </ul>
                  <a href="https://t.me/Zen_pips_bot" target="_blank" rel="noopener noreferrer" className="block text-center w-full py-4 rounded-xl border border-[var(--border-color)] text-[var(--foreground)] font-bold hover:bg-yellow-500 hover:text-black transition-all">Start Now</a>
                </div>
              </FadeInSection>

              <FadeInSection delay={0.2}>
                <div className="bg-[var(--card-bg)] border border-[#d4af37] shadow-[0_0_30px_rgba(212,175,55,0.15)] rounded-3xl p-8 flex flex-col relative transform hover:-translate-y-2 transition-transform duration-300 md:-translate-y-4 h-full">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#d4af37] text-black text-xs font-bold uppercase tracking-wider py-1 px-4 rounded-full">Most Popular</div>
                  <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">6 Months Access</h3>
                  <p className="text-[var(--text-muted)] mb-6 text-sm">The Commitment Phase. Full institutional access.</p>
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-8 flex items-baseline gap-2 flex-wrap">
                    <span className="text-sm sm:text-lg line-through opacity-30 text-[var(--text-muted)] font-mono">$250</span>
                    $100<span className="text-sm sm:text-lg text-[var(--text-muted)] font-normal ml-1 sm:ml-2"> ($16/mo)</span>
                  </div>
                  <ul className="space-y-4 mb-8 flex-1">
                    <li className="flex items-center gap-3 text-[var(--text-muted)] text-sm"><div className="w-1.5 h-1.5 rounded-full bg-[#d4af37]"></div> Daily VIP Signals & Terminal</li>
                    <li className="flex items-center gap-3 text-[var(--text-muted)] text-sm"><div className="w-1.5 h-1.5 rounded-full bg-[#d4af37]"></div> Risk Management Risk Planner</li>
                    <li className="flex items-center gap-3 text-[var(--text-muted)] text-sm"><div className="w-1.5 h-1.5 rounded-full bg-[#d4af37]"></div> Educational Vault Access</li>
                  </ul>
                  <a href="https://t.me/Zen_pips_bot" target="_blank" rel="noopener noreferrer" className="block text-center w-full py-4 rounded-xl bg-[#d4af37] text-black font-bold hover:brightness-110 transition-colors shadow-lg">Secure Spot</a>
                </div>
              </FadeInSection>

              <FadeInSection delay={0.3}>
                <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-8 flex flex-col hover:-translate-y-2 transition-transform duration-300 h-full">
                  <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">1 Year Access</h3>
                  <p className="text-[var(--text-muted)] mb-6 text-sm">Become a Dominator. Annual mastery and support.</p>
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-8 flex items-baseline gap-2 flex-wrap">
                    <span className="text-sm sm:text-lg line-through opacity-30 text-[var(--text-muted)] font-mono">$450</span>
                    $200<span className="text-sm sm:text-lg text-[var(--text-muted)] font-normal ml-1 sm:ml-2"> ($16/mo)</span>
                  </div>
                  <ul className="space-y-4 mb-8 flex-1">
                    <li className="flex items-center gap-3 text-[var(--text-muted)] text-sm"><div className="w-1.5 h-1.5 rounded-full bg-[#d4af37]"></div> Institutional Guide (Premium)</li>
                    <li className="flex items-center gap-3 text-[var(--text-muted)] text-sm"><div className="w-1.5 h-1.5 rounded-full bg-[#d4af37]"></div> VIP Journal Analysis Tools</li>
                    <li className="flex items-center gap-3 text-[var(--text-muted)] text-sm"><div className="w-1.5 h-1.5 rounded-full bg-[#d4af37]"></div> Priority Implementation Access</li>
                  </ul>
                  <a href="https://t.me/Zen_pips_bot" target="_blank" rel="noopener noreferrer" className="block text-center w-full py-4 rounded-xl border border-[var(--border-color)] text-[var(--foreground)] font-bold hover:bg-yellow-500 hover:text-black transition-all">Go Annual</a>
                </div>
              </FadeInSection>
            </div>
          </section>

          {/* Get Started / Broker Section */}
          <section id="broker" className="relative z-10 py-24 px-6 max-w-7xl mx-auto border-t border-[var(--border-color)]">
            <FadeInSection>
              <div className="text-center mb-16">
                <h2 className="font-[family-name:var(--font-outfit)] text-3xl md:text-5xl font-bold text-[var(--foreground)] mb-4">
                  Get <span className="text-[#d4af37]">Set Up.</span>
                </h2>
                <p className="text-[var(--text-muted)] max-w-xl mx-auto text-lg">
                  Everything you need to start executing trades in under 10 minutes.
                </p>
              </div>
            </FadeInSection>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <FadeInSection delay={0.1}>
                <a href="https://www.hfm.com/ke/en/?refid=30508914" target="_blank" rel="noopener noreferrer"
                  className="group bg-gradient-to-br from-[var(--card-bg)] to-transparent border border-[var(--border-color)] p-8 rounded-3xl hover:border-[#d4af37]/40 hover:shadow-[0_0_40px_rgba(212,175,55,0.1)] transition-all duration-300 flex flex-col items-start h-full">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-[#d4af37]/10 rounded-full flex items-center justify-center">
                      <Target className="w-6 h-6 text-[#d4af37]" />
                    </div>
                    <span className="text-xs bg-[#d4af37]/10 text-[#d4af37] px-3 py-1 rounded-full font-semibold uppercase tracking-wider">Step 1</span>
                  </div>
                  <h3 className="text-2xl font-bold text-[var(--foreground)] mb-3">Open Your Broker</h3>
                  <p className="text-[var(--text-muted)] mb-6 leading-relaxed">
                    We exclusively use <strong className="text-[var(--foreground)]">HFM</strong> for institutional-grade spreads on Gold and Bitcoin. Raw spreads. Fast execution. Regulated.
                  </p>
                  <div className="mt-auto flex items-center gap-2 text-[#d4af37] font-semibold group-hover:gap-3 transition-all">
                    Open HFM Account <ExternalLink className="w-4 h-4" />
                  </div>
                </a>
              </FadeInSection>

              <FadeInSection delay={0.2}>
                <a href="https://www.binance.com/referral/earn-together/refer2earn-usdc/claim?hl=en&ref=GRO_28502_E50OE&utm_source=default" target="_blank" rel="noopener noreferrer"
                  className="group bg-gradient-to-br from-[var(--card-bg)] to-transparent border border-[var(--border-color)] p-8 rounded-3xl hover:border-yellow-500/40 hover:shadow-[0_0_40px_rgba(234,179,8,0.1)] transition-all duration-300 flex flex-col items-start h-full">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center">
                      <Clock className="w-6 h-6 text-yellow-400" />
                    </div>
                    <span className="text-xs bg-yellow-500/10 text-yellow-400 px-3 py-1.5 rounded-full font-semibold uppercase tracking-wider">Step 2</span>
                  </div>
                  <h3 className="text-2xl font-bold text-[var(--foreground)] mb-3">Get USDT via Binance</h3>
                  <p className="text-[var(--text-muted)] mb-6 leading-relaxed">
                    Purchase <strong className="text-[var(--foreground)]">USDT</strong> via card or bank transfer, then send it via TRC-20 to join our VIP room instantly.
                  </p>
                  <div className="mt-auto flex items-center gap-2 text-yellow-400 font-semibold group-hover:gap-3 transition-all">
                    Create Binance Account <ExternalLink className="w-4 h-4" />
                  </div>
                </a>
              </FadeInSection>
            </div>

            <FadeInSection delay={0.3}>
              <div className="mt-12 text-center">
                <div className="inline-flex items-center gap-3 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-full px-8 py-4">
                  <Users className="w-5 h-5 text-[#d4af37]" />
                  <span className="text-[var(--text-muted)]">Step 3:</span>
                  <a href="https://t.me/Zen_pips_bot" target="_blank" rel="noopener noreferrer" className="text-[#d4af37] font-bold hover:underline">
                    Message @Zen_pips to unlock VIP
                  </a>
                </div>
              </div>
            </FadeInSection>
          </section>
        </div>
        )}
        


        {/* Footer — only shown if NOT community tab, placed at bottom of scrollable area */}
        {activeTab !== "community" && (
          <footer className="relative z-10 border-t border-[var(--border-color)] py-16 px-6 bg-[var(--background)] min-h-[300px]">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                <div className="md:col-span-2">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="relative w-11 h-11 bg-[#d4af37] rounded-full p-0.5 shadow-md border border-yellow-600/30 flex items-center justify-center">
                      <div className="w-full h-full bg-[#0a0a0a] rounded-full overflow-hidden relative">
                        <Image 
                          src="/logo.png" 
                          alt="Zen Pips" 
                          fill 
                          className="object-contain" 
                        />
                      </div>
                    </div>
                    <span className="font-[family-name:var(--font-outfit)] font-bold text-xl tracking-wide text-[var(--foreground)]">ZENPIPS</span>
                  </div>
                  <p className="text-[var(--text-muted)] text-sm max-w-md leading-relaxed">
                    The elite trading community built on precision, discipline, and institutional-grade analysis. XAU/USD and BTC/USD specialists.
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-wider mb-4">Quick Links</h4>
                  <ul className="space-y-3 text-sm text-[var(--text-muted)]">
                    <li><a href="https://t.me/Zen_pips_bot" target="_blank" rel="noopener noreferrer" className="hover:text-[#d4af37] transition-colors">Join VIP</a></li>
                    <li><a href="https://www.hfm.com/ke/en/?refid=30508914" target="_blank" rel="noopener noreferrer" className="hover:text-[#d4af37] transition-colors">Open Broker (HFM)</a></li>
                    <li><a href="https://www.binance.com/referral/earn-together/refer2earn-usdc/claim?hl=en&ref=GRO_28502_E50OE&utm_source=default" target="_blank" rel="noopener noreferrer" className="hover:text-[#d4af37] transition-colors">Buy USDT (Binance)</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-wider mb-4">Community</h4>
                  <ul className="space-y-3 text-sm text-[var(--text-muted)]">
                    <li>
                        <a href="https://t.me/zenpips" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[var(--text-muted)] hover:text-white transition-colors text-xs font-medium">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Premium Group
                        </a>
                    </li>
                    <li><a href="https://t.me/MadDmakz" target="_blank" rel="noopener noreferrer" className="hover:text-[#d4af37] transition-colors">Contact Admin</a></li>
                  </ul>
                </div>
              </div>
              <div className="border-t border-[var(--border-color)] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-[var(--text-muted)] text-xs max-w-lg text-center md:text-left">
                  Trading foreign exchange on margin carries a high level of risk and may not be suitable for all investors. Past performance is not indicative of future results. This community is for educational purposes only.
                </p>
                <div className="text-xs text-[var(--text-muted)]">&copy; 2026 Zen Pips. All rights reserved.</div>
              </div>
            </div>
          </footer>
        )}
      </section>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
        <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
            <div className="w-8 h-8 animate-spin border-2 border-[#d4af37] border-t-transparent rounded-full" />
        </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
