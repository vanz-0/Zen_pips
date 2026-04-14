'use client'
import { useState, useEffect } from 'react'
import { Clock, X, Terminal, ArrowRight, ShieldAlert } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function NewsModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [newsData, setNewsData] = useState<any>(null)
  const [isDarkMode, setIsDarkMode] = useState(true)

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark') || 
                   window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(isDark);

    const checkNews = async () => {
      try {
        const res = await fetch('/api/news')
        const data = await res.json()
        if (data.events && data.events.length > 0) {
          setNewsData(data)
          const sessionKey = 'zenpips_news_session_seen';
          if (!sessionStorage.getItem(sessionKey)) {
            setIsOpen(true)
            sessionStorage.setItem(sessionKey, 'true')
          }
        }
      } catch (e) {
        console.error("Failed to fetch live news feed", e)
      }
    }
    checkNews()
  }, [])

  if (!newsData) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-xl"
          />

          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`relative w-full max-w-2xl overflow-hidden rounded-[2.5rem] border shadow-2xl transition-colors duration-500
              ${isDarkMode 
                ? 'bg-zinc-950/80 border-white/10 text-white' 
                : 'bg-white/90 border-black/5 text-zinc-900 backdrop-blur-3xl'}`}
          >
            <div className={`h-1.5 w-full ${newsData.activeBlackout?.isBlackout ? 'bg-red-500' : 'bg-[#d4af37]'}`} />

            <div className="p-8 md:p-10">
              <div className="mb-8 flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={`rounded-2xl p-3 ${isDarkMode ? 'bg-zinc-900 border border-white/5' : 'bg-zinc-100 border border-black/5'}`}>
                    <ShieldAlert className={`h-7 w-7 ${newsData.activeBlackout?.isBlackout ? 'text-red-500' : 'text-[#d4af37]'}`} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight font-[family-name:var(--font-outfit)]">Institutional Intel</h2>
                    <p className={`text-xs font-semibold uppercase tracking-widest opacity-50 mt-1`}>{newsData.date}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className={`rounded-full p-2 transition-colors ${isDarkMode ? 'hover:bg-white/10 text-zinc-500' : 'hover:bg-black/5 text-zinc-400'}`}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className={`mb-8 space-y-4 rounded-3xl border p-6 transition-all duration-300
                ${isDarkMode ? 'bg-zinc-900/50 border-white/5' : 'bg-gray-50 border-black/5 shadow-inner'}`}>
                <div className="flex items-center gap-2">
                  <Terminal className={`h-4 w-4 ${isDarkMode ? 'text-[#d4af37]' : 'text-[#b8860b]'}`} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">Strategic Analytics</span>
                </div>
                <p className={`text-sm leading-relaxed font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>
                  {newsData.aiAnalysis}
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                   <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-50">
                     <Clock className="h-4 w-4" /> Live Economic Calendar
                   </h3>
                   <span className="text-[10px] px-2 py-1 rounded-full bg-[#d4af37]/10 text-[#d4af37] font-bold animate-pulse">CONNECTIVITY: LIVE</span>
                </div>

                <div className="grid gap-3">
                  {newsData.events.map((ev: any) => (
                    <div 
                      key={ev.id} 
                      className={`group flex items-center justify-between rounded-2xl border p-5 transition-all
                        ${isDarkMode ? 'bg-zinc-900/30 border-white/5 hover:border-[#d4af37]/30' : 'bg-white border-black/5 shadow-sm hover:border-[#d4af37]/30'}`}
                    >
                      <div className="flex items-center gap-5">
                        <div className={`h-12 w-1.5 rounded-full shadow-lg transition-transform group-hover:scale-y-110 
                          ${ev.impact === 'High' ? 'bg-red-500 shadow-red-500/20' : 'bg-[#d4af37] shadow-[#d4af37]/20'}`} />
                        <div>
                          <p className="font-bold tracking-tight">{ev.currency} <span className="opacity-30 mx-1">/</span> {ev.event}</p>
                          <p className="mt-1 text-xs font-mono opacity-50">
                            {new Date(ev.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] uppercase tracking-tighter opacity-40 mb-1 font-bold">Expectation</div>
                        <div className={`text-sm font-mono font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                          {ev.forecast} <ArrowRight className="inline h-3 w-3 opacity-30 mx-1" /> <span className="opacity-40">{ev.previous}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => setIsOpen(false)}
                className={`mt-10 flex w-full items-center justify-center gap-3 rounded-2xl py-6 text-sm font-bold uppercase tracking-widest transition-all
                  ${isDarkMode 
                    ? 'bg-[#d4af37] text-zinc-950 hover:bg-[#c5a037] hover:scale-[0.99]' 
                    : 'bg-zinc-950 text-white hover:bg-zinc-800 shadow-xl hover:shadow-zinc-950/20'}`}
              >
                Acknowledge Directive
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
