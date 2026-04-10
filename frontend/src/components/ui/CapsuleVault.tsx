"use client";

import { motion } from "framer-motion";
import { MemoryDropzone } from "./MemoryDropzone";
import { Lock, Mail, Calendar, Key } from "lucide-react";
import { useState } from "react";

export function CapsuleVault() {
  const [isSealing, setIsSealing] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="w-full max-w-2xl mx-auto glass-panel p-8 md:p-12 rounded-[2rem] shadow-2xl relative overflow-hidden"
    >
      {/* Glow effect in background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-amber-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-white/5 border border-white/10 mb-2">
            <Key className="w-6 h-6 text-amber-500" />
          </div>
          <h2 className="text-3xl font-light tracking-tight text-white">Forjar Cápsula</h2>
          <p className="text-sm text-gray-400 max-w-sm mx-auto">
            Defina os artefatos que viajarão no tempo. Quando você selar, eles pertencerão apenas ao futuro.
          </p>
        </div>

        {/* Form Inputs */}
        <div className="space-y-5">
          <div className="space-y-1">
            <label className="text-[11px] uppercase tracking-widest text-gray-500 ml-3">Título do Legado</label>
            <input 
              type="text" 
              placeholder="Ex: Para a minha filha, quando fizer 18"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1">
              <label className="text-[11px] uppercase tracking-widest text-gray-500 ml-3">Data de Despertar</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                  type="date" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-all [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] uppercase tracking-widest text-gray-500 ml-3">Guardião Principal (E-mail)</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                  type="email" 
                  placeholder="guarda@futuro.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        <MemoryDropzone />

        <div className="pt-8 flex justify-center">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsSealing(true)}
            className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-amber-600/80 to-amber-500/80 hover:from-amber-500 hover:to-amber-400 rounded-full text-white font-medium tracking-wide shadow-[0_0_40px_rgba(212,175,55,0.3)] transition-all overflow-hidden"
          >
            <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            <Lock className="w-5 h-5" />
            <span>Selar Permanentemente</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
