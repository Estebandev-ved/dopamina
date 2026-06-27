import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * Splash Screen showing on initial load.
 * Premium Visuals:
 * - Berlin Warehouse styling (Grid overlay, dark layout).
 * - Neon Purple glowing pulse animation.
 * - Smooth transition out of view after loading is completed.
 */
export default function Splash({ onComplete }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2800); // Display for 2.8 seconds
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, y: -50, transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black overflow-hidden"
    >
      {/* Background Grid Overlay */}
      <div className="absolute inset-0 industrial-grid-dense opacity-20 pointer-events-none" />

      {/* Background Glow Sphere */}
      <div className="absolute w-[300px] h-[300px] bg-neon-purple/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="text-center z-10 px-4">
        {/* Neon Pulse Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          {/* Logo Icon */}
          <div className="relative mb-6">
            <motion.div
              animate={{ 
                boxShadow: [
                  "0 0 10px rgba(157,0,255,0.4)", 
                  "0 0 35px rgba(188,52,250,0.8)", 
                  "0 0 10px rgba(157,0,255,0.4)"
                ] 
              }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="w-16 h-16 rounded-lg border border-neon-purple flex items-center justify-center bg-black text-neon-purple font-black text-3xl"
            >
              D
            </motion.div>
            <div className="absolute -inset-1 border border-neon-purple/30 rounded-lg blur-sm pointer-events-none" />
          </div>

          {/* Logo Text */}
          <h1 className="text-4xl md:text-5xl font-black tracking-[0.25em] text-white uppercase mb-2">
            DOPAMINA
          </h1>
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="text-xs md:text-sm font-semibold tracking-[0.4em] text-neon-violet uppercase"
          >
            Crew • Underground Culture
          </motion.div>
        </motion.div>
      </div>

      {/* Loading Bar */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-48 h-[2px] bg-industrial-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ left: '-100%' }}
          animate={{ left: '100%' }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-neon-violet to-transparent"
        />
      </div>
    </motion.div>
  );
}
