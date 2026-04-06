"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import {
    BookOpen, Download, FileText, Lock, GraduationCap, ArrowLeft,
    Search, Filter, Video, Headphones, Star, ChevronDown, ExternalLink, Loader2,
    CheckCircle2, Trophy, Award, Medal, Play, X, BarChart3, TrendingUp, Terminal, Activity, Globe, Landmark, Shield, Zap
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import confetti from "canvas-confetti"

interface VaultResource {
    id: string
    title: string
    description: string
    type: "PDF" | "Video" | "Course" | "Audio"
    category: string
    level: "Foundation" | "Intermediate" | "Advanced"
    locked: boolean
    file_path?: string | null
    external_url?: string | null
    created_at: string
}

const LEVEL_COLORS: Record<string, string> = {
    Foundation: "text-[var(--color-info)] bg-blue-500/10 border-blue-500/20",
    Intermediate: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    Advanced: "text-purple-400 bg-purple-500/10 border-purple-500/20",
}

const TYPE_ICONS: Record<string, typeof FileText> = {
    PDF: FileText,
    Video: Video,
    Course: BookOpen,
    Audio: Headphones,
}

// Default resources (Premium content structure)
const DEFAULT_RESOURCES: VaultResource[] = [
    { id: "1", title: "SMC: Market Structure 101", description: "The foundation of Smart Money: BOS, CHoCH, and identifying true trend shifts.", type: "Video", category: "Smart Money Concepts", level: "Foundation", locked: false, file_path: null, external_url: "https://www.youtube.com/watch?v=xGFCIUFxsbw", created_at: "" },
    { id: "2", title: "ICT: Internal Liquidity Mastery", description: "Learn to identify buy-side and sell-side liquidity before the banks move.", type: "PDF", category: "ICT", level: "Foundation", locked: false, file_path: null, external_url: null, created_at: "" },
    { id: "3", title: "Risk Management & Psychology", description: "The mental edge: discipline, position sizing, and institutional emotional control.", type: "Video", category: "Psychology", level: "Foundation", locked: false, file_path: null, external_url: "https://www.youtube.com/watch?v=MGglyvc8d58", created_at: "" },
    { id: "4", title: "Advanced Institutional Orderflow", description: "Deep dive into Order Blocks, FVGs, and Breaker Block manipulation.", type: "PDF", category: "Strategy", level: "Intermediate", locked: true, file_path: null, external_url: null, created_at: "" },
    { id: "5", title: "Market Manipulation Cycles", description: "Identifying the AMD (Accumulation, Manipulation, Distribution) power of 3.", type: "Video", category: "Strategy", level: "Intermediate", locked: true, file_path: null, external_url: "https://www.youtube.com/watch?v=dIT4HTFYGGo", created_at: "" },
    { id: "6", title: "Elite ICT Mentorship: Core 2026", description: "Full breakdown of the 2026 institutional model and silver bullet strategies.", type: "Video", category: "ICT", level: "Advanced", locked: true, file_path: null, external_url: "https://www.youtube.com/watch?v=tRq1hyGGtl4", created_at: "" },
    { id: "8", title: "The Institutional Playbook (Final)", description: "The complete Zen Pips methodology from A to Z for advanced operators.", type: "PDF", category: "Strategy", level: "Advanced", locked: true, file_path: "ZenPips_Institutional_Guide.pdf", external_url: null, created_at: "" },
]

const ALL_CATEGORIES = ["All", "Smart Money Concepts", "ICT", "Strategy", "Psychology", "Live Sessions"]

interface VaultProps {
    onNavigate?: (tab: "journal" | "vault" | "profile" | "chartai" | "admin" | "help" | "community" | "innovation" | null) => void
}

export function VaultTab({ onNavigate }: VaultProps) {
    const { user, profile, loading: authLoading } = useAuth()
    const router = useRouter()
    const [resources, setResources] = useState<VaultResource[]>(DEFAULT_RESOURCES)
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [category, setCategory] = useState("All")
    const [level, setLevel] = useState("All")
    
    // Progress State
    const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
    const [awardedCerts, setAwardedCerts] = useState<Set<string>>(new Set())
    const [showCertModal, setShowCertModal] = useState<string | null>(null)
    const [selectedVideo, setSelectedVideo] = useState<string | null>(null)
    const [claimingCert, setClaimingCert] = useState(false)

    const fetchResources = useCallback(async () => {
        const { data, error } = await supabase
            .from("vault_resources")
            .select("*")
            .order("created_at", { ascending: true })

        if (!error && data && data.length > 0) {
            setResources(data as VaultResource[])
        }
        setLoading(false)
    }, [])

    const fetchProgress = useCallback(async () => {
        if (!user) return
        
        // 1. Fetch Completed Resources
        const { data: progress } = await supabase
            .from("user_vault_progress")
            .select("resource_id")
            .eq("user_id", user.id)
            
        if (progress) setCompletedIds(new Set(progress.map(p => p.resource_id)))
        
        // 2. Fetch Awarded Certificates
        const { data: certs } = await supabase
            .from("user_certificates")
            .select("level")
            .eq("user_id", user.id)
            
        if (certs) setAwardedCerts(new Set(certs.map(c => c.level)))
    }, [user])

    useEffect(() => {
        fetchResources()
        if (user) fetchProgress()
    }, [fetchResources, fetchProgress, user])

    const filtered = resources.filter(r => {
        const matchesSearch = !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase())
        const matchesCategory = category === "All" || r.category === category
        const matchesLevel = level === "All" || r.level === level
        return matchesSearch && matchesCategory && matchesLevel
    })

    const handleDownload = async (resource: VaultResource, isFinallyLocked: boolean) => {
        if (isFinallyLocked) return

        // ─── Mark as Completed ───
        if (user && !completedIds.has(resource.id)) {
            await supabase.from("user_vault_progress").upsert({
                user_id: user.id,
                resource_id: resource.id
            }, { onConflict: 'user_id,resource_id' })
            setCompletedIds(prev => new Set([...prev, resource.id]))
        }

        if (resource.external_url) {
            window.open(resource.external_url, "_blank")
            return
        }
        if (resource.file_path) {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
            const publicUrl = `${supabaseUrl}/storage/v1/object/public/education-vault/${encodeURIComponent(resource.file_path)}`
            window.open(publicUrl, "_blank")
        }
    }

    const claimCertificate = async (level: string) => {
        if (!user) return
        setClaimingCert(true)
        
        const { error } = await supabase.from("user_certificates").insert({
            user_id: user.id,
            level: level
        })
        
        if (!error) {
            setAwardedCerts(prev => new Set([...prev, level]))
            setShowCertModal(level)
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#EAB308', '#FFFFFF', '#000000']
            })
        }
        setClaimingCert(false)
    }

    // ─── Progress Calculations ───
    const getLevelStats = (l: string) => {
        const items = resources.filter(r => r.level === l)
        const completed = items.filter(r => completedIds.has(r.id)).length
        const total = items.length
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0
        return { completed, total, percent }
    }

    return (
        <div className="w-full text-[var(--foreground)] py-12 font-[family-name:var(--font-outfit)]">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-yellow-500 mb-2">
                            <GraduationCap className="w-6 h-6" />
                            <span className="text-sm font-bold uppercase tracking-widest">Education Hub</span>
                        </div>
                        <h1 className="text-4xl font-bold text-[var(--foreground)] uppercase tracking-tight">The Dominator Vault</h1>
                        <p className="text-[var(--text-muted)] mt-2">Institutional-grade education for the selected few.</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="bg-yellow-500/10 text-yellow-500 px-3 py-1.5 rounded-full border border-yellow-500/20 font-bold">
                            {resources.length} Institutional Resources
                        </span>
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search resources..."
                            className="w-full bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-xl pl-10 pr-4 py-3 text-sm focus:border-yellow-500/50 outline-none text-[var(--foreground)] placeholder-gray-500"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select value={category} onChange={(e) => setCategory(e.target.value)} className="bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm focus:border-yellow-500/50 outline-none text-[var(--foreground)]">
                            {ALL_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                        <select value={level} onChange={(e) => setLevel(e.target.value)} className="bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm focus:border-yellow-500/50 outline-none text-[var(--foreground)]">
                            <option>All</option>
                            <option value="Foundation">Beginner</option>
                            <option>Intermediate</option>
                            <option>Advanced</option>
                        </select>
                    </div>
                </div>

                {/* Resources Sections by Level */}
                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
                    </div>
                ) : (
                    <div className="space-y-12">
                        {["Foundation", "Intermediate", "Advanced"].map((lvl) => {
                            const levelResources = filtered.filter(r => r.level === lvl)
                            if (levelResources.length === 0 && level !== "All") return null
                            if (levelResources.length === 0 && level === "All") return null

                            const stats = getLevelStats(lvl)
                            const isCertsAwarded = awardedCerts.has(lvl)
                            const canClaim = stats.percent === 100 && !isCertsAwarded

                            return (
                                <div key={lvl} className="space-y-6">
                                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--border-color)] pb-4">
                                        <div className="space-y-1 flex-1">
                                            <div className="flex items-center gap-3">
                                                <h2 className="text-2xl font-bold">{lvl === 'Foundation' ? 'Beginner' : lvl} Mastery</h2>
                                                {isCertsAwarded && (
                                                    <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-yellow-500/20">
                                                        <Trophy className="w-3 h-3" /> Certified
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 w-full max-w-md">
                                                <div className="flex-1 h-1.5 bg-[var(--panel-bg)] rounded-full overflow-hidden">
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${stats.percent}%` }}
                                                        className={`h-full rounded-full ${lvl === 'Foundation' ? 'bg-blue-500' : lvl === 'Intermediate' ? 'bg-yellow-500' : 'bg-purple-500'}`}
                                                    />
                                                </div>
                                                <span className="text-xs font-bold text-[var(--text-muted)]">{stats.percent}%</span>
                                            </div>
                                        </div>
                                        
                                        {canClaim && (
                                            <button 
                                                onClick={() => claimCertificate(lvl)}
                                                className="bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-yellow-400 transition-all shadow-[0_0_20px_rgba(234,179,8,0.2)] animate-pulse"
                                            >
                                                <Award className="w-4 h-4" /> Claim Certificate
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {levelResources.map((resource, i) => {
                                            const TypeIcon = TYPE_ICONS[resource.type] || FileText
                                            const isVIP = profile?.is_vip || profile?.plan === 'VIP'
                                            const isFinallyLocked = !isVIP && (resource.level === 'Intermediate' || resource.level === 'Advanced')
                                            const isCompleted = completedIds.has(resource.id)

                                            return (
                                                <motion.div
                                                    key={resource.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    className={`group relative bg-[var(--panel-bg)] p-6 rounded-2xl border transition-all cursor-pointer overflow-hidden ${
                                                        isCompleted ? 'border-green-500/20' : 'border-[var(--border-color)] hover:border-yellow-500/30'
                                                    }`}
                                                >
                                                    {/* Status Badge */}
                                                    <div className="absolute top-4 right-4">
                                                        {isCompleted ? (
                                                            <div className="bg-green-500/10 text-green-500 p-1.5 rounded-full border border-green-500/20">
                                                                <CheckCircle2 className="w-4 h-4" />
                                                            </div>
                                                        ) : isFinallyLocked ? (
                                                            <div className="bg-[var(--panel-bg)] p-1.5 rounded-full border border-[var(--border-color)]">
                                                                <Lock className="w-4 h-4 text-[var(--text-muted)]" />
                                                            </div>
                                                        ) : null}
                                                    </div>

                                                    <div className="space-y-4 relative z-10">
                                                        <div className="bg-yellow-500/10 p-3 rounded-xl border border-yellow-500/20 w-fit">
                                                            <TypeIcon className="w-6 h-6 text-yellow-500" />
                                                        </div>

                                                        <div>
                                                            <h3 className={`text-lg font-bold transition-colors leading-tight ${isCompleted ? 'text-gray-200' : 'text-[var(--foreground)] group-hover:text-yellow-500'}`}>
                                                                {resource.title}
                                                            </h3>
                                                            <p className="text-sm text-[var(--text-muted)] mt-2 line-clamp-2">{resource.description}</p>
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">{resource.type}</span>
                                                                <span className="w-1 h-1 bg-gray-700 rounded-full" />
                                                                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">{resource.category}</span>
                                                            </div>
                                                        </div>

                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                if (resource.type === 'Video' && !isFinallyLocked) {
                                                                    setSelectedVideo(resource.external_url || null)
                                                                    // Mark completed immediately when starting watch
                                                                    if (user && !completedIds.has(resource.id)) {
                                                                        supabase.from("user_vault_progress").upsert({
                                                                            user_id: user.id,
                                                                            resource_id: resource.id
                                                                        }, { onConflict: 'user_id,resource_id' }).then(() => {
                                                                            setCompletedIds(prev => new Set([...prev, resource.id]))
                                                                        })
                                                                    }
                                                                } else {
                                                                    handleDownload(resource, isFinallyLocked)
                                                                }
                                                            }}
                                                            disabled={isFinallyLocked}
                                                            className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                                                                isFinallyLocked
                                                                    ? "bg-[var(--panel-bg)] text-[var(--text-muted)] border border-[var(--border-color)] cursor-not-allowed"
                                                                    : resource.type === 'Video'
                                                                        ? "bg-yellow-500 text-black hover:bg-yellow-400"
                                                                        : isCompleted
                                                                            ? "bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20"
                                                                            : "bg-[var(--foreground)] text-[var(--background)] hover:bg-yellow-500"
                                                            }`}
                                                        >
                                                            {isFinallyLocked ? (
                                                                <>Unlock with VIP</>
                                                            ) : resource.type === 'Video' ? (
                                                                <><Play className="w-4 h-4" /> Watch Lesson</>
                                                            ) : isCompleted ? (
                                                                <><CheckCircle2 className="w-4 h-4" /> Review Material</>
                                                            ) : (
                                                                <><Download className="w-4 h-4" /> Download PDF</>
                                                            )}
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* ─── Institutional Trading Tools Section ─── */}
                <div className="pt-20 space-y-10 border-t border-[var(--border-color)]">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 text-[var(--color-info)] mb-2">
                                <Shield className="w-5 h-5" />
                                <span className="text-xs font-bold uppercase tracking-widest font-mono">Institutional Toolkit</span>
                            </div>
                            <h2 className="text-3xl font-black italic tracking-tight uppercase">Trading Weapons & Links</h2>
                            <p className="text-[var(--text-muted)] text-sm mt-2">Essential external and internal tools to maximize your institutional edge.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[ 
                                { 
                                    title: "Zen Personal Journal", 
                                    desc: "The ultimate tool for tracking trade psychology and pip growth.", 
                                    link: "#", 
                                    icon: <BarChart3 className="w-6 h-6" />, 
                                    label: "Internal Hub",
                                    action: "Open Journal",
                                    onClick: () => onNavigate?.('journal')
                                },
                                { 
                                    title: "Zen Signal Indicator", 
                                    desc: "Proprietary MT5 indicator for identifying BOS/CHoCH on your local terminal.", 
                                    link: "https://t.me/zenpips", 
                                    icon: <TrendingUp className="w-6 h-6" />, 
                                    label: "Download (MT5)",
                                    action: "Download .ex5"
                                },
                                { 
                                    title: "Zen MT5 Node", 
                                    desc: "The institutional Python bridge that syncs master signals to your account. Requires your unique Client UID (found below) for calibration.", 
                                    link: "https://t.me/zenpips", 
                                    icon: <Terminal className="w-6 h-6" />, 
                                    label: "Setup Node (PC)",
                                    action: "View Bridge Setup"
                                },
                                { 
                                    title: "MyFXBook Analytics", 
                                    desc: "Monitor the public performance and drawdown of the core Zen Fund.", 
                                    link: "https://myfxbook.com", 
                                    icon: <Activity className="w-6 h-6" />, 
                                    label: "External Tracking",
                                    action: "View Stats"
                                },
                                { 
                                    title: "Forex Factory", 
                                    desc: "High-impact news calendar. Never trade without checking the Red Folders.", 
                                    link: "https://forexfactory.com", 
                                    icon: <Globe className="w-6 h-6" />, 
                                    label: "Economic Calendar",
                                    action: "Check News"
                                },
                                { 
                                    title: "HFM Broker Portal", 
                                    desc: "Access your funding, withdrawals, and institutional MT5 server settings.", 
                                    link: "https://www.hfm.com/ke/en/?refid=30508914", 
                                    icon: <Landmark className="w-6 h-6" />, 
                                    label: "Official Broker",
                                    action: "Login Area"
                                },
                                { 
                                    title: "Institutional Protocol", 
                                    desc: "The complete 2026 Zen Pips Institutional protocol in PDF format.", 
                                    link: "/ZenPips_Institutional_Guide.pdf", 
                                    icon: <FileText className="w-6 h-6" />, 
                                    label: "Essential Reading",
                                    action: "Download PDF"
                                },
                                { 
                                    title: "Tools Manifesto", 
                                    desc: "Detailed breakdown of our technical arsenal and institutional stack.", 
                                    link: "/ZenPips_Tools_Manifesto.pdf", 
                                    icon: <Zap className="w-6 h-6" />, 
                                    label: "Technical Protocol",
                                    action: "Download PDF"
                                }
                            ].map((tool, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * i }}
                                className="bg-[var(--panel-bg)] p-6 rounded-3xl border border-[var(--border-color)] hover:border-blue-500/30 transition-all group flex flex-col justify-between"
                            >
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="p-3 bg-[var(--panel-bg)] rounded-2xl text-[var(--color-info)] group-hover:scale-110 transition-transform">
                                            {tool.icon}
                                        </div>
                                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest font-mono">{tool.label}</span>
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold group-hover:text-[var(--foreground)] transition-colors">{tool.title}</h4>
                                        <p className="text-xs text-[var(--text-muted)] mt-2 leading-relaxed">{tool.desc}</p>
                                    </div>
                                </div>
                                <a 
                                    href={tool.link} 
                                    target={tool.link.startsWith('http') || tool.link.endsWith('.pdf') ? "_blank" : "_self"}
                                    rel="noopener noreferrer"
                                    onClick={(e) => {
                                        if (tool.onClick) {
                                            e.preventDefault();
                                            tool.onClick();
                                        }
                                    }}
                                    className="mt-6 w-full py-3 bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-xl text-center text-xs font-bold uppercase tracking-widest hover:bg-blue-500 hover:text-[var(--foreground)] hover:border-blue-500 transition-all flex items-center justify-center gap-2"
                                >
                                    {tool.action} <ExternalLink className="w-3 h-3" />
                                </a>
                            </motion.div>
                        ))}
                    </div>

                    {/* 🔑 MT5 Node Calibration Helper */}
                    <div className="mt-12 bg-blue-500/5 border border-blue-500/20 rounded-3xl p-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Shield className="w-40 h-40 text-blue-500" />
                        </div>
                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center gap-2 text-blue-500 text-xs font-bold uppercase tracking-widest">
                                <Zap className="w-4 h-4" /> MT5 Node Calibration Helper
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                                <div className="space-y-4">
                                    <h3 className="text-2xl font-bold italic uppercase">Your Terminal Identity</h3>
                                    <p className="text-[var(--text-muted)] text-sm leading-relaxed max-w-md">
                                        Use your unique Client UID to calibrate your local **Zen MT5 Node**. This allows the bridge to securely fetch signals and execute trades exclusively for your account.
                                    </p>
                                </div>
                                <div className="bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-2xl p-6 backdrop-blur-sm space-y-4">
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-black">Client UID (Master Key)</p>
                                        <div className="flex gap-2">
                                            <code className="flex-1 bg-black/40 border border-[var(--border-color)] p-3 rounded-xl text-xs font-mono text-blue-400 overflow-hidden text-ellipsis whitespace-nowrap">
                                                {user?.id || 'AUTH_REQUIRED'}
                                            </code>
                                            <button 
                                                onClick={() => {
                                                    if (user?.id) {
                                                        navigator.clipboard.writeText(user.id);
                                                        confetti({ particleCount: 30, spread: 30, colors: ['#3B82F6'] });
                                                    }
                                                }}
                                                className="bg-blue-500 text-black px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-400 transition-all flex items-center gap-2"
                                            >
                                                Copy
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-[var(--text-muted)] italic">💡 Paste this into your `.env` file as <code>CLIENT_UID</code> within the Zen MT5 Node directory.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {filtered.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center p-12 gap-4">
                        <Search className="w-12 h-12 text-[var(--text-muted)]" />
                        <p className="text-[var(--text-muted)]">No resources match your search.</p>
                    </div>
                )}

                {/* Certificate Showcase Modal */}
                {showCertModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onClick={() => setShowCertModal(null)}
                            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            className="relative w-full max-w-2xl bg-[#0a0a0a] border border-yellow-500/30 rounded-3xl p-8 md:p-12 text-center overflow-hidden shadow-[0_0_50px_rgba(234,179,8,0.2)]"
                        >
                            {/* Decorative Background */}
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-yellow-500 to-transparent" />
                            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #EAB308 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                            
                            <div className="relative z-10 space-y-6">
                                <motion.div 
                                    initial={{ rotate: -10, scale: 0.5 }}
                                    animate={{ rotate: 0, scale: 1 }}
                                    transition={{ type: "spring", damping: 10 }}
                                    className="w-24 h-24 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto border-2 border-yellow-500/50"
                                >
                                    <Medal className="w-12 h-12 text-yellow-500" />
                                </motion.div>

                                <div className="space-y-2">
                                    <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tighter">Achievement Unlocked</h2>
                                    <p className="text-yellow-500 font-bold uppercase tracking-widest text-sm">Zen Pips Institutional Trader</p>
                                </div>

                                <div className="py-8 px-4 border-y border-[var(--border-color)] bg-white/[0.02] rounded-2xl">
                                    <p className="text-[var(--text-muted)] italic text-sm mb-4 italic">"This certificate is awarded for 100% completion of the"</p>
                                    <h3 className="text-2xl font-bold bg-gradient-to-r from-yellow-200 via-yellow-500 to-yellow-200 bg-clip-text text-transparent">
                                        {showCertModal === 'Foundation' ? 'Foundation & Smart Money Concepts' : showCertModal} Mastery
                                    </h3>
                                    <p className="text-xs text-[var(--text-muted)] mt-6 uppercase tracking-widest font-mono">ID: ZP-{Math.random().toString(36).substring(7).toUpperCase()}</p>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                    <button 
                                        onClick={() => setShowCertModal(null)}
                                        className="flex-1 bg-white text-black py-3 rounded-xl font-bold hover:bg-yellow-500 transition-colors"
                                    >
                                        Back to Vault
                                    </button>
                                    <button 
                                        onClick={() => window.print()}
                                        className="flex-1 bg-[var(--panel-bg)] border border-[var(--border-color)] text-[var(--foreground)] py-3 rounded-xl font-bold hover:bg-[var(--border-color)] transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Download className="w-4 h-4" /> Save Certificate
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Video Player Modal */}
                {selectedVideo && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onClick={() => setSelectedVideo(null)}
                            className="absolute inset-0 bg-black/95 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="relative w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-[var(--border-color)]"
                        >
                            <button 
                                onClick={() => setSelectedVideo(null)}
                                className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black p-2 rounded-full border border-[var(--border-color)] transition-colors"
                            >
                                <X className="w-5 h-5 text-[var(--foreground)]" />
                            </button>
                            
                            {/* YouTube Embed Helper */}
                            <iframe 
                                src={selectedVideo.includes('youtube.com') || selectedVideo.includes('youtu.be')
                                    ? `https://www.youtube.com/embed/${selectedVideo.split('v=')[1]?.split('&')[0] || selectedVideo.split('/').pop()}?autoplay=1`
                                    : selectedVideo
                                }
                                className="w-full h-full border-none"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    )
}
