"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { Camera, Type, Mic, FileVideo, AlertCircle } from "lucide-react";

type ItemType = "TEXT" | "PHOTO" | "AUDIO" | "VIDEO";

interface Memory {
  id: string;
  type: ItemType;
  label: string;
}

const MAX_ITEMS = 10;

export function MemoryDropzone() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Controls the shake animation on the counter
  const controls = useAnimation();

  const addMemory = async (type: ItemType) => {
    if (memories.length >= MAX_ITEMS) {
      // Punição tátil visual (Shaking)
      await controls.start({
        x: [0, -10, 10, -10, 10, -5, 5, 0],
        color: ["#9ca3af", "#ef4444", "#ef4444", "#9ca3af"],
        transition: { duration: 0.5 }
      });
      return;
    }

    const labels = {
      TEXT: "Carta Oculta",
      PHOTO: "Retrato Vintage",
      AUDIO: "Rolo de Voz",
      VIDEO: "Filme Super8"
    };
    
    setMemories([...memories, {
      id: Math.random().toString(36).substr(2, 9),
      type,
      label: labels[type]
    }]);
  };

  const getConfig = (type: ItemType) => {
    switch (type) {
      case "TEXT": return { 
        icon: <Type className="w-6 h-6 text-emerald-200" />, 
        bg: "bg-gradient-to-br from-emerald-900/40 to-emerald-900/10",
        border: "border-emerald-500/30",
        glow: "shadow-[0_0_15px_rgba(16,185,129,0.15)]"
      };
      case "PHOTO": return { 
        icon: <Camera className="w-6 h-6 text-amber-200" />, 
        bg: "bg-gradient-to-br from-amber-900/40 to-amber-900/10",
        border: "border-amber-500/30",
        glow: "shadow-[0_0_15px_rgba(245,158,11,0.15)]"
      };
      case "AUDIO": return { 
        icon: <Mic className="w-6 h-6 text-indigo-300" />, 
        bg: "bg-gradient-to-br from-indigo-900/40 to-purple-900/10",
        border: "border-indigo-500/30",
        glow: "shadow-[0_0_15px_rgba(99,102,241,0.15)]"
      };
      case "VIDEO": return { 
        icon: <FileVideo className="w-6 h-6 text-rose-300" />, 
        bg: "bg-gradient-to-br from-rose-900/40 to-rose-900/10",
        border: "border-rose-500/30",
        glow: "shadow-[0_0_15px_rgba(244,63,94,0.15)]"
      };
    }
  };

  return (
    <div className="flex flex-col gap-6 mt-8">
      <div className="flex justify-between items-end pb-2 border-b border-white/5 relative">
        <h3 className="text-sm tracking-widest text-gray-400 uppercase">Suas Relíquias</h3>
        
        {/* Contador com animação de controle */}
        <motion.div 
          animate={controls}
          className="flex flex-col items-end"
        >
          {memories.length === MAX_ITEMS && (
             <span className="text-[10px] text-red-400 absolute -top-4 right-0 font-bold tracking-widest uppercase">
                 CAPACIDADE MÁXIMA
             </span>
          )}
          <span className="text-sm text-gray-400 font-mono font-bold tracking-tight">
            {memories.length} <span className="text-gray-600 opacity-50">/ {MAX_ITEMS} MAX</span>
          </span>
        </motion.div>
      </div>

      {/* Caixa de vidro onde as coisas quicam (Dropzone) */}
      <div 
        ref={containerRef}
        className="min-h-[160px] p-4 glass-panel rounded-2xl flex flex-wrap gap-4 items-center justify-center relative overflow-hidden transition-all duration-500 bg-black/40 border border-white/10 shadow-inner"
      >
        <AnimatePresence>
          {memories.length === 0 && (
            <motion.p 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-gray-500 text-sm absolute select-none flex flex-col items-center gap-2"
            >
              <AlertCircle className="w-5 h-5 opacity-20" />
              O cofre aguarda.
            </motion.p>
          )}
          
          {memories.map((m) => {
            const config = getConfig(m.type);
            return (
              <motion.div
                layout
                key={m.id}
                // Spring Physics: Efeito Molenga / Quique!
                initial={{ scale: 0.1, opacity: 0, y: -40, rotate: Math.random() * -30 }}
                animate={{ scale: 1, opacity: 1, y: 0, rotate: 0 }}
                exit={{ scale: 0, opacity: 0, rotate: 90 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 15,
                  mass: 0.8
                }}
                
                // Arrabastar e Bater nas Paredes (Drag)
                drag
                dragConstraints={containerRef}
                dragElastic={0.2}
                whileDrag={{ scale: 1.15, zIndex: 50, rotate: 5, cursor: "grabbing" }}
                whileHover={{ y: -5, scale: 1.05 }}
                
                className={`flex flex-col gap-3 items-center justify-center w-[110px] h-[140px] rounded-2xl ${config.bg} ${config.border} border shadow-lg cursor-grab backdrop-blur-md relative overflow-hidden group hover:${config.glow} transition-shadow duration-300`}
              >
                {/* Reflexo superior do cartão lembrando vidro */}
                <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                
                <motion.div 
                  className="p-3 bg-black/30 rounded-full border border-white/5 backdrop-blur-xl shadow-inner group-hover:scale-110 transition-transform"
                >
                  {config.icon}
                </motion.div>
                <span className="text-[10px] text-gray-300/90 text-center uppercase tracking-wide leading-tight px-3 font-medium select-none z-10">
                  {m.label}
                </span>

                {/* Botão de deletar que aparece no hover */}
                <button 
                  onClick={() => setMemories(memories.filter(x => x.id !== m.id))}
                  className="absolute top-2 right-2 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-gray-400 opacity-0 group-hover:opacity-100 hover:text-white hover:bg-red-500/80 hover:scale-110 transition-all z-20 cursor-pointer"
                >
                  ×
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Control Tools - Fabrica de Relíquias */}
      <div className="flex gap-4 justify-center flex-wrap pt-2">
        <ToolButton icon={<Type className="text-emerald-400"/>} label="Carta" onClick={() => addMemory("TEXT")} disabled={memories.length >= MAX_ITEMS} />
        <ToolButton icon={<Camera className="text-amber-400"/>} label="Foto" onClick={() => addMemory("PHOTO")} disabled={memories.length >= MAX_ITEMS} />
        <ToolButton icon={<Mic className="text-indigo-400"/>} label="Voz" onClick={() => addMemory("AUDIO")} disabled={memories.length >= MAX_ITEMS} />
        <ToolButton icon={<FileVideo className="text-rose-400"/>} label="Vídeo" onClick={() => addMemory("VIDEO")} disabled={memories.length >= MAX_ITEMS} />
      </div>
    </div>
  );
}

function ToolButton({ icon, label, onClick, disabled }: { icon: React.ReactNode; label: string; onClick: () => void; disabled: boolean }) {
  return (
    <motion.button
      whileHover={!disabled ? { y: -3, scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      onClick={disabled ? undefined : onClick}
      className={`relative inline-flex items-center gap-2 px-5 py-3 rounded-2xl glass-panel text-sm transition-all border border-white/10 shadow-lg group overflow-hidden ${disabled ? 'opacity-40 cursor-not-allowed saturate-0' : 'text-gray-200 hover:text-white cursor-pointer hover:border-white/20 hover:shadow-xl'}`}
      type="button"
    >
      {/* Brilhozinho passando (Juice) */}
      {!disabled && (
         <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
      )}
      
      <div className="w-5 h-5 group-hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.5)] transition-all">
        {icon}
      </div>
      <span className="font-medium tracking-wide">{label}</span>
    </motion.button>
  );
}
