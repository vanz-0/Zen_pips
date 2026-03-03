"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Shield, Lock, Mail, ArrowRight } from "lucide-react"

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true)

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 font-outfit relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-1/4 -left-20 w-80 h-80 bg-yellow-500/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-yellow-500/5 blur-[120px] rounded-full" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-[#111] p-8 rounded-3xl border border-white/5 relative z-10 shadow-2xl"
            >
                <div className="text-center space-y-2 mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500/10 rounded-2xl border border-yellow-500/20 mb-4">
                        <Shield className="w-8 h-8 text-yellow-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">
                        {isLogin ? "Welcome Back" : "Join the Elite"}
                    </h1>
                    <p className="text-gray-400">
                        {isLogin
                            ? "Enter your credentials to access the terminal."
                            : "Start your journey to market dominance today."}
                    </p>
                </div>

                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                    {!isLogin && (
                        <div className="space-y-1">
                            <label className="text-xs text-gray-400 uppercase font-bold tracking-widest ml-1">Full Name</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="John Doe"
                                    className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-11 outline-none focus:border-yellow-500/50 transition-all text-white"
                                />
                                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            </div>
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-xs text-gray-400 uppercase font-bold tracking-widest ml-1">Email Address</label>
                        <div className="relative">
                            <input
                                type="email"
                                placeholder="dominator@zenpips.com"
                                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-11 outline-none focus:border-yellow-500/50 transition-all text-white"
                            />
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs text-gray-400 uppercase font-bold tracking-widest ml-1">Password</label>
                        <div className="relative">
                            <input
                                type="password"
                                placeholder="••••••••"
                                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-11 outline-none focus:border-yellow-500/50 transition-all text-white"
                            />
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        </div>
                    </div>

                    <button className="w-full bg-yellow-500 text-black py-4 rounded-xl font-bold flex items-center justify-center gap-2 group hover:bg-yellow-400 transition-all mt-4">
                        {isLogin ? "Access Terminal" : "Create Account"}
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-gray-400 hover:text-white text-sm transition-colors"
                    >
                        {isLogin ? "Don't have an account? " : "Already a member? "}
                        <span className="text-yellow-500 font-bold ml-1">{isLogin ? "Sign Up" : "Log In"}</span>
                    </button>
                </div>
            </motion.div>
        </div>
    )
}
