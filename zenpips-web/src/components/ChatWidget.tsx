"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquare, X, Send, Bot, User, Loader2 } from "lucide-react"

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState([
        { role: "assistant", content: "Welcome to Zen Pips. I'm your institutional assistant. How can I help you dominate the markets today?" }
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
        setInput("")
        setLoading(true)

        try {
            // Simulate RAG call to Modal Webhook
            await new Promise(r => setTimeout(r, 1500))

            const assistantMsg = {
                role: "assistant",
                content: "Based on our institutional playbook, we recommend focusing on XAUUSD during the London-NY overlap. For VIP access, you can visit the @Zen_pips bot on Telegram."
            }
            setMessages(prev => [...prev, assistantMsg])
        } catch (error) {
            console.error("Chat error:", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-6 right-6 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-black shadow-2xl hover:scale-110 active:scale-95 transition-all z-40 ${isOpen ? 'opacity-0 scale-0 pointer-events-none' : 'opacity-100 scale-100'}`}
            >
                <MessageSquare className="w-4 h-4" />
            </button>

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
                        <div className="p-4 border-b border-white/5 bg-yellow-500/5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-black">
                                    <Bot className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-sm">Zen Assistant</h3>
                                    <div className="flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                        <span className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Active Edge</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
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
                                    <div className="bg-[#1a1a1a] p-3 rounded-2xl rounded-tl-none border border-white/5">
                                        <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />
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
                                    className="w-full bg-black border border-white/10 rounded-xl py-3 pl-4 pr-12 outline-none focus:border-yellow-500/50 transition-all text-sm"
                                />
                                <button
                                    onClick={handleSend}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-yellow-500 rounded-lg text-black hover:bg-yellow-400 transition-colors"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-[9px] text-gray-600 text-center mt-3 uppercase tracking-widest font-bold">
                                Powered by Zen Pips institutional RAG
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
