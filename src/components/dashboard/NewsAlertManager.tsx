"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, Clock, X } from "lucide-react"
import { supabase } from "@/lib/supabase"

export function NewsAlertManager() {
    const [news, setNews] = useState<any[]>([])
    const [activeAlerts, setActiveAlerts] = useState<any[]>([])

    useEffect(() => {
        const fetchNews = async () => {
            const todayStr = new Date().toISOString().split('T')[0]
            const { data } = await supabase
                .from('market_news')
                .select('*')
                .eq('event_date', todayStr)
                
            if (data && data.length > 0) {
                // Parse standard "8:30am" times into exact Date objects for today
                const parsedNews = data.map(item => {
                    const parsedData = { ...item, triggerTimeUtc: 0 }
                    try {
                        const timeString = item.event_time.toLowerCase()
                        const isPM = timeString.includes('pm')
                        const cleanTime = timeString.replace('am', '').replace('pm', '').trim()
                        let [hours, minutes] = cleanTime.split(':').map(Number)
                        
                        if (isPM && hours !== 12) hours += 12
                        if (!isPM && hours === 12) hours = 0
                        
                        const eventDate = new Date()
                        // Based on ForexFactory default timezone (EST/EDT typically, but assuming local parsing for simplicity)
                        eventDate.setHours(hours, minutes, 0, 0)
                        
                        // Set the trigger time to exactly 15 minutes before
                        parsedData.triggerTimeUtc = eventDate.getTime() - (15 * 60 * 1000)
                    } catch (e) {
                        console.error('Time parsing error for alert', e)
                    }
                    return parsedData
                }).filter(n => n.triggerTimeUtc > 0)
                
                setNews(parsedNews)
            }
        }
        
        fetchNews()
    }, [])

    useEffect(() => {
        if (news.length === 0) return

        const checkInterval = setInterval(() => {
            const now = new Date().getTime()
            
            // Check if any news event is hitting the exact 15-minute mark (within a 1 minute window to catch execution)
            news.forEach(item => {
                const timeDiff = item.triggerTimeUtc - now
                
                // If we exactly crossed into the 15-minute warning window
                if (timeDiff <= 0 && timeDiff > -60000) {
                    // Check if we haven't already alerted today to prevent spam reload alerts
                    if (!activeAlerts.find(a => a.id === item.id)) {
                        setActiveAlerts(prev => [...prev, item])
                        
                        // Automatically drop a quick persona chat logic into db when alert pops
                        triggerPersonaDiscussion(item)
                    }
                }
            })
        }, 30000) // Poll every 30s

        return () => clearInterval(checkInterval)
    }, [news, activeAlerts])

    const triggerPersonaDiscussion = async (event: any) => {
        // Automatically injects a real-time reactive persona response directly linked to the popup
        await supabase.from("community_messages").insert([
            {
                content: `**Zen Master**: Heads up. ${event.event_name} (${event.currency}) drops in 15 minutes. Prepare for the liquidity flush.`,
                channel: "market-news"
            },
            {
                content: `**LiquidityHunter**: Algorithms will absolutely sweep the ${event.currency} pairings right at the open. Do not be caught in the displacement.`,
                channel: "market-news"
            }
        ])
    }

    const clearAlert = (id: string) => {
        setActiveAlerts(prev => prev.filter(a => a.id !== id))
    }

    return (
        <div className="fixed top-20 right-4 z-[999] flex flex-col gap-3 max-w-[360px] w-full px-4 sm:px-0 pointer-events-none">
            <AnimatePresence>
                {activeAlerts.map(alert => (
                    <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, y: -20 }}
                        onAnimationComplete={() => {
                            // Automatically clear after 15 seconds
                            setTimeout(() => clearAlert(alert.id), 15000)
                        }}
                        className="bg-black/80 backdrop-blur-xl border border-red-500/30 shadow-2xl shadow-red-500/10 p-4 rounded-3xl text-red-500 relative overflow-hidden pointer-events-auto"
                    >
                        {/* Progress Bar (Announcement Duration: 15s) */}
                        <motion.div 
                            initial={{ width: "100%" }}
                            animate={{ width: "0%" }}
                            transition={{ duration: 15, ease: "linear" }}
                            className="absolute bottom-0 left-0 h-1 bg-red-500/50"
                        />

                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/20">
                                <AlertTriangle className="w-5 h-5 animate-pulse" />
                            </div>
                            <div className="flex-1 space-y-1 pr-6">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold bg-red-500/10 px-2 py-0.5 rounded text-red-400">HIGH IMPACT</span>
                                    <span className="flex items-center gap-1 text-[10px] uppercase font-mono tracking-widest text-red-500/60 animation-pulse">
                                        <Clock className="w-3 h-3" /> 15 MINUTES LEFT
                                    </span>
                                </div>
                                <h3 className="font-bold text-sm text-red-100">{alert.currency} {alert.event_name}</h3>
                                <p className="text-xs text-red-400/80 leading-relaxed font-mono">
                                    Imminent volatility injection. Protect capital.
                                </p>
                            </div>
                            <button 
                                onClick={() => clearAlert(alert.id)}
                                className="absolute top-4 right-4 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 p-1.5 rounded-full transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    )
}
