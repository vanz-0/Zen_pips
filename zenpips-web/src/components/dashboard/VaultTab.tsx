"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import {
    BookOpen, Download, FileText, Lock, GraduationCap, ArrowLeft,
    Search, Filter, Video, Headphones, Star, ChevronDown, ExternalLink, Loader2
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

interface VaultResource {
    id: string
    title: string
    description: string
    type: "PDF" | "Video" | "Course" | "Audio"
    category: string
    level: "Beginner" | "Intermediate" | "Advanced"
    locked: boolean
    file_path?: string | null
    external_url?: string | null
    created_at: string
}

const LEVEL_COLORS: Record<string, string> = {
    Beginner: "text-blue-400 bg-blue-500/10 border-blue-500/20",
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
    { id: "1", title: "SMC: Market Structure 101", description: "The foundation of Smart Money: BOS, CHoCH, and identifying true trend shifts.", type: "PDF", category: "Smart Money Concepts", level: "Beginner", locked: false, file_path: null, external_url: null, created_at: "" },
    { id: "2", title: "ICT: Internal Liquidity Mastery", description: "Learn to identify buy-side and sell-side liquidity before the banks move.", type: "PDF", category: "ICT", level: "Beginner", locked: false, file_path: null, external_url: null, created_at: "" },
    { id: "3", title: "Risk Management & Psychology", description: "The mental edge: discipline, position sizing, and institutional emotional control.", type: "PDF", category: "Psychology", level: "Beginner", locked: false, file_path: null, external_url: null, created_at: "" },
    { id: "4", title: "Advanced Institutional Orderflow", description: "Deep dive into Order Blocks, FVGs, and Breaker Block manipulation.", type: "PDF", category: "Strategy", level: "Intermediate", locked: true, file_path: null, external_url: null, created_at: "" },
    { id: "5", title: "Market Manipulation Cycles", description: "Identifying the AMD (Accumulation, Manipulation, Distribution) power of 3.", type: "Video", category: "Strategy", level: "Intermediate", locked: true, file_path: null, external_url: null, created_at: "" },
    { id: "6", title: "Elite ICT Mentorship: Core 2026", description: "Full breakdown of the 2026 institutional model and silver bullet strategies.", type: "Video", category: "ICT", level: "Advanced", locked: true, file_path: null, external_url: null, created_at: "" },
    { id: "7", title: "Live Session: High Frequency Analysis", description: "Weekly live institutional trading session recordings with real-time commentary.", type: "Video", category: "Live Sessions", level: "Advanced", locked: true, file_path: null, external_url: null, created_at: "" },
    { id: "8", title: "The Institutional Playbook (Final)", description: "The complete Zen Pips methodology from A to Z for advanced operators.", type: "PDF", category: "Strategy", level: "Advanced", locked: true, file_path: null, external_url: null, created_at: "" },
]

const ALL_CATEGORIES = ["All", "Smart Money Concepts", "ICT", "Strategy", "Psychology", "Live Sessions"]

export function VaultTab() {
    const { user, profile, loading: authLoading } = useAuth()
    const router = useRouter()
    const [resources, setResources] = useState<VaultResource[]>(DEFAULT_RESOURCES)
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [category, setCategory] = useState("All")
    const [level, setLevel] = useState("All")

    const fetchResources = useCallback(async () => {
        const { data, error } = await supabase
            .from("vault_resources")
            .select("*")
            .order("created_at", { ascending: false })

        if (!error && data && data.length > 0) {
            setResources(data as VaultResource[])
        }
        // If table doesn't exist or is empty, keep defaults
        setLoading(false)
    }, [])

    useEffect(() => {
        fetchResources()
    }, [fetchResources])

    const filtered = resources.filter(r => {
        const matchesSearch = !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase())
        const matchesCategory = category === "All" || r.category === category
        const matchesLevel = level === "All" || r.level === level
        return matchesSearch && matchesCategory && matchesLevel
    })

    const handleDownload = async (resource: VaultResource) => {
        if (resource.locked) return
        if (resource.external_url) {
            window.open(resource.external_url, "_blank")
            return
        }
        if (resource.file_path) {
            const { data } = await supabase.storage
                .from("education-vault")
                .createSignedUrl(resource.file_path, 3600)
            if (data?.signedUrl) {
                window.open(data.signedUrl, "_blank")
            }
        }
    }

    return (
        <div className="w-full text-white py-12 font-[family-name:var(--font-outfit)]">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-yellow-500 mb-2">
                            <GraduationCap className="w-6 h-6" />
                            <span className="text-sm font-bold uppercase tracking-widest">Education Hub</span>
                        </div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">The Dominator Vault</h1>
                        <p className="text-gray-400 mt-2">Institutional-grade education for the selected few.</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="bg-yellow-500/10 text-yellow-500 px-3 py-1.5 rounded-full border border-yellow-500/20 font-bold">
                            {resources.filter(r => !r.locked).length} Resources Available
                        </span>
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search resources..."
                            className="w-full bg-[#111] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-yellow-500/50 outline-none text-white placeholder-gray-500"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select value={category} onChange={(e) => setCategory(e.target.value)} className="bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-yellow-500/50 outline-none text-white">
                            {ALL_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                        <select value={level} onChange={(e) => setLevel(e.target.value)} className="bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-yellow-500/50 outline-none text-white">
                            <option>All</option>
                            <option>Beginner</option>
                            <option>Intermediate</option>
                            <option>Advanced</option>
                        </select>
                    </div>
                </div>

                {/* Resources Grid */}
                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map((resource, i) => {
                            const TypeIcon = TYPE_ICONS[resource.type] || FileText
                            
                            // ─── Custom Gating Logic ───
                            const isVIP = profile?.is_vip || profile?.plan === 'VIP';
                            
                            // Gating logic: Beginner is FREE. Intermediate/Advanced is VIP.
                            const isFinallyLocked = !isVIP && (resource.level === 'Intermediate' || resource.level === 'Advanced');

                            return (
                                <motion.div
                                    key={resource.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="group relative bg-[#111] p-6 rounded-2xl border border-white/5 hover:border-yellow-500/30 transition-all cursor-pointer overflow-hidden"
                                >
                                    {/* Glow */}
                                    <div className="absolute -top-12 -right-12 w-24 h-24 bg-yellow-500/5 blur-3xl group-hover:bg-yellow-500/15 transition-all" />

                                    <div className="space-y-4 relative z-10">
                                        <div className="flex items-center justify-between">
                                            <div className="bg-yellow-500/10 p-3 rounded-xl border border-yellow-500/20">
                                                <TypeIcon className="w-6 h-6 text-yellow-500" />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter border ${LEVEL_COLORS[resource.level]}`}>
                                                    {resource.level}
                                                </span>
                                                {isFinallyLocked && (
                                                    <div className="flex items-center gap-1 px-2 py-0.5 bg-white/5 rounded-md border border-white/10">
                                                        <Lock className="w-3 h-3 text-gray-500" />
                                                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">VIP</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-bold text-white group-hover:text-yellow-500 transition-colors leading-tight">
                                                {resource.title}
                                            </h3>
                                            <p className="text-sm text-gray-400 mt-2 line-clamp-2">{resource.description}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-[10px] text-gray-500 uppercase tracking-wider">{resource.type}</span>
                                                <span className="w-1 h-1 bg-gray-700 rounded-full" />
                                                <span className="text-[10px] text-gray-500 uppercase tracking-wider">{resource.category}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleDownload(resource)}
                                            disabled={resource.locked}
                                            className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${resource.locked
                                                ? "bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed"
                                                : "bg-white text-black hover:bg-yellow-500 transition-colors"
                                                }`}
                                        >
                                            {isFinallyLocked ? (
                                                <>Unlock with Lifetime VIP</>
                                            ) : resource.file_path || resource.external_url ? (
                                                <>Access Resource <ExternalLink className="w-4 h-4" /></>
                                            ) : (
                                                <>Coming Soon</>
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                )}

                {filtered.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center p-12 gap-4">
                        <Search className="w-12 h-12 text-gray-600" />
                        <p className="text-gray-400">No resources match your search.</p>
                    </div>
                )}

                {/* Mentorship Banner */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    className="bg-gradient-to-br from-yellow-500/10 to-transparent p-8 rounded-3xl border border-yellow-500/10 flex flex-col md:flex-row items-center gap-8 justify-between"
                >
                    <div className="space-y-4 text-center md:text-left">
                        <h2 className="text-2xl font-bold">Want personalized mentorship?</h2>
                        <p className="text-gray-400 max-w-md">Join our weekly live breakdown sessions where we analyze institutional orderflow in real-time.</p>
                        <a
                            href="https://t.me/MadDmakz"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block bg-yellow-500 text-black px-8 py-3 rounded-xl font-bold hover:bg-yellow-400 transition-colors"
                        >
                            Apply for Mentorship
                        </a>
                    </div>
                    <div className="relative">
                        <div className="w-48 h-48 bg-yellow-500/20 blur-3xl absolute inset-0" />
                        <BookOpen className="w-32 h-32 text-yellow-500 relative z-10 opacity-50" />
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
