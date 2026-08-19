"use client";

import { useState } from "react";

export function LiveSignalChart() {
    return (
        <div className="w-full h-[400px] flex flex-col items-center justify-center bg-[var(--card-bg)] text-[var(--text-muted)] p-4 rounded-xl border border-[var(--border-color)]">
            <span className="text-4xl mb-4 block">📈</span>
            <span className="text-sm uppercase tracking-widest font-bold">Chart Integration Pending</span>
            <p className="text-xs mt-2 max-w-xs mx-auto text-center">
                The advanced charting module is currently being reconfigured for iOS compatibility.
            </p>
        </div>
    );
}
