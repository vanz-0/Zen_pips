"use client";

import { useEffect, useRef, useState } from "react";
import { TrendingUp, TrendingDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useSignals } from "@/hooks/useSignals";

// ─── Types ───
export interface SignalData {
    id: string;
    pair: string;
    ticker: string;
    source: string;
    timeframe: string;
    direction: "BUY" | "SELL";
    status: string;
    entry: number;
    tp1: number;
    tp2: number;
    tp3: number;
    sl: number;
    current_sl: number;
    tp1_hit: boolean;
    tp2_hit: boolean;
    tp3_hit: boolean;
    sl_hit: boolean;
    closed: boolean;
    total_pips: number;
    pip_multiplier: number;
    confluence: string;
    created_at: string;
}

// ─── Watchlist pairs ───
const WATCHLIST = [
    { symbol: "OANDA:XAUUSD", display: "XAU/USD", name: "Gold", price: "5,183.47", change: "+0.87%", up: true },
    { symbol: "OANDA:XAGUSD", display: "XAG/USD", name: "Silver", price: "88.302", change: "+1.59%", up: true },
    { symbol: "COINBASE:BTCUSD", display: "BTC/USD", name: "Bitcoin", price: "66,045.0", change: "+3.08%", up: true },
    { symbol: "OANDA:GBPUSD", display: "GBP/USD", name: "British Pound", price: "1.35047", change: "+0.13%", up: true },
    { symbol: "OANDA:EURUSD", display: "EUR/USD", name: "Euro", price: "1.17805", change: "+0.07%", up: true },
    { symbol: "COINBASE:ETHUSD", display: "ETH/USD", name: "Ethereum", price: "1,917.84", change: "-3.43%", up: false },
];

// ─── Signals ───
// Signals are now fetched live from Supabase.

// ─── TradingView Widget (center chart) ───
function TradingViewChart({ symbol }: { symbol: string }) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        const container = containerRef.current;
        container.innerHTML = "";

        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
        script.type = "text/javascript";
        script.async = true;
        script.innerHTML = JSON.stringify({
            autosize: true,
            symbol: symbol,
            interval: "15",
            timezone: "Africa/Nairobi",
            theme: "dark",
            style: "1",
            locale: "en",
            backgroundColor: "rgba(10, 10, 10, 1)",
            gridColor: "rgba(255, 255, 255, 0.03)",
            hide_top_toolbar: false,
            hide_legend: false,
            allow_symbol_change: true,
            save_image: false,
            calendar: false,
            hide_volume: false,
            support_host: "https://www.tradingview.com",
        });

        const widgetDiv = document.createElement("div");
        widgetDiv.className = "tradingview-widget-container__widget";
        widgetDiv.style.height = "100%";
        widgetDiv.style.width = "100%";

        container.appendChild(widgetDiv);
        container.appendChild(script);

        return () => {
            container.innerHTML = "";
        };
    }, [symbol]);

    return (
        <div ref={containerRef} className="tradingview-widget-container w-full h-full" />
    );
}

// ─── Main Terminal Component ───
export function TradingTerminal() {
    const [selectedSymbol, setSelectedSymbol] = useState(WATCHLIST[0].symbol);
    const [leftOpen, setLeftOpen] = useState(true);
    const [rightOpen, setRightOpen] = useState(true);
    const { signals } = useSignals();

    // Derived global stats
    const totalPipsToday = signals.reduce((acc, sig) => acc + (sig.total_pips || 0), 0);
    const winRate = signals.length > 0
        ? Math.round((signals.filter(s => s.total_pips > 0).length / signals.length) * 100)
        : 100;

    return (
        <div className="w-full flex flex-col" style={{ height: "calc(100vh - 73px)" }}>
            {/* Terminal Header Bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#0d0d0d] border-b border-white/5">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setLeftOpen(!leftOpen)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                        title={leftOpen ? "Hide watchlist" : "Show watchlist"}
                    >
                        {leftOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold hidden sm:inline">Live Terminal</span>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                        </span>
                        <span className="text-green-400 text-[10px] font-mono font-bold">MARKET OPEN</span>
                    </div>
                    <div className="bg-[#d4af37]/10 border border-[#d4af37]/20 px-2.5 py-1 rounded-full">
                        <span className="text-[#d4af37] text-[10px] font-mono font-bold">+{totalPipsToday.toLocaleString()} PIPS TODAY</span>
                    </div>
                </div>

                <button
                    onClick={() => setRightOpen(!rightOpen)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                    title={rightOpen ? "Hide signals" : "Show signals"}
                >
                    {rightOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
            </div>

            {/* 3-Panel Layout */}
            <div className="flex flex-1 overflow-hidden">
                {/* ─── LEFT PANEL: Watchlist ─── */}
                {leftOpen && (
                    <div className="w-64 flex-shrink-0 bg-[#0d0d0d] border-r border-white/5 flex flex-col overflow-hidden">
                        <div className="px-3 py-2.5 border-b border-white/5 flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Market</span>
                            <span className="text-[10px] text-gray-600">{WATCHLIST.length} pairs</span>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {WATCHLIST.map((pair) => (
                                <button
                                    key={pair.symbol}
                                    onClick={() => setSelectedSymbol(pair.symbol)}
                                    className={`w-full text-left px-3 py-3 border-b border-white/3 transition-all cursor-pointer ${selectedSymbol === pair.symbol
                                        ? "bg-[#d4af37]/5 border-l-2 border-l-[#d4af37]"
                                        : "hover:bg-white/3 border-l-2 border-l-transparent"
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`font-bold text-sm ${selectedSymbol === pair.symbol ? "text-[#d4af37]" : "text-white"}`}>
                                            {pair.display}
                                        </span>
                                        <span className={`text-[10px] font-mono flex items-center gap-0.5 ${pair.up ? "text-green-400" : "text-red-400"}`}>
                                            {pair.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                            {pair.change}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-gray-500">{pair.name}</span>
                                        <span className="text-xs text-gray-300 font-mono">{pair.price}</span>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Account Summary */}
                        <div className="px-3 py-3 border-t border-white/5 bg-[#0a0a0a]">
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Today&apos;s Performance</div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <div className="text-green-400 font-mono font-bold text-sm">{winRate}%</div>
                                    <div className="text-[9px] text-gray-600">Win Rate</div>
                                </div>
                                <div>
                                    <div className="text-[#d4af37] font-mono font-bold text-sm">{signals.length}</div>
                                    <div className="text-[9px] text-gray-600">Signals</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── CENTER: TradingView Chart ─── */}
                <div className="flex-1 min-w-0 bg-[#0a0a0a]">
                    <TradingViewChart symbol={selectedSymbol} />
                </div>

                {/* ─── RIGHT PANEL: Signal Feed ─── */}
                {rightOpen && (
                    <div className="w-72 flex-shrink-0 bg-[#0d0d0d] border-l border-white/5 flex flex-col overflow-hidden">
                        <div className="px-3 py-2.5 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-[#d4af37] uppercase tracking-wider">⚡ Signals</span>
                            </div>
                            <span className="text-[10px] text-gray-600">25 Feb</span>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {signals.map((sig, i) => {
                                const isActive = sig.status === "ACTIVE";
                                const isTp1 = sig.tp1_hit;
                                const slMovedToEntry = sig.current_sl >= sig.entry && sig.direction === "BUY" || 
                                                       sig.current_sl <= sig.entry && sig.direction === "SELL";

                                // Format time from created_at
                                const sigDate = new Date(sig.created_at);
                                const timeStr = sigDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC';

                                // Build activity timeline events
                                const events: { icon: string; text: string; color: string; detail?: string }[] = [];
                                
                                events.push({
                                    icon: "🎯",
                                    text: `Entry placed at ${sig.entry}`,
                                    color: "text-[#d4af37]",
                                    detail: sig.confluence && !sig.confluence.includes("LOT OVERRIDE") ? sig.confluence : undefined
                                });

                                if (sig.tp1_hit) {
                                    events.push({
                                        icon: "✅",
                                        text: `TP1 hit at ${sig.tp1}`,
                                        color: "text-green-400",
                                        detail: "First target secured — profit locked in."
                                    });
                                }
                                
                                if (isTp1 && slMovedToEntry) {
                                    events.push({
                                        icon: "🛡️",
                                        text: `SL moved to ${sig.current_sl}`,
                                        color: "text-blue-400",
                                        detail: "Stop Loss moved to breakeven. This trade is now risk-free — capital fully protected while we target TP2 and TP3."
                                    });
                                } else if (sig.current_sl !== sig.sl) {
                                    events.push({
                                        icon: "🔄",
                                        text: `SL adjusted to ${sig.current_sl}`,
                                        color: "text-yellow-400",
                                        detail: "Stop Loss updated to lock in partial profits and reduce exposure. Smart risk management in action."
                                    });
                                }

                                if (sig.tp2_hit) {
                                    events.push({
                                        icon: "✅",
                                        text: `TP2 hit at ${sig.tp2}`,
                                        color: "text-green-400",
                                        detail: "Second target reached — strong momentum confirmed."
                                    });
                                }
                                if (sig.tp3_hit) {
                                    events.push({
                                        icon: "🏆",
                                        text: `TP3 hit at ${sig.tp3}`,
                                        color: "text-green-400",
                                        detail: "Full target reached — maximum profit extracted. Trade complete."
                                    });
                                }
                                if (sig.sl_hit) {
                                    events.push({
                                        icon: "🛑",
                                        text: `SL hit at ${sig.current_sl}`,
                                        color: "text-red-400",
                                        detail: slMovedToEntry 
                                            ? "Stopped at breakeven — no loss. Capital preserved for the next setup."
                                            : "Stop Loss triggered. Risk was pre-calculated and contained."
                                    });
                                }

                                // Status color mapping based on risk-management progression
                                const isLoss = sig.sl_hit && !slMovedToEntry;
                                const isBreakeven = sig.sl_hit && slMovedToEntry && !sig.tp2_hit;
                                const isTp2Stop = (sig.sl_hit && sig.tp2_hit);

                                const statusColor = sig.tp3_hit ? "text-green-400" 
                                    : (isTp2Stop || (sig.tp2_hit && !sig.tp3_hit)) ? "text-yellow-400" 
                                    : (isBreakeven || (sig.tp1_hit && !sig.tp2_hit)) ? "text-orange-400" 
                                    : isLoss ? "text-red-400" 
                                    : isActive ? "text-blue-400" 
                                    : "text-gray-400";

                                const statusDot = sig.tp3_hit ? "bg-green-500" 
                                    : (isTp2Stop || (sig.tp2_hit && !sig.tp3_hit)) ? "bg-yellow-500" 
                                    : (isBreakeven || (sig.tp1_hit && !sig.tp2_hit)) ? "bg-orange-500" 
                                    : isLoss ? "bg-red-500" 
                                    : "bg-blue-500";

                                return (
                                    <div
                                        key={sig.id}
                                        className={`px-3 py-3 border-b border-white/5 transition-colors cursor-pointer hover:bg-white/3 ${i === 0 ? "bg-green-500/3" : ""}`}
                                        onClick={() => {
                                            const match = WATCHLIST.find((w) => w.display === sig.pair);
                                            if (match) setSelectedSymbol(match.symbol);
                                        }}
                                    >
                                        {/* Signal Header */}
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-white font-bold text-sm">{sig.pair}</span>
                                                <span className="text-[9px] text-gray-500 font-mono">{sig.timeframe}</span>
                                            </div>
                                            <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${sig.direction === "BUY"
                                                ? "bg-green-500/10 text-green-400 border-green-500/20"
                                                : "bg-red-500/10 text-red-400 border-red-500/20"
                                                }`}>
                                                {sig.direction}
                                            </span>
                                        </div>

                                        {/* Status Badge */}
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <span className="relative flex h-1.5 w-1.5">
                                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${statusDot} opacity-75`}></span>
                                                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${statusDot}`}></span>
                                            </span>
                                            <span className={`text-[10px] font-mono font-bold ${statusColor}`}>
                                                {sig.status}
                                            </span>
                                            <span className="text-[9px] text-gray-600 ml-auto">{timeStr}</span>
                                        </div>

                                        {/* Levels Grid */}
                                        <div className="space-y-1 text-[10px]">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Entry</span>
                                                <span className="text-[#d4af37] font-mono font-bold">{sig.entry}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">TP1</span>
                                                <span className={`font-mono ${sig.tp1_hit ? "text-green-400 font-bold" : "text-gray-400"}`}>
                                                    {sig.tp1} {sig.tp1_hit ? "✓" : ""}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">TP2</span>
                                                <span className={`font-mono ${sig.tp2_hit ? "text-green-400 font-bold" : "text-gray-400"}`}>
                                                    {sig.tp2} {sig.tp2_hit ? "✓" : ""}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">TP3</span>
                                                <span className={`font-mono ${sig.tp3_hit ? "text-green-400 font-bold" : "text-gray-400"}`}>
                                                    {sig.tp3} {sig.tp3_hit ? "✓" : ""}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Original SL</span>
                                                <span className="text-red-400/50 font-mono line-through">{sig.sl}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500 font-semibold">Current SL</span>
                                                <span className={`font-mono font-bold ${slMovedToEntry ? "text-blue-400" : "text-red-400"}`}>
                                                    {sig.current_sl} {slMovedToEntry ? "🛡️" : ""}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Result Pips */}
                                        {sig.total_pips > 0 && (
                                            <div className="mt-2 pt-1.5 border-t border-white/5 flex justify-between items-center">
                                                <span className="text-[9px] text-gray-500">Result</span>
                                                <span className="text-green-400 font-mono font-bold text-xs">+{sig.total_pips} Pips</span>
                                            </div>
                                        )}

                                        {/* Activity Timeline */}
                                        <div className="mt-2 pt-2 border-t border-white/5">
                                            <div className="text-[9px] text-gray-500 uppercase tracking-wider mb-1.5 font-semibold">Activity</div>
                                            <div className="space-y-1.5">
                                                {events.map((evt, eIdx) => (
                                                    <div key={eIdx} className="flex items-start gap-1.5">
                                                        <span className="text-[10px] mt-0.5 flex-shrink-0">{evt.icon}</span>
                                                        <div className="min-w-0">
                                                            <div className={`text-[10px] font-mono font-semibold ${evt.color}`}>
                                                                {evt.text}
                                                            </div>
                                                            {evt.detail && (
                                                                <p className="text-[9px] text-gray-500 leading-snug mt-0.5">
                                                                    {evt.detail}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Signal Summary Footer */}
                        <div className="px-3 py-3 border-t border-white/5 bg-[#0a0a0a]">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-[9px] text-gray-500 uppercase tracking-wider">Confirmed</div>
                                    <div className="text-green-400 font-mono font-bold text-lg">+{totalPipsToday.toLocaleString()}</div>
                                    <div className="text-[9px] text-gray-600">Pips · 0 Losses</div>
                                </div>
                                <a
                                    href="https://t.me/Zen_pips_bot"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-6 py-2.5 bg-yellow-500 text-black font-bold uppercase tracking-widest text-sm rounded-lg hover:bg-yellow-400 transition-colors flex items-center gap-2"
                                >
                                    Get VIP Access
                                </a>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
