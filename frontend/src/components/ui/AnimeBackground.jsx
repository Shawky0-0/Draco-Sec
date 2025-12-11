import React from 'react';
import { motion } from 'framer-motion';

export const AnimeBackground = () => {
    // 15x15 grid = 225 dots
    const dots = Array.from({ length: 225 });

    return (
        <div className="absolute inset-0 grid grid-cols-[repeat(15,1fr)] gap-4 items-center justify-items-center opacity-30 pointer-events-none z-0">
            {dots.map((_, i) => (
                <motion.div
                    key={i}
                    className="w-2 h-2 bg-primary/20 rounded-full"
                    initial={{ scale: 0.1, opacity: 0.1 }}
                    animate={{
                        scale: [0.1, 1, 0.1],
                        opacity: [0.1, 0.5, 0.1]
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        delay: Math.random() * 2, // Random delay for organic "cyber" feel
                        ease: "easeInOut"
                    }}
                />
            ))}
        </div>
    );
};
