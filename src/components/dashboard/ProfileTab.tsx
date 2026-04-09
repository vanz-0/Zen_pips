"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { User, Shield, CreditCard, History, Settings, LogOut, ArrowLeft, Save, Loader2, Mail, AtSign, CheckCircle2, Link, Zap } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { useSignals } from "@/hooks/useSignals"
import Image from "next/image"

export function ProfileTab() {
  const { user, profile, loading: authLoading, signOut } = useAuth()
  const { signals } = useSignals()
  const router = useRouter()

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Editable fields
  const [fullName, setFullName] = useState("")
  const [telegramUsername, setTelegramUsername] = useState("")
  const [mt5AccountId, setMt5AccountId] = useState("")

  // Initialize form from user metadata
  useEffect(() => {
    if (user) {
      setFullName(user.user_metadata?.full_name || "")
      setTelegramUsername(user.user_metadata?.telegram_username || "")
      setMt5AccountId(user.user_metadata?.mt5_account_id || "")
    }
  }, [user])

  const [timeframe, setTimeframe] = useState<"day" | "week" | "month">("day")

  // Derived stats from signals based on timeframe
  const filteredSignals = useMemo(() => {
    const now = new Date();
    return signals.filter(s => {
      const createdDate = new Date(s.created_at);
      if (timeframe === "day") {
        return createdDate.toDateString() === now.toDateString();
      } else if (timeframe === "week") {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        return createdDate >= startOfWeek;
      } else if (timeframe === "month") {
        return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [signals, timeframe]);

  const totalPips = filteredSignals.reduce((acc: number, s: any) => acc + (s.total_pips || 0), 0)
  const grandTotalPips = signals.reduce((acc: number, s: any) => acc + (s.total_pips || 0), 0)
  const winCount = filteredSignals.filter((s: any) => s.total_pips > 0).length
  const winRate = filteredSignals.length > 0 ? Math.round((winCount / filteredSignals.length) * 100) : 0

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: fullName,
        telegram_username: telegramUsername,
        mt5_account_id: mt5AccountId,
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
        <h2 className="text-2xl font-bold text-[var(--foreground)]">Access Restricted</h2>
        <p className="text-[var(--text-muted)] text-center max-w-sm">You need to be logged in to view your Dominator Profile.</p>
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
    ? fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user.email?.[0]?.toUpperCase() || "ZP"

  const memberSince = new Date(user.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })

  return (
    <div className="w-full text-[var(--foreground)] py-12 font-[family-name:var(--font-outfit)]">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-500 to-white bg-clip-text text-transparent">
              Analytics Dashboard
            </h1>
            <p className="text-[var(--text-muted)] mt-2">Your command center. Track live performance and automate your edge.</p>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-4 bg-[var(--panel-bg)] p-5 rounded-2xl border border-[var(--border-color)] shadow-lg"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center text-black font-bold text-xl shadow-[0_0_20px_rgba(212,175,55,0.3)]">
              {initials}
            </div>
            <div>
              <p className="font-semibold text-[var(--foreground)] text-lg">{fullName || "Dominator"}</p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-yellow-500/20">
                  {profile?.is_admin ? "ELITE ADMIN" : "VIP MEMBER"}
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">Since {memberSince}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Success Banner */}
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-[var(--color-success)] px-4 py-3 rounded-xl text-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            Profile updated successfully!
          </motion.div>
        )}

        {/* Timeframe Toggle */}
        <div className="flex justify-start">
          <div className="inline-flex p-1 bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-xl shadow-lg">
            {(["day", "week", "month"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                  timeframe === t
                    ? "bg-yellow-500 text-black shadow-lg"
                    : "text-[var(--text-muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[var(--panel-bg)] p-6 rounded-2xl border border-[var(--border-color)] space-y-4 hover:border-yellow-500/20 transition-colors"
          >
            <div className="flex items-center gap-2 text-yellow-500">
              <Shield className="w-5 h-5" />
              <h3 className="font-semibold">Subscription Status</h3>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-[var(--color-success)]">ACTIVE</p>
              <p className="text-[var(--text-muted)] text-sm">Member since {memberSince}</p>
            </div>
            <a
              href="https://t.me/Zen_pips_bot"
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
            className="bg-[var(--panel-bg)] p-6 rounded-2xl border border-[var(--border-color)] space-y-4 hover:border-yellow-500/20 transition-colors"
          >
            <div className="flex items-center gap-2 text-yellow-500">
              <History className="w-5 h-5" />
              <h3 className="font-semibold">Trading Performance</h3>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold font-mono">
                <span className={totalPips >= 0 ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}>
                  {totalPips > 0 ? "+" : ""}{Math.round(totalPips).toLocaleString()}
                </span>
                <span className="text-lg text-[var(--text-muted)] ml-1">Pips</span>
              </p>
              <div className="flex flex-col gap-1">
                <p className="text-green-500 text-sm font-semibold">{winRate}% Win Rate · {filteredSignals.length} {timeframe} Signals</p>
                <p className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-wider">Total Lifetime: +{Math.round(grandTotalPips).toLocaleString()} Pips</p>
              </div>
            </div>
            <button
              onClick={() => router.push("/journal")}
              className="w-full py-2.5 bg-[var(--panel-bg)] text-[var(--foreground)] rounded-lg font-semibold text-sm hover:bg-[var(--border-color)] transition-colors border border-[var(--border-color)]"
            >
              View Journal
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[var(--panel-bg)] p-6 rounded-2xl border border-[var(--border-color)] space-y-4 hover:border-yellow-500/20 transition-colors"
          >
            <div className="flex items-center gap-2 text-yellow-500">
              <CreditCard className="w-5 h-5" />
              <h3 className="font-semibold">Quick Actions</h3>
            </div>
            <div className="space-y-2">
              <a
                href="https://t.me/Zen_pips_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-2.5 bg-[var(--panel-bg)] text-[var(--foreground)] rounded-lg font-semibold text-sm hover:bg-[var(--border-color)] transition-colors border border-[var(--border-color)] text-center"
              >
                Open Telegram Group
              </a>
              <button
                onClick={() => router.push("/vault")}
                className="w-full py-2.5 bg-[var(--panel-bg)] text-[var(--foreground)] rounded-lg font-semibold text-sm hover:bg-[var(--border-color)] transition-colors border border-[var(--border-color)]"
              >
                Education Vault
              </button>
            </div>
          </motion.div>
        </div>

        {/* Broker Integrations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-gradient-to-br from-[var(--card-bg)] to-[var(--background)] rounded-2xl border border-[#d4af37]/30 overflow-hidden relative shadow-[0_0_40px_rgba(212,175,55,0.05)]"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-[80px] -mr-10 -mt-10 pointer-events-none" />
          
          <div className="p-8 md:p-10 flex flex-col md:flex-row gap-10 items-center">
            <div className="flex-1 space-y-6 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-xs font-bold uppercase tracking-wider">
                <img src="/vantage-logo.svg" alt="Vantage" className="w-3.5 h-3.5" /> Multi-Broker Copier
              </div>
              <h2 className="text-2xl md:text-4xl font-bold text-[var(--foreground)] leading-tight">
                Automate Your Edge <br className="hidden sm:block" />
                <span className="text-[#d4af37]">with Institutional Liquidity.</span>
              </h2>
              <p className="text-[var(--text-muted)] text-sm md:text-lg leading-relaxed max-w-xl">
                The Zen Pips Bridge supports Vantage Markets. Link your preferred broker to activate zero-latency institutional trade synchronization.
              </p>
              
              <div className="pt-4">
                <a href="https://vigco.co/la-com-inv/TItFx2Oy" target="_blank" rel="noopener noreferrer" className="inline-block bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/30 px-8 py-3 rounded-xl font-bold hover:bg-[#d4af37] hover:text-black transition-all text-center text-sm shadow-lg hover:-translate-y-1">
                  Connect Vantage Account
                </a>
              </div>
            </div>
            
            <div className="w-full md:w-[380px] bg-[var(--card-bg)]/60 rounded-2xl p-6 border border-[var(--border-color)] backdrop-blur-xl relative z-10 shrink-0 shadow-2xl space-y-6">
               <div>
                 <h3 className="text-lg font-bold text-[var(--foreground)] mb-2 flex items-center gap-2">
                   <Link className="w-5 h-5 text-[var(--text-muted)]" />
                   Connection Portal
                 </h3>
                 <p className="text-xs text-[var(--text-muted)]">Input your MT5 ID to route signals dynamically.</p>
               </div>

               <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-extrabold">Vantage MT5 ID</label>
                    <input
                      type="text"
                      value={mt5AccountId}
                      onChange={(e) => setMt5AccountId(e.target.value)}
                      className="w-full bg-[var(--background)] p-3 rounded-xl border border-[var(--border-color)] text-[var(--foreground)] focus:border-yellow-500/50 outline-none transition-colors font-mono text-sm"
                      placeholder="e.g. 86213984"
                    />
                  </div>

                  {/* PLACEHOLDERS FOR CLOUD MAM ARCHITECTURE */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-extrabold">MT5 Password (Cloud Beta)</label>
                    <input
                      type="password"
                      className="w-full bg-[var(--background)] p-3 rounded-xl border border-[var(--border-color)] text-[var(--foreground)] focus:border-yellow-500/50 outline-none transition-colors font-mono text-sm opacity-50 cursor-not-allowed"
                      placeholder="••••••••••••"
                      disabled
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-extrabold">Broker Server Info</label>
                    <input
                      type="text"
                      className="w-full bg-[var(--background)] p-3 rounded-xl border border-[var(--border-color)] text-[var(--foreground)] focus:border-yellow-500/50 outline-none transition-colors font-mono text-sm opacity-50 cursor-not-allowed"
                      placeholder="e.g. VantageInternational-Live"
                      disabled
                    />
                  </div>

                  <button
                    onClick={handleSave}
                    disabled={saving || !mt5AccountId}
                    className="w-full py-3 bg-[var(--panel-bg)] text-[var(--foreground)] rounded-xl font-bold hover:bg-yellow-500 hover:text-black transition-colors border border-[var(--border-color)] flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Connection ID"}
                  </button>

                  {mt5AccountId && (
                    <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/10">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <p className="text-[10px] text-[var(--color-success)] font-bold uppercase tracking-widest">Active Linkage</p>
                      </div>
                    </div>
                  )}
               </div>
            </div>
          </div>
        </motion.div>

        {/* Account Settings */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-[var(--panel-bg)] rounded-2xl border border-[var(--border-color)] overflow-hidden"
        >
          <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Settings className="w-5 h-5 text-[var(--text-muted)]" />
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
                  className="text-sm text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
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
                <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-bold flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Full Name
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-[var(--background)] p-3 rounded-lg border border-[var(--border-color)] text-[var(--foreground)] focus:border-yellow-500/50 outline-none transition-colors"
                    placeholder="Your full name"
                  />
                ) : (
                  <div className="bg-[var(--background)] p-3 rounded-lg border border-[var(--border-color)] text-[var(--foreground)]">
                    {fullName || <span className="text-[var(--text-muted)] italic">Not set</span>}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-bold flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Email Address
                </label>
                <div className="bg-[var(--background)] p-3 rounded-lg border border-[var(--border-color)] text-[var(--foreground)] flex items-center justify-between">
                  <span>{user.email}</span>
                  <span className="text-[9px] bg-green-500/10 text-[var(--color-success)] px-2 py-0.5 rounded-full font-bold border border-green-500/20">
                    VERIFIED
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-bold flex items-center gap-1.5">
                  <AtSign className="w-3.5 h-3.5" /> Telegram Username
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={telegramUsername}
                    onChange={(e) => setTelegramUsername(e.target.value)}
                    className="w-full bg-[var(--background)] p-3 rounded-lg border border-[var(--border-color)] text-[var(--foreground)] focus:border-yellow-500/50 outline-none transition-colors"
                    placeholder="@your_username"
                  />
                ) : (
                  <div className="bg-[var(--background)] p-3 rounded-lg border border-[var(--border-color)] text-[var(--foreground)]">
                    {telegramUsername || <span className="text-[var(--text-muted)] italic">Not linked</span>}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-bold flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> User ID
                </label>
                <div className="bg-[var(--background)] p-3 rounded-lg border border-[var(--border-color)] text-[var(--text-muted)] font-mono text-xs truncate">
                  {user.id}
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="pt-6 border-t border-[var(--border-color)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm text-[var(--text-muted)]">Session & Security</p>
                <p className="text-[11px] text-[var(--text-muted)]">Log out of your current session.</p>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 text-red-500 text-sm font-semibold hover:text-[var(--color-danger)] transition-colors bg-red-500/5 px-4 py-2 rounded-lg border border-red-500/10 hover:border-red-500/20"
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
