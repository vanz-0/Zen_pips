"use client";

import { useEffect, useRef, useState } from "react";
import { TrendingUp, TrendingDown, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";

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
    const [signals, setSignals] = useState<SignalData[]>([]);

    // Fetch signals from Supabase 
    useEffect(() => {
        const fetchSignals = async () => {
            const { data, error } = await supabase
                .from('signals')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching signals:", error);
            } else if (data) {
                setSignals(data as SignalData[]);
            }
        };

        fetchSignals();

        // Subscribe to live updates
        const channel = supabase
            .channel('signals_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'signals' }, (payload) => {
                fetchSignals(); // Refresh on any change
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

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

                                // Format time from created_at
                                const sigDate = new Date(sig.created_at);
                                const timeStr = sigDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC';

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

                                        {/* Status */}
                                        <div className="flex items-center gap-1.5 mb-2">
                                            {!isActive && (
                                                <span className="relative flex h-1.5 w-1.5">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                                                </span>
                                            )}
                                            {isActive && (
                                                <span className="relative flex h-1.5 w-1.5">
                                                    <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
                                                </span>
                                            )}
                                            <span className={`text-[10px] font-mono font-bold ${isActive ? "text-blue-400" : "text-green-400"}`}>
                                                {sig.status}
                                            </span>
                                            <span className="text-[9px] text-gray-600 ml-auto">{timeStr}</span>
                                        </div>

                                        {/* Levels */}
                                        <div className="space-y-1 text-[10px]">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Entry</span>
                                                <span className="text-[#d4af37] font-mono font-bold">{sig.entry.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">TP1</span>
                                                <span className={`font-mono ${sig.tp1_hit ? "text-green-400 font-bold" : "text-gray-400"}`}>
                                                    {sig.tp1.toLocaleString()} {sig.tp1_hit ? "✓" : ""}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">TP2</span>
                                                <span className={`font-mono ${sig.tp2_hit ? "text-green-400 font-bold" : "text-gray-400"}`}>
                                                    {sig.tp2.toLocaleString()} {sig.tp2_hit ? "✓" : ""}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">TP3</span>
                                                <span className={`font-mono ${sig.tp3_hit ? "text-green-400 font-bold" : "text-gray-400"}`}>
                                                    {sig.tp3.toLocaleString()} {sig.tp3_hit ? "✓" : ""}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">SL</span>
                                                <span className="text-red-400 font-mono">{sig.sl.toLocaleString()}</span>
                                            </div>
                                        </div>

                                        {/* Result */}
                                        {sig.total_pips > 0 && (
                                            <div className="mt-2 pt-1.5 border-t border-white/5 flex justify-between items-center">
                                                <span className="text-[9px] text-gray-500">Result</span>
                                                <span className="text-green-400 font-mono font-bold text-xs">+{sig.total_pips} Pips</span>
                                            </div>
                                        )}

                                        {/* Confluence */}
                                        <p className="mt-1.5 text-[9px] text-gray-600 leading-relaxed italic">
                                            {sig.confluence}
                                        </p>
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
                                    href="https://t.me/Zen_pips"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-[#d4af37] text-black text-[10px] font-bold px-3 py-2 rounded-lg hover:brightness-110 transition-all"
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
