"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface InteractiveHoverButtonProps {
    text?: string;
    href?: string;
    className?: string;
}

export function InteractiveHoverButton({ text = "Button", className, href }: InteractiveHoverButtonProps) {
    const inner = (
        <div
            className={cn(
                "group relative w-auto cursor-pointer overflow-hidden rounded-full border border-[#d4af37]/30 bg-[#0a0a0a] px-8 py-4 text-center font-semibold text-white",
                className
            )}
        >
            <span className="inline-flex items-center gap-2 translate-x-0 transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0">
                {text}
            </span>
            <div className="absolute top-0 z-10 flex h-full w-full translate-x-12 items-center justify-center gap-2 text-black opacity-0 transition-all duration-300 group-hover:-translate-x-1 group-hover:opacity-100">
                <span>{text}</span>
                <ArrowRight className="w-5 h-5" />
            </div>
            <div className="absolute left-[20%] top-[40%] h-2 w-2 scale-[1] rounded-full bg-[#d4af37] transition-all duration-300 group-hover:left-[0%] group-hover:top-[0%] group-hover:h-full group-hover:w-full group-hover:scale-[1.8] group-hover:bg-[#d4af37]"></div>
        </div>
    );

    if (href) {
        return (
            <a href={href} target="_blank" rel="noopener noreferrer">
                {inner}
            </a>
        );
    }

    return inner;
}
