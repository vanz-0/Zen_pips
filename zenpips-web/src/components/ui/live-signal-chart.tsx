"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
    createChart,
    ColorType,
    CrosshairMode,
    LineSeries,
    CandlestickSeries,
    createSeriesMarkers,
} from "lightweight-charts";

// ─── REAL SIGNAL DATA (from live TradingView screenshots, 25 Feb 2026) ───

interface Signal {
    pair: string;
    timeframe: string;
    direction: "BUY" | "SELL";
    entry: number;
    tp1: number;
    tp2: number;
    tp3: number;
    sl: number;
    status: string;
    tp1Hit: boolean;
    tp2Hit: boolean;
    tp3Hit: boolean;
    pipMultiplier: number; // gold/silver = 100, BTC = 1
    resultPips: number;
}

const SIGNALS: Signal[] = [
    {
        pair: "BTC/USD",
        timeframe: "M5",
        direction: "BUY",
        entry: 64423.5,
        tp1: 64689.5,
        tp2: 64955.5,
        tp3: 65221.5,
        sl: 64157.5,
        status: "ALL TPs HIT",
        tp1Hit: true,
        tp2Hit: true,
        tp3Hit: true,
        pipMultiplier: 1,
        resultPips: 266 + 532 + 798, // 1,596 pips
    },
    {
        pair: "BTC/USD",
        timeframe: "M15",
        direction: "BUY",
        entry: 63945,
        tp1: 65105,
        tp2: 66265,
        tp3: 67425,
        sl: 62785,
        status: "TP2 HIT · RISK-FREE",
        tp1Hit: true,
        tp2Hit: true,
        tp3Hit: false,
        pipMultiplier: 1,
        resultPips: 1160 + 2320, // 3,480 pips confirmed
    },
    {
        pair: "XAU/USD",
        timeframe: "M5",
        direction: "BUY",
        entry: 5168.73,
        tp1: 5194.88,
        tp2: 5221.04,
        tp3: 5247.19,
        sl: 5142.57,
        status: "ACTIVE",
        tp1Hit: false,
        tp2Hit: false,
        tp3Hit: false,
        pipMultiplier: 100,
        resultPips: 0, // floating
    },
    {
        pair: "XAG/USD",
        timeframe: "M5",
        direction: "BUY",
        entry: 88.19,
        tp1: 89.19,
        tp2: 90.19,
        tp3: 91.19,
        sl: 87.18,
        status: "ACTIVE",
        tp1Hit: false,
        tp2Hit: false,
        tp3Hit: false,
        pipMultiplier: 100,
        resultPips: 0,
    },
];

// Generate realistic candle data around a signal
function generateCandleData(signal: Signal, count: number) {
    const data = [];
    let price = signal.entry - (signal.direction === "BUY" ? 8 : -8) * (signal.tp1 - signal.entry) / 10;
    const now = Math.floor(Date.now() / 1000);
    const interval = signal.timeframe === "M5" ? 300 : 900;
    const entryIdx = Math.floor(count * 0.3);

    for (let i = 0; i < count; i++) {
        const time = now - (count - i) * interval;
        const range = Math.abs(signal.tp1 - signal.entry) * 0.3;
        const volatility = range * (0.3 + Math.random() * 0.7);

        let direction: number;
        if (i < entryIdx) {
            // Pre-entry: sideways/slightly down for BUY
            direction = signal.direction === "BUY" ? (Math.random() > 0.55 ? -1 : 1) : (Math.random() > 0.55 ? 1 : -1);
        } else {
            // Post-entry: trending in signal direction
            const progress = (i - entryIdx) / (count - entryIdx);
            const trendBias = signal.direction === "BUY" ? 0.65 + progress * 0.15 : 0.35 - progress * 0.15;
            direction = Math.random() < trendBias ? 1 : -1;
        }

        const open = price;
        const close = open + direction * volatility;
        const high = Math.max(open, close) + Math.random() * range * 0.4;
        const low = Math.min(open, close) - Math.random() * range * 0.4;

        data.push({
            time: time as unknown as string,
            open: Math.round(open * 100) / 100,
            high: Math.round(high * 100) / 100,
            low: Math.round(low * 100) / 100,
            close: Math.round(close * 100) / 100,
        });

        price = close;

        // Guide price towards TPs after entry
        if (i === entryIdx) price = signal.entry;
        if (i === Math.floor(count * 0.5) && signal.tp1Hit) price = signal.tp1;
        if (i === Math.floor(count * 0.65) && signal.tp2Hit) price = signal.tp2;
        if (i === Math.floor(count * 0.8) && signal.tp3Hit) price = signal.tp3;
    }

    return data;
}

function formatPips(pips: number): string {
    return pips >= 1000 ? `+${pips.toLocaleString()}` : `+${pips}`;
}

export function LiveSignalChart() {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const signal = SIGNALS[activeIndex];

    const handleResize = useCallback(() => {
        if (chartRef.current && chartContainerRef.current) {
            chartRef.current.applyOptions({
                width: chartContainerRef.current.clientWidth,
                height: chartContainerRef.current.clientHeight,
            });
        }
    }, []);

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const container = chartContainerRef.current;

        // Remove old chart
        if (chartRef.current) {
            chartRef.current.remove();
            chartRef.current = null;
        }

        const chart = createChart(container, {
            width: container.clientWidth,
            height: container.clientHeight,
            layout: {
                background: { type: ColorType.Solid, color: "transparent" },
                textColor: "#555",
                fontFamily: "'Inter', sans-serif",
                fontSize: 11,
            },
            grid: {
                vertLines: { color: "rgba(255,255,255,0.03)" },
                horzLines: { color: "rgba(255,255,255,0.03)" },
            },
            crosshair: {
                mode: CrosshairMode.Normal,
                vertLine: { color: "rgba(212,175,55,0.3)", labelBackgroundColor: "#d4af37" },
                horzLine: { color: "rgba(212,175,55,0.3)", labelBackgroundColor: "#d4af37" },
            },
            rightPriceScale: {
                borderColor: "rgba(255,255,255,0.05)",
                scaleMargins: { top: 0.08, bottom: 0.08 },
            },
            timeScale: {
                borderColor: "rgba(255,255,255,0.05)",
                timeVisible: true,
                secondsVisible: false,
            },
            handleScale: { mouseWheel: true, pinch: true },
            handleScroll: { mouseWheel: true, pressedMouseMove: true },
        });

        chartRef.current = chart;

        // Candlestick series
        const candleSeries = chart.addSeries(CandlestickSeries, {
            upColor: "#22c55e",
            downColor: "#ef4444",
            borderDownColor: "#ef4444",
            borderUpColor: "#22c55e",
            wickDownColor: "#ef4444",
            wickUpColor: "#22c55e",
        });

        const candleData = generateCandleData(signal, 100);
        candleSeries.setData(candleData);

        // Signal markers using v5 API
        const entryIdx = Math.floor(candleData.length * 0.3);
        const tp1Idx = Math.floor(candleData.length * 0.5);
        const tp2Idx = Math.floor(candleData.length * 0.65);
        const tp3Idx = Math.floor(candleData.length * 0.8);

        const markers: Array<{
            time: string;
            position: "aboveBar" | "belowBar";
            color: string;
            shape: "arrowDown" | "arrowUp";
            text: string;
        }> = [
                {
                    time: candleData[entryIdx].time,
                    position: signal.direction === "BUY" ? "belowBar" : "aboveBar",
                    color: "#d4af37",
                    shape: signal.direction === "BUY" ? "arrowUp" : "arrowDown",
                    text: `${signal.direction} @ ${signal.entry}`,
                },
            ];

        if (signal.tp1Hit) {
            markers.push({
                time: candleData[tp1Idx].time,
                position: signal.direction === "BUY" ? "aboveBar" : "belowBar",
                color: "#22c55e",
                shape: signal.direction === "BUY" ? "arrowUp" : "arrowDown",
                text: "TP1 ✓",
            });
        }
        if (signal.tp2Hit) {
            markers.push({
                time: candleData[tp2Idx].time,
                position: signal.direction === "BUY" ? "aboveBar" : "belowBar",
                color: "#22c55e",
                shape: signal.direction === "BUY" ? "arrowUp" : "arrowDown",
                text: "TP2 ✓",
            });
        }
        if (signal.tp3Hit) {
            markers.push({
                time: candleData[tp3Idx].time,
                position: signal.direction === "BUY" ? "aboveBar" : "belowBar",
                color: "#16a34a",
                shape: signal.direction === "BUY" ? "arrowUp" : "arrowDown",
                text: "TP3 ✓",
            });
        }

        createSeriesMarkers(candleSeries, markers);

        // TP / SL / Entry horizontal lines
        const addLevelLine = (price: number, color: string, title: string) => {
            const lineSeries = chart.addSeries(LineSeries, {
                color,
                lineWidth: 1,
                lineStyle: 2,
                priceLineVisible: false,
                lastValueVisible: false,
                crosshairMarkerVisible: false,
            });
            const lineData = candleData.slice(entryIdx).map((c) => ({ time: c.time, value: price }));
            lineSeries.setData(lineData);
            lineSeries.createPriceLine({
                price,
                color,
                lineWidth: 1,
                lineStyle: 2,
                axisLabelVisible: true,
                title,
            });
        };

        addLevelLine(signal.entry, "#d4af37", "ENTRY");
        addLevelLine(signal.tp1, "#22c55e", "TP1");
        addLevelLine(signal.tp2, "#22c55e", "TP2");
        addLevelLine(signal.tp3, "#16a34a", "TP3");
        addLevelLine(signal.sl, "#ef4444", "SL");

        chart.timeScale().fitContent();

        const resizeObserver = new ResizeObserver(() => handleResize());
        resizeObserver.observe(container);
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            resizeObserver.disconnect();
            chart.remove();
            chartRef.current = null;
        };
    }, [activeIndex, signal, handleResize]);

    // Calculate total pips across all signals
    const totalConfirmedPips = SIGNALS.reduce((sum, s) => sum + s.resultPips, 0);

    return (
        <div className="relative w-full h-full">
            {/* Chart */}
            <div ref={chartContainerRef} className="absolute inset-0" />

            {/* Signal Tabs - top left */}
            <div className="absolute top-2 left-2 z-10 flex gap-1.5 flex-wrap">
                {SIGNALS.map((s, i) => (
                    <button
                        key={`${s.pair}-${s.timeframe}`}
                        onClick={() => setActiveIndex(i)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition-all border cursor-pointer ${i === activeIndex
                                ? "bg-[#d4af37]/20 text-[#d4af37] border-[#d4af37]/40"
                                : "bg-white/5 text-gray-500 border-white/5 hover:text-gray-300 hover:border-white/10"
                            }`}
                    >
                        {s.pair} {s.timeframe}
                    </button>
                ))}
            </div>

            {/* Direction + Status badge - top right */}
            <div className="absolute top-2 right-2 z-10 flex items-center gap-2 pointer-events-none">
                <div
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${signal.direction === "BUY"
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}
                >
                    {signal.direction}
                </div>
                <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
                    <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                    </span>
                    <span className="text-green-400 text-[10px] font-mono font-bold">{signal.status}</span>
                </div>
            </div>

            {/* Signal Detail Panel - bottom right */}
            <div className="absolute bottom-2 right-2 z-10 pointer-events-none">
                <div className="bg-[#0a0a0a]/90 backdrop-blur-sm border border-white/10 rounded-xl p-2.5 text-[10px] space-y-1">
                    <div className="flex justify-between gap-5">
                        <span className="text-gray-500">Entry</span>
                        <span className="text-[#d4af37] font-mono font-bold">{signal.entry}</span>
                    </div>
                    <div className="flex justify-between gap-5">
                        <span className="text-gray-500">TP1</span>
                        <span className={`font-mono ${signal.tp1Hit ? "text-green-400 font-bold" : "text-gray-400"}`}>
                            {signal.tp1} {signal.tp1Hit ? "✓" : ""}
                        </span>
                    </div>
                    <div className="flex justify-between gap-5">
                        <span className="text-gray-500">TP2</span>
                        <span className={`font-mono ${signal.tp2Hit ? "text-green-400 font-bold" : "text-gray-400"}`}>
                            {signal.tp2} {signal.tp2Hit ? "✓" : ""}
                        </span>
                    </div>
                    <div className="flex justify-between gap-5">
                        <span className="text-gray-500">TP3</span>
                        <span className={`font-mono ${signal.tp3Hit ? "text-green-400 font-bold" : "text-gray-400"}`}>
                            {signal.tp3} {signal.tp3Hit ? "✓" : ""}
                        </span>
                    </div>
                    <div className="flex justify-between gap-5">
                        <span className="text-gray-500">SL</span>
                        <span className="text-red-400 font-mono">{signal.sl}</span>
                    </div>
                    {signal.resultPips > 0 && (
                        <div className="border-t border-white/5 pt-1 flex justify-between gap-5">
                            <span className="text-gray-500">Pips</span>
                            <span className="text-green-400 font-mono font-bold">{formatPips(signal.resultPips)}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Total Pips Counter - bottom left */}
            <div className="absolute bottom-2 left-2 z-10 pointer-events-none">
                <div className="bg-[#0a0a0a]/90 backdrop-blur-sm border border-[#d4af37]/20 rounded-xl px-3 py-2">
                    <div className="text-[9px] text-gray-500 uppercase tracking-wider mb-0.5">Today&apos;s Confirmed</div>
                    <div className="text-green-400 font-mono font-bold text-sm">{formatPips(totalConfirmedPips)} Pips</div>
                </div>
            </div>
        </div>
    );
}
