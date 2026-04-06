"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { motion } from "framer-motion"
import { Send, Users, Shield, Clock, Search, Hash, MessageSquare } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { supabase } from "@/lib/supabase"
import { useSignals } from "@/hooks/useSignals"

interface Message {
  id: string
  user_id: string
  content: string
  created_at: string
  user_data?: {
    full_name: string
    is_vip: boolean
  }
  image?: string
}

// ─── Constants ───
const COMMUNITY_MEMBERS = [
  { name: "Marcus K.", initials: "MK", is_vip: true },
  { name: "Sarah T.", initials: "ST", is_vip: true },
  { name: "DeFi Ace", initials: "DA", is_vip: false },
  { name: "LiquidityHunter", initials: "LH", is_vip: true },
  { name: "Zen Master", initials: "ZM", is_vip: true },
  { name: "Nyx Capital", initials: "NC", is_vip: true },
  { name: "OrderBlock_OG", initials: "OB", is_vip: false },
  { name: "SnipeTrades", initials: "SN", is_vip: true },
  { name: "Rookie_Ryan", initials: "RR", is_vip: false },
  { name: "PipzQueen", initials: "PQ", is_vip: true },
  { name: "AlgoFX", initials: "AF", is_vip: false },
  { name: "ICT Student", initials: "IS", is_vip: false },
]

const COMMUNITY_RULES = [
  "No spamming or self-promotion in public channels.",
  "Respect institutional analysis; constructive criticism only.",
  "Financial advice is strictly prohibited. We trade setups, not promises.",
  "VIP Lounge is for advanced strategy discussion and developer interaction.",
  "Keep the environment Zen. Toxicity results in an immediate ban.",
]

// ─── Static Filler Conversations (Trading Niche) ───
const STATIC_FILLER: { member: number; content: string; minutesAgo: number }[] = [
  { member: 5, content: "GM legends 🔥 Let's hunt some liquidity today", minutesAgo: 142 },
  { member: 2, content: "That Asian session sweep on Gold was textbook. Buy side taken, displacement down. Classic AMD.", minutesAgo: 138 },
  { member: 0, content: "Exactly what I was watching. The M15 FVG at 4530 got respected beautifully.", minutesAgo: 135 },
  { member: 11, content: "Can someone explain what AMD means? I keep seeing it in the vault PDFs", minutesAgo: 132 },
  { member: 7, content: "Accumulation → Manipulation → Distribution. It's the Power of 3. Smart money accumulates positions, manipulates price to trigger stops, then distributes. Read the ICT 2024 Mentorship notes in the Vault 📚", minutesAgo: 130 },
  { member: 11, content: "Thank you! That makes so much more sense now. I was just looking at candles without context 😅", minutesAgo: 128 },
  { member: 3, content: "The weekly profile on DXY is screaming reversal. If dollar drops, metals are going to FLY 🚀", minutesAgo: 120 },
  { member: 9, content: "Been watching the same thing. Silver has been consolidating hard. That descending channel is ready to break.", minutesAgo: 117 },
  { member: 4, content: "Patience > prediction. Let the market show you. Don't force entries.\n\n🧘 Trade with zen, not FOMO.", minutesAgo: 112 },
  { member: 6, content: "Anyone else notice the order block on the H4 Gold chart? There's a massive imbalance sitting right above current price.", minutesAgo: 105 },
  { member: 0, content: "Yes! That's exactly why I'm watching for a sell. If it taps into that OB and shows rejection, it's game over for the bulls short-term.", minutesAgo: 102 },
  { member: 10, content: "What risk % are you guys running per trade? I've been doing 2% but the drawdowns feel heavy on metals", minutesAgo: 95 },
  { member: 7, content: "1% max per idea. Remember you're splitting across 3 TPs so it's 0.33% per order. The compounding over time is what makes the difference, not individual trade size.", minutesAgo: 93 },
  { member: 5, content: "☝️ This is the way. Consistency beats intensity every single time. Our system proves it — check the performance tab.", minutesAgo: 90 },
  { member: 8, content: "Just joined this week and I'm blown away by the Vault resources. The CRT Method PDF changed my whole perspective on candle reading.", minutesAgo: 82 },
  { member: 9, content: "Welcome! The CRT + FVG combo is deadly. Once you master those two concepts you'll see setups everywhere.", minutesAgo: 79 },
  { member: 1, content: "Pro tip for new members: Don't trade every setup you see. Quality > Quantity.\n\nI used to take 10+ trades a day. Now I take 1-2 and my win rate went from 40% to 78%.", minutesAgo: 72 },
  { member: 3, content: "Silver is starting to move. London session coming in hot 🔥", minutesAgo: 58 },
  { member: 6, content: "That M15 break of structure on XAU was clean. Anyone catch the entry around the FVG?", minutesAgo: 45 },
  { member: 0, content: "That's what the signal system caught. The automation is unreal — entry hit, SL placed, 3 TPs mapped. All hands-free. 🤖", minutesAgo: 42 },
  { member: 4, content: "\"The market is a device for transferring money from the impatient to the patient.\"\n— Warren Buffett\n\n🧠 Stay disciplined.", minutesAgo: 35 },
  { member: 10, content: "Quick question — when you guys say \"sweep\" do you mean the same thing as a stop hunt?", minutesAgo: 28 },
  { member: 7, content: "Essentially yes. A liquidity sweep is when price takes out a key level (previous highs/lows) where stop losses are clustered, then reverses. Smart money needs that liquidity to fill their orders.", minutesAgo: 25 },
  { member: 9, content: "Think of it like this: retail puts stops below support. Smart money drives price there to fill buy orders. Then price rockets up. The Liquidity PDF in the Vault explains it perfectly.", minutesAgo: 22 },
  { member: 5, content: "🚨 XAU/USD TP1 SMASHED 🚀 +1500 Pips secured. Running to TP2 with SL at entry now. TEXTBOOK M5 entry.", minutesAgo: 15 },
  { member: 0, content: "The Gold move was institutional precision. Euro follow suit too — TP1 hit. NY session looking prime for the BTC sell limit.", minutesAgo: 12 },
  { member: 7, content: "Sitting on hands for BTC/USD. Sell limit at 68837.5. HTF bearish FVG rejection is the target. Patience > FOMO.", minutesAgo: 8 },
]

// ─── Dynamic Filler (based on live signals) ───
function generateSignalFillers(signals: any[]): { member: number; content: string; minutesAgo: number }[] {
  const active = signals.filter(s => !s.closed)
  if (active.length === 0) return []

  const fillers: { member: number; content: string; minutesAgo: number }[] = []

  active.forEach((sig, idx) => {
    const pair = sig.pair
    const dir = sig.direction
    const entry = sig.entry
    const emoji = dir === 'BUY' ? '🟢' : '🔴'
    const dirWord = dir === 'BUY' ? 'bullish' : 'bearish'

    fillers.push(
      { member: 5, content: `${emoji} New signal just dropped: ${pair} ${dir} @ ${entry}. The institutional flow is clear on this one. Let's see how price reacts to the zone.`, minutesAgo: 15 - idx * 3 },
      { member: 7, content: `${pair} setup looks solid. The ${sig.timeframe} structure is ${dirWord} and we've got confluence with the liquidity sweep. Managing risk with 3 TPs as always 🎯`, minutesAgo: 13 - idx * 3 },
      { member: 3, content: `Already in on ${pair}! Entry was clean. SL at ${sig.sl} gives us enough room. Let's ride this one out 🏄‍♂️`, minutesAgo: 11 - idx * 3 },
    )

    if (sig.tp1_hit) {
      fillers.push(
        { member: 9, content: `🎯 TP1 HIT on ${pair}! SL moved to breakeven. Risk-free from here. This is why we trust the system.`, minutesAgo: 8 - idx * 3 },
        { member: 0, content: `Beautiful! Zero risk now. Let runners ride for TP2 and TP3. Institutional precision 💎`, minutesAgo: 7 - idx * 3 },
      )
    }

    if (sig.confluence) {
      fillers.push(
        { member: 1, content: `The confluence on ${pair} is strong: "${sig.confluence}". This is exactly the kind of A+ setup we wait for.`, minutesAgo: 10 - idx * 3 },
      )
    }
  })

  // Add some recent general chatter
  fillers.push(
    { member: 8, content: "The signal automation is insane. Got the Telegram notification, checked the Chart AI tab, everything was already mapped. Copy trading in 2026 is different 🚀", minutesAgo: 5 },
    { member: 4, content: "End of session approaching. Remember: secure profits, review your journal, prepare for tomorrow.\n\n🧘 Discipline is the edge.", minutesAgo: 2 },
    { member: 5, content: "Great session everyone. The ecosystem performed flawlessly today. Stay sharp, stay zen. 🔥", minutesAgo: 1 },
  )

  return fillers
}

export function CommunityTab() {
  const { user, profile } = useAuth()
  const { signals } = useSignals()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [dailyNews, setDailyNews] = useState<any[]>([])
  const [dbHasMessages, setDbHasMessages] = useState(false)
  const [activeChannel, setActiveChannel] = useState<'general-chat' | 'setups-and-charts' | 'vip-lounge'>('general-chat')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Generate filler messages only for general-chat
  const fillerMessages = useMemo(() => {
    if (activeChannel !== 'general-chat' || dbHasMessages) return []

    const now = new Date()
    const allFillers = [...STATIC_FILLER, ...generateSignalFillers(signals)]
    allFillers.sort((a, b) => b.minutesAgo - a.minutesAgo)

    return allFillers.map((f, i) => {
      const member = COMMUNITY_MEMBERS[f.member % COMMUNITY_MEMBERS.length]
      const time = new Date(now.getTime() - f.minutesAgo * 60000)
      return {
        id: `filler-${i}`,
        user_id: `filler-user-${f.member}`,
        content: f.content,
        created_at: time.toISOString(),
        user_data: {
          full_name: member.name,
          is_vip: member.is_vip,
        },
      } as Message
    })
  }, [signals, activeChannel, dbHasMessages])

  // ─── Fetch Daily News ───
  useEffect(() => {
    const fetchNews = async () => {
      const { data } = await supabase
        .from('market_news')
        .select('*')
        .eq('event_date', new Date().toISOString().split('T')[0])
        .order('event_time', { ascending: true })
      
      if (data) setDailyNews(data)
    }
    fetchNews()
  }, [])

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("community_messages")
        .select(`*, user_data:client_trading_profiles(full_name, is_vip)`)
        .eq('channel', activeChannel)
        .order("created_at", { ascending: true })
        .limit(100)

      if (!error && data && data.length > 0) {
        setMessages(data as any)
        setDbHasMessages(true)
      } else {
        setDbHasMessages(false)
      }
      setLoading(false)
    }

    const isLoungeRestricted = activeChannel === 'vip-lounge' && (profile?.plan !== 'VIP' && profile?.plan !== 'Lifetime')

    if (isLoungeRestricted) {
       setMessages([])
       setDbHasMessages(false)
       setLoading(false)
       return
    }

    fetchMessages()

    const channelSubscription = supabase
      .channel(`public:community_messages:${activeChannel}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "community_messages", filter: `channel=eq.${activeChannel}` },
        (payload) => {
          supabase.from("client_trading_profiles").select("full_name, is_vip").eq("id", payload.new.user_id).single()
            .then(({ data }) => {
                const newMsg = { ...payload.new, user_data: data }
                setMessages((prev) => [...prev, newMsg as any])
                setDbHasMessages(true)
            })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channelSubscription)
    }
  }, [activeChannel])

  const displayMessages = dbHasMessages ? messages : fillerMessages

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" })
  }, [displayMessages])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!newMessage.trim() && !selectedFile) || !user) return

    setIsUploading(true)
    let imageUrl = null

    try {
        if (selectedFile) {
            const fileName = `${user.id}/${crypto.randomUUID()}.jpg`
            const { data, error: uploadError } = await supabase.storage
                .from('charts')
                .upload(fileName, selectedFile)
            
            if (data) {
                const { data: { publicUrl } } = supabase.storage.from('charts').getPublicUrl(fileName)
                imageUrl = publicUrl
            }
        }

        const { error } = await supabase.from("community_messages").insert({
          user_id: user.id,
          content: newMessage.trim(),
          image: imageUrl,
          channel: activeChannel
        })

        if (!error) {
          setNewMessage("")
          setSelectedFile(null)
          setPreviewUrl(null)
        }
    } catch (err) {
        console.error("Chat upload error:", err)
    } finally {
        setIsUploading(false)
    }
  }

  return (
    <div className="w-full flex-1 min-h-0 text-[var(--foreground)] font-[family-name:var(--font-outfit)] flex gap-0 overflow-hidden bg-[var(--background)]">
      {/* ─── Left Sidebar (Channels + Members) ─── */}
      <div className="hidden md:flex flex-col w-60 bg-[var(--card-bg)] border-r border-[var(--border-color)] flex-shrink-0">
        {/* Sidebar Header */}
        <div className="p-5 border-b border-[var(--border-color)] flex items-center gap-2">
            <Users className="w-5 h-5 text-[var(--color-info)]" />
            <h2 className="font-bold tracking-tighter text-base uppercase">Community</h2>
        </div>

        {/* Channels */}
        <div className="p-4 space-y-5 border-b border-[var(--border-color)]">
            <div className="space-y-1.5">
                <h3 className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest px-2 mb-2">Public Channels</h3>
                <button 
                  onClick={() => setActiveChannel('general-chat')}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl font-medium text-sm transition-colors ${activeChannel === 'general-chat' ? 'bg-[var(--panel-bg)] text-[var(--foreground)] border border-[var(--border-color)]' : 'text-[var(--text-muted)] hover:bg-white/[0.02] hover:text-gray-200'}`}
                >
                    <Hash className="w-4 h-4 text-[var(--text-muted)]" /> general-chat
                </button>
                <button 
                  onClick={() => setActiveChannel('setups-and-charts')}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl font-medium text-sm transition-colors ${activeChannel === 'setups-and-charts' ? 'bg-[var(--panel-bg)] text-[var(--foreground)] border border-[var(--border-color)]' : 'text-[var(--text-muted)] hover:bg-white/[0.02] hover:text-gray-200'}`}
                >
                    <Hash className="w-4 h-4 text-[var(--text-muted)]" /> setups-and-charts
                </button>
            </div>
            
                <button 
                  onClick={() => {
                    const isPremium = profile?.is_vip && profile?.plan !== 'Trial';
                    if (isPremium) {
                      setActiveChannel('vip-lounge');
                    } else {
                      alert("💎 PREMIUM EXCLUSIVE: Upgrade your plan to enter the VIP Lounge. (Not available for Free Trials)");
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium text-sm transition-all ${
                    activeChannel === 'vip-lounge' 
                      ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' 
                      : 'text-yellow-500/80 hover:bg-yellow-500/10 border border-yellow-500/10'
                  }`}
                >
                    <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4" /> vip-lounge
                    </div>
                    {!(profile?.is_vip && profile?.plan !== 'Trial') && <Lock className="w-3 h-3 opacity-50" />}
                </button>
        </div>

        {/* Online Members — scrollable */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <h3 className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest px-2 mb-3">Online — {COMMUNITY_MEMBERS.length}</h3>
            <div className="space-y-1">
                {COMMUNITY_MEMBERS.map((m, i) => (
                    <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.02] transition-colors">
                        <div className="relative">
                            <div className="w-7 h-7 rounded-full bg-[var(--panel-bg)] text-[var(--foreground)] border border-[var(--border-color)] flex items-center justify-center text-[9px] font-bold shadow-sm">
                                {m.initials}
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[var(--background)]" />
                        </div>
                        <span className={`text-xs ${m.is_vip ? 'text-yellow-500' : 'text-[var(--text-muted)]'}`}>{m.name}</span>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* ─── Main Chat Area ─── */}
      <div className="flex-1 bg-[var(--background)] flex flex-col overflow-hidden">
        {/* Channel Header */}
        <div className="px-5 py-3 border-b border-[var(--border-color)] bg-[var(--panel-bg)] flex items-center justify-between flex-shrink-0">
            <div>
                <h1 className="text-lg font-bold flex items-center gap-2">
                    <Hash className="w-5 h-5 text-[var(--text-muted)]" /> {activeChannel}
                </h1>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  {activeChannel === 'setups-and-charts' 
                    ? 'Institutional setups and technical analysis.' 
                    : 'Discuss setups, trading concepts, and interact with the institutional flow.'}
                </p>
            </div>
            <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-[var(--border-color)]">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{COMMUNITY_MEMBERS.length} Online</span>
            </div>
        </div>

        {/* Messages — only this scrolls */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
            {loading ? (
                <div className="flex items-center justify-center h-full">
                    <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                </div>
            ) : displayMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
                    <MessageSquare className="w-16 h-16 text-[var(--text-muted)]" />
                    <p className="text-[var(--text-muted)] max-w-sm text-sm">
                        {activeChannel === 'setups-and-charts' 
                            ? "Waiting for institutional chart analysis. Broadcast your signals here."
                            : "Welcome to the beginning of the general chat. Share your setups below."
                        }
                    </p>
                </div>
            ) : (
                <div className={`space-y-4 ${activeChannel === 'setups-and-charts' ? 'max-w-4xl mx-auto pb-12' : ''}`}>
                {/* ─── Community Rules (Only in General Chat) ─── */}
                {activeChannel === 'general-chat' && (
                  <div className="bg-[var(--panel-bg)] p-6 rounded-3xl border border-[var(--border-color)] mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <Shield className="w-5 h-5 text-yellow-500" />
                      <h2 className="font-bold text-sm uppercase tracking-widest bg-gradient-to-r from-yellow-500 to-yellow-200 bg-clip-text text-transparent">Group Rules & Regulations</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {COMMUNITY_RULES.map((rule, idx) => (
                        <div key={idx} className="flex gap-2 text-[11px] text-[var(--text-muted)] leading-relaxed group">
                          <span className="text-yellow-500/50 font-mono">0{idx + 1}</span>
                          <span className="group-hover:text-gray-300 transition-colors">{rule}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ─── VIP Lounge Empty State ─── */}
                {activeChannel === 'vip-lounge' && messages.length === 0 && (
                   <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 bg-yellow-500/5 rounded-3xl border border-yellow-500/10">
                      <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                          <Hash className="w-8 h-8 text-yellow-500" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-bold text-yellow-500">Welcome to the VIP Lounge</h3>
                        <p className="text-[var(--text-muted)] max-w-sm text-xs leading-relaxed">
                          This is an exclusive space for direct interaction with the Zen Pips team. Secure, institutional-grade discussions only.
                        </p>
                      </div>
                   </div>
                )}

                {displayMessages.map((msg, i) => {
                    const isSystem = !msg.user_id;
                    const isOfficial = msg.user_id === 'zen-official';
                    const initials = msg.user_data?.full_name?.substring(0,2)?.toUpperCase() || "ZP";
                    const isChartChannel = activeChannel === 'setups-and-charts';
                    
                    return (
                        <motion.div 
                            key={msg.id || i} 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={`flex gap-4 ${isSystem ? 'justify-center py-4' : ''} ${isChartChannel ? 'bg-[var(--card-bg)] p-6 rounded-3xl border border-[var(--border-color)]' : ''} group`}
                        >
                            {!isSystem && !isChartChannel && (
                                <div className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center bg-[var(--panel-bg)] border border-[var(--border-color)] text-[10px] font-bold shadow-md`}>
                                    {initials}
                                </div>
                            )}
                            <div className={`flex-1 space-y-2 ${isSystem ? 'text-center' : ''}`}>
                                {!isSystem && (
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <div className="flex items-center gap-2">
                                            {isChartChannel && (
                                                 <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-[var(--panel-bg)] border border-[var(--border-color)] text-[9px] font-bold`}>
                                                    {initials}
                                                </div>
                                            )}
                                            <span className={`font-bold text-sm ${msg.user_data?.is_vip || isOfficial ? 'text-yellow-500' : 'text-gray-200'}`}>
                                                {isOfficial ? "Zen Institutional Hub" : (msg.user_data?.full_name || "Anonymous Trader")}
                                            </span>
                                            {(msg.user_data?.is_vip || isOfficial) && (
                                                <span className="text-[8px] bg-yellow-500/10 text-yellow-500 px-1.5 py-0.5 rounded border border-yellow-500/20 font-bold uppercase tracking-wider">OFFICIAL</span>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-[var(--text-muted)] font-mono">
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                )}
                                <div className={`text-sm leading-relaxed whitespace-pre-line ${isSystem ? 'bg-blue-500/10 text-[var(--color-info)] px-4 py-2 rounded-xl text-xs font-mono font-bold border border-blue-500/20 inline-block mx-auto' : 'text-[var(--foreground)]'}`}>
                                    {msg.content}
                                    {msg.image && (
                                        <div className={`mt-4 rounded-2xl overflow-hidden border border-[var(--border-color)] shadow-2xl bg-black ${isChartChannel ? 'aspect-video w-full' : 'max-w-2xl'}`}>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={msg.image} alt="Institutional Chart Analysis" className="w-full h-full object-contain hover:scale-[1.01] transition-transform duration-500" />
                                        </div>
                                    )}
                                </div>
                                {isChartChannel && !isSystem && (
                                     <div className="pt-4 flex items-center gap-4 border-t border-[var(--border-color)] mt-4">
                                        <button className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-muted)] hover:text-yellow-500 transition-colors uppercase tracking-widest">
                                            <Shield className="w-3 h-3" /> VERIFIED SETUP
                                        </button>
                                        <button className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-muted)] hover:text-blue-400 transition-colors uppercase tracking-widest">
                                            <Clock className="w-3 h-3" /> {new Date(msg.created_at).toLocaleDateString()}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )
                })}
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="px-4 py-3 bg-[var(--card-bg)] border-t border-[var(--border-color)] flex-shrink-0">
            {previewUrl && (
                <div className="mb-3 relative group w-fit">
                    <img src={previewUrl} alt="Preview" className="h-20 w-auto rounded-xl border border-[var(--border-color)] object-cover" />
                    <button 
                        onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            )}
            <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
                <div className="relative flex-1">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={`Message #${activeChannel}...`}
                        className="w-full bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-2xl pl-5 pr-14 py-3.5 text-sm focus:border-white/30 focus:bg-[var(--background)] transition-colors outline-none text-[var(--foreground)] placeholder-gray-500"
                        disabled={!user || isUploading}
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute right-12 top-1/2 -translate-y-1/2 p-2 text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
                        disabled={!user || isUploading}
                    >
                        <ImageIcon className="w-4 h-4" />
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
                    
                    <button
                        type="submit"
                        disabled={(!newMessage.trim() && !selectedFile) || !user || isUploading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-white/10 hover:bg-white/20 text-[var(--foreground)] rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                </div>
            </form>
            {!user && (
                <p className="text-[10px] text-center text-[var(--text-muted)] mt-2 font-bold uppercase tracking-widest">
                    Log in to join the conversation
                </p>
            )}
        </div>
      </div>
    </div>
  )
}

function ImageIcon(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path></svg>
}

function X(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
}

function Loader2(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`animate-spin ${props.className || ''}`}><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
}

function Lock(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
}
