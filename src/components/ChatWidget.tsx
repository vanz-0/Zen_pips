"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Terminal, X, Send, Bot, ExternalLink, Loader2 } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useTheme } from "@/context/ThemeContext"
import Image from "next/image"

export default function ChatWidget() {
    const { user } = useAuth()
    const { theme } = useTheme()
    const [isOpen, setIsOpen] = useState(false)
    const chatRef = useRef<HTMLDivElement>(null)
    const [messages, setMessages] = useState([
        { role: "assistant", content: "Zen Pips Terminal active. Query institutional parameters, SOPs, or trading framework below." }
    ])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (chatRef.current && !chatRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside)
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [isOpen])

    const handleSend = async () => {
        if (!input.trim() || loading) return

        const userMsg = { role: "user", content: input }
        setMessages(prev => [...prev, userMsg])
        const currentInput = input
        setInput("")
        setLoading(true)

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: currentInput,
                    userId: user?.id 
                })
            });
            const data = await response.json();

            if (data.reply) {
                setMessages(prev => [...prev, { role: "assistant", content: data.reply }])
            } else {
                setMessages(prev => [...prev, { role: "assistant", content: "Connection offline. Please try again later." }])
            }
        } catch (error) {
            console.error("Chat error:", error)
            setMessages(prev => [...prev, { role: "assistant", content: "System error. Terminal disconnected." }])
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            {/* Toggle Button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        onClick={() => setIsOpen(true)}
                        className={`fixed bottom-24 right-6 w-14 h-14 bg-[var(--panel-bg)] border border-[#d4af37]/50 rounded-full flex items-center justify-center text-[#d4af37] shadow-2xl hover:bg-[#d4af37] hover:text-black transition-all z-40`}
                    >
                        <Bot className="w-6 h-6" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        ref={chatRef}
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed bottom-20 right-4 sm:bottom-24 sm:right-6 w-[calc(100vw-2rem)] md:w-[400px] h-[75vh] max-h-[600px] bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-3xl shadow-2xl flex flex-col z-[60] overflow-hidden font-outfit"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-[var(--border-color)] bg-[var(--background)] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="relative w-8 h-8 bg-[#d4af37] rounded-full p-0.5 shadow-sm border border-yellow-600/30 flex items-center justify-center">
                                    <div className="w-full h-full bg-[var(--background)] rounded-full overflow-hidden relative">
                                        <Image 
                                            src="/logo.png" 
                                            alt="Zen Pips" 
                                            fill 
                                            className="object-contain scale-150" 
                                        />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-outfit font-bold text-[var(--foreground)] tracking-wide text-sm uppercase">Institutional RAG</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                        <span className="text-[10px] text-[var(--text-muted)] font-mono tracking-widest uppercase">System Online</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <a
                                    href="https://t.me/Zen_pips_bot"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 border border-yellow-500/20 rounded-md transition-colors text-xs font-bold uppercase tracking-widest mr-2"
                                >
                                    <ExternalLink className="w-3 h-3" />
                                    Execution Bot
                                </a>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 sm:p-1.5 hover:bg-[var(--foreground)]/5 rounded-md transition-colors text-[var(--text-muted)] hover:text-[var(--foreground)] border border-[var(--border-color)] sm:border-none"
                                >
                                    <X className="w-5 h-5 sm:w-4 sm:h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user'
                                        ? 'bg-[#d4af37] text-black font-medium rounded-tr-none'
                                        : 'bg-[var(--sub-panel-bg)] text-[var(--foreground)] border border-[var(--border-color)] rounded-tl-none'
                                        }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-[var(--sub-panel-bg)] px-4 py-3 rounded-2xl rounded-tl-none border border-[var(--border-color)] flex items-center gap-1.5 h-10">
                                        <motion.div className="w-1.5 h-1.5 bg-[#d4af37] rounded-full" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0 }} />
                                        <motion.div className="w-1.5 h-1.5 bg-[#d4af37] rounded-full" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }} />
                                        <motion.div className="w-1.5 h-1.5 bg-[#d4af37] rounded-full" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }} />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-[var(--border-color)] bg-[var(--background)]">
                            <div className="relative">
                                <input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Ask about strategy, billing, or broker..."
                                    className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg py-3 pl-4 pr-12 outline-none focus:border-[#d4af37]/50 transition-all text-sm font-mono text-[var(--foreground)] placeholder:text-[var(--text-muted)]/50"
                                />
                                <button
                                    onClick={handleSend}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#d4af37]/10 rounded-md text-[#d4af37] hover:bg-[#d4af37] hover:text-black transition-colors"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-[10px] text-[var(--text-muted)] text-center mt-3 uppercase tracking-widest font-mono">
                                Zen Pips Terminal V1.0
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
