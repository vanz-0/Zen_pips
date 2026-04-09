"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mail, Send, X, Shield, Zap, CheckCircle2, Loader2, MessageSquare, ExternalLink } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { supabase } from "@/lib/supabase"
import confetti from "canvas-confetti"

export function ProfileSetupPopup() {
    const { user, profile } = useAuth()
    const [isVisible, setIsVisible] = useState(false)
    const [email, setEmail] = useState("")
    const [telegramHandle, setTelegramHandle] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    const [step, setStep] = useState(1) // 1: Vantage Broker, 2: Journal & Community
    const [mt5Id, setMt5Id] = useState("")

    useEffect(() => {
        const hasShown = sessionStorage.getItem('zenpips_onboarding_shown')
        if (hasShown) return

        const timer = setTimeout(() => {
            const needsSetup = profile && (!profile.mt5_account_id || !profile.email)
            if (needsSetup) {
                setIsVisible(true)
                sessionStorage.setItem('zenpips_onboarding_shown', 'true')
            }
        }, 10000)

        return () => clearTimeout(timer)
    }, [profile])

    const handleBrokerSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (mt5Id.trim() === "") {
            alert("Vantage Account ID is mandatory for the copy trading bridge.");
            return;
        }
        setStep(2)
    }

    const handleFinalSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return
        setIsSubmitting(true)

        try {
            const { error } = await supabase
                .from('client_trading_profiles')
                .update({
                    email: email || user.email,
                    telegram_handle: telegramHandle || null,
                    mt5_account_id: mt5Id
                })
                .eq('id', user.id)

            if (error) throw error

            setIsSuccess(true)
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#0066ff', '#ffffff'] // Vantage blue colors
            })

            setTimeout(() => {
                setIsVisible(false)
                window.location.reload()
            }, 3000)

        } catch (err) {
            console.error("Setup error:", err)
            alert("An error occurred. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-[9999] flex justify-center p-4 bg-[var(--background)]/90 backdrop-blur-md overflow-y-auto custom-scrollbar">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-lg my-auto bg-[var(--card-bg)] border border-blue-500/30 rounded-2xl sm:rounded-[32px] p-5 sm:p-6 md:p-10 shadow-[0_0_50px_rgba(0,102,255,0.15)]"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
                        
                        <button 
                            onClick={() => setIsVisible(false)}
                            className="absolute top-4 right-4 sm:top-6 sm:right-6 text-[var(--text-muted)] hover:text-[#d4af37] transition-colors"
                        >
                            <X className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>

                        {!isSuccess ? (
                            <div className="space-y-6 relative z-10">
                                {step === 1 ? (
                                    <form onSubmit={handleBrokerSubmit} className="space-y-4 sm:space-y-6">
                                        <div className="text-center space-y-2 sm:space-y-3">
                                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-500/10 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto border border-blue-500/20 mb-3 sm:mb-4">
                                                <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
                                            </div>
                                            <h2 className="text-xl sm:text-2xl md:text-3xl font-black italic tracking-tight uppercase text-[var(--foreground)]">Vantage Gateway</h2>
                                            <p className="text-[var(--text-muted)] text-xs sm:text-sm leading-relaxed">
                                                To utilize the Institutional Copy Trading tools, a verified **Vantage Markets** account is mandatory.
                                            </p>
                                        </div>

                                        <div className="p-4 bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-2xl space-y-4">
                                            <div className="flex flex-col gap-2">
                                                <span className="text-xs font-bold text-[var(--text-muted)] font-mono">1. Register with our Hub Link</span>
                                                <a href="https://vigco.co/la-com-inv/TItFx2Oy" target="_blank" className="bg-blue-600/10 text-blue-400 py-2 px-4 rounded-xl text-center text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600/20 transition-all border border-blue-500/20">
                                                    Open Vantage Registration 
                                                </a>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <span className="text-xs font-bold text-[var(--text-muted)] font-mono">2. Enter your MT5 Account Details</span>
                                                <input
                                                    type="text"
                                                    value={mt5Id}
                                                    onChange={(e) => setMt5Id(e.target.value)}
                                                    placeholder="Vantage MT5 ID (e.g. 892019)"
                                                    className="w-full bg-[var(--background)] p-3 rounded-xl border border-[var(--border-color)] text-[var(--foreground)] focus:border-yellow-500/50 outline-none transition-colors font-mono text-sm leading-relaxed"
                                                />
                                                <input
                                                    type="password"
                                                    placeholder="MT5 Password (Cloud Beta)"
                                                    className="w-full bg-[var(--background)] p-3 rounded-xl border border-[var(--border-color)] text-[var(--foreground)] outline-none font-mono text-sm leading-relaxed opacity-50 cursor-not-allowed mt-2"
                                                    disabled
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Broker Server (e.g. Vantage-Live)"
                                                    className="w-full bg-[var(--background)] p-3 rounded-xl border border-[var(--border-color)] text-[var(--foreground)] outline-none font-mono text-sm leading-relaxed opacity-50 cursor-not-allowed mt-2"
                                                    disabled
                                                />
                                            </div>
                                        </div>

                                        <button 
                                            type="submit"
                                            className="w-full bg-blue-600 text-white h-12 sm:h-14 rounded-xl font-black uppercase tracking-widest text-sm sm:text-base flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all"
                                        >
                                            Confirm Broker <Send className="w-4 h-4 ml-1" />
                                        </button>
                                    </form>
                                ) : (
                                    <form onSubmit={handleFinalSubmit} className="space-y-4 sm:space-y-6">
                                        <div className="text-center space-y-2 sm:space-y-3">
                                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#d4af37]/10 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto border border-[#d4af37]/20 mb-3 sm:mb-4">
                                                <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-[#d4af37]" />
                                            </div>
                                            <h2 className="text-xl sm:text-2xl md:text-3xl font-black italic tracking-tight uppercase text-[var(--foreground)]">Community & Journal</h2>
                                            <p className="text-[var(--text-muted)] text-xs sm:text-sm leading-relaxed">
                                                Connect to our Telegram infrastructure and verify your journal reports email.
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] ml-1">Journal Reports Email</label>
                                                <div className="relative">
                                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#d4af37]" />
                                                    <input 
                                                        required
                                                        type="email"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        placeholder={user?.email || "email@example.com"}
                                                        className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-xl py-3.5 pl-12 pr-4 text-sm focus:border-[#d4af37]/50 outline-none transition-all text-[var(--foreground)]"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-1.5 pt-2">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] ml-1">Telegram Handle (Optional)</label>
                                                <input 
                                                    type="text"
                                                    value={telegramHandle}
                                                    onChange={(e) => setTelegramHandle(e.target.value)}
                                                    placeholder="@YourTelegramUsername"
                                                    className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-xl py-3.5 px-4 text-sm focus:border-[#d4af37]/50 outline-none transition-all text-[var(--foreground)]"
                                                />
                                            </div>

                                            <div className="pt-2 flex flex-col gap-2">
                                                <p className="text-[10px] text-[var(--text-muted)] text-center">Don't want to type your handle? Just message our bot directly:</p>
                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    <a 
                                                        href="https://t.me/zenpips_bot?start=VIP_HUB" 
                                                        target="_blank" rel="noopener noreferrer"
                                                        className="py-2 border border-dashed border-[var(--border-color)] text-[var(--text-muted)] rounded-lg text-center hover:bg-[#d4af37]/5 hover:text-[#d4af37] transition-all"
                                                    >
                                                        VIP Access
                                                    </a>
                                                    <a 
                                                        href="https://t.me/zenpips_bot?start=FREE_CHANNEL" 
                                                        target="_blank" rel="noopener noreferrer"
                                                        className="py-2 border border-dashed border-[var(--border-color)] text-[var(--text-muted)] rounded-lg text-center hover:bg-[#d4af37]/5 hover:text-[#d4af37] transition-all"
                                                    >
                                                        Free Channel
                                                    </a>
                                                    <a 
                                                        href="https://t.me/zenpips_bot?start=TOOLS_LEARNING" 
                                                        target="_blank" rel="noopener noreferrer"
                                                        className="py-2 border border-dashed border-[var(--border-color)] text-[var(--text-muted)] rounded-lg text-center hover:bg-[#d4af37]/5 hover:text-[#d4af37] transition-all"
                                                    >
                                                        Learning Tools
                                                    </a>
                                                    <a 
                                                        href="https://t.me/zenpips_bot?start=BINANCE_SUBSCRIPTION" 
                                                        target="_blank" rel="noopener noreferrer"
                                                        className="py-2 border border-dashed border-[var(--border-color)] text-[var(--text-muted)] rounded-lg text-center hover:bg-yellow-500/5 hover:text-yellow-500 transition-all font-bold"
                                                    >
                                                        Binance Sub
                                                    </a>
                                                </div>
                                            </div>
                                        </div>

                                        <button 
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full bg-[#d4af37] text-black h-12 sm:h-14 rounded-xl font-black uppercase tracking-widest text-sm sm:text-base flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
                                        >
                                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Complete Setup"}
                                        </button>
                                    </form>
                                )}
                            </div>
                        ) : (
                            <div className="text-center space-y-4 sm:space-y-6 py-6 sm:py-10 relative z-10">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto border-2 border-blue-500/50">
                                    <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-blue-500" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black italic tracking-tight uppercase text-[var(--foreground)]">All Systems Go</h2>
                                    <p className="text-[var(--text-muted)] text-xs sm:text-sm max-w-sm mx-auto">
                                        Your Vantage integration and Journal setup are complete. Welcome to the Zen Pips Institutional Hub.
                                    </p>
                                </div>
                                <div className="text-[10px] font-bold text-blue-500/50 uppercase tracking-[0.2em] animate-pulse">Syncing Connection...</div>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
