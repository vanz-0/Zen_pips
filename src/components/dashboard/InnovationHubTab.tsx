"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { 
    Lightbulb, 
    MessageSquare, 
    ThumbsUp, 
    Cpu, 
    Send, 
    CheckCircle2, 
    Clock, 
    ChevronRight, 
    AlertCircle,
    Loader2,
    Zap,
    Box,
    Terminal,
    Activity,
    Shield,
    Flame
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { supabase } from "@/lib/supabase"

interface ToolProposal {
    id: string
    user_id: string
    title: string
    description: string
    ai_plan: string | null
    votes: number
    status: "PROPOSED" | "PLANNED" | "BUILDING" | "SHIPPED"
    created_at: string
}

interface InnovationHubProps {
    onNavigate?: (tab: "profile" | "journal" | "vault" | "chartai" | "admin" | "help" | "community" | "innovation" | null) => void
}

export function InnovationHubTab({ onNavigate }: InnovationHubProps) {
    const { user, profile } = useAuth()
    const [proposals, setProposals] = useState<ToolProposal[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [success, setSuccess] = useState(false)

    const fetchProposals = async () => {
        const { data, error } = await supabase
            .from("tool_proposals")
            .select("*")
            .order("votes", { ascending: false })
        
        if (!error && data) {
            setProposals(data as ToolProposal[])
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchProposals()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !title || !description) return
        setSubmitting(true)

        const { error } = await supabase.from("tool_proposals").insert({
            user_id: user.id,
            title,
            description,
            status: "PROPOSED",
            votes: 1
        })

        if (!error) {
            setSuccess(true)
            setTitle("")
            setDescription("")
            fetchProposals()
            setTimeout(() => setSuccess(false), 5000)
        }
        setSubmitting(false)
    }

    const handleVote = async (id: string, currentVotes: number) => {
        if (!user) return
        // Optimistic update
        setProposals(prev => prev.map(p => p.id === id ? { ...p, votes: p.votes + 1 } : p))
        
        await supabase.from("tool_proposals")
            .update({ votes: currentVotes + 1 })
            .eq("id", id)
    }

    return (
        <div className="w-full text-[var(--foreground)] py-12 font-[family-name:var(--font-outfit)]">
            <div className="max-w-6xl mx-auto space-y-12">
                
                {/* Header */}
                <div className="flex flex-col items-center text-center space-y-6 mb-12">
                     <motion.button 
                        onClick={() => onNavigate?.(null)}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative w-24 h-24 bg-[#d4af37] rounded-full p-1 shadow-[0_0_30px_rgba(212,175,55,0.2)] border border-yellow-600/30 flex items-center justify-center transition-transform hover:scale-105 mx-auto"
                    >
                        <div className="w-full h-full bg-[#0a0a0a] rounded-full overflow-hidden relative">
                            <Image 
                                src="/logo.png" 
                                alt="Zen Pips" 
                                fill 
                                className="object-contain" 
                                priority
                            />
                        </div>
                    </motion.button>

                    <div className="max-w-2xl">
                        <div className="flex items-center justify-center gap-2 text-[#d4af37] mb-2 uppercase tracking-[0.2em] text-[10px] font-bold">
                            <Lightbulb className="w-4 h-4" /> Community Lab
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter text-[var(--foreground)]">
                            Zen Innovation Hub
                        </h1>
                        <p className="text-[var(--text-muted)] mt-4 text-sm leading-relaxed">
                            The decentralized R&D center for Zen Pips. Propose new tools, browse AI-generated implementation plans, and vote on our next production build.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Proposal Form */}
                    <div className="lg:col-span-1">
                        <div className="bg-[var(--panel-bg)] p-8 rounded-3xl border border-[var(--border-color)] sticky top-24">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Send className="w-5 h-5 text-[#d4af37]" /> Submit Idea
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold mb-2 block">Tool Title</label>
                                        <input 
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="e.g. Volume Profile Script"
                                            className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm focus:border-[#d4af37]/50 outline-none transition-all"
                                            required
                                        />
                                </div>
                                <div>
                                    <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold mb-2 block">Technical Description</label>
                                    <textarea 
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="What should it do?"
                                        rows={4}
                                        className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm focus:border-[#d4af37]/50 outline-none transition-all resize-none"
                                        required
                                    />
                                </div>
                                <button 
                                    disabled={submitting}
                                    className="w-full py-4 bg-[#d4af37] text-black rounded-xl font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />}
                                    PROPOSE TOOL
                                </button>
                                {success && (
                                    <p className="text-[var(--color-success)] text-[10px] text-center font-bold animate-bounce mt-2">
                                        🚀 PROPOSAL TRANSMITTED TO R&D
                                    </p>
                                )}
                                 </form>
                                 <div className="p-4 bg-[var(--panel-bg)] rounded-2xl border border-[var(--border-color)] mt-6">
                                     <h3 className="text-[10px] text-[#d4af37] font-bold uppercase mb-2">Institutional Bridge (MT5)</h3>
                                     <p className="text-[10px] text-[var(--text-muted)] leading-relaxed font-medium">
                                         The **Zen MT5 Node** is the core bridge. Once deployed, it syncs cloud signals to your local terminal with 1% risk-per-trade logic. 
                                         <br/><br/>
                                         <span className="text-white">Status: ⚡ DISCONNECTED (Run `python mt5_bridge.py`)</span>
                                     </p>
                                 </div>
                             </div>
                         </div>

                    {/* Proposal Feed */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold flex items-center gap-2">
                                <Box className="w-3 h-3" /> Live Proposals
                            </span>
                            <span className="text-[10px] text-[#d4af37] font-mono">SORT BY: VOTES</span>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-24">
                                <Loader2 className="w-8 h-8 animate-spin text-[#d4af37]" />
                            </div>
                        ) : proposals.length === 0 ? (
                            <div className="bg-[var(--panel-bg)] p-12 rounded-3xl border border-dashed border-[var(--border-color)] text-center flex flex-col items-center gap-4">
                                <AlertCircle className="w-12 h-12 text-gray-700" />
                                <p className="text-[var(--text-muted)] font-medium italic">No proposals yet. Be the first to innovate.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {proposals.map((item) => (
                                    <motion.div 
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-3xl overflow-hidden hover:border-[#d4af37]/20 transition-all p-1"
                                    >
                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-widest ${
                                                            item.status === 'SHIPPED' ? 'bg-green-500/10 text-green-500 border border-green-500/10' :
                                                            item.status === 'BUILDING' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/10' :
                                                            'bg-[var(--panel-bg)] text-[var(--text-muted)] border border-[var(--border-color)]'
                                                        }`}>
                                                            {item.status}
                                                        </span>
                                                        <span className="text-[10px] text-[var(--text-muted)] font-mono">ID: {item.id.slice(0, 8).toUpperCase()}</span>
                                                    </div>
                                                    <h3 className="text-xl font-bold text-[var(--foreground)] group-hover:text-[#d4af37] transition-colors">{item.title}</h3>
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <button 
                                                        onClick={() => handleVote(item.id, item.votes)}
                                                        className="w-12 h-12 bg-[var(--panel-bg)] rounded-2xl border border-[var(--border-color)] flex flex-col items-center justify-center hover:bg-[#d4af37] hover:text-black transition-all group"
                                                    >
                                                        <ThumbsUp className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform" />
                                                    </button>
                                                    <span className="text-[10px] font-bold text-[var(--text-muted)] mt-1 uppercase">{item.votes} Votes</span>
                                                </div>
                                            </div>
                                            <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-xl">{item.description}</p>
                                            
                                            {/* AI PLAN ACCORDION (Example visual) */}
                                            <div className="mt-6 border-t border-[var(--border-color)] pt-6">
                                                <div className="flex items-center gap-2 text-[#d4af37] mb-4">
                                                    <Cpu className="w-4 h-4" />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest">AI Implementation Roadmap</span>
                                                </div>
                                                <div className="bg-[var(--background)] rounded-2xl p-4 border border-[var(--border-color)] font-mono text-[10px] leading-relaxed text-[var(--text-muted)]">
                                                    {item.ai_plan || "⚙️ Zen AI is analyzing the complexity and resource requirements for this build..."}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
