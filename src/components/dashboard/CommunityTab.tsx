"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { motion } from "framer-motion"
import { Send, Users, Shield, Clock, Search, Hash, MessageSquare, Heart, Share2, Download, CornerUpLeft, Smile, Trash2, CheckCircle2 } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { supabase } from "@/lib/supabase"
import { useSignals } from "@/hooks/useSignals"

interface Reaction {
  emoji: string
  count: number
  user_reacted: boolean
}

interface Message {
  id: string
  user_id: string
  content: string
  created_at: string
  user_data?: {
    full_name: string
    is_vip: boolean
    is_admin?: boolean
  }
  image?: string
  parent_id?: string
  reactions?: Reaction[]
  replies?: Message[]
}

const TRADING_EMOJIS = [
  "🚀", "🔥", "❤️", "💯", "🎉", "💰", "💵", "💹", "📊", "📈", 
  "📉", "💎", "🎯", "🏦", "🌍", "🇺🇸", "🇪🇺", "🇬🇧", "🇯🇵", "₿", 
  "🐂", "🐻", "⏳", "✅", "🚨"
]

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
  // ─── Tokyo Session (00:00 - 09:00 UTC / Early AM) ───
  { member: 5, content: "GM legends 🔥 Tokyo session is opening. Let's see what Asia gives us today. Eyes on Silver and Gold for early displacement.", minutesAgo: 240 },
  { member: 2, content: "XAG/USD already showing weakness in Tokyo. That sell signal at 75.36 is looking validated — price swept the Asian high and dumped. TP1 at 73.94 is within range.", minutesAgo: 225 },
  { member: 0, content: "Agreed. Silver did exactly what the markup showed. The liquidity grab above 76.00 was the manipulation leg. Now we're in distribution.", minutesAgo: 220 },
  { member: 7, content: "For newer members: Tokyo session typically sets up the liquidity pools. Smart money uses this low-volume window to position before London's displacement. The Vault PDF on 'Sessions & Killzones' covers this in depth 📚", minutesAgo: 210 },
  { member: 11, content: "Thank you! I was wondering why some signals are placed during quiet hours. Makes sense now — they're positioning ahead of the move.", minutesAgo: 205 },
  { member: 9, content: "XAU/USD sell limit at 4736.41 is still pending. Gold is consolidating in a tight range during Tokyo. London should provide the sweep into our entry zone.", minutesAgo: 195 },
  { member: 3, content: "DXY is holding strong in the Asian session. If dollar stays bid, we could see metals continue lower. The sell bias on Gold and Silver aligns with this.", minutesAgo: 185 },

  // ─── London Session Transition (07:00 - 12:00 UTC) ───
  { member: 4, content: "🏦 London opens in 30 minutes. This is where the real volume kicks in.\n\n🧘 \"Patience is profitable. Impulsiveness is expensive.\"", minutesAgo: 160 },
  { member: 6, content: "GBP/USD sell limit at 1.3385 — London session is the optimal killzone for Cable. Watching for a liquidity sweep above yesterday's high before entering.", minutesAgo: 150 },
  { member: 0, content: "London open just displaced Gold to the upside. If it taps into the supply zone at 4736, our sell limit triggers. This is AMD textbook setup — Accumulation (Tokyo), Manipulation (London sweep), Distribution (the sell).", minutesAgo: 140 },
  { member: 7, content: "EUR/USD sell at 1.1652 is our London-NY overlap play. Euro pairs move hardest during the overlap between 12:00-15:00 UTC. That's when we expect the entry to activate.", minutesAgo: 130 },
  { member: 1, content: "Pro tip for new members: Don't trade every setup you see. Quality > Quantity.\n\nI used to take 10+ trades a day. Now I take 1-2 and my win rate went from 40% to 78%.", minutesAgo: 118 },
  { member: 10, content: "What risk % are you guys running per trade? I've been doing 2% but the drawdowns feel heavy on metals", minutesAgo: 105 },
  { member: 7, content: "1% max per idea. Remember you're splitting across 3 TPs so it's 0.33% per order. The compounding over time is what makes the difference, not individual trade size.", minutesAgo: 102 },
  { member: 5, content: "☝️ This is the way. Consistency beats intensity every single time. Our system proves it — check the performance tab.", minutesAgo: 98 },
  { member: 8, content: "Just joined this week and I'm blown away by the Vault resources. The CRT Method PDF changed my whole perspective on candle reading.", minutesAgo: 85 },

  // ─── New York Session & Live Trade Updates ───
  { member: 3, content: "🇺🇸 New York session is live. This is where the big money moves happen. All pending orders should be sharp. No chasing.", minutesAgo: 65 },
  { member: 5, content: "🚨 XAG/USD TP1 HIT at 73.94! 🎯 SL moved to breakeven. Running for TP2 at 72.52. Silver is printing money today.", minutesAgo: 50 },
  { member: 0, content: "Beautiful execution on Silver. Risk-free from here. Let the runners ride for TP2 and TP3. Institutional precision 💎", minutesAgo: 47 },
  { member: 9, content: "GBP/USD entry zone approaching. London set the manipulation high, NY should deliver the distribution leg. Patience.", minutesAgo: 40 },
  { member: 6, content: "The M15 break of structure on EUR/USD was clean. The FVG at 1.1660 got respected. If we get entry, TP1 at 1.1615 is the first target.", minutesAgo: 30 },
  { member: 0, content: "That's exactly what the signal system caught. The automation is unreal — entry hit, SL placed, 3 TPs mapped. All hands-free. 🤖", minutesAgo: 25 },
  { member: 4, content: "\"The market is a device for transferring money from the impatient to the patient.\"\n— Warren Buffett\n\n🧠 Stay disciplined. We close the day at 01:00 UTC.", minutesAgo: 18 },
  { member: 7, content: "Sitting tight on Gold. Sell limit at 4736.41 hasn't triggered yet — that's fine. HTF bearish FVG rejection is the target. We don't chase, we wait.", minutesAgo: 12 },
  { member: 5, content: "Great session everyone. Tokyo gave us the setup, London provided displacement, and NY is delivering the results. Stay sharp, stay zen. 🔥", minutesAgo: 5 },
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
  const [activeChannel, setActiveChannel] = useState<'general-chat' | 'setups-and-charts' | 'market-news' | 'vip-lounge'>('general-chat')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null) // Message ID
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
        .select(`*, user_data:client_trading_profiles(full_name, is_vip, is_admin), reactions:community_reactions(*)`)
        .eq('channel', activeChannel)
        .order("created_at", { ascending: true })
        .limit(100)

      if (!error && data) {
        // Group reactions and thread replies
        const formatted = data.map((msg: any) => ({
          ...msg,
          reactions: formatReactions(msg.reactions || [], user?.id)
        }))
        
        // Simple threading: nested within list if parent_id exists
        setMessages(formatted as any)
        setDbHasMessages(data.length > 0)
      }
      setLoading(false)
    }

    const formatReactions = (raw: any[], currentUserId?: string) => {
      const groups: Record<string, { count: number; user_reacted: boolean }> = {}
      raw.forEach(r => {
        if (!groups[r.emoji]) groups[r.emoji] = { count: 0, user_reacted: false }
        groups[r.emoji].count++
        if (r.user_id === currentUserId) groups[r.emoji].user_reacted = true
      })
      return Object.entries(groups).map(([emoji, data]) => ({ emoji, ...data }))
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
        (payload: any) => {
          supabase.from("client_trading_profiles").select("full_name, is_vip").eq("id", payload.new.user_id).single()
            .then(({ data }: any) => {
                const newMsg = { ...payload.new, user_data: data }
                setMessages((prev) => [...prev, newMsg as any])
                setDbHasMessages(true)
            })
        }
      )
      .subscribe()

    const reactionSubscription = supabase
      .channel(`public:community_reactions:${activeChannel}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "community_reactions" },
        () => {
          fetchMessages()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channelSubscription)
      supabase.removeChannel(reactionSubscription)
    }
  }, [activeChannel, user])

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

        // Logic for auto-routing to setups-and-charts
        let targetChannel = activeChannel
        const isAdmin = profile?.is_admin
        const isSignal = newMessage.toUpperCase().includes("SIGNAL") || newMessage.toUpperCase().includes("SETUP")
        
        if (selectedFile && isAdmin && isSignal && activeChannel === 'general-chat') {
            targetChannel = 'setups-and-charts'
        }

        const { error } = await supabase.from("community_messages").insert({
          user_id: user.id,
          content: newMessage.trim(),
          image: imageUrl,
          channel: targetChannel,
          parent_id: replyTo?.id || null
        })

        if (!error) {
          setNewMessage("")
          setSelectedFile(null)
          setPreviewUrl(null)
          setReplyTo(null)
        }
    } catch (err) {
        console.error("Chat upload error:", err)
    } finally {
        setIsUploading(false)
    }
  }

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!user) return
    
    // Check if reacted already
    const msg = messages.find(m => m.id === messageId)
    const existing = msg?.reactions?.find(r => r.emoji === emoji && r.user_reacted)

    if (existing) {
        // Remove reaction
        await supabase.from('community_reactions').delete().match({ message_id: messageId, user_id: user.id, emoji })
    } else {
        // Add reaction
        await supabase.from('community_reactions').insert({ message_id: messageId, user_id: user.id, emoji })
    }
  }

  const downloadImage = (url: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = `zenpips-chart-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const shareContent = async (msg: Message) => {
    const shareData = {
        title: 'Zen Pips Trade Setup',
        text: msg.content,
        url: msg.image || window.location.href
    }
    
    try {
        if (navigator.share) {
            await navigator.share(shareData)
        } else {
            await navigator.clipboard.writeText(msg.image || window.location.href)
            alert("Link copied to clipboard!")
        }
    } catch (err) {
        console.error("Share failed:", err)
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
                <button 
                  onClick={() => setActiveChannel('market-news')}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl font-medium text-sm transition-colors ${activeChannel === 'market-news' ? 'bg-[var(--panel-bg)] text-[var(--foreground)] border border-[var(--border-color)]' : 'text-[var(--text-muted)] hover:bg-white/[0.02] hover:text-gray-200'}`}
                >
                    <Hash className="w-4 h-4 text-[var(--text-muted)]" /> market-news
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
      <div className="flex-1 bg-[var(--background)] flex flex-col overflow-hidden w-full relative">
        {/* Mobile Channel Switcher */}
        <div className="md:hidden flex overflow-x-auto border-b border-[var(--border-color)] bg-[var(--panel-bg)] hide-scrollbar shrink-0">
            {['general-chat', 'setups-and-charts', 'market-news', 'vip-lounge'].map((ch: string) => (
                <button
                    key={ch}
                    onClick={() => {
                        if (ch === 'vip-lounge') {
                            const isPremium = profile?.is_vip && profile?.plan !== 'Trial';
                            if (isPremium) {
                                setActiveChannel('vip-lounge');
                            } else {
                                alert("💎 PREMIUM EXCLUSIVE: Upgrade your plan to enter the VIP Lounge. (Not available for Free Trials)");
                            }
                        } else {
                            setActiveChannel(ch as any);
                        }
                    }}
                    className={`px-4 py-3 text-[10px] sm:text-xs font-bold whitespace-nowrap border-b-2 flex items-center gap-1.5 transition-colors ${activeChannel === ch ? 'border-yellow-500 text-yellow-500 bg-yellow-500/5' : 'border-transparent text-[var(--text-muted)]'}`}
                >
                    <Hash className="w-3 h-3" />
                    {ch.replace(/-/g, ' ').toUpperCase()}
                    {ch === 'vip-lounge' && !(profile?.is_vip && profile?.plan !== 'Trial') && <Lock className="w-2.5 h-2.5 ml-1" />}
                </button>
            ))}
        </div>
        {/* Channel Header (Hidden on small mobile if needed, or kept) */}
        <div className="hidden sm:flex px-5 py-3 border-b border-[var(--border-color)] bg-[var(--panel-bg)] items-center justify-between flex-shrink-0">
            <div>
                <h1 className="text-base sm:text-lg font-bold flex items-center gap-2 font-[family-name:var(--font-outfit)]">
                    <Hash className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--text-muted)]" /> {activeChannel}
                </h1>
                <p className="text-[10px] sm:text-[11px] text-[var(--text-muted)] mt-0.5">
                  {activeChannel === 'setups-and-charts' 
                    ? 'Institutional setups and technical analysis.' 
                    : activeChannel === 'market-news'
                    ? 'AI analysis of institutional liquidity traps, stop hunts, and high-impact events.'
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
                      <div className="space-y-4 max-w-lg">
                        <h3 className="text-xl font-black text-yellow-500 tracking-tight uppercase">VIP Lounge <span className="text-white opacity-80">(Coming Soon)</span></h3>
                        <p className="text-[var(--text-muted)] text-sm leading-relaxed">
                          This is an exclusive space for direct interaction with the Zen Pips team. Secure, institutional-grade discussions only.
                        </p>
                        <div className="bg-black/40 border border-yellow-500/20 rounded-2xl p-6 text-left mt-4">
                            <h4 className="text-xs font-bold text-yellow-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Shield className="w-4 h-4" /> Upcoming Features
                            </h4>
                            <ul className="space-y-3 text-xs text-gray-300">
                                <li className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1" />
                                    <span><strong>Direct Mentorship:</strong> 1-on-1 access to institutional traders and developers.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1" />
                                    <span><strong>Alpha Scanners:</strong> Early access to our proprietary liquidity void and stop-hunt detection bots.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1" />
                                    <span><strong>Advanced Vault Content:</strong> Exclusive PDF teardowns of high-impact news days and market maker traps.</span>
                                </li>
                            </ul>
                        </div>
                      </div>
                   </div>
                )}

                {displayMessages.filter(msg => !msg.parent_id).map((msg, i) => {
                    const isSystem = !msg.user_id && !msg.content.startsWith('**');
                    const isPersona = !msg.user_id && msg.content.startsWith('**');
                    let personaName = 'AI Agent';
                    let renderContent = msg.content;
                    
                    if (isPersona) {
                        const split = msg.content.split('**:');
                        if (split.length > 1) {
                            personaName = split[0].replace('**', '').trim();
                            renderContent = split.slice(1).join('**:').trim();
                        }
                    }

                    const isOfficial = msg.user_id === 'zen-official' || isPersona;
                    const initials = isPersona ? personaName.substring(0, 2).toUpperCase() : (msg.user_data?.full_name?.substring(0,2)?.toUpperCase() || "ZP");
                    const isChartChannel = activeChannel === 'setups-and-charts';
                    const replies = messages.filter(m => m.parent_id === msg.id);
                    
                    return (
                        <div key={msg.id || i} className="space-y-4">
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className={`flex gap-4 ${isSystem ? 'justify-center py-4' : ''} ${isChartChannel ? 'bg-[var(--card-bg)] p-6 rounded-3xl border border-[var(--border-color)]' : ''} group relative`}
                            >
                                {!isSystem && !isChartChannel && (
                                    <div className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center bg-[var(--panel-bg)] ${isPersona ? 'border-yellow-500/50 text-yellow-500' : 'border-[var(--border-color)] text-[var(--foreground)]'} text-[10px] font-bold shadow-md`}>
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
                                                    {isPersona ? personaName : isOfficial ? "Zen Institutional Hub" : (msg.user_data?.full_name || "Anonymous Trader")}
                                                </span>
                                                {(msg.user_data?.is_vip || isOfficial) && (
                                                    <span className="text-[8px] bg-yellow-500/10 text-yellow-500 px-1.5 py-0.5 rounded border border-yellow-500/20 font-bold uppercase tracking-wider">{isPersona ? 'AI AGENT' : 'OFFICIAL'}</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] text-[var(--text-muted)] font-mono">
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    <div className={`leading-relaxed whitespace-pre-line relative ${isSystem ? 'bg-blue-500/10 text-[var(--color-info)] px-4 py-2 rounded-xl text-xs font-mono font-bold border border-blue-500/20 inline-block mx-auto' : 'text-[var(--foreground)]'}`}>
                                        <div className="max-h-32 sm:max-h-48 overflow-y-auto custom-scrollbar pr-2 mb-2 text-xs sm:text-sm">
                                            {renderContent}
                                        </div>
                                        {msg.image && (
                                            <div className={`mt-2 rounded-2xl overflow-hidden border border-[var(--border-color)] shadow-2xl bg-black group/img relative ${isChartChannel ? 'aspect-video w-full' : 'max-w-2xl'}`}>
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={msg.image} alt="Institutional Chart Analysis" className="w-full h-full object-contain hover:scale-[1.01] transition-transform duration-500" />
                                                
                                                {/* Image specific tools */}
                                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover/img:opacity-100 transition-opacity">
                                                    <button onClick={() => downloadImage(msg.image!)} className="p-2 bg-black/60 rounded-xl border border-white/10 text-white hover:bg-white/20 transition-colors">
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => shareContent(msg)} className="p-2 bg-black/60 rounded-xl border border-white/10 text-white hover:bg-white/20 transition-colors">
                                                        <Share2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Action Bar (Hover only for non-system) */}
                                        {!isSystem && (
                                            <div className="absolute -top-10 right-0 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl py-1 px-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shadow-xl z-20">
                                                <button onClick={() => setReplyTo(msg)} className="p-2 hover:bg-white/5 rounded-lg text-[var(--text-muted)] hover:text-white" title="Reply">
                                                    <CornerUpLeft className="w-4 h-4" />
                                                </button>
                                                <div className="relative">
                                                    <button onClick={() => setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)} className="p-2 hover:bg-white/5 rounded-lg text-[var(--text-muted)] hover:text-yellow-500" title="React">
                                                        <Smile className="w-4 h-4" />
                                                    </button>
                                                    {showEmojiPicker === msg.id && (
                                                        <div className="absolute right-0 top-full mt-2 w-48 p-2 bg-[var(--background)] border border-[var(--border-color)] rounded-2xl shadow-2xl z-50 grid grid-cols-5 gap-1 max-h-40 overflow-y-auto custom-scrollbar">
                                                            {TRADING_EMOJIS.map((emoji: string) => (
                                                                <button key={emoji} onClick={() => { handleReaction(msg.id, emoji); setShowEmojiPicker(null); }} className="p-1.5 hover:bg-white/10 rounded-lg text-lg transition-colors">
                                                                    {emoji}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <button onClick={() => shareContent(msg)} className="p-2 hover:bg-white/5 rounded-lg text-[var(--text-muted)] hover:text-blue-400" title="Share">
                                                    <Share2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Real Reactions Display */}
                                    {msg.reactions && msg.reactions.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                            {msg.reactions.map((r: any) => (
                                                <button 
                                                    key={r.emoji} 
                                                    onClick={() => handleReaction(msg.id, r.emoji)}
                                                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold transition-all border ${r.user_reacted ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-500' : 'bg-white/5 border-white/5 text-[var(--text-muted)] hover:border-white/20'}`}
                                                >
                                                    <span>{r.emoji}</span>
                                                    <span>{r.count}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {isChartChannel && !isSystem && (
                                         <div className="pt-4 flex items-center gap-4 border-t border-[var(--border-color)] mt-4">
                                            <button className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-muted)] hover:text-yellow-500 transition-colors uppercase tracking-widest">
                                                <CheckCircle2 className="w-3 h-3 text-green-500" /> VERIFIED SETUP
                                            </button>
                                            <button className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-muted)] hover:text-blue-400 transition-colors uppercase tracking-widest">
                                                <Clock className="w-3 h-3" /> {new Date(msg.created_at).toLocaleDateString()}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>

                            {/* Render Replies */}
                            {replies.length > 0 && (
                                <div className="ml-12 space-y-4 border-l-2 border-[var(--border-color)] pl-6">
                                    {replies.map((reply: any) => (
                                        <div key={reply.id} className="flex gap-3 text-sm">
                                            <div className="w-6 h-6 rounded-full bg-[var(--panel-bg)] border border-[var(--border-color)] flex items-center justify-center text-[8px] font-bold shrink-0">
                                                {reply.user_data?.full_name?.substring(0,2).toUpperCase()}
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-xs text-gray-200">{reply.user_data?.full_name}</span>
                                                    <span className="text-[9px] text-[var(--text-muted)]">{new Date(reply.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <p className="text-[var(--text-muted)] text-xs">{reply.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                })}
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Reply Bar */}
        {replyTo && (
            <div className="mb-2 px-4 py-2 bg-[var(--panel-bg)] border-l-4 border-yellow-500 flex items-center justify-between rounded-r-xl">
                <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-500">Replying to {replyTo.user_data?.full_name}</span>
                    <span className="text-xs text-[var(--text-muted)] truncate max-w-md">{replyTo.content}</span>
                </div>
                <button onClick={() => setReplyTo(null)} className="p-1 hover:bg-white/5 rounded-full">
                    <X className="w-4 h-4 text-[var(--text-muted)]" />
                </button>
            </div>
        )}

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
