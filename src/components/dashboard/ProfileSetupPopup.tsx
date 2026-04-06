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

    useEffect(() => {
        // Trigger 15 seconds after component mounts
        const timer = setTimeout(() => {
            // Only show if user is logged in but profile is incomplete (no telegram or not a VIP/Trial)
            const needsSetup = profile && (!profile.telegram_handle || (!profile.is_vip && profile.plan !== 'Trial'))
            if (needsSetup) {
                setIsVisible(true)
            }
        }, 15000)

        return () => clearTimeout(timer)
    }, [profile])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setIsSubmitting(true)

        // Calculate trial end date (7 days from now)
        const trialEndDate = new Date()
        trialEndDate.setDate(trialEndDate.getDate() + 7)

        try {
            const { error } = await supabase
                .from('client_trading_profiles')
                .update({
                    email: email || user.email,
                    telegram_handle: telegram,
                    plan: 'Trial',
                    trial_ends_at: trialEndDate.toISOString(),
                    is_vip: false // It's a trial, not full VIP yet
                })
                .eq('id', user.id)

            if (error) throw error

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
                // Refresh page or state to reflect new trial status
                window.location.reload()
            }, 3000)

        } catch (err) {
            console.error("Setup error:", err)
            alert("Failed to activate trial. Please try again or contact support.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-lg bg-[#0a0a0a] border border-yellow-500/30 rounded-[32px] p-8 md:p-10 shadow-[0_0_50px_rgba(212,175,55,0.2)] overflow-hidden"
                    >
                        {/* Decorative Background */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent" />
                        
                        <button 
                            onClick={() => setIsVisible(false)}
                            className="absolute top-6 right-6 text-[var(--text-muted)] hover:text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        {!isSuccess ? (
                            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                                <div className="text-center space-y-3">
                                    <div className="w-16 h-16 bg-yellow-500/10 rounded-2xl flex items-center justify-center mx-auto border border-yellow-500/20 mb-4">
                                        <Zap className="w-8 h-8 text-yellow-500" />
                                    </div>
                                    <h2 className="text-3xl font-black italic tracking-tight uppercase">Activate 7-Day Trial</h2>
                                    <p className="text-[var(--text-muted)] text-sm leading-relaxed">
                                        Complete your institutional profile to unlock full access to the **VIP Lounge**, **Education Vault**, and **Live Signals** for 7 days.
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
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-sm focus:border-yellow-500/50 outline-none transition-all placeholder:text-white/20"
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
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-sm focus:border-yellow-500/50 outline-none transition-all placeholder:text-white/20"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl flex gap-3">
                                    <Shield className="w-5 h-5 text-yellow-500 shrink-0" />
                                    <p className="text-[10px] text-yellow-500/70 leading-relaxed font-medium">
                                        Your information is encrypted. We use Telegram to sync your institutional signal alerts and provide 1-on-1 support.
                                    </p>
                                </div>

                                <button 
                                    disabled={isSubmitting}
                                    type="submit"
                                    className="w-full bg-[#d4af37] text-black h-14 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_30_px_rgba(212,175,55,0.2)]"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>Activate My Trial <Send className="w-4 h-4" /></>
                                    )}
                                </button>
                                
                                <p className="text-center text-[10px] text-[var(--text-muted)]">No credit card required. Cancel anytime.</p>
                            </form>
                        ) : (
                            <div className="text-center space-y-6 py-10 relative z-10">
                                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto border-2 border-green-500/50">
                                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-3xl font-black italic tracking-tight uppercase text-green-500">Trial Activated</h2>
                                    <p className="text-[var(--text-muted)] text-sm max-w-sm mx-auto">
                                        Welcome to the Institutional Hub. You now have **7 days** of full access to the Zen Pips ecosystem.
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
