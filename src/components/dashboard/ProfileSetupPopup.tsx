"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mail, Send, X, Shield, Zap, CheckCircle2, Loader2, MessageSquare } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { supabase } from "@/lib/supabase"
import confetti from "canvas-confetti"

export function ProfileSetupPopup() {
    const { user, profile } = useAuth()
    const [isVisible, setIsVisible] = useState(false)
    const [email, setEmail] = useState("")
    const [telegram, setTelegram] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    const [step, setStep] = useState(1) // 1: Basic, 2: Broker
    const [mt5Id, setMt5Id] = useState("")
    const [isVerifyingBroker, setIsVerifyingBroker] = useState(false)

    useEffect(() => {
        // Only trigger if not already dismissed or shown in this session
        const hasShown = sessionStorage.getItem('zenpips_trial_shown')
        if (hasShown) return

        const timer = setTimeout(() => {
            const needsSetup = profile && (!profile.telegram_handle || (!profile.is_vip && profile.plan !== 'Trial'))
            if (needsSetup) {
                setIsVisible(true)
                sessionStorage.setItem('zenpips_trial_shown', 'true')
            }
        }, 15000)

        return () => clearTimeout(timer)
    }, [profile])

    const handleBasicSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setStep(2) // Move to Broker step
    }

    const handleFinalSubmit = async (withBroker = false) => {
        if (!user) return
        setIsSubmitting(true)

        // Calculate trial end date (7 days from now)
        const trialEndDate = new Date()
        trialEndDate.setDate(trialEndDate.getDate() + 7)

        try {
            // 1. Update Core Profile
            const { error } = await supabase
                .from('client_trading_profiles')
                .update({
                    email: email || user.email,
                    telegram_handle: telegram,
                    plan: 'Trial',
                    trial_ends_at: trialEndDate.toISOString(),
                    is_vip: false,
                    mt5_account_id: mt5Id || null
                })
                .eq('id', user.id)

            if (error) throw error

            // 2. If Broker ID provided, trigger verification API
            if (withBroker && mt5Id) {
                setIsVerifyingBroker(true)
                await fetch('/api/affiliate/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ broker: 'HFM', brokerId: mt5Id })
                })
            }

            setIsSuccess(true)
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#d4af37', '#ffffff']
            })

            // Close after 3 seconds on success
            setTimeout(() => {
                setIsVisible(false)
                window.location.reload()
            }, 3000)

        } catch (err) {
            console.error("Setup error:", err)
            alert("An error occurred. Please try again.")
        } finally {
            setIsSubmitting(false)
            setIsVerifyingBroker(false)
        }
    }

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-[9999] flex justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto custom-scrollbar">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-lg my-auto bg-[#0a0a0a] border border-yellow-500/30 rounded-2xl sm:rounded-[32px] p-5 sm:p-6 md:p-10 shadow-[0_0_50px_rgba(212,175,55,0.2)]"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent" />
                        
                        <button 
                            onClick={() => setIsVisible(false)}
                            className="absolute top-4 right-4 sm:top-6 sm:right-6 text-[var(--text-muted)] hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>

                        {!isSuccess ? (
                            <div className="space-y-6 relative z-10">
                                {step === 1 ? (
                                    <form onSubmit={handleBasicSubmit} className="space-y-4 sm:space-y-6">
                                        <div className="text-center space-y-2 sm:space-y-3">
                                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-yellow-500/10 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto border border-yellow-500/20 mb-3 sm:mb-4">
                                                <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500" />
                                            </div>
                                            <h2 className="text-xl sm:text-2xl md:text-3xl font-black italic tracking-tight uppercase">Trial Activation</h2>
                                            <p className="text-[var(--text-muted)] text-xs sm:text-sm leading-relaxed">
                                                Link your communication handles to sync signals and unlock the **Institutional Journal**.
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] ml-1">Telegram Handle</label>
                                                <div className="relative">
                                                    <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-yellow-500" />
                                                    <input 
                                                        required
                                                        type="text"
                                                        value={telegram}
                                                        onChange={(e) => setTelegram(e.target.value)}
                                                        placeholder="@YourHandle"
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-sm focus:border-yellow-500/50 outline-none transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] ml-1">Preferred Email</label>
                                                <div className="relative">
                                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-yellow-500" />
                                                    <input 
                                                        required
                                                        type="email"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        placeholder={user?.email || "email@example.com"}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-sm focus:border-yellow-500/50 outline-none transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <button 
                                            type="submit"
                                            className="w-full bg-[#d4af37] text-black h-12 sm:h-14 rounded-xl font-black uppercase tracking-widest text-sm sm:text-base flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(212,175,55,0.2)]"
                                        >
                                            Next Step <Send className="w-4 h-4" />
                                        </button>
                                    </form>
                                ) : (
                                    <div className="space-y-4 sm:space-y-6">
                                        <div className="text-center space-y-2 sm:space-y-3">
                                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-500/10 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto border border-blue-500/20 mb-3 sm:mb-4">
                                                <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
                                            </div>
                                            <h2 className="text-xl sm:text-2xl md:text-3xl font-black italic tracking-tight uppercase">Broker Integration</h2>
                                            <p className="text-[var(--text-muted)] text-xs sm:text-sm leading-relaxed">
                                                Link your **HFM Account** to unlock **20 Bonus AI Credits** for automated chart markups.
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-gray-400 font-mono">1. Register with HFM</span>
                                                    <a href="https://www.hfm.com/ke/en/?refid=30508914" target="_blank" className="text-yellow-500 text-[10px] font-bold uppercase underline">Open Link</a>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-gray-400 font-mono">2. Enter MT5 Login ID</span>
                                                    <div className="w-32">
                                                        <input 
                                                            type="text"
                                                            value={mt5Id}
                                                            onChange={(e) => setMt5Id(e.target.value)}
                                                            placeholder="862139..."
                                                            className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 px-3 text-xs focus:border-blue-500/50 outline-none text-right font-mono"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <button 
                                                onClick={() => handleFinalSubmit(true)}
                                                disabled={isSubmitting || !mt5Id}
                                                className="w-full bg-blue-600 text-white h-12 sm:h-14 rounded-xl font-black uppercase tracking-widest text-sm sm:text-base flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
                                            >
                                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Link Broker & Get Bonus <Zap className="w-4 h-4 fill-white" /></>}
                                            </button>

                                            <button 
                                                onClick={() => handleFinalSubmit(false)}
                                                disabled={isSubmitting}
                                                className="w-full text-[var(--text-muted)] hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest text-center"
                                            >
                                                Skip for now (Basic Trial)
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center space-y-4 sm:space-y-6 py-6 sm:py-10 relative z-10">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto border-2 border-green-500/50">
                                    <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-green-500" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black italic tracking-tight uppercase text-green-500">Trial Activated</h2>
                                    <p className="text-[var(--text-muted)] text-xs sm:text-sm max-w-sm mx-auto">
                                        Welcome to the Institutional Hub. You now have **7 days** of full access to the Zen Pips ecosystem.
                                        {mt5Id && " Bonus credits are being provisioned."}
                                    </p>
                                </div>
                                <div className="text-[10px] font-bold text-green-500/50 uppercase tracking-[0.2em] animate-pulse">Syncing Connection...</div>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
