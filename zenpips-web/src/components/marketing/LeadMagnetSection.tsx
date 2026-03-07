"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Download, CheckCircle2, Loader2, Sparkles } from "lucide-react";

export function LeadMagnetSection() {
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.includes("@")) return;

        setStatus("loading");
        try {
            const res = await fetch("/api/leads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    name: name || null,
                    source: "lead_magnet",
                    utm_source: new URLSearchParams(window.location.search).get("utm_source"),
                    utm_medium: new URLSearchParams(window.location.search).get("utm_medium"),
                    utm_campaign: new URLSearchParams(window.location.search).get("utm_campaign"),
                }),
            });

            if (!res.ok) throw new Error("Failed");
            setStatus("success");
        } catch {
            setStatus("error");
            setTimeout(() => setStatus("idle"), 3000);
        }
    };

    return (
        <section className="relative z-10 py-24 px-6 max-w-7xl mx-auto border-t border-white/5">
            <div className="relative rounded-3xl overflow-hidden">
                {/* Background glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/10 via-transparent to-purple-500/5" />
                <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#d4af37]/10 blur-[120px] rounded-full" />
                <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-purple-500/10 blur-[120px] rounded-full" />

                <div className="relative bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        {/* Left: Copy */}
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 bg-[#d4af37]/10 text-[#d4af37] px-4 py-1.5 rounded-full text-sm font-bold border border-[#d4af37]/20">
                                <Sparkles className="w-4 h-4" />
                                FREE DOWNLOAD
                            </div>
                            <h2 className="font-[family-name:var(--font-outfit)] text-3xl md:text-4xl font-bold text-white leading-tight">
                                The Institutional<br />
                                <span className="text-[#d4af37]">Market Structure</span> Guide
                            </h2>
                            <p className="text-gray-400 leading-relaxed">
                                Master the exact framework our team uses to identify institutional order flow,
                                liquidity sweeps, and high-probability entry points. This is the same methodology
                                behind our 80%+ win rate.
                            </p>
                            <ul className="space-y-3 text-sm text-gray-300">
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#d4af37]" />
                                    Order Block identification & validation
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#d4af37]" />
                                    Fair Value Gap trading setups
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#d4af37]" />
                                    Liquidity sweep patterns (Turtle Soup)
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#d4af37]" />
                                    London & New York session timing
                                </li>
                            </ul>
                        </div>

                        {/* Right: Form */}
                        <div className="space-y-4">
                            <AnimatePresence mode="wait">
                                {status === "success" ? (
                                    <motion.div
                                        key="success"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="bg-green-500/10 border border-green-500/20 rounded-2xl p-8 text-center space-y-4"
                                    >
                                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                                            <CheckCircle2 className="w-8 h-8 text-green-400" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white">You&apos;re In!</h3>
                                        <p className="text-gray-400 text-sm">
                                            Your guide is ready. Check your inbox or download directly:
                                        </p>
                                        <a
                                            href="https://t.me/Zen_pips_bot"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 bg-[#d4af37] text-black px-6 py-3 rounded-xl font-bold hover:bg-yellow-400 transition-colors"
                                        >
                                            <Download className="w-5 h-5" />
                                            Join Free Channel for Guide
                                        </a>
                                    </motion.div>
                                ) : (
                                    <motion.form
                                        key="form"
                                        onSubmit={handleSubmit}
                                        className="space-y-4"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                    >
                                        <div className="space-y-2">
                                            <label className="text-xs text-gray-400 uppercase tracking-wider font-bold">Your Name</label>
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="First name"
                                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:border-[#d4af37]/50 outline-none transition-colors"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs text-gray-400 uppercase tracking-wider font-bold">Email Address *</label>
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                                <input
                                                    type="email"
                                                    required
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    placeholder="your@email.com"
                                                    className="w-full bg-black/50 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-gray-600 focus:border-[#d4af37]/50 outline-none transition-colors"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={status === "loading"}
                                            className="w-full bg-[#d4af37] hover:bg-yellow-400 text-black py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-[0_0_30px_rgba(212,175,55,0.2)] hover:shadow-[0_0_40px_rgba(212,175,55,0.3)]"
                                        >
                                            {status === "loading" ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <Download className="w-5 h-5" />
                                            )}
                                            {status === "loading" ? "Securing your copy..." : "Download Free Guide"}
                                        </button>
                                        {status === "error" && (
                                            <p className="text-red-400 text-sm text-center">Something went wrong. Try again.</p>
                                        )}
                                        <p className="text-[10px] text-gray-600 text-center">
                                            No spam. Just institutional knowledge. Unsubscribe anytime.
                                        </p>
                                    </motion.form>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
