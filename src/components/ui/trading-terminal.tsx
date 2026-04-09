"use client";

import { useEffect, useRef, useState } from "react";
import { TrendingUp, TrendingDown, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { useSignals } from "@/hooks/useSignals";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

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

// ─── TradingView Widget (center chart) ───
function TradingViewChart({ symbol }: { symbol: string }) {
    const { theme } = useTheme();
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
            theme: theme === "dark" ? "dark" : "light",
            style: "1",
            locale: "en",
            backgroundColor: theme === "dark" ? "rgba(10, 10, 10, 1)" : "rgba(255, 255, 255, 1)",
            gridColor: theme === "dark" ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.03)",
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
    }, [symbol, theme]);

    return (
        <div ref={containerRef} className="tradingview-widget-container w-full h-full" />
    );
}

// ─── Signal Card (reused in both sidebar and mobile toggle) ───
function SignalCard({ sig, onSelectSymbol, profile }: { sig: any; onSelectSymbol: (sym: string) => void; profile: any }) {
    const isActive = sig.status === "ACTIVE";
    const isTp1 = sig.tp1_hit;
    const isTp2 = sig.tp2_hit;
    const isTp3 = sig.tp3_hit;
    const slMovedToEntry = sig.current_sl >= sig.entry && sig.direction === "BUY" ||
        sig.current_sl <= sig.entry && sig.direction === "SELL";

    const sigDate = new Date(sig.created_at);
    const timeStr = sigDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC';

    const now = new Date();
    const diffMs = now.getTime() - sigDate.getTime();
    const diffHours = diffMs / (1000 * 3600);
    const isGated = false; // Platform is free — no signal gating

    const events: { icon: string; text: string; color: string; detail?: string }[] = [];
    events.push({ icon: "🎯", text: `Entry placed at ${sig.entry}`, color: "text-[#d4af37]", detail: sig.confluence });
    if (sig.tp1_hit) events.push({ icon: "✅", text: `TP1 hit at ${sig.tp1}`, color: "text-[var(--color-success)]", detail: "Target 1 secured. Trade is now risk-free." });
    if (isTp1 && slMovedToEntry) events.push({ icon: "🛡️", text: "SL MOVED TO ENTRY", color: "text-[var(--color-info)]", detail: "Capital protected at breakeven." });
    if (sig.tp2_hit) events.push({ icon: "💰", text: `TP2 hit at ${sig.tp2}`, color: "text-[var(--color-success)]", detail: "Secondary targets hit." });
    if (sig.tp3_hit) events.push({ icon: "🏆", text: "FULL TAKE PROFIT TAKEN", color: "text-[var(--color-success)]", detail: `Completed at ${sig.tp3}. Maximum yield.` });

    const statusColor = isTp3 ? "text-[var(--color-success)]" : isTp2 ? "text-yellow-400" : isTp1 ? "text-[var(--color-warning)]" : isActive ? "text-[var(--color-info)]" : "text-[var(--text-muted)]";
    const statusDot = isTp3 ? "bg-green-500" : isTp2 ? "bg-yellow-500" : isTp1 ? "bg-orange-500" : "bg-blue-500";

    return (
        <div
            className="px-3 py-3 border-b border-[var(--border-color)] transition-colors"
            onClick={() => {
                const match = WATCHLIST.find((w) => w.display === sig.pair);
                if (match) onSelectSymbol(match.symbol);
            }}
        >
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-[var(--foreground)] font-black text-sm tracking-tight">{sig.pair}</span>
                    <span className="text-[9px] text-[var(--text-muted)] font-mono bg-[var(--panel-bg)] px-1.5 py-0.5 rounded">{sig.timeframe}</span>
                </div>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${sig.direction === "BUY"
                    ? "bg-green-500/10 text-[var(--color-success)] border-green-500/20"
                    : "bg-red-500/10 text-[var(--color-danger)] border-red-500/20"
                    }`}>
                    {sig.direction}
                </span>
            </div>

            <div className="flex items-center gap-1.5 mb-3">
                <span className="relative flex h-1.5 w-1.5">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${statusDot} opacity-75`}></span>
                    <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${statusDot}`}></span>
                </span>
                <span className={`text-[10px] font-black uppercase tracking-widest ${statusColor}`}>{sig.status}</span>
                <span className="text-[9px] text-[var(--text-muted)] ml-auto font-mono">{timeStr}</span>
            </div>

            <div className={`grid grid-cols-2 gap-2 text-[10px] mb-3 relative ${isGated ? 'blur-md select-none' : ''}`}>
                <div className="bg-white/[0.02] border border-[var(--border-color)] p-2 rounded-lg">
                    <span className="text-[var(--text-muted)] block mb-0.5 font-bold uppercase text-[8px] tracking-tighter">Entry</span>
                    <span className="text-[var(--foreground)] font-mono font-bold">{sig.entry.toLocaleString()}</span>
                </div>
                <div className={`border p-2 rounded-lg transition-all ${isTp1 ? "bg-green-500/10 border-green-500/30" : "bg-white/[0.02] border-[var(--border-color)]"}`}>
                    <span className={`${isTp1 ? "text-[var(--color-success)]" : "text-[var(--text-muted)]"} block mb-0.5 font-bold uppercase text-[8px] tracking-tighter`}>TP 1</span>
                    <span className={`font-mono font-bold ${isTp1 ? "text-[var(--color-success)]" : "text-[var(--text-muted)]"}`}>{sig.tp1.toLocaleString()} {isTp1 && "✓"}</span>
                </div>
                <div className={`border p-2 rounded-lg transition-all ${isTp2 ? "bg-green-500/10 border-green-500/30" : "bg-white/[0.02] border-[var(--border-color)]"}`}>
                    <span className={`${isTp2 ? "text-[var(--color-success)]" : "text-[var(--text-muted)]"} block mb-0.5 font-bold uppercase text-[8px] tracking-tighter`}>TP 2</span>
                    <span className={`font-mono font-bold ${isTp2 ? "text-[var(--color-success)]" : "text-[var(--text-muted)]"}`}>{sig.tp2.toLocaleString()} {isTp2 && "✓"}</span>
                </div>
                <div className={`border p-2 rounded-lg transition-all ${isTp3 ? "bg-green-500/10 border-green-500/30" : "bg-white/[0.02] border-[var(--border-color)]"}`}>
                    <span className={`${isTp3 ? "text-[var(--color-success)]" : "text-[var(--text-muted)]"} block mb-0.5 font-bold uppercase text-[8px] tracking-tighter`}>TP 3</span>
                    <span className={`font-mono font-bold ${isTp3 ? "text-[var(--color-success)]" : "text-[var(--text-muted)]"}`}>{sig.tp3.toLocaleString()} {isTp3 && "✓"}</span>
                </div>
                <div className="col-span-2 bg-blue-500/5 border border-blue-500/10 p-2 rounded-lg flex justify-between items-center">
                    <span className="text-[var(--color-info)] font-bold uppercase text-[8px] tracking-tighter">Current SL Protection</span>
                    <span className={`font-mono font-bold ${slMovedToEntry ? "text-[var(--color-info)]" : "text-[var(--color-danger)]"}`}>
                        {sig.current_sl.toLocaleString()} {slMovedToEntry ? "🛡️" : ""}
                    </span>
                </div>
                {isGated && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-lg border border-yellow-500/20">
                        <span className="text-[9px] text-yellow-500 font-black uppercase tracking-widest">VIP ALPHA GATED</span>
                    </div>
                )}
            </div>

            <div className="space-y-1.5 pt-2 border-t border-[var(--border-color)]">
                <p className="text-[9px] text-[var(--text-muted)] uppercase font-black tracking-widest">Operational Log</p>
                {events.map((evt, eIdx) => (
                    <div key={eIdx} className="flex gap-2">
                        <span className="text-xs">{evt.icon}</span>
                        <div className="min-w-0 flex-1">
                            <p className={`text-[10px] font-black tracking-tight ${evt.color}`}>{evt.text}</p>
                            {evt.detail && <p className="text-[9px] text-[var(--text-muted)] leading-tight mt-0.5">{evt.detail}</p>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Main Terminal Component ───
export function TradingTerminal() {
    const [selectedSymbol, setSelectedSymbol] = useState(WATCHLIST[0].symbol);
    const [leftOpen, setLeftOpen] = useState(true);
    const [rightOpen, setRightOpen] = useState(true);
    const [mobileSignalsOpen, setMobileSignalsOpen] = useState(false);
    const { signals } = useSignals();
    const { user, profile } = useAuth();

    const totalPipsToday = signals.reduce((acc, sig: any) => acc + (sig.total_pips || 0), 0);
    const winRate = signals.length > 0
        ? Math.round((signals.filter((s: any) => (s.total_pips || 0) > 0).length / signals.length) * 100)
        : 100;

    const selectedPair = WATCHLIST.find(w => w.symbol === selectedSymbol);

    return (
        <div className="w-full flex flex-col" style={{ height: "calc(100vh - 73px)" }}>
            {/* Terminal Header Bar */}
            <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-[var(--panel-bg)] border-b border-[var(--border-color)]">
                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Desktop: sidebar toggle. Hidden on mobile */}
                    <button
                        onClick={() => setLeftOpen(!leftOpen)}
                        className="hidden lg:block p-1.5 rounded-lg bg-[var(--panel-bg)] hover:bg-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
                        title={leftOpen ? "Hide watchlist" : "Show watchlist"}
                    >
                        {leftOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    <span className="text-[10px] sm:text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Live Terminal</span>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-full">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                        </span>
                        <span className="text-[var(--color-success)] text-[9px] sm:text-[10px] font-mono font-bold">LIVE</span>
                    </div>
                    <div className="hidden sm:block bg-[#d4af37]/10 border border-[#d4af37]/20 px-2.5 py-1 rounded-full">
                        <span className="text-[#d4af37] text-[10px] font-mono font-bold">🎯 {totalPipsToday.toLocaleString()} PIPS</span>
                    </div>
                </div>

                {/* Desktop: right sidebar toggle. Hidden on mobile */}
                <button
                    onClick={() => setRightOpen(!rightOpen)}
                    className="hidden lg:block p-1.5 rounded-lg bg-[var(--panel-bg)] hover:bg-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
                    title={rightOpen ? "Hide signals" : "Show signals"}
                >
                    {rightOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
            </div>

            {/* ─── MOBILE: Market Selector Dropdown (above chart) ─── */}
            <div className="lg:hidden flex items-center gap-1.5 px-3 py-2 bg-[var(--panel-bg)] border-b border-[var(--border-color)] overflow-x-auto">
                {WATCHLIST.map((pair) => (
                    <button
                        key={pair.symbol}
                        onClick={() => setSelectedSymbol(pair.symbol)}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${selectedSymbol === pair.symbol
                            ? "bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/30"
                            : "bg-[var(--card-bg)] text-[var(--text-muted)] border border-[var(--border-color)]"
                            }`}
                    >
                        {pair.display}
                    </button>
                ))}
            </div>

            {/* ─── MAIN LAYOUT ─── */}
            <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
                {/* ─── LEFT PANEL: Watchlist (Desktop only) ─── */}
                {leftOpen && (
                    <div className="hidden lg:flex w-64 flex-shrink-0 bg-[var(--panel-bg)] border-r border-[var(--border-color)] flex-col overflow-hidden">
                        <div className="px-3 py-2.5 border-b border-[var(--border-color)] flex items-center justify-between">
                            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Market</span>
                            <span className="text-[10px] text-[var(--text-muted)]">{WATCHLIST.length} pairs</span>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {WATCHLIST.map((pair) => (
                                <button
                                    key={pair.symbol}
                                    onClick={() => setSelectedSymbol(pair.symbol)}
                                    className={`w-full text-left px-3 py-3 border-b border-[var(--border-color)] transition-all cursor-pointer ${selectedSymbol === pair.symbol
                                        ? "bg-[#d4af37]/5 border-l-2 border-l-[#d4af37]"
                                        : "hover:bg-[var(--sub-panel-bg)] border-l-2 border-l-transparent"
                                        }`}
                                >
                                    <div className="flex flex-col mb-1">
                                        <span className={`font-bold text-sm ${selectedSymbol === pair.symbol ? "text-[#d4af37]" : "text-[var(--foreground)]"}`}>
                                            {pair.display}
                                        </span>
                                        <span className="text-[10px] text-[var(--text-muted)] mt-1">{pair.name}</span>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="px-3 py-3 border-t border-[var(--border-color)] bg-[var(--card-bg)]">
                            <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-2">Today&apos;s Performance</div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <div className="text-[var(--color-success)] font-mono font-bold text-sm">{winRate}%</div>
                                    <div className="text-[9px] text-[var(--text-muted)]">Win Rate</div>
                                </div>
                                <div>
                                    <div className="text-[#d4af37] font-mono font-bold text-sm">{signals.length}</div>
                                    <div className="text-[9px] text-[var(--text-muted)]">Signals</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── CENTER: TradingView Chart ─── */}
                <div className="flex-1 min-w-0 min-h-[300px] lg:min-h-0 bg-[var(--card-bg)]">
                    <TradingViewChart symbol={selectedSymbol} />
                </div>

                {/* ─── RIGHT PANEL: Signal Feed (Desktop only) ─── */}
                {rightOpen && (
                    <div className="hidden lg:flex w-72 flex-shrink-0 bg-[var(--panel-bg)] border-l border-[var(--border-color)] flex-col overflow-hidden">
                        <div className="px-3 py-2.5 border-b border-[var(--border-color)] flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-[#d4af37] uppercase tracking-wider">⚡ Signals</span>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {signals.map((sig: any) => (
                                <SignalCard key={sig.id} sig={sig} onSelectSymbol={setSelectedSymbol} profile={profile} />
                            ))}
                        </div>

                        <div className="px-4 py-3 border-t border-[var(--border-color)] bg-[var(--card-bg)]">
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold">Confirmed Performance</div>
                                        <div className="flex items-baseline gap-1.5">
                                            <div className="text-[var(--color-success)] font-mono font-black text-xl">+{totalPipsToday.toLocaleString()}</div>
                                            <div className="text-[10px] text-[var(--color-success)] font-bold uppercase tracking-tight">Pips</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold">Win Rate</div>
                                        <div className="text-[var(--foreground)] font-mono font-black text-lg">100%</div>
                                    </div>
                                </div>
                                <a
                                    href="https://t.me/Zen_pips_bot"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full py-3 bg-yellow-500 text-black font-black uppercase tracking-[0.1em] text-center text-xs rounded-xl hover:bg-yellow-400 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(234,179,8,0.2)]"
                                >
                                    Get VIP Access
                                </a>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ─── MOBILE: Signals Toggle (below chart) ─── */}
            <div className="lg:hidden border-t border-[var(--border-color)] bg-[var(--panel-bg)]">
                <button
                    onClick={() => setMobileSignalsOpen(!mobileSignalsOpen)}
                    className="w-full flex items-center justify-between px-4 py-3"
                >
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#d4af37] uppercase tracking-wider">⚡ Signals</span>
                        <span className="text-[10px] text-[var(--text-muted)] bg-[var(--card-bg)] px-2 py-0.5 rounded-full border border-[var(--border-color)]">{signals.length}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] text-[var(--color-success)] font-mono font-bold">+{totalPipsToday.toLocaleString()} pips</span>
                        {mobileSignalsOpen ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />}
                    </div>
                </button>

                {mobileSignalsOpen && (
                    <div className="max-h-[50vh] overflow-y-auto border-t border-[var(--border-color)]">
                        {signals.map((sig: any) => (
                            <SignalCard key={sig.id} sig={sig} onSelectSymbol={setSelectedSymbol} profile={profile} />
                        ))}
                        <div className="p-3">
                            <a
                                href="https://t.me/Zen_pips_bot"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-3 bg-yellow-500 text-black font-black uppercase tracking-[0.08em] text-center text-xs rounded-xl flex items-center justify-center gap-2"
                            >
                                Get VIP Access
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
