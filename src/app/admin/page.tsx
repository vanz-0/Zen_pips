"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { useRouter } from "next/navigation"
import ChartUploader from "@/components/admin/ChartUploader"
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

            <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
                {/* Stats Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: 'Active Signals', value: '4', color: 'text-yellow-500' },
                        { label: 'Fleet Accounts', value: '5', color: 'text-blue-400' },
                        { label: 'Community', value: '1.2k', color: 'text-white' },
                        { label: 'Bridge Status', value: 'READY', color: 'text-emerald-400' }
                    ].map(stat => (
                        <div key={stat.label} className="bg-[#0a0a0a] rounded-xl p-4 border border-white/[0.06]">
                            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mb-1">{stat.label}</p>
                            <p className={`text-xl font-heading font-bold ${stat.color}`}>{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Navigation Tabs */}
                <div className="flex gap-2">
                    {[
                        { name: 'Signal Terminal', icon: BarChart3, active: true },
                        { name: 'User Management', icon: Users, active: false },
                        { name: 'Settings', icon: Settings, active: false }
                    ].map((item) => (
                        <button
                            key={item.name}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                                item.active
                                    ? 'bg-yellow-500 text-black'
                                    : 'bg-white/[0.04] text-neutral-500 hover:bg-white/[0.08] hover:text-neutral-300 border border-white/[0.06]'
                            }`}
                        >
                            <item.icon className="w-4 h-4" />
                            {item.name}
                        </button>
                    ))}
                </div>

                {/* Main Content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <ChartUploader />
                </motion.div>
            </main>
        </div>
    )
}
