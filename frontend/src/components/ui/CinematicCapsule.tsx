"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Type, Mic, FileVideo, Lock } from "lucide-react";

type ItemType = "TEXT" | "PHOTO" | "AUDIO" | "VIDEO";
interface Memory { id: string; type: ItemType; label: string; }
const MAX_ITEMS = 10;

// ==========================================
// CSS ART DOS OBJETOS (AS RELÍQUIAS FÍSICAS)
// ==========================================
function PhysicalRelic({ type }: { type: ItemType }) {
  if (type === "TEXT") {
    return (
      <div className="w-[80px] h-[100px] mx-auto bg-[#ebd5b3] rounded-sm shadow-xl relative flex items-center justify-center border-l-4 border-r-4 border-[#d4b886]">
        <div className="absolute top-3 left-2 right-2 space-y-1 opacity-20">
          <div className="w-full h-1 bg-black rounded" />
          <div className="w-5/6 h-1 bg-black rounded" />
          <div className="w-full h-1 bg-black rounded" />
        </div>
        <div className="w-8 h-8 bg-red-700/90 rounded-full shadow-inner flex items-center justify-center border-2 border-red-900/40">
           <div className="w-5 h-5 border border-red-900/20 rounded-full" />
        </div>
      </div>
    );
  }
  if (type === "PHOTO") {
    return (
      <div className="w-[90px] h-[110px] mx-auto bg-[#f8f8f8] p-1.5 pb-4 shadow-xl border border-white/50 rounded-sm flex items-start justify-center">
        <div className="w-full h-[70%] bg-gradient-to-br from-gray-800 to-black shadow-inner relative overflow-hidden">
           <div className="absolute -top-4 -right-4 w-12 h-20 bg-white/20 rotate-45 blur-sm" />
        </div>
      </div>
    );
  }
  if (type === "AUDIO") {
    return (
      <div className="w-[110px] h-[70px] mx-auto bg-gray-400 rounded-md shadow-lg p-1 relative border-t-2 border-white/40 flex items-center justify-center">
        <div className="w-[80%] h-[60%] bg-gray-800/80 rounded-sm flex items-center justify-between px-2">
           <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center"><div className="w-1.5 h-1.5 bg-black rounded-full"/></div>
           <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center"><div className="w-1.5 h-1.5 bg-black rounded-full"/></div>
        </div>
      </div>
    );
  }
  if (type === "VIDEO") {
    return (
      <div className="w-[100px] h-[80px] mx-auto bg-slate-900 rounded-sm shadow-xl flex flex-col relative border border-white/10">
        <div className="h-4 w-full flex">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`flex-1 h-full ${i % 2 === 0 ? 'bg-white' : 'bg-black'} skew-x-[-15deg] scale-110`} />
          ))}
        </div>
        <div className="flex-1 w-full border-t border-white/20" />
      </div>
    );
  }
  return null;
}

export function CinematicCapsule() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isOpened, setIsOpened] = useState(false);
  const [isSealed, setIsSealed] = useState(false);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [flyingItem, setFlyingItem] = useState<Memory | null>(null);

  const addMemory = (type: ItemType) => {
    if (memories.length >= MAX_ITEMS) return;
    if (isSealed) return;
    setIsOpened(true);

    const labels = {
      TEXT: "Documento Selado", PHOTO: "Registro Focal", AUDIO: "Cassete de Voz", VIDEO: "Fita Mastreada"
    };
    const newMemory = { id: Math.random().toString(36).substr(2, 9), type, label: labels[type] };
    
    setFlyingItem(newMemory);
    
    // O timing cirúrgico: a carta leva 1 seg pra cair. No segundo 0.6, o vídeo da boca abre!
    setTimeout(() => {
      setIsPlayingVideo(true);
      if (videoRef.current) {
        videoRef.current.currentTime = 0; // garante que toque do início
        videoRef.current.play();
      }
    }, 600); // Toca o vídeo um pouco antes da carta bater pra dar a sensação de que engoliu no ar

    setTimeout(() => {
      setMemories(prev => [...prev, newMemory]);
      setFlyingItem(null);
    }, 1100); 
  };

  const sealVault = () => {
    setIsSealed(true);
    setIsOpened(false);
  };

  return (
    <div className="flex flex-col items-center w-full min-h-[650px] relative pointer-events-auto">
      
      {/* HUD de Estoque */}
      {memories.length > 0 && !isSealed && (
         <motion.div 
           initial={{ opacity: 0 }} animate={{ opacity: 1 }}
           className="absolute top-0 right-4 md:right-8 bg-amber-900/30 px-4 py-2 rounded-full border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.2)] select-none z-10"
         >
           <span className="text-sm font-bold text-amber-500/90 tracking-widest uppercase">
             Armazenado: {memories.length}/{MAX_ITEMS}
           </span>
         </motion.div>
      )}

      {/* ÁREA DO COFRE */}
      <div className="relative w-[340px] h-[340px] md:w-[450px] md:h-[450px] mt-8 flex flex-col items-center justify-center">
        
        {/* Luz de Fundo permanente (aumentada pro bau dela reluzir) */}
        <motion.div 
           className="absolute w-[80%] h-[40%] bg-amber-600/30 blur-[40px] rounded-full bottom-[20%]"
           animate={{ scale: isOpened && !isSealed ? 1.2 : 1, opacity: isOpened && !isSealed ? 1 : 0.4 }}
        />

        {/* ======================================================== */}
        {/* O VÔO FÍSICO (A Relíquia cai cravada na imagem!) */}
        {/* ======================================================== */}
        <AnimatePresence>
            {flyingItem && (
               <motion.div
                 key={flyingItem.id}
                 // Aterrissa mais pro meio superior da caixa (-20y de offset)
                 initial={{ y: 250, scale: 0.2, opacity: 0 }}
                 animate={{ 
                    y: [250, -60, -20], 
                    scale: [0.2, 1.2, 0.4, 0], // reduz pra sumir DENTRO do baú
                    opacity: [0, 1, 1, 0.5, 0], 
                    rotateX: [0, 180, 500, 720],
                    rotateY: [0, 360, 500, 720],
                    rotateZ: [0, -180, -360]
                 }}
                 transition={{ duration: 1.1, times: [0, 0.4, 0.8, 1], ease: "easeInOut" }}
                 className="absolute left-1/2 top-1/3 ml-[-40px] mt-[-50px] z-[60] flex items-center justify-center"
                 style={{ perspective: "500px" }}
               >
                 <PhysicalRelic type={flyingItem.type} />
               </motion.div>
            )}
        </AnimatePresence>

        {/* ======================================================== */}
        {/* AS ARTES MAGISTRÁVEIS (Estático PNG e WEBM Transparente) */}
        {/* ======================================================== */}
        <div className="relative w-full h-full z-20 pointer-events-none filter drop-shadow-2xl flex items-center justify-center">

            {/* A Imagem Base Estática */}
            <motion.img 
              src="/bau-fechado.png" 
              className="absolute w-full max-h-full object-contain"
              animate={{ opacity: isPlayingVideo ? 0 : 1 }}
              transition={{ duration: 0.1 }}
            />

            {/* O Vídeo de "Bocada Mágica". Invisível até a carta encostar. */}
            <motion.video 
              ref={videoRef}
              src="/bau-abre-fecha.webm" 
              autoPlay={false}
              muted
              playsInline
              onEnded={() => setIsPlayingVideo(false)} // Assim que o video bater a tampa, escondemos ele de volta!
              className="absolute w-full max-h-full object-contain"
              animate={{ opacity: isPlayingVideo ? 1 : 0 }}
              transition={{ duration: 0.05 }}
            />
             
        </div>

        {/* CLARÃO ABSURDO DE SUCESSO E IMPACTO (SELO PERMANENTE) */}
        <AnimatePresence>
            {isSealed && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: [0, 1, 0, 0], scale: [0, 3, 5, 8] }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none"
                >
                    <div className="w-[150px] h-[150px] bg-white rounded-full blur-[40px] opacity-100 mix-blend-screen" />
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      {/* ======================================================== */}
      {/* PAINEL DE CONTROLES INFERIORES: GERADORES DE RELÍQUIAS   */}
      {/* ======================================================== */}
      <motion.div 
        animate={{ 
          opacity: isSealed ? 0 : 1, 
          y: isSealed ? 80 : 0, 
          scale: flyingItem ? 0.95 : 1, 
          pointerEvents: isSealed || flyingItem ? "none" : "auto" 
        }}
        transition={{ duration: 0.5 }}
        className="mt-2 flex gap-4 w-full max-w-lg justify-center flex-wrap z-10"
      >
        <GameButton icon={<Type className="w-5 h-5 text-gray-500 group-hover:text-amber-200 transition-colors"/>} label="Escrever" onClick={() => addMemory("TEXT")} disabled={memories.length >= MAX_ITEMS} />
        <GameButton icon={<Camera className="w-5 h-5 text-gray-500 group-hover:text-amber-200 transition-colors"/>} label="Revelar" onClick={() => addMemory("PHOTO")} disabled={memories.length >= MAX_ITEMS} />
        <GameButton icon={<Mic className="w-5 h-5 text-gray-500 group-hover:text-amber-200 transition-colors"/>} label="Gravar" onClick={() => addMemory("AUDIO")} disabled={memories.length >= MAX_ITEMS} />
        <GameButton icon={<FileVideo className="w-5 h-5 text-gray-500 group-hover:text-amber-200 transition-colors"/>} label="Filmar" onClick={() => addMemory("VIDEO")} disabled={memories.length >= MAX_ITEMS} />
      </motion.div>

      {/* BOTÃO DO DESTINO: SELAR O COFRE */}
      <motion.div
         animate={{ opacity: isOpened && !isSealed && memories.length > 0 ? 1 : 0, scale: isOpened && !isSealed && memories.length > 0 ? 1 : 0.8 }}
         className="mt-8 pointer-events-auto"
      >
        <button
          onClick={sealVault}
          className="group relative px-10 py-5 bg-gradient-to-br from-amber-600 via-amber-500 to-amber-700 rounded-full text-black font-extrabold tracking-widest uppercase transition-all shadow-[0_0_50px_rgba(214,158,46,0.6)] hover:shadow-[0_0_100px_rgba(214,158,46,1)] transform hover:scale-105 active:scale-95 border-2 border-yellow-300 overflow-hidden"
        >
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
          <div className="flex items-center gap-2 relative z-10">
            <Lock className="w-5 h-5" />
            LACRAR PERMANENTEMENTE
          </div>
        </button>
      </motion.div>
      
      {/* MENSAGEM FINAL PÓS SELAGEM MANTENDO O COFRE NA TELA */}
      <AnimatePresence>
        {isSealed && (
            <motion.div 
               initial={{ opacity: 0, y: 50 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 1, duration: 1, type: "spring" }}
               className="absolute bottom-10 px-10 py-8 rounded-3xl bg-black/50 shadow-2xl backdrop-blur-xl border border-amber-500/30 text-center"
            >
                <h3 className="text-4xl text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-600 font-serif font-black tracking-widest uppercase pb-2">O Tempo Congelou</h3>
                <p className="mt-2 text-amber-500/60 uppercase tracking-[0.2em] text-sm">Este receptáculo agora aguarda o futuro.</p>
            </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

function GameButton({ icon, label, onClick, disabled }: { icon: React.ReactNode; label: string; onClick: () => void; disabled: boolean }) {
  return (
    <motion.button
      whileHover={!disabled ? { y: -6, scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.9 } : {}}
      onClick={disabled ? undefined : onClick}
      className={`relative flex flex-col items-center justify-center gap-2 w-20 h-24 rounded-bl-xl rounded-br-3xl bg-gradient-to-br from-white/10 to-transparent border shadow-lg transition-colors group overflow-hidden ${disabled ? 'border-white/5 opacity-50 grayscale cursor-not-allowed' : 'border-white/10 hover:border-amber-500/50 hover:bg-amber-900/10 cursor-pointer'}`}
    >
      <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
      <motion.div className={`transition-transform duration-300 ${!disabled && 'group-hover:scale-125 group-hover:drop-shadow-[0_0_10px_rgba(251,191,36,1)]'}`}>
        {icon}
      </motion.div>
      <span className={`text-[10px] font-bold tracking-wider uppercase pt-1 transition-colors ${!disabled ? 'text-gray-400 group-hover:text-amber-200 drop-shadow-md' : 'text-gray-600'}`}>{label}</span>
      {!disabled && (
         <div className="absolute bottom-0 inset-x-0 h-[3px] bg-amber-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
      )}
    </motion.button>
  );
}
