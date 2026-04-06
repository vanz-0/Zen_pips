"use client";

import * as React from "react";
import { motion } from "framer-motion";

interface AnimatedTextProps {
    words: string[];
    className?: string;
    delayPerWord?: number;
}

export function AnimatedText({ words, className = "", delayPerWord = 0.15 }: AnimatedTextProps) {
    return (
        <motion.h1
            initial={{ filter: "blur(10px)", opacity: 0, y: 50 }}
            animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={className}
        >
            {words.map((text, index) => (
                <motion.span
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        delay: index * delayPerWord,
                        duration: 0.6,
                    }}
                    className="inline-block mx-1 md:mx-2"
                >
                    {text}
                </motion.span>
            ))}
        </motion.h1>
    );
}
