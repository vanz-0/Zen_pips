"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Terminal, X, Send, Bot, ExternalLink, Loader2 } from "lucide-react"
import { useAuth } from "@/context/AuthContext"

export default function ChatWidget() {
    const { user } = useAuth()
    const [isOpen, setIsOpen] = useState(false)
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
                        className={`fixed bottom-6 right-6 w-14 h-14 bg-[#111] border border-yellow-500/50 rounded-full flex items-center justify-center text-yellow-500 shadow-2xl hover:bg-yellow-500 hover:text-black transition-all z-40`}
                    >
                        <Bot className="w-6 h-6" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed bottom-6 right-6 w-[90vw] md:w-[400px] h-[600px] bg-[#111] border border-white/10 rounded-3xl shadow-2xl flex flex-col z-50 overflow-hidden font-outfit"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-white/10 bg-[#0a0a0a] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center justify-center text-yellow-500">
                                    <Terminal className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-outfit font-bold text-white tracking-wide text-sm uppercase">Institutional RAG</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                        <span className="text-[10px] text-gray-400 font-mono tracking-widest uppercase">System Online</span>
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
                                    className="p-1.5 hover:bg-white/5 rounded-md transition-colors text-gray-500 hover:text-white"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user'
                                        ? 'bg-yellow-500 text-black font-medium rounded-tr-none'
                                        : 'bg-[#1a1a1a] text-gray-200 border border-white/5 rounded-tl-none'
                                        }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-[#1a1a1a] px-4 py-3 rounded-2xl rounded-tl-none border border-white/5 flex items-center gap-1.5 h-10">
                                        <motion.div className="w-1.5 h-1.5 bg-yellow-500 rounded-full" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0 }} />
                                        <motion.div className="w-1.5 h-1.5 bg-yellow-500 rounded-full" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }} />
                                        <motion.div className="w-1.5 h-1.5 bg-yellow-500 rounded-full" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }} />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-white/5 bg-black/20">
                            <div className="relative">
                                <input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Ask about strategy, billing, or broker..."
                                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg py-3 pl-4 pr-12 outline-none focus:border-yellow-500/50 transition-all text-sm font-mono text-gray-300 placeholder:text-gray-600"
                                />
                                <button
                                    onClick={handleSend}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-yellow-500/10 rounded-md text-yellow-500 hover:bg-yellow-500 hover:text-black transition-colors"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-500 text-center mt-3 uppercase tracking-widest font-mono">
                                Zen Pips Terminal V1.0
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
