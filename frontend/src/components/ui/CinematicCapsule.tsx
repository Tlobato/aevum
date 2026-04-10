"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Type, Mic, FileVideo, Lock } from "lucide-react";
import { ItemType, Memory } from "@/types/capsule";
import { THEME_REGISTRY } from "@/config/themes";
import { PhysicalRelic } from "./relics/PhysicalRelic";
import { ForgeModal } from "./forge/ForgeModal";

const MAX_ITEMS = 10;
const DEFAULT_THEME_ID = "bau-pirata";

export function CinematicCapsule({ themeId = DEFAULT_THEME_ID }: { themeId?: string }) {
  const activeTheme = THEME_REGISTRY[themeId] ?? THEME_REGISTRY[DEFAULT_THEME_ID];
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isOpened, setIsOpened] = useState(false);
  const [isSealed, setIsSealed] = useState(false);
  const [isChomping, setIsChomping] = useState(false);
  const [flyingItem, setFlyingItem] = useState<Memory | null>(null);

  const [activeForgeMode, setActiveForgeMode] = useState<ItemType | null>(null);

  const initiateForge = (type: ItemType) => {
    if (memories.length >= MAX_ITEMS || isSealed) return;
    setActiveForgeMode(type);
    setIsOpened(true); 
  };

  const cancelForge = () => {
    setActiveForgeMode(null);
  };

  const handleLaunchMemory = (newMemoryData: Partial<Memory>) => {
    setActiveForgeMode(null);

    const newMemory: Memory = { 
      id: Math.random().toString(36).substring(2, 9), 
      type: newMemoryData.type as ItemType, 
      label: newMemoryData.label || "Memória Desconhecida",
      payload: newMemoryData.payload,
      fileName: newMemoryData.fileName
    };
    
    setFlyingItem(newMemory);
    
    setTimeout(() => { setIsChomping(true); }, 600);
    setTimeout(() => {
      setMemories(prev => [...prev, newMemory]);
      setFlyingItem(null);
      setIsChomping(false); 
    }, 1100); 
  };

  const sealVault = () => {
    setIsSealed(true);
    setIsOpened(false);
  };

  const isBlurMode = activeForgeMode !== null;

  return (
    <div className="flex flex-col items-center w-full min-h-[650px] relative pointer-events-auto">
      
      {/* Marcador de Armazenamento */}
      {memories.length > 0 && !isSealed && (
         <motion.div 
           initial={{ opacity: 0 }} animate={{ opacity: 1 }}
           className={`absolute top-0 right-4 md:right-8 bg-amber-900/30 px-4 py-2 rounded-full border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.2)] select-none z-10 transition-all ${isBlurMode ? 'opacity-20 blur-sm' : ''}`}
         >
           <span className="text-sm font-bold text-amber-500/90 tracking-widest uppercase">
             Armazenado: {memories.length}/{MAX_ITEMS}
           </span>
         </motion.div>
      )}

      {/* Container Principal do Baú */}
      <div className={`relative w-[340px] h-[340px] md:w-[450px] md:h-[450px] mt-8 flex flex-col items-center justify-center transition-all duration-500 ${isBlurMode ? 'blur-md opacity-30 scale-95 grayscale-[50%]' : ''}`}>
        <motion.div 
           className="absolute w-[80%] h-[40%] bg-amber-600/30 blur-[40px] rounded-full bottom-[20%]"
           animate={{ scale: isOpened && !isSealed ? 1.2 : 1, opacity: isOpened && !isSealed ? 1 : 0.4 }}
        />

        {/* Animação Parábola 3D da Relíquia */}
        <AnimatePresence>
            {flyingItem && (
               <motion.div
                 key={flyingItem.id}
                 initial={{ y: 250, scale: 0.2, opacity: 0 }}
                 animate={{ 
                    y: [250, -60, -10], 
                    scale: [0.2, 1.2, 0.4, 0], 
                    opacity: [0, 1, 1, 0.5, 0], 
                    rotateX: [0, 180, 500, 720],
                    rotateY: [0, 360, 500, 720],
                    rotateZ: [0, -180, -360]
                 }}
                 transition={{ duration: 1.1, times: [0, 0.4, 0.8, 1], ease: "easeInOut" }}
                 className="absolute left-1/2 top-1/3 ml-[-40px] mt-[-50px] z-[60] flex items-center justify-center"
                 style={{ perspective: "500px" }}
               >
                 <PhysicalRelic type={flyingItem.type} theme={activeTheme} />
               </motion.div>
            )}
        </AnimatePresence>

        {/* Máquina de Estado do PNG (O 'Chomp') */}
        <div className="relative w-full h-full z-20 pointer-events-none filter drop-shadow-2xl flex items-center justify-center">
            <motion.img 
              src={activeTheme.assets.vault.closed} className="absolute w-full max-h-full object-contain"
              animate={{ opacity: isChomping ? 0 : 1 }} transition={{ duration: 0 }} />
            <motion.img 
              src={activeTheme.assets.vault.opened} className="absolute w-full max-h-full object-contain"
              animate={{ opacity: isChomping ? 1 : 0 }} transition={{ duration: 0 }} />
        </div>
      </div>

      {/* Painel Inferior de Criação (Ações) */}
      <motion.div 
        animate={{ 
          opacity: isSealed ? 0 : 1, y: isSealed ? 80 : 0, scale: flyingItem ? 0.95 : 1, pointerEvents: isSealed || flyingItem || isBlurMode ? "none" : "auto" 
        }}
        transition={{ duration: 0.5 }}
        className={`mt-2 flex gap-4 w-full max-w-lg justify-center flex-wrap z-10 transition-all duration-500 ${isBlurMode ? 'opacity-0 blur-md translate-y-10' : ''}`}
      >
        <GameButton icon={<Type className="w-5 h-5"/>} label="Escrever" onClick={() => initiateForge("TEXT")} disabled={memories.length >= MAX_ITEMS} />
        <GameButton icon={<Camera className="w-5 h-5"/>} label="Revelar" onClick={() => initiateForge("PHOTO")} disabled={memories.length >= MAX_ITEMS} />
        <GameButton icon={<Mic className="w-5 h-5"/>} label="Gravar" onClick={() => initiateForge("AUDIO")} disabled={memories.length >= MAX_ITEMS} />
        <GameButton icon={<FileVideo className="w-5 h-5"/>} label="Filmar" onClick={() => initiateForge("VIDEO")} disabled={memories.length >= MAX_ITEMS} />
      </motion.div>

      {/* Botão Global de Selagem */}
      <motion.div
         animate={{ opacity: isOpened && !isSealed && memories.length > 0 && !isBlurMode ? 1 : 0, scale: isOpened && !isSealed && memories.length > 0 && !isBlurMode ? 1 : 0.8 }}
         className={`mt-8 pointer-events-auto transition-all ${isBlurMode ? 'pointer-events-none opacity-0' : ''}`}
      >
        <button onClick={sealVault} className="group relative px-10 py-5 bg-gradient-to-br from-amber-600 via-amber-500 to-amber-700 rounded-full text-black font-extrabold tracking-widest uppercase transition-all shadow-[0_0_50px_rgba(214,158,46,0.6)] hover:shadow-[0_0_100px_rgba(214,158,46,1)] transform hover:scale-105 active:scale-95 border-2 border-yellow-300">
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
          <div className="flex items-center gap-2 relative z-10"><Lock className="w-5 h-5" /> LACRAR PERMANENTEMENTE</div>
        </button>
      </motion.div>

      {/* ======================================================== */}
      {/* COMPONENTE FILHO INJETADO: O MODAL DA FORJA INTELIGENTE  */}
      {/* ======================================================== */}
      <AnimatePresence>
        {activeForgeMode && (
           <ForgeModal 
              activeForgeMode={activeForgeMode} 
              onCancel={cancelForge} 
              onLaunch={handleLaunchMemory} 
           />
        )}
      </AnimatePresence>
      
      {/* Splash Cênico de Selagem Final */}
      <AnimatePresence>
        {isSealed && (
            <motion.div 
               initial={{ opacity: 0, y: 50 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 1, duration: 1, type: "spring" }}
               className="absolute bottom-10 z-[110] px-10 py-8 rounded-3xl bg-black/50 shadow-2xl backdrop-blur-xl border border-amber-500/30 text-center"
            >
                <h3 className="text-4xl text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-600 font-serif font-black tracking-widest uppercase pb-2">O Tempo Congelou</h3>
                <p className="mt-2 text-amber-500/60 uppercase tracking-[0.2em] text-sm">Este receptáculo agora aguarda o futuro.</p>
            </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

// O componente ajudante do botão inferior
function GameButton({ icon, label, onClick, disabled }: { icon: React.ReactNode; label: string; onClick: () => void; disabled: boolean }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      className={`relative flex flex-col items-center justify-center gap-2 w-20 h-24 rounded-bl-xl rounded-br-3xl bg-gradient-to-br from-white/10 to-transparent border shadow-lg transition-all group overflow-hidden ${disabled ? 'border-white/5 opacity-50 grayscale cursor-not-allowed' : 'border-white/10 hover:border-amber-500/50 hover:bg-amber-900/10 hover:-translate-y-1 hover:scale-105 cursor-pointer'}`}
    >
      <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
      <div className={`transition-transform duration-300 ${!disabled ? 'text-gray-500 group-hover:text-amber-200 group-hover:scale-125 group-hover:drop-shadow-[0_0_10px_rgba(251,191,36,1)]' : 'text-gray-600'}`}>
        {icon}
      </div>
      <span className={`text-[10px] font-bold tracking-wider uppercase pt-1 transition-colors ${!disabled ? 'text-gray-400 group-hover:text-amber-200 drop-shadow-md' : 'text-gray-600'}`}>{label}</span>
      {!disabled && (
         <div className="absolute bottom-0 inset-x-0 h-[3px] bg-amber-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
      )}
    </button>
  );
}
