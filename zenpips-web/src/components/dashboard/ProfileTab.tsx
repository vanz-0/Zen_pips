"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { User, Shield, CreditCard, History, Settings, LogOut, ArrowLeft, Save, Loader2, Mail, AtSign, CheckCircle2 } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { useSignals } from "@/hooks/useSignals"
import Image from "next/image"

export function ProfileTab() {
  const { user, loading: authLoading, signOut } = useAuth()
  const { signals } = useSignals()
  const router = useRouter()

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Editable fields
  const [fullName, setFullName] = useState("")
  const [telegramUsername, setTelegramUsername] = useState("")

  // Initialize form from user metadata
  useEffect(() => {
    if (user) {
      setFullName(user.user_metadata?.full_name || "")
      setTelegramUsername(user.user_metadata?.telegram_username || "")
    }
  }, [user])

  // Derived stats from signals
  const totalPips = signals.reduce((acc, s) => acc + (s.total_pips || 0), 0)
  const winCount = signals.filter(s => s.total_pips > 0).length
  const winRate = signals.length > 0 ? Math.round((winCount / signals.length) * 100) : 0

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: fullName,
        telegram_username: telegramUsername,
      },
    })
    setSaving(false)
    if (!error) {
      setSaved(true)
      setEditing(false)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/auth")
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-12 h-12 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-6">
        <Shield className="w-16 h-16 text-yellow-500/30" />
        <h2 className="text-2xl font-bold text-white">Access Restricted</h2>
        <p className="text-gray-400 text-center max-w-sm">You need to be logged in to view your Dominator Profile.</p>
        <button
          onClick={() => router.push("/auth")}
          className="bg-yellow-500 text-black px-8 py-3 rounded-xl font-bold hover:bg-yellow-400 transition-all"
        >
          Log In / Sign Up
        </button>
      </div>
    )
  }

  const initials = fullName
    ? fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : user.email?.[0]?.toUpperCase() || "ZP"

  const memberSince = new Date(user.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })

  return (
    <div className="w-full text-white py-12 font-[family-name:var(--font-outfit)]">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
              Dominator Profile
            </h1>
            <p className="text-gray-400 mt-2">Your command center. Manage your access, settings, and trading performance.</p>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-4 bg-[#111] p-5 rounded-2xl border border-white/5 shadow-lg"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center text-black font-bold text-xl shadow-[0_0_20px_rgba(212,175,55,0.3)]">
              {initials}
            </div>
            <div>
              <p className="font-semibold text-white text-lg">{fullName || "Dominator"}</p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-yellow-500/20">
                  VIP MEMBER
                </span>
                <span className="text-[10px] text-gray-500">Since {memberSince}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Success Banner */}
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl text-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            Profile updated successfully!
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#111] p-6 rounded-2xl border border-white/5 space-y-4 hover:border-yellow-500/20 transition-colors"
          >
            <div className="flex items-center gap-2 text-yellow-500">
              <Shield className="w-5 h-5" />
              <h3 className="font-semibold">Subscription Status</h3>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-green-400">ACTIVE</p>
              <p className="text-gray-400 text-sm">Member since {memberSince}</p>
            </div>
            <a
              href="https://t.me/MadDmakz"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-2.5 bg-yellow-500 text-black rounded-lg font-semibold text-sm hover:bg-yellow-400 transition-colors text-center"
            >
              Manage Subscription
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#111] p-6 rounded-2xl border border-white/5 space-y-4 hover:border-yellow-500/20 transition-colors"
          >
            <div className="flex items-center gap-2 text-yellow-500">
              <History className="w-5 h-5" />
              <h3 className="font-semibold">Trading Performance</h3>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold font-mono">
                <span className={totalPips >= 0 ? "text-green-400" : "text-red-400"}>
                  {totalPips > 0 ? "+" : ""}{totalPips.toLocaleString()}
                </span>
                <span className="text-lg text-gray-500 ml-1">Pips</span>
              </p>
              <p className="text-green-500 text-sm font-semibold">{winRate}% Win Rate · {signals.length} Signals</p>
            </div>
            <button
              onClick={() => router.push("/journal")}
              className="w-full py-2.5 bg-white/5 text-white rounded-lg font-semibold text-sm hover:bg-white/10 transition-colors border border-white/10"
            >
              View Journal
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#111] p-6 rounded-2xl border border-white/5 space-y-4 hover:border-yellow-500/20 transition-colors"
          >
            <div className="flex items-center gap-2 text-yellow-500">
              <CreditCard className="w-5 h-5" />
              <h3 className="font-semibold">Quick Actions</h3>
            </div>
            <div className="space-y-2">
              <a
                href="https://t.me/Zen_pips"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-2.5 bg-white/5 text-white rounded-lg font-semibold text-sm hover:bg-white/10 transition-colors border border-white/10 text-center"
              >
                Open Telegram Group
              </a>
              <button
                onClick={() => router.push("/vault")}
                className="w-full py-2.5 bg-white/5 text-white rounded-lg font-semibold text-sm hover:bg-white/10 transition-colors border border-white/10"
              >
                Education Vault
              </button>
            </div>
          </motion.div>
        </div>

        {/* Account Settings */}
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
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="text-sm text-yellow-500 font-semibold hover:text-yellow-400 transition-colors"
              >
                Edit Profile
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setEditing(false)}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 text-sm bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold hover:bg-yellow-400 transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save
                </button>
              </div>
            )}
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs text-gray-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Full Name
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-black/50 p-3 rounded-lg border border-white/10 text-white focus:border-yellow-500/50 outline-none transition-colors"
                    placeholder="Your full name"
                  />
                ) : (
                  <div className="bg-black/30 p-3 rounded-lg border border-white/5 text-white">
                    {fullName || <span className="text-gray-500 italic">Not set</span>}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs text-gray-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Email Address
                </label>
                <div className="bg-black/30 p-3 rounded-lg border border-white/5 text-white flex items-center justify-between">
                  <span>{user.email}</span>
                  <span className="text-[9px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full font-bold border border-green-500/20">
                    VERIFIED
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-gray-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
                  <AtSign className="w-3.5 h-3.5" /> Telegram Username
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={telegramUsername}
                    onChange={(e) => setTelegramUsername(e.target.value)}
                    className="w-full bg-black/50 p-3 rounded-lg border border-white/10 text-white focus:border-yellow-500/50 outline-none transition-colors"
                    placeholder="@your_username"
                  />
                ) : (
                  <div className="bg-black/30 p-3 rounded-lg border border-white/5 text-white">
                    {telegramUsername || <span className="text-gray-500 italic">Not linked</span>}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs text-gray-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> User ID
                </label>
                <div className="bg-black/30 p-3 rounded-lg border border-white/5 text-gray-500 font-mono text-xs truncate">
                  {user.id}
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm text-gray-400">Session & Security</p>
                <p className="text-[11px] text-gray-600">Log out of your current session.</p>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 text-red-500 text-sm font-semibold hover:text-red-400 transition-colors bg-red-500/5 px-4 py-2 rounded-lg border border-red-500/10 hover:border-red-500/20"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
