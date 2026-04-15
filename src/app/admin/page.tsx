"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { useRouter } from "next/navigation"
import ChartUploader from "@/components/Admin/ChartUploader"
import { motion } from "framer-motion"
import { ShieldAlert, BarChart3, Settings, Users, LogOut, ChevronRight } from "lucide-react"

export default function AdminDashboard() {
    const { user, profile, loading, signOut } = useAuth()
    const router = useRouter()
    const [isAuthorized, setIsAuthorized] = useState(false)

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/auth/login")
            } else if (profile && !profile.is_admin) {
                // Not an admin, redirect to dashboard or home
                router.push("/")
            } else if (profile?.is_admin) {
                setIsAuthorized(true)
            }
        }
    }, [user, profile, loading, router])

    if (loading || !isAuthorized) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin" />
                    <p className="text-neutral-500 font-medium tracking-widest text-xs uppercase">Verifying Institutional Credentials</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            {/* Sidebar / Top Nav for mobile */}
            <div className="w-full border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center shadow-lg shadow-yellow-500/20">
                            <ShieldAlert className="text-black w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="font-heading font-bold text-lg tracking-tight">ZENPIPS ADMIN</h1>
                            <p className="text-[10px] text-neutral-500 font-semibold uppercase tracking-widest">Command Center v2.0</p>
                        </div>
                    </div>

                    <button 
                        onClick={() => signOut()}
                        className="p-2 hover:bg-white/5 rounded-full transition-colors group"
                    >
                        <LogOut className="w-5 h-5 text-neutral-400 group-hover:text-red-400 transition-colors" />
                    </button>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Stats & Navigation */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="glass-card p-6 border-white/5">
                        <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-widest mb-4">Quick Stats</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors">
                                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mb-1">Active Signals</p>
                                <p className="text-2xl font-heading font-bold text-yellow-500">14</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors">
                                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mb-1">Community Mbrs</p>
                                <p className="text-2xl font-heading font-bold">1.2k</p>
                            </div>
                        </div>
                    </div>

                    <nav className="space-y-2">
                        {[
                            { name: 'Signals & Broadcasts', icon: BarChart3, active: true },
                            { name: 'User Management', icon: Users, active: false },
                            { name: 'Platform Settings', icon: Settings, active: false }
                        ].map((item) => (
                            <button 
                                key={item.name}
                                className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
                                    item.active ? 'bg-yellow-500 text-black font-bold' : 'bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon className="w-5 h-5" />
                                    <span>{item.name}</span>
                                </div>
                                <ChevronRight className={`w-4 h-4 ${item.active ? 'text-black' : 'text-neutral-600'}`} />
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Right Column: Main Content */}
                <div className="lg:col-span-8 space-y-8">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <header>
                            <h2 className="text-3xl font-heading font-bold text-white tracking-tight">Broadcast Management</h2>
                            <p className="text-neutral-400 mt-2">Create high-impact signals and setup charts for the global community.</p>
                        </header>

                        <div className="grid grid-cols-1 gap-8">
                            <ChartUploader />
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    )
}
