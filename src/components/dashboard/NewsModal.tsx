'use client'
import { useState, useEffect } from 'react'
import { AlertTriangle, Clock, X, Terminal } from 'lucide-react'

export default function NewsModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [newsData, setNewsData] = useState<any>(null)
  
  useEffect(() => {
    const checkNews = async () => {
      try {
        const today = new Date().toISOString().split('T')[0]
        const lastSeen = localStorage.getItem('news_modal_seen_date')
        
        const res = await fetch('/api/news')
        const data = await res.json()
        setNewsData(data)
        
        // Show modal on first load of the day
        if (lastSeen !== today) {
          setIsOpen(true)
          localStorage.setItem('news_modal_seen_date', today)
        }
      } catch (e) {
        console.error("Failed to fetch news data", e)
      }
    }
    checkNews()
  }, [])

  if (!isOpen || !newsData) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-zinc-900 border border-[#d4af37]/30 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        
        <div className="bg-[#d4af37]/10 p-6 border-b border-[#d4af37]/20 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-red-500/20 p-2 rounded-full">
               <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white font-[family-name:var(--font-outfit)] uppercase tracking-wide">Daily Institutional News</h2>
              <p className="text-xs text-zinc-400 mt-1 uppercase tracking-widest">{newsData.date}</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* AI Analysis */}
          <div className="bg-black/50 border border-zinc-800 rounded-2xl p-5">
             <div className="flex items-center gap-2 mb-3 text-[#d4af37]">
                <Terminal className="w-4 h-4" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest">AI Market Bias</span>
             </div>
             <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed font-mono">
                {newsData.aiAnalysis}
             </p>
          </div>

          {/* Event List */}
          <div>
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Scheduled High-Impact Events
            </h3>
            <div className="space-y-3">
              {newsData.events.map((ev: any) => (
                <div key={ev.id} className="bg-zinc-800/30 border border-zinc-800 rounded-xl p-4 flex justify-between items-center hover:border-red-500/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-10 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        {ev.currency} <span className="text-zinc-500 font-normal">|</span> {ev.event}
                      </div>
                      <div className="text-xs text-zinc-400 mt-1 font-mono">
                        {new Date(ev.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-xs font-mono">
                     <span className="text-zinc-500">FCST:</span> <span className="text-white font-bold">{ev.forecast}</span><br/>
                     <span className="text-zinc-500">PREV:</span> <span className="text-white font-bold">{ev.previous}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <button 
             onClick={() => setIsOpen(false)}
             className="w-full py-4 text-sm font-bold uppercase tracking-widest bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-all"
          >
             Acknowledge & Enter Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
