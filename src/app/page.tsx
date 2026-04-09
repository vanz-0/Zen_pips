"use client";

import Image from "next/image";
import { BarChart2, Shield, TrendingUp, Zap, Target, Users, Clock, ExternalLink, Menu, X, LogIn, BookOpen, History, User, GraduationCap, MessageCircle, Home as HomeIcon, Lock, LogOut, Lightbulb, Sun, Moon, Star } from "lucide-react";
import dynamic from "next/dynamic";
import { GlowCard } from "@/components/ui/glow-card";

const TradingTerminal = dynamic(() => import("@/components/ui/trading-terminal").then(mod => mod.TradingTerminal), { ssr: false });
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect, useMemo } from "react";
import { SignalData } from "@/components/ui/trading-terminal";
import { useSignals } from "@/hooks/useSignals";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
const ProfileTab = dynamic(() => import("@/components/dashboard/ProfileTab").then(mod => mod.ProfileTab));
const JournalTab = dynamic(() => import("@/components/dashboard/JournalTab").then(mod => mod.JournalTab));
const VaultTab = dynamic(() => import("@/components/dashboard/VaultTab").then(mod => mod.VaultTab));
const ChartAITab = dynamic(() => import("@/components/dashboard/ChartAITab").then(mod => mod.ChartAITab));
const CommunityTab = dynamic(() => import("@/components/dashboard/CommunityTab").then(mod => mod.CommunityTab), { ssr: false });
const SignalControlPanel = dynamic(() => import("@/components/admin/SignalControlPanel").then(mod => mod.SignalControlPanel));
const OnboardingTab = dynamic(() => import("@/components/dashboard/OnboardingTab").then(mod => mod.OnboardingTab));
const InnovationHubTab = dynamic(() => import("@/components/dashboard/InnovationHubTab").then(mod => mod.InnovationHubTab));
const LeadMagnetSection = dynamic(() => import("@/components/marketing/LeadMagnetSection").then(mod => mod.LeadMagnetSection));
const ProfileSetupPopup = dynamic(() => import("@/components/dashboard/ProfileSetupPopup").then(mod => mod.ProfileSetupPopup), { ssr: false });
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

function FadeInSection({ children, className = "" }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

function DashboardContent() {
  const { signals } = useSignals();
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<"journal" | "vault" | "profile" | "chartai" | "admin" | "help" | "community" | "innovation" | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [activeReviewSlide, setActiveReviewSlide] = useState(0);
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

  useEffect(() => {
    const tab = searchParams.get('tab') as any;
    if (tab && ["journal", "vault", "profile", "chartai", "admin", "help", "community", "innovation"].includes(tab)) {
      setActiveTab(tab);
      setMenuOpen(false);
      setProfileMenuOpen(false);
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

      {/* Subtle Grid Overlay */}
      <div className="absolute inset-0 z-[1] bg-[linear-gradient(to_right,var(--border-color)_1px,transparent_1px),linear-gradient(to_bottom,var(--border-color)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30"></div>
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
                GET STARTED FREE
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
                  (profile) ? <JournalTab /> : (
                    <div className="flex flex-col items-center justify-center p-8 sm:p-14 md:p-20 bg-[var(--card-bg)] rounded-3xl border border-[var(--border-color)] text-center">
                      <Lock className="w-12 h-12 sm:w-16 sm:h-16 text-yellow-500 mb-6 opacity-20" />
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 text-[var(--foreground)]">Institutional Journaling</h2>
                      <p className="text-[var(--text-muted)] max-w-sm mx-auto mb-8 text-sm sm:text-base">Access the multi-timeframe journal to track your metrics like a professional. VIP Exclusive.</p>
                      <a href="https://t.me/Zen_pips_bot" className="px-6 sm:px-8 py-3 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400 transition-all text-sm sm:text-base">Unlock with VIP</a>
                    </div>
                  )
                )}
                {activeTab === "vault" && (
                  <VaultTab onNavigate={(t) => setActiveTab(t as any)} profile={profile} />
                )}
                {activeTab === "profile" && <ProfileTab />}
                {activeTab === "help" && <OnboardingTab />}
                {activeTab === "innovation" && <InnovationHubTab onNavigate={(t) => setActiveTab(t as any)} />}
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
            <section id="features" className="relative z-10 py-12 sm:py-16 md:py-24 px-4 sm:px-6 max-w-7xl mx-auto border-t border-[var(--border-color)]">
              <FadeInSection>
                <div className="text-center md:text-left mb-8 sm:mb-12 md:mb-16">
                  <h2 className="font-[family-name:var(--font-outfit)] text-2xl sm:text-3xl md:text-5xl font-bold text-[var(--foreground)] mb-3 sm:mb-4">
                    The <span className="text-[#d4af37]">Advantage.</span>
                  </h2>
                  <p className="text-[var(--text-muted)] max-w-xl text-sm sm:text-base md:text-lg">
                    We strip away the noise and focus purely on high-probability setups, giving you the institutional edge.
                  </p>
                </div>
              </FadeInSection>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              <FadeInSection className="md:col-span-2" delay={0.1}>
                <GlowCard glowColor="gold" className="h-full">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#d4af37]/20 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                    <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
                  </div>
                  <h3 className="text-lg sm:text-2xl font-bold text-[var(--foreground)] mb-2 sm:mb-3">Sniper Entries</h3>
                  <p className="text-[var(--text-muted)] text-sm sm:text-base leading-relaxed max-w-md">
                    We send pinpoint BUY/SELL targets directly to your Telegram. We only trade when the setup perfectly aligns with our confluence models during London/NY sessions.
                  </p>
                </GlowCard>
              </FadeInSection>

              <FadeInSection delay={0.2}>
                <GlowCard glowColor="blue" className="h-full">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                    <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                  </div>
                  <h3 className="text-lg sm:text-2xl font-bold text-[var(--foreground)] mb-2 sm:mb-3">Capital Preservation</h3>
                  <p className="text-[var(--text-muted)] text-sm sm:text-base leading-relaxed">
                    We advocate 1% max risk per trade. Our stop-losses are calculated mathematically to avoid market sweeps.
                  </p>
                </GlowCard>
              </FadeInSection>

              <FadeInSection delay={0.3}>
                <GlowCard glowColor="green" className="h-full">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
                  </div>
                  <h3 className="text-lg sm:text-2xl font-bold text-[var(--foreground)] mb-2 sm:mb-3">Compound Growth</h3>
                  <p className="text-[var(--text-muted)] text-sm sm:text-base leading-relaxed">
                    Consistency over gambling. Our monthly net pip targets are built to scale funded accounts steadily.
                  </p>
                </GlowCard>
              </FadeInSection>

              <FadeInSection className="md:col-span-2" delay={0.4}>
                <GlowCard glowColor="purple" className="h-full">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/20 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                    <BarChart2 className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                  </div>
                  <h3 className="text-lg sm:text-2xl font-bold text-[var(--foreground)] mb-2 sm:mb-3">Daily Institutional Breakdown</h3>
                  <p className="text-[var(--text-muted)] text-sm sm:text-base leading-relaxed max-w-md">
                    Before we ever place a trade, you receive our macro bias, liquidity zones, and structural markups. You aren&apos;t just copying; you are learning market dominance.
                  </p>
                </GlowCard>
              </FadeInSection>
            </div>
          </section>

          {/* Results / Social Proof Section */}
          <section id="results" className="relative z-10 py-12 sm:py-16 md:py-24 px-4 sm:px-6 max-w-7xl mx-auto border-t border-[var(--border-color)]">
            <FadeInSection>
              <div className="text-center mb-8 sm:mb-12 md:mb-16">
                <h2 className="font-[family-name:var(--font-outfit)] text-2xl sm:text-3xl md:text-5xl font-bold text-[var(--foreground)] mb-3 sm:mb-4">
                  Real <span className="text-[#d4af37]">Results.</span> No Filters.
                </h2>
                <p className="text-[var(--text-muted)] max-w-xl mx-auto text-sm sm:text-base md:text-lg">
                  Verified pip counts from our live Telegram channel. Every number is backed by posted signals.
                </p>
              </div>
            </FadeInSection>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-8 sm:mb-12 md:mb-16 pb-8 md:pb-0">
              {[
                { value: `+${grandTotalPips.toLocaleString()}`, label: "Grand Total Pips", color: "text-[#d4af37]" },
                { value: `+${totalPipsToday.toLocaleString()}`, label: "Pips Today", color: "text-[var(--foreground)]" },
                { value: `${winRate}%`, label: "Win Rate", color: "text-[var(--foreground)]" },
                { value: activeCount > 0 ? "LIVE" : "MONITORING", label: activeCount > 0 ? "Active Now" : "Systems Check", color: activeCount > 0 ? "text-[var(--color-success)]" : "text-[var(--color-info)]", glow: activeCount > 0 },
              ].map((stat, i) => (
                <FadeInSection key={stat.label} delay={0.1 * i}>
                  <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 text-center">
                    <div className={`text-base sm:text-xl md:text-3xl lg:text-4xl font-extrabold ${stat.color} font-mono mb-1 sm:mb-2 tracking-tight`}>{stat.value}</div>
                    <div className="text-[9px] sm:text-xs md:text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider">{stat.label}</div>
                  </div>
                </FadeInSection>
              ))}
            </div>

            {/* Recent Signal Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
              {signals.slice(0, 5).map((sig, i) => (
                <FadeInSection key={sig.id} delay={0.1 * (i + 1)}>
                  <div 
                    onClick={() => user ? handleNavClick("chartai") : router.push("/auth")}
                    className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-4 sm:p-6 hover:border-green-500/20 transition-all h-full cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <span className="text-[#d4af37] font-bold text-sm sm:text-lg">{sig.pair} <span className="text-[10px] text-[var(--text-muted)]">{sig.timeframe}</span></span>
                      <span className={`text-[8px] sm:text-[10px] font-mono px-2 sm:px-3 py-1 rounded-full border ${sig.closed
                        ? "bg-green-500/10 text-[var(--color-success)] border-green-500/20"
                        : sig.tp1_hit
                          ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                          : "bg-blue-500/10 text-[var(--color-info)] border-blue-500/20"
                        }`}>
                        {sig.status}
                      </span>
                    </div>
                    <div className="space-y-2 text-xs sm:text-sm">
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
                    <div className="mt-3 text-[9px] text-[#d4af37] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">View in Chart AI →</div>
                  </div>
                </FadeInSection>
              ))}
            </div>
          </section>

          
          {/* Marquee Section */}
          <section className="py-8 bg-[var(--panel-bg)] border-y border-[var(--border-color)] overflow-hidden relative flex flex-col gap-4">
             <div className="absolute left-0 top-0 w-16 h-full bg-gradient-to-r from-[var(--background)] to-transparent z-10 pointer-events-none" />
             <div className="absolute right-0 top-0 w-16 h-full bg-gradient-to-l from-[var(--background)] to-transparent z-10 pointer-events-none" />
             
             
             <div className="flex whitespace-nowrap animate-marquee">
<span className="mx-4 text-sm font-bold text-[var(--text-muted)] tracking-widest uppercase">DATA-DRIVEN RESULTS</span>
<span className="mx-4 text-sm font-bold text-[#d4af37] tracking-widest uppercase">•</span>
<span className="mx-4 text-sm font-bold text-[var(--text-muted)] tracking-widest uppercase">DEEP INSTITUTIONAL RESEARCH</span>
<span className="mx-4 text-sm font-bold text-[#d4af37] tracking-widest uppercase">•</span>
<span className="mx-4 text-sm font-bold text-[var(--text-muted)] tracking-widest uppercase">SMART MONEY CONCEPTS</span>
<span className="mx-4 text-sm font-bold text-[#d4af37] tracking-widest uppercase">•</span>
<span className="mx-4 text-sm font-bold text-[var(--text-muted)] tracking-widest uppercase">ALGORITHMIC EXECUTION</span>
<span className="mx-4 text-sm font-bold text-[#d4af37] tracking-widest uppercase">•</span>
<span className="mx-4 text-sm font-bold text-[var(--text-muted)] tracking-widest uppercase">ORDER FLOW ANALYSIS</span>
<span className="mx-4 text-sm font-bold text-[#d4af37] tracking-widest uppercase">•</span>
<span className="mx-4 text-sm font-bold text-[var(--text-muted)] tracking-widest uppercase">LIQUIDITY SWEEPS</span>
<span className="mx-4 text-sm font-bold text-[#d4af37] tracking-widest uppercase">•</span>
<span className="mx-4 text-sm font-bold text-[var(--text-muted)] tracking-widest uppercase">MACRO FUNDAMENTALS</span>
<span className="mx-4 text-sm font-bold text-[#d4af37] tracking-widest uppercase">•</span>
<span className="mx-4 text-sm font-bold text-[var(--text-muted)] tracking-widest uppercase">VOLUME PROFILING</span>
<span className="mx-4 text-sm font-bold text-[#d4af37] tracking-widest uppercase">•</span>
<span className="mx-4 text-sm font-bold text-[var(--text-muted)] tracking-widest uppercase">DATA-DRIVEN RESULTS</span>
<span className="mx-4 text-sm font-bold text-[#d4af37] tracking-widest uppercase">•</span>
<span className="mx-4 text-sm font-bold text-[var(--text-muted)] tracking-widest uppercase">DEEP INSTITUTIONAL RESEARCH</span>
<span className="mx-4 text-sm font-bold text-[#d4af37] tracking-widest uppercase">•</span>
<span className="mx-4 text-sm font-bold text-[var(--text-muted)] tracking-widest uppercase">SMART MONEY CONCEPTS</span>
<span className="mx-4 text-sm font-bold text-[#d4af37] tracking-widest uppercase">•</span>
<span className="mx-4 text-sm font-bold text-[var(--text-muted)] tracking-widest uppercase">ALGORITHMIC EXECUTION</span>
<span className="mx-4 text-sm font-bold text-[#d4af37] tracking-widest uppercase">•</span>
<span className="mx-4 text-sm font-bold text-[var(--text-muted)] tracking-widest uppercase">ORDER FLOW ANALYSIS</span>
<span className="mx-4 text-sm font-bold text-[#d4af37] tracking-widest uppercase">•</span>
<span className="mx-4 text-sm font-bold text-[var(--text-muted)] tracking-widest uppercase">LIQUIDITY SWEEPS</span>
<span className="mx-4 text-sm font-bold text-[#d4af37] tracking-widest uppercase">•</span>
<span className="mx-4 text-sm font-bold text-[var(--text-muted)] tracking-widest uppercase">MACRO FUNDAMENTALS</span>
<span className="mx-4 text-sm font-bold text-[#d4af37] tracking-widest uppercase">•</span>
<span className="mx-4 text-sm font-bold text-[var(--text-muted)] tracking-widest uppercase">VOLUME PROFILING</span>
<span className="mx-4 text-sm font-bold text-[#d4af37] tracking-widest uppercase">•</span>
             </div>
             <div className="flex whitespace-nowrap animate-marquee-reverse opacity-70">
<span className="mx-4 text-xs font-bold text-[var(--text-muted)] tracking-widest uppercase">BTC/USD</span>
<span className="mx-4 text-xs font-bold text-blue-500 tracking-widest uppercase">•</span>
<span className="mx-4 text-xs font-bold text-[var(--text-muted)] tracking-widest uppercase">EUR/USD</span>
<span className="mx-4 text-xs font-bold text-blue-500 tracking-widest uppercase">•</span>
<span className="mx-4 text-xs font-bold text-[var(--text-muted)] tracking-widest uppercase">XAU/USD (GOLD)</span>
<span className="mx-4 text-xs font-bold text-blue-500 tracking-widest uppercase">•</span>
<span className="mx-4 text-xs font-bold text-[var(--text-muted)] tracking-widest uppercase">XAG/USD (SILVER)</span>
<span className="mx-4 text-xs font-bold text-blue-500 tracking-widest uppercase">•</span>
<span className="mx-4 text-xs font-bold text-[var(--text-muted)] tracking-widest uppercase">GBP/USD</span>
<span className="mx-4 text-xs font-bold text-blue-500 tracking-widest uppercase">•</span>
<span className="mx-4 text-xs font-bold text-[var(--text-muted)] tracking-widest uppercase">US30 (DOW)</span>
<span className="mx-4 text-xs font-bold text-blue-500 tracking-widest uppercase">•</span>
<span className="mx-4 text-xs font-bold text-[var(--text-muted)] tracking-widest uppercase">NAS100 (NASDAQ)</span>
<span className="mx-4 text-xs font-bold text-blue-500 tracking-widest uppercase">•</span>
<span className="mx-4 text-xs font-bold text-[var(--text-muted)] tracking-widest uppercase">SPX500</span>
<span className="mx-4 text-xs font-bold text-blue-500 tracking-widest uppercase">•</span>
<span className="mx-4 text-xs font-bold text-[var(--text-muted)] tracking-widest uppercase">WTI (OIL)</span>
<span className="mx-4 text-xs font-bold text-blue-500 tracking-widest uppercase">•</span>
<span className="mx-4 text-xs font-bold text-[var(--text-muted)] tracking-widest uppercase">ETH/USD</span>
<span className="mx-4 text-xs font-bold text-blue-500 tracking-widest uppercase">•</span>
<span className="mx-4 text-xs font-bold text-[var(--text-muted)] tracking-widest uppercase">SOL/USD</span>
<span className="mx-4 text-xs font-bold text-blue-500 tracking-widest uppercase">•</span>
<span className="mx-4 text-xs font-bold text-[var(--text-muted)] tracking-widest uppercase">USD/JPY</span>
<span className="mx-4 text-xs font-bold text-blue-500 tracking-widest uppercase">•</span>
<span className="mx-4 text-xs font-bold text-[var(--text-muted)] tracking-widest uppercase">BTC/USD</span>
<span className="mx-4 text-xs font-bold text-blue-500 tracking-widest uppercase">•</span>
<span className="mx-4 text-xs font-bold text-[var(--text-muted)] tracking-widest uppercase">EUR/USD</span>
<span className="mx-4 text-xs font-bold text-blue-500 tracking-widest uppercase">•</span>
<span className="mx-4 text-xs font-bold text-[var(--text-muted)] tracking-widest uppercase">XAU/USD (GOLD)</span>
<span className="mx-4 text-xs font-bold text-blue-500 tracking-widest uppercase">•</span>
<span className="mx-4 text-xs font-bold text-[var(--text-muted)] tracking-widest uppercase">XAG/USD (SILVER)</span>
<span className="mx-4 text-xs font-bold text-blue-500 tracking-widest uppercase">•</span>
<span className="mx-4 text-xs font-bold text-[var(--text-muted)] tracking-widest uppercase">GBP/USD</span>
<span className="mx-4 text-xs font-bold text-blue-500 tracking-widest uppercase">•</span>
<span className="mx-4 text-xs font-bold text-[var(--text-muted)] tracking-widest uppercase">US30 (DOW)</span>
<span className="mx-4 text-xs font-bold text-blue-500 tracking-widest uppercase">•</span>
<span className="mx-4 text-xs font-bold text-[var(--text-muted)] tracking-widest uppercase">NAS100 (NASDAQ)</span>
<span className="mx-4 text-xs font-bold text-blue-500 tracking-widest uppercase">•</span>
<span className="mx-4 text-xs font-bold text-[var(--text-muted)] tracking-widest uppercase">SPX500</span>
<span className="mx-4 text-xs font-bold text-blue-500 tracking-widest uppercase">•</span>
<span className="mx-4 text-xs font-bold text-[var(--text-muted)] tracking-widest uppercase">WTI (OIL)</span>
<span className="mx-4 text-xs font-bold text-blue-500 tracking-widest uppercase">•</span>
<span className="mx-4 text-xs font-bold text-[var(--text-muted)] tracking-widest uppercase">ETH/USD</span>
<span className="mx-4 text-xs font-bold text-blue-500 tracking-widest uppercase">•</span>
<span className="mx-4 text-xs font-bold text-[var(--text-muted)] tracking-widest uppercase">SOL/USD</span>
<span className="mx-4 text-xs font-bold text-blue-500 tracking-widest uppercase">•</span>
<span className="mx-4 text-xs font-bold text-[var(--text-muted)] tracking-widest uppercase">USD/JPY</span>
<span className="mx-4 text-xs font-bold text-blue-500 tracking-widest uppercase">•</span>
             </div>

             <style dangerouslySetInnerHTML={{ __html:`
                @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } }
                @keyframes marquee-reverse { 0% { transform: translateX(-50%); } 100% { transform: translateX(0%); } }
                .animate-marquee { animation: marquee 300s linear infinite; width: max-content; }
                .animate-marquee-reverse { animation: marquee-reverse 300s linear infinite; width: max-content; }
             `}} />
          </section>

          {/* AI Reviews Section */}
          <section className="relative z-10 py-16 px-4 max-w-7xl mx-auto">
            <FadeInSection>
              <div className="text-center mb-10">
                <h2 className="text-2xl md:text-4xl font-bold text-[var(--foreground)] mb-3">What Traders Say</h2>
                <p className="text-[var(--text-muted)]">Real feedback from verified copy-trading clients.</p>
              </div>
            </FadeInSection>
            <div className="relative w-full group">
              <div 
                id="testimonial-carousel"
                className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide transition-all duration-500 ease-in-out scroll-smooth"
                onScroll={(e) => {
                  const scrollLeft = (e.target as HTMLDivElement).scrollLeft;
                  const width = (e.target as HTMLDivElement).offsetWidth;
                  const index = Math.round(scrollLeft / width);
                  if (index !== activeReviewSlide) setActiveReviewSlide(index);
                }}
              >
                  {[
                    { t: "The AI signal entry validation is unmatched. I no longer second guess my entries.", v: "VIP User", n: "Jason M.", r: 5 },
                    { t: "Deep character analysis gives me the 'why' behind every trade. Setup took 5 mins.", v: "$25 Mastery", n: "Sarah K.", r: 5 },
                    { t: "Copier works flawlessly on Vantage. 0 slippage. The institutional journal changed my mindset.", v: "$10 Commitment", n: "Alex T.", r: 5 },
                    { t: "The U.S. index signals are incredibly precise. NAS100 execution is institutional grade.", v: "VIP User", n: "Marcus L.", r: 5 },
                    { t: "Zero latency on the bridge. Gold (XAU/USD) hits TP before my manual chart even ticks.", v: "$25 Mastery", n: "Elena R.", r: 5 },
                    { t: "Switched to Vantage per the guide. Best decision ever. The daily macroeconomic bias saves me from bad trades.", v: "$10 Commitment", n: "David W.", r: 5 },
                    { t: "The community sentiment analysis is a game changer. I've never seen a group so focused on liquidity sweeps.", v: "VIP User", n: "Priya N.", r: 5 },
                    { t: "Zen Pips helped me pass my $100k prop firm challenge in just two weeks. Clear entries, logical stops.", v: "$25 Mastery", n: "Ahmed K.", r: 5 },
                    { t: "Finally, a signal provider that actually cares about risk management. The journal tool alone is worth the sub.", v: "$10 Commitment", n: "Chris M.", r: 5 }
                  ].map((review, i) => (
                    <div key={i} className="min-w-full flex-shrink-0 flex justify-center px-4 snap-center py-4">
                      <div className="w-full max-w-2xl p-6 sm:p-10 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-color)] flex flex-col justify-between hover:border-[#d4af37]/30 transition-all duration-300 shadow-xl scale-[0.98] hover:scale-100">
                        <div>
                          <div className="flex items-center gap-1 mb-4 sm:mb-6">
                            {[...Array(review.r)].map((_, j) => (
                              <Star key={j} className="w-5 h-5 sm:w-6 sm:h-6 fill-yellow-500 text-yellow-500" />
                            ))}
                          </div>
                          <p className="text-[var(--foreground)] mb-6 text-base sm:text-xl tracking-tight font-medium italic leading-relaxed">"{review.t}"</p>
                        </div>
                        <div className="flex items-center justify-between border-t border-[var(--border-color)] pt-4">
                          <div className="flex flex-col">
                            <span className="font-bold tracking-wide text-sm sm:text-base">{review.n}</span>
                            <span className="text-[10px] text-[var(--text-muted)]">Verified Trader</span>
                          </div>
                          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest bg-[#d4af37]/10 text-[#d4af37] px-3 py-1 rounded-full border border-[#d4af37]/20">{review.v}</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
              
              {/* 9 Pagination Dots */}
              <div className="flex justify-center items-center gap-2 mt-4 sm:mt-8">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(idx => (
                  <button 
                    key={idx}
                    onClick={() => {
                        const container = document.getElementById('testimonial-carousel');
                        if (container) {
                            container.scrollTo({
                                left: idx * container.offsetWidth,
                                behavior: 'smooth'
                            });
                        }
                        setActiveReviewSlide(idx);
                    }}
                    className={`transition-all duration-300 rounded-full h-2.5 ${activeReviewSlide === idx ? 'w-8 bg-[#d4af37]' : 'w-2.5 bg-[var(--border-color)] hover:bg-[#d4af37]/50'}`}
                    aria-label={`Go to review ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* Lead Magnet Section */}
          <LeadMagnetSection />

          {/* Pricing Section */}
          <section id="pricing" className="relative z-10 py-12 sm:py-16 md:py-24 px-4 sm:px-6 max-w-7xl mx-auto border-t border-[var(--border-color)]">
            <FadeInSection>
              <div className="text-center mb-8 sm:mb-12 md:mb-16">
                <h2 className="font-[family-name:var(--font-outfit)] text-xl sm:text-2xl md:text-5xl font-bold text-[var(--foreground)] mb-3 sm:mb-4">
                  Join the <span className="text-[#d4af37]">Inner Circle.</span>
                </h2>
                <p className="text-[var(--text-muted)] max-w-xl mx-auto text-xs sm:text-base md:text-lg px-4 sm:px-0">
                  Unlock all features with our flexible plans. Gain access to advanced scanners, AI-powered signals, expert academy lessons, and 24/7 updates designed to maximize your trading edge.
                </p>
              </div>
            </FadeInSection>

            {/* Mobile: Horizontal snap-scroll carousel. Desktop: 3-col grid */}
            <div className="flex md:grid md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 overflow-x-auto md:overflow-visible snap-x snap-mandatory pt-10 md:pt-0 pb-4 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
              {/* FREE TIER */}
              <FadeInSection delay={0.1}>
                <div className="min-w-[85vw] sm:min-w-[70vw] md:min-w-0 snap-center bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 flex flex-col md:hover:-translate-y-2 transition-transform duration-300 h-full">
                  <h3 className="text-lg sm:text-xl font-bold text-[var(--foreground)] mb-2">Free Access</h3>
                  <p className="text-[var(--text-muted)] mb-4 sm:mb-6 text-xs sm:text-sm">Explore the ecosystem risk-free.</p>
                  <div className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] mb-6 sm:mb-8 flex items-baseline gap-2 flex-wrap">
                    $0<span className="text-xs sm:text-lg text-[var(--text-muted)] font-normal">/forever</span>
                  </div>
                  <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 flex-1">
                    <li className="flex items-center gap-3 text-[var(--text-muted)] text-xs sm:text-sm"><div className="w-1.5 h-1.5 rounded-full bg-[#d4af37] flex-shrink-0"></div> 10 Daily AI Credits</li>
                    <li className="flex items-center gap-3 text-[var(--text-muted)] text-xs sm:text-sm"><div className="w-1.5 h-1.5 rounded-full bg-[#d4af37] flex-shrink-0"></div> Free Community Channel</li>
                    <li className="flex items-center gap-3 text-[var(--text-muted)] text-xs sm:text-sm"><div className="w-1.5 h-1.5 rounded-full bg-[#d4af37] flex-shrink-0"></div> Basic Learning Material</li>
                    <li className="flex items-center gap-3 text-[var(--text-muted)] text-xs sm:text-sm"><div className="w-1.5 h-1.5 rounded-full bg-[#d4af37] flex-shrink-0"></div> Chart AI Preview</li>
                  </ul>
                  <a href="https://t.me/Zen_pips_bot" target="_blank" rel="noopener noreferrer" className="block text-center w-full py-3 sm:py-4 rounded-xl border border-[var(--border-color)] text-[var(--text-muted)] font-bold hover:bg-white/5 transition-all text-sm">Join Free</a>
                </div>
              </FadeInSection>

              {/* $10 TIER - MOST POPULAR */}
              <FadeInSection delay={0.2}>
                <div className="min-w-[85vw] sm:min-w-[70vw] md:min-w-0 snap-center bg-[var(--card-bg)] border border-[#d4af37] shadow-[0_0_30px_rgba(212,175,55,0.15)] rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 flex flex-col relative md:hover:-translate-y-2 transition-transform duration-300 md:-translate-y-4 h-full">
                  <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2 bg-[#d4af37] text-black text-[10px] sm:text-xs font-bold uppercase tracking-wider py-1 px-3 sm:px-4 rounded-full">Most Popular</div>
                  <h3 className="text-lg sm:text-xl font-bold text-[var(--foreground)] mb-2 mt-2 md:mt-0">The Commitment</h3>
                  <p className="text-[var(--text-muted)] mb-4 sm:mb-6 text-xs sm:text-sm">Start building real discipline and edge.</p>
                  <div className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] mb-6 sm:mb-8 flex items-baseline gap-2 flex-wrap">
                    $10<span className="text-xs sm:text-lg text-[var(--text-muted)] font-normal">/mo</span>
                  </div>
                  <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 flex-1">
                    <li className="flex items-center gap-3 text-[var(--text-muted)] text-xs sm:text-sm"><div className="w-1.5 h-1.5 rounded-full bg-[#d4af37] flex-shrink-0"></div> Daily VIP Signals (XAU/XAG/Forex)</li>
                    <li className="flex items-center gap-3 text-[var(--text-muted)] text-xs sm:text-sm"><div className="w-1.5 h-1.5 rounded-full bg-[#d4af37] flex-shrink-0"></div> VIP Journal & Risk Manager</li>
                    <li className="flex items-center gap-3 text-[var(--text-muted)] text-xs sm:text-sm"><div className="w-1.5 h-1.5 rounded-full bg-[#d4af37] flex-shrink-0"></div> Learning Material & Educational Vault</li>
                    <li className="flex items-center gap-3 text-[var(--text-muted)] text-xs sm:text-sm"><div className="w-1.5 h-1.5 rounded-full bg-[#d4af37] flex-shrink-0"></div> Institutional Community Access</li>
                    <li className="flex items-center gap-3 text-[var(--text-muted)] text-xs sm:text-sm"><div className="w-1.5 h-1.5 rounded-full bg-[#d4af37] flex-shrink-0"></div> Innovation Hub Tools</li>
                  </ul>
                  <a href="https://t.me/Zen_pips_bot" target="_blank" rel="noopener noreferrer" className="block text-center w-full py-3 sm:py-4 rounded-xl bg-[#d4af37] text-black font-bold hover:brightness-110 transition-colors shadow-lg text-sm">Get Started</a>
                </div>
              </FadeInSection>

              {/* $25 TIER */}
              <FadeInSection delay={0.3}>
                <div className="min-w-[85vw] sm:min-w-[70vw] md:min-w-0 snap-center bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 flex flex-col md:hover:-translate-y-2 transition-transform duration-300 h-full">
                  <h3 className="text-lg sm:text-xl font-bold text-[var(--foreground)] mb-2">The Mastery</h3>
                  <p className="text-[var(--text-muted)] mb-4 sm:mb-6 text-xs sm:text-sm">Full institutional access. Automated execution.</p>
                  <div className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] mb-6 sm:mb-8 flex items-baseline gap-2 flex-wrap">
                    $25<span className="text-xs sm:text-lg text-[var(--text-muted)] font-normal">/mo</span>
                  </div>
                  <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 flex-1">
                    <li className="flex items-center gap-3 text-[var(--text-muted)] text-xs sm:text-sm"><div className="w-1.5 h-1.5 rounded-full bg-[#d4af37] flex-shrink-0"></div> Everything in The Commitment</li>
                    <li className="flex items-center gap-3 text-[var(--text-muted)] text-xs sm:text-sm"><div className="w-1.5 h-1.5 rounded-full bg-[#d4af37] flex-shrink-0"></div> VIP Institutional Toolkit</li>
                    <li className="flex items-center gap-3 text-[var(--text-muted)] text-xs sm:text-sm"><div className="w-1.5 h-1.5 rounded-full bg-[#d4af37] flex-shrink-0"></div> Automatic Trade Copier & Copy Trading Bot</li>
                    <li className="flex items-center gap-3 text-[var(--text-muted)] text-xs sm:text-sm"><div className="w-1.5 h-1.5 rounded-full bg-[#d4af37] flex-shrink-0"></div> Signal Entry & Signal Analysis (Chart AI)</li>
                    <li className="flex items-center gap-3 text-[var(--text-muted)] text-xs sm:text-sm"><div className="w-1.5 h-1.5 rounded-full bg-[#d4af37] flex-shrink-0"></div> Priority Implementation & VIP Lounge</li>
                  </ul>
                  <a href="https://t.me/Zen_pips_bot" target="_blank" rel="noopener noreferrer" className="block text-center w-full py-3 sm:py-4 rounded-xl border border-[var(--border-color)] text-[var(--foreground)] font-bold hover:bg-yellow-500 hover:text-black transition-all text-sm">Secure Spot</a>
                </div>
              </FadeInSection>
            </div>

            {/* Enterprise Partner CTA */}
            <FadeInSection delay={0.4}>
              <div className="max-w-5xl mx-auto mt-8 sm:mt-10 p-5 sm:p-6 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-color)] text-center">
                <h4 className="text-sm sm:text-base font-bold text-[var(--foreground)] mb-2">Want more? <span className="text-[#d4af37]">Become a Partner.</span></h4>
                <p className="text-[var(--text-muted)] text-xs sm:text-sm max-w-lg mx-auto mb-4 leading-relaxed">
                  Full unrestricted access to every service, platform, resource, and AI tool we offer. Enterprise-grade partnerships for serious institutional traders.
                </p>
                <a href="https://t.me/Zen_pips_bot?start=PARTNER" target="_blank" rel="noopener noreferrer" className="inline-block text-xs sm:text-sm px-6 py-2.5 rounded-xl border border-[#d4af37]/30 text-[#d4af37] font-bold uppercase tracking-wider hover:bg-[#d4af37] hover:text-black transition-all">Contact Us</a>
              </div>
            </FadeInSection>

            {/* Mobile scroll indicator */}
            <div className="flex md:hidden justify-center gap-1.5 mt-4">
              <div className="w-6 h-1 rounded-full bg-[#d4af37]"></div>
              <div className="w-6 h-1 rounded-full bg-[var(--border-color)]"></div>
              <div className="w-6 h-1 rounded-full bg-[var(--border-color)]"></div>
            </div>
          </section>

          {/* Get Started / Broker Section */}
          <section id="broker" className="relative z-10 py-12 sm:py-16 md:py-24 px-4 sm:px-6 max-w-7xl mx-auto border-t border-[var(--border-color)]">
            <FadeInSection>
              <div className="text-center mb-8 sm:mb-12 md:mb-16">
                <h2 className="font-[family-name:var(--font-outfit)] text-2xl sm:text-3xl md:text-5xl font-bold text-[var(--foreground)] mb-3 sm:mb-4">
                  Get <span className="text-[#d4af37]">Set Up.</span>
                </h2>
                <p className="text-[var(--text-muted)] max-w-xl mx-auto text-sm sm:text-base md:text-lg">
                  Everything you need to start executing trades in under 10 minutes.
                </p>
              </div>
            </FadeInSection>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 max-w-4xl mx-auto">
              <FadeInSection delay={0.1}>
                <a href="https://vigco.co/la-com-inv/TItFx2Oy" target="_blank" rel="noopener noreferrer"
                  className="group bg-gradient-to-br from-[var(--card-bg)] to-transparent border border-[var(--border-color)] p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl transition-all duration-300 flex flex-col items-start h-full">
                  <div className="flex items-center gap-3 mb-4 sm:mb-6">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#d4af37]/10 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="40,60 150,60 260,340 150,340" fill="#024D56" /><polygon points="180,60 360,60 260,260 220,200" fill="#E24E24" /></svg>
                    </div>
                    <span className="text-[10px] sm:text-xs bg-[#d4af37]/10 text-[#d4af37] px-2 sm:px-3 py-1 rounded-full font-semibold uppercase tracking-wider">Step 1</span>
                  </div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--foreground)] mb-2 sm:mb-3">Open Your Broker</h3>
                  <p className="text-[var(--text-muted)] mb-4 sm:mb-6 leading-relaxed text-sm">
                    We exclusively use <strong className="text-[var(--foreground)]">Vantage Markets</strong> for prop-firm friendly raw spreads.
                  </p>
                  <div className="mt-auto flex items-center gap-2 text-[#d4af37] font-semibold text-sm">
                    Connect Vantage <ExternalLink className="w-4 h-4" />
                  </div>
                </a>
              </FadeInSection>

              <FadeInSection delay={0.2}>
                <a href="https://www.binance.com/referral/earn-together/refer2earn-usdc/claim?hl=en&ref=GRO_28502_E50OE&utm_source=default" target="_blank" rel="noopener noreferrer"
                  className="group bg-gradient-to-br from-[var(--card-bg)] to-transparent border border-[var(--border-color)] p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl transition-all duration-300 flex flex-col items-start h-full">
                  <div className="flex items-center gap-3 mb-4 sm:mb-6">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500/10 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="#F3BA2F" xmlns="http://www.w3.org/2000/svg"><path d="M16.624 13.9202l2.7175 2.7154-7.3415 7.353-7.3415-7.353 2.7175-2.7154 4.624 4.6595 4.624-4.6595zm4.6366-4.6366L24 12l-2.7394 2.7154-2.7394-2.7154 2.7394-2.7154zM7.376 10.0798L4.6585 7.3644 12 .0115l7.3415 7.3529-2.7175 2.7154-4.624-4.6595-4.624 4.6595zM2.7394 9.2846L0 12l2.7394 2.7154 2.7394-2.7154-2.7394-2.7154zM12 15.2154l-2.7175-2.7154L12 9.7846l2.7175 2.7154L12 15.2154z"/></svg>
                    </div>
                    <span className="text-[10px] sm:text-xs bg-yellow-500/10 text-yellow-400 px-2 sm:px-3 py-1 rounded-full font-semibold uppercase tracking-wider">Step 2</span>
                  </div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--foreground)] mb-2 sm:mb-3">Get USDT via Binance</h3>
                  <p className="text-[var(--text-muted)] mb-4 sm:mb-6 leading-relaxed text-sm">
                    Purchase <strong className="text-[var(--foreground)]">USDT</strong> via card or bank transfer, then send via TRC-20 to join VIP.
                  </p>
                  <div className="mt-auto flex items-center gap-2 text-yellow-400 font-semibold text-sm">
                    Create Binance Account <ExternalLink className="w-4 h-4" />
                  </div>
                </a>
              </FadeInSection>
            </div>

            <FadeInSection delay={0.3}>
              <div className="mt-8 sm:mt-12 text-center">
                <div className="inline-flex items-center gap-2 sm:gap-3 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-full px-4 sm:px-8 py-3 sm:py-4 flex-wrap justify-center">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-[#d4af37]" />
                  <span className="text-[var(--text-muted)] text-sm">Step 3:</span>
                  <a href="https://t.me/Zen_pips_bot" target="_blank" rel="noopener noreferrer" className="text-[#d4af37] font-bold hover:underline text-sm">
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
          <footer className="relative z-10 border-t border-[var(--border-color)] py-8 sm:py-12 md:py-16 px-4 sm:px-6 bg-[var(--background)]">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 md:gap-12 mb-8 sm:mb-12">
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
                    <li><a href="https://www.hfm.com/ke/en/?refid=30508914" target="_blank" rel="noopener noreferrer" className="hover:text-[#d4af37] transition-colors">Open Broker (Vantage)</a></li>
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
      <ProfileSetupPopup />
    </main>
  );
}

export default function Home() {
  const [activeReviewSlide, setActiveReviewSlide] = useState(0);
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
