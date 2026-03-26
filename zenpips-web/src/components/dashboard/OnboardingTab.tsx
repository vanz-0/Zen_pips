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
                <div className="absolute left-[20px] top-[40px] bottom-0 w-[2px] bg-white/5 z-0" />
            )}
            <div className="flex gap-6 relative z-10">
                <button 
                    onClick={onToggle}
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                        isOpen 
                            ? "bg-yellow-500 border-yellow-500 text-black shadow-[0_0_20px_rgba(212,175,55,0.3)]" 
                            : "bg-[#111] border-white/10 text-gray-500"
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
                            <h3 className={`text-xl font-bold transition-colors ${isOpen ? "text-white" : "text-gray-400 group-hover:text-gray-300"}`}>
                                {title}
                            </h3>
                            <p className="text-sm text-gray-500">{description}</p>
                        </div>
                        {isOpen ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
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
        <div className="w-full text-white py-12 font-[family-name:var(--font-outfit)]">
            <div className="max-w-4xl mx-auto space-y-12">
                
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-xs font-bold uppercase tracking-widest">
                        <Zap className="w-3 h-3 fill-yellow-500" /> Getting Started
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-white via-white to-gray-500 bg-clip-text text-transparent italic tracking-tight">
                        THE DOMINATOR SETUP
                    </h1>
                    <p className="text-gray-400 max-w-xl mx-auto">
                        Follow our institutional onboarding process to link your capital to the Zen Pips Bridge and start trading our high-probability signals.
                    </p>
                </div>

                {/* Steps Accordion */}
                <div className="space-y-2">
                    
                    {/* Step 1: Broker Setup */}
                    <Step 
                        number={1} 
                        title="Establish Your Brokerage (HFM)" 
                        description="Access institutional-grade liquidity and raw spreads."
                        isOpen={openStep === 1}
                        onToggle={() => setOpenStep(1)}
                    >
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-6">
                            <div className="flex flex-col md:flex-row gap-6 items-start">
                                <div className="flex-1 space-y-4">
                                    <p className="text-gray-300 leading-relaxed">
                                        We exclusively use <strong className="text-white">HFM (HotForex)</strong> for our Copy Trader bridge. Their execution speed ensures all our members enter at the exact same price as the main institutional flow.
                                    </p>
                                    <ul className="space-y-3">
                                        <li className="flex items-start gap-3 text-sm text-gray-400">
                                            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                            <span>Click the button below to visit HFM.</span>
                                        </li>
                                        <li className="flex items-start gap-3 text-sm text-gray-400">
                                            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                            <span>Register an account and specifically choose an <strong className="text-white">MT5 Premium</strong> or <strong className="text-white">HFM Copy</strong> account.</span>
                                        </li>
                                        <li className="flex items-start gap-3 text-sm text-gray-400">
                                            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                            <span>Complete your KYC verification to unlock full deposit capabilities.</span>
                                        </li>
                                    </ul>
                                </div>
                                <div className="w-full md:w-64 space-y-3">
                                    <a 
                                        href="https://www.hfm.com/ke/en/?refid=30508914" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 w-full py-4 bg-[#d4af37] text-black font-black rounded-xl hover:brightness-110 transition-all text-sm uppercase tracking-wider"
                                    >
                                        JOIN HFM <ExternalLink className="w-4 h-4" />
                                    </a>
                                    <p className="text-[10px] text-gray-600 text-center uppercase font-bold tracking-tighter">Zen Pips Official Broker Affiliate Link</p>
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
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-yellow-500">
                                        <Smartphone className="w-4 h-4" />
                                        <span className="text-xs font-bold uppercase tracking-wider">Mobile App (iPhone/Android)</span>
                                    </div>
                                    <ol className="space-y-3 text-sm text-gray-400 list-decimal pl-4">
                                        <li>Open the MT5 App.</li>
                                        <li>Go to <strong className="text-white">Settings</strong> &gt; <strong className="text-white">New Account</strong>.</li>
                                        <li>Select HFM as your broker and log in.</li>
                                        <li>Your 8-digit Login ID will appear at the top of your Account profile.</li>
                                    </ol>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-yellow-500">
                                        <Monitor className="w-4 h-4" />
                                        <span className="text-xs font-bold uppercase tracking-wider">Desktop Platform</span>
                                    </div>
                                    <ol className="space-y-3 text-sm text-gray-400 list-decimal pl-4">
                                        <li>Open MetaTrader 5 on your PC.</li>
                                        <li>Look at the <strong className="text-white">Navigator</strong> window (Press Ctrl+N).</li>
                                        <li>Expand the 'Accounts' tree.</li>
                                        <li>The number listed next to your name is your MT5 ID (e.g., 86213984).</li>
                                    </ol>
                                </div>
                            </div>
                            <div className="mt-8 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl flex items-start gap-4">
                                <Info className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-yellow-500/80 leading-relaxed font-medium">
                                    <strong>IMPORTANT:</strong> You only need to provide the Login ID. <strong>NEVER</strong> share your MT5 Master Password with anyone, including us. Our bridge only requires the ID to route signals via the HFM server.
                                </p>
                            </div>
                        </div>
                    </Step>

                    {/* Step 3: Funding */}
                    <Step 
                        number={3} 
                        title="Capital Injection (Funding)" 
                        description="Deposit your trading capital into your HFM Wallet."
                        isOpen={openStep === 3}
                        onToggle={() => setOpenStep(3)}
                    >
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-6">
                            <div className="flex flex-col md:flex-row gap-8">
                                <div className="flex-1 space-y-4">
                                    <h4 className="font-bold flex items-center gap-2">
                                        <CreditCard className="w-4 h-4 text-blue-400" />
                                        Funding Options
                                    </h4>
                                    <p className="text-sm text-gray-400">
                                        HfM provides multiple zero-fee deposit methods. Login to the myHF area on their site and click 'Deposit'.
                                    </p>
                                    <div className="grid grid-cols-2 gap-3 pb-2">
                                        {['Visa/Mastercard', 'Wire Transfer', 'Skrill/Neteller', 'Crypto (Bitcoin)'].map(m => (
                                            <div key={m} className="bg-white/5 p-2.5 rounded-lg border border-white/5 text-[10px] font-bold text-center uppercase tracking-widest">{m}</div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex-1 space-y-4">
                                    <h4 className="font-bold flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-green-400" />
                                        Risk Strategy
                                    </h4>
                                    <p className="text-sm text-gray-400 italic">
                                        "A trader without capital management is a gambler."
                                    </p>
                                    <ul className="space-y-2 text-xs text-gray-500">
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
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-8">
                            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-yellow-500/10 to-transparent rounded-2xl border border-yellow-500/20">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <Bitcoin className="w-8 h-8 text-yellow-500" />
                                        <div>
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Crypto Checkout</p>
                                            <h4 className="text-2xl font-black text-white">$50 / Month - VIP ACCESS</h4>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-400 max-w-md">We exclusively accept Bitcoin (BTC) for membership payments to ensure instant, global, and anonymous security.</p>
                                </div>
                                <div className="hidden lg:block">
                                    <Download className="w-12 h-12 text-white/10" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <p className="text-sm font-bold text-white flex items-center gap-2">
                                        <ArrowRight className="w-4 h-4 text-yellow-500" />
                                        1. Get BTC via Binance
                                    </p>
                                    <p className="text-xs text-gray-400 leading-relaxed">
                                        Download the Binance app. Use our link to register and get lower transaction fees. Buy Bitcoin using your local currency (P2P or Bank Card).
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
                                    <p className="text-sm font-bold text-white flex items-center gap-2">
                                        <ArrowRight className="w-4 h-4 text-yellow-500" />
                                        2. Send To Admin Wallet
                                    </p>
                                    <p className="text-xs text-gray-400 leading-relaxed">
                                        Message <strong className="text-white">@MadDmakz</strong> on Telegram to get the current institutional BTC address. Send the exact amount and share a screenshot of the confirmation.
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
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col items-center text-center space-y-6">
                            <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                                <CheckCircle2 className="w-8 h-8 text-green-500" />
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-xl font-bold">You're Ready to Dominate.</h4>
                                <p className="text-sm text-gray-400 max-w-lg mx-auto leading-relaxed">
                                    Once you've done the above, go to the <strong className="text-white font-bold">Analytics</strong> tab and enter your HFM MT5 ID in the Connection Portal. Your copy trader will instantly switch to <strong className="text-white">ACTIVE</strong> mode.
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
                <div className="p-8 bg-[#111] rounded-3xl border border-white/5 flex flex-col md:flex-row items-center gap-8 justify-between">
                    <div className="space-y-3 text-center md:text-left">
                        <h4 className="text-xl font-bold italic tracking-tight uppercase">Need Human Assistance?</h4>
                        <p className="text-sm text-gray-500 leading-relaxed max-w-sm">
                            Our institutional support is available 24/5 to help you with the technical setup or broker integration.
                        </p>
                    </div>
                    <a 
                        href="https://t.me/MadDmakz" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-white/5 border border-white/10 px-6 py-3 rounded-xl hover:bg-white/10 transition-all font-bold group"
                    >
                        Contact Zen Direct <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </a>
                </div>
            </div>
        </div>
    )
}
