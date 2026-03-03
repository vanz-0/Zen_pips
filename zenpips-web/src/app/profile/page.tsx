"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { User, Shield, CreditCard, History, Settings } from "lucide-react"

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initial loading simulation
    const timer = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
        <div className="w-12 h-12 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-12 font-outfit">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
              Dominator Profile
            </h1>
            <p className="text-gray-400 mt-2">Manage your institutional trading access and settings.</p>
          </div>
          <div className="flex items-center gap-3 bg-[#111] p-4 rounded-xl border border-white/5">
            <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center text-black font-bold text-xl">
              JD
            </div>
            <div>
              <p className="font-semibold text-white">John Dominator</p>
              <p className="text-xs text-yellow-500">VIP ELITE MEMBER</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Stats Cards */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#111] p-6 rounded-2xl border border-white/5 space-y-4"
          >
            <div className="flex items-center gap-2 text-yellow-500">
              <Shield className="w-5 h-5" />
              <h3 className="font-semibold">Subscription Status</h3>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold">ACTIVE</p>
              <p className="text-gray-400 text-sm">Renews on Oct 12, 2026</p>
            </div>
            <button className="w-full py-2 bg-yellow-500 text-black rounded-lg font-semibold text-sm hover:bg-yellow-400 transition-colors">
              Manage Billing
            </button>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#111] p-6 rounded-2xl border border-white/5 space-y-4"
          >
            <div className="flex items-center gap-2 text-yellow-500">
              <CreditCard className="w-5 h-5" />
              <h3 className="font-semibold">Linked Wallet</h3>
            </div>
            <div className="space-y-1">
              <p className="text-xl font-mono truncate">0x71C...4f92</p>
              <p className="text-gray-400 text-sm">Used for VIP activation</p>
            </div>
            <button className="w-full py-2 bg-white/5 text-white rounded-lg font-semibold text-sm hover:bg-white/10 transition-colors border border-white/10">
              Change Wallet
            </button>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#111] p-6 rounded-2xl border border-white/5 space-y-4"
          >
            <div className="flex items-center gap-2 text-yellow-500">
              <History className="w-5 h-5" />
              <h3 className="font-semibold">Trading Activity</h3>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold">+1,240 Pips</p>
              <p className="text-green-500 text-sm font-semibold">↑ 12% this month</p>
            </div>
            <button className="w-full py-2 bg-white/5 text-white rounded-lg font-semibold text-sm hover:bg-white/10 transition-colors border border-white/10">
              View Analytics
            </button>
          </motion.div>
        </div>

        {/* Account Details */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-[#111] rounded-2xl border border-white/5 overflow-hidden"
        >
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-400" />
              Account Settings
            </h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Telegram Username</label>
                <div className="bg-black/50 p-3 rounded-lg border border-white/10 text-white">
                  @maddmakz
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Email Address</label>
                <div className="bg-black/50 p-3 rounded-lg border border-white/10 text-white">
                  john.doe@example.com
                </div>
              </div>
            </div>
            <div className="pt-4">
              <button className="text-red-500 text-sm font-semibold hover:underline">
                Deactivate Dominator Account
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
