"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
    CheckCircle2, 
    ExternalLink, 
    Smartphone, 
    Monitor, 
    CreditCard, 
    Bitcoin, 
    ChevronRight, 
    ChevronDown, 
    Zap, 
    Shield, 
    Info, 
    ArrowRight,
    Search,
    Download
} from "lucide-react"
import Image from "next/image"

interface StepProps {
    number: number
    title: string
    description: string
    isOpen: boolean
    onToggle: () => void
    children: React.ReactNode
    isLast?: boolean
}

function Step({ number, title, description, isOpen, onToggle, children, isLast }: StepProps) {
    return (
        <div className="relative">
            {!isLast && (
                <div className="absolute left-[20px] top-[40px] bottom-0 w-[2px] bg-gradient-to-br from-[var(--card-bg)] via-[var(--background)] to-[var(--card-bg)] z-0" />
            )}
            <div className="flex gap-6 relative z-10">
                <button 
                    onClick={onToggle}
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                        isOpen 
                            ? "bg-yellow-500 border-yellow-500 text-black shadow-[0_0_20px_rgba(212,175,55,0.3)]" 
                            : "bg-gradient-to-br from-[var(--card-bg)] via-[var(--background)] to-[var(--card-bg)] border-[var(--border-color)] text-[var(--text-muted)]"
                    }`}
                >
                    <span className="font-bold">{number}</span>
                </button>
                <div className="flex-1 pb-10">
                    <button 
                        onClick={onToggle}
                        className="flex items-center justify-between w-full text-left group"
                    >
                        <div className="space-y-1">
                            <h3 className={`text-base sm:text-lg md:text-xl font-bold transition-colors ${isOpen ? "text-[var(--foreground)]" : "text-[var(--text-muted)] group-hover:text-[var(--text-muted)]"}`}>
                                {title}
                            </h3>
                            <p className="text-xs sm:text-sm text-[var(--text-muted)]">{description}</p>
                        </div>
                        {isOpen ? <ChevronDown className="w-5 h-5 text-[var(--text-muted)]" /> : <ChevronRight className="w-5 h-5 text-[var(--text-muted)]" />}
                    </button>

                    <AnimatePresence>
                        {isOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="mt-6 space-y-4">
                                    {children}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}

export function OnboardingTab() {
    const [openStep, setOpenStep] = useState(1)

    return (
        <div className="w-full text-[var(--foreground)] py-12 font-[family-name:var(--font-outfit)]">
            <div className="max-w-4xl mx-auto space-y-12">
                
                {/* Header */}
                <div className="text-center space-y-4 pt-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/20 text-[#d4af37] text-xs font-bold uppercase tracking-widest">
                        <div className="relative w-5 h-5 bg-[#d4af37] rounded-full p-0.5 border border-yellow-600/30 flex items-center justify-center">
                            <div className="w-full h-full bg-[#0a0a0a] rounded-full overflow-hidden relative">
                                <Image 
                                    src="/logo.png" 
                                    alt="Zen Pips" 
                                    fill 
                                    className="object-contain scale-150" 
                                />
                            </div>
                        </div>
                        Getting Started
                    </div>
                    <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-[var(--foreground)] italic tracking-tight uppercase font-[family-name:var(--font-outfit)]">
                        THE DOMINATOR SETUP
                    </h1>
                    <p className="text-[var(--text-muted)] max-w-xl mx-auto text-sm sm:text-base md:text-lg leading-relaxed">
                        Follow our institutional onboarding process to link your capital to the Zen Pips Bridge and start trading our high-probability signals.
                    </p>
                </div>

                {/* Steps Accordion */}
                <div className="space-y-2">
                    
                    {/* Step 1: Broker Setup */}
                    <Step 
                        number={1} 
                        title="Establish Your Brokerage (Vantage)" 
                        description="Access institutional-grade liquidity and raw spreads."
                        isOpen={openStep === 1}
                        onToggle={() => setOpenStep(1)}
                    >
                        <div className="bg-gradient-to-br from-[var(--card-bg)] via-[var(--background)] to-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-6 space-y-6">
                            <div className="flex flex-col md:flex-row gap-6 items-start">
                                <div className="flex-1 space-y-4">
                                    <p className="text-[var(--text-muted)] text-sm sm:text-base leading-relaxed">
                                        We exclusively use <strong className="text-[var(--foreground)]">Vantage (Vantage Markets)</strong> for our Copy Trader bridge. Their execution speed ensures all our members enter at the exact same price as the main institutional flow.
                                    </p>
                                    <ul className="space-y-3">
                                        <li className="flex items-start gap-3 text-sm text-[var(--text-muted)]">
                                            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                            <span>Click the button below to visit Vantage.</span>
                                        </li>
                                        <li className="flex items-start gap-3 text-sm text-[var(--text-muted)]">
                                            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                            <span>Register an account and specifically choose an <strong className="text-[var(--foreground)]">MT5 Premium</strong> or <strong className="text-[var(--foreground)]">Vantage Copy</strong> account.</span>
                                        </li>
                                        <li className="flex items-start gap-3 text-sm text-[var(--text-muted)]">
                                            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                            <span>Complete your KYC verification to unlock full deposit capabilities.</span>
                                        </li>
                                    </ul>
                                </div>
                                    <div className="space-y-3">
                                        <a 
                                            href="https://vigco.co/la-com-inv/TItFx2Oy" 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2 w-full py-4 bg-white/5 border border-white/10 text-white font-black rounded-xl hover:bg-white/10 transition-all text-sm uppercase tracking-wider"
                                        >
                                            <div className="w-6 h-6 relative mr-1"><Image src="/vantage-logo.svg" alt="Vantage" fill className="object-contain" /></div> JOIN Vantage <ExternalLink className="w-4 h-4" />
                                        </a>
                                        <a 
                                            href="/Zen_Pips_Institutional_Guidelines.pdf" 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2 w-full py-3 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-all text-[10px] uppercase tracking-widest"
                                        >
                                            DOWNLOAD MANUAL <Download className="w-4 h-4 text-yellow-500" />
                                        </a>
                                        <p className="text-[10px] text-[var(--text-muted)] text-center uppercase font-bold tracking-tighter">Zen Pips Official Broker Affiliate Link</p>
                                    </div>
                            </div>
                        </div>
                    </Step>

                    {/* Step 2: MT5 ID */}
                    <Step 
                        number={2} 
                        title="Locate Your MT5 Login ID" 
                        description="This ID is the key to linking our signals to your portfolio."
                        isOpen={openStep === 2}
                        onToggle={() => setOpenStep(2)}
                    >
                        <div className="bg-gradient-to-br from-[var(--card-bg)] via-[var(--background)] to-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-yellow-500">
                                        <Smartphone className="w-4 h-4" />
                                        <span className="text-xs font-bold uppercase tracking-wider">Mobile App (iPhone/Android)</span>
                                    </div>
                                    <ol className="space-y-3 text-sm text-[var(--text-muted)] list-decimal pl-4">
                                        <li>Open the MT5 App.</li>
                                        <li>Go to <strong className="text-[var(--foreground)]">Settings</strong> &gt; <strong className="text-[var(--foreground)]">New Account</strong>.</li>
                                        <li>Select Vantage as your broker and log in.</li>
                                        <li>Your 8-digit Login ID will appear at the top of your Account profile.</li>
                                    </ol>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-yellow-500">
                                        <Monitor className="w-4 h-4" />
                                        <span className="text-xs font-bold uppercase tracking-wider">Desktop Platform</span>
                                    </div>
                                    <ol className="space-y-3 text-sm text-[var(--text-muted)] list-decimal pl-4">
                                        <li>Open MetaTrader 5 on your PC.</li>
                                        <li>Look at the <strong className="text-[var(--foreground)]">Navigator</strong> window (Press Ctrl+N).</li>
                                        <li>Expand the 'Accounts' tree.</li>
                                        <li>The number listed next to your name is your MT5 ID (e.g., 86213984).</li>
                                    </ol>
                                </div>
                            </div>
                            <div className="mt-8 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl flex items-start gap-4">
                                <Info className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-yellow-500/80 leading-relaxed font-medium">
                                    <strong>IMPORTANT:</strong> You only need to provide the Login ID. <strong>NEVER</strong> share your MT5 Master Password with anyone, including us. Our bridge only requires the ID to route signals via the Vantage server.
                                </p>
                            </div>
                        </div>
                    </Step>

                    {/* Step 3: Funding */}
                    <Step 
                        number={3} 
                        title="Capital Injection (Funding)" 
                        description="Deposit your trading capital into your Vantage Wallet."
                        isOpen={openStep === 3}
                        onToggle={() => setOpenStep(3)}
                    >
                        <div className="bg-gradient-to-br from-[var(--card-bg)] via-[var(--background)] to-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-6 space-y-6">
                            <div className="flex flex-col md:flex-row gap-8">
                                <div className="flex-1 space-y-4">
                                    <h4 className="font-bold flex items-center gap-2">
                                        <CreditCard className="w-4 h-4 text-[var(--color-info)]" />
                                        Funding Options
                                    </h4>
                                    <p className="text-sm text-[var(--text-muted)]">
                                        Vantage provides multiple zero-fee deposit methods. Login to the Vantage Portal area on their site and click 'Deposit'.
                                    </p>
                                    <div className="grid grid-cols-2 gap-3 pb-2">
                                        {['Visa/Mastercard', 'Wire Transfer', 'Skrill/Neteller', 'Crypto (Bitcoin)'].map(m => (
                                            <div key={m} className="bg-gradient-to-br from-[var(--card-bg)] via-[var(--background)] to-[var(--card-bg)] p-2.5 rounded-lg border border-[var(--border-color)] text-[10px] font-bold text-center uppercase tracking-widest">{m}</div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex-1 space-y-4">
                                    <h4 className="font-bold flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-[var(--color-success)]" />
                                        Risk Strategy
                                    </h4>
                                    <p className="text-sm text-[var(--text-muted)] italic">
                                        "A trader without capital management is a gambler."
                                    </p>
                                    <ul className="space-y-2 text-xs text-[var(--text-muted)]">
                                        <li>• Minimum for auto-copy: $100</li>
                                        <li>• Recommended for stability: $500 - $1,000</li>
                                        <li>• We use a 1% risk per trade institutional model.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </Step>

                    {/* Step 4: Subscription */}
                    <Step 
                        number={4} 
                        title="Unlock Institutional Access (Subscription)" 
                        description="Pay your VIP membership via Bitcoin from Binance."
                        isOpen={openStep === 4}
                        onToggle={() => setOpenStep(4)}
                    >
                        <div className="bg-gradient-to-br from-[var(--card-bg)] via-[var(--background)] to-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-6 space-y-8">
                            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-yellow-500/10 to-transparent rounded-2xl border border-yellow-500/20">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 relative">
                                            <Image src="/binance-logo.svg" alt="Binance" fill className="object-contain" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest">Crypto Checkout</p>
                                            <h4 className="text-2xl font-black text-[var(--foreground)]">$50 / Month - VIP ACCESS</h4>
                                        </div>
                                    </div>
                                    <p className="text-sm text-[var(--text-muted)] max-w-md">We exclusively accept USDT via TRC20 (Tron) or BEP20 (Binance Smart Chain) for membership payments to ensure low fees and instant confirmation.</p>
                                </div>
                                <div className="hidden lg:block">
                                    <Download className="w-12 h-12 text-[var(--foreground)]/10" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <p className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
                                        <ArrowRight className="w-4 h-4 text-yellow-500" />
                                        1. Get USDT via Binance
                                    </p>
                                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                                        Download the Binance app. Use our link to register and get lower transaction fees. Buy USDT using your local currency (P2P or Bank Card).
                                    </p>
                                    <a 
                                        href="https://www.binance.com/referral/earn-together/refer2earn-usdc/claim?hl=en&ref=GRO_28502_E50OE&utm_source=default" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-[#d4af37] text-xs font-bold hover:gap-3 transition-all"
                                    >
                                        REGISTER ON BINANCE <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                                <div className="space-y-4">
                                    <p className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
                                        <ArrowRight className="w-4 h-4 text-yellow-500" />
                                        2. Send To Admin Wallet (TRC20 / BEP20)
                                    </p>
                                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                                        Message <strong className="text-[var(--foreground)]">@MadDmakz</strong> on Telegram to get the current institutional USDT address. IMPORTANT: Only use the TRC20 or BEP20 network to avoid losing funds.
                                    </p>
                                    <a 
                                        href="https://t.me/MadDmakz" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-[#d4af37] text-xs font-bold hover:gap-3 transition-all font-mono"
                                    >
                                        MESSAGE @MadDmakz <ArrowRight className="w-3 h-3" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </Step>

                    {/* Step 5: Activation */}
                    <Step 
                        number={5} 
                        title="Finalize & Activate Connection" 
                        description="Enter your ID and Go Live with the Zen Pips Bridge."
                        isOpen={openStep === 5}
                        onToggle={() => setOpenStep(5)}
                        isLast
                    >
                        <div className="bg-gradient-to-br from-[var(--card-bg)] via-[var(--background)] to-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-6 flex flex-col items-center text-center space-y-6">
                            <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                                <CheckCircle2 className="w-8 h-8 text-green-500" />
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-xl font-bold">You're Ready to Dominate.</h4>
                                <p className="text-sm text-[var(--text-muted)] max-w-lg mx-auto leading-relaxed">
                                    Once you've done the above, go to the <strong className="text-[var(--foreground)] font-bold">Analytics</strong> tab and enter your Vantage MT5 ID in the Connection Portal. Your copy trader will instantly switch to <strong className="text-[var(--foreground)]">ACTIVE</strong> mode.
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => window.scrollTo(0,0)} 
                                    className="px-8 py-3 bg-[#d4af37] text-black font-black rounded-xl hover:brightness-110 transition-all uppercase text-xs tracking-widest shadow-[0_0_20px_rgba(212,175,55,0.2)]"
                                >
                                    Go to Dashboard
                                </button>
                            </div>
                        </div>
                    </Step>
                </div>

                {/* FAQ/Support Footer */}
                <div className="p-8 bg-gradient-to-br from-[var(--card-bg)] via-[var(--background)] to-[var(--card-bg)] rounded-3xl border border-[var(--border-color)] flex flex-col md:flex-row items-center gap-8 justify-between">
                    <div className="space-y-3 text-center md:text-left">
                        <h4 className="text-xl font-bold italic tracking-tight uppercase">Need Human Assistance?</h4>
                        <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-sm">
                            Our institutional support is available 24/5 to help you with the technical setup or broker integration.
                        </p>
                    </div>
                    <a 
                        href="https://t.me/MadDmakz" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-gradient-to-br from-[var(--card-bg)] via-[var(--background)] to-[var(--card-bg)] border border-[var(--border-color)] px-6 py-3 rounded-xl hover:bg-[var(--border-color)] transition-all font-bold group"
                    >
                        Contact Zen Direct <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </a>
                </div>
            </div>
        </div>
    )
}
