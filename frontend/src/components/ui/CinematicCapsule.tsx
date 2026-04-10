"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Type, Mic, FileVideo, Lock, X, FileUp, PenLine, Paperclip, CheckCircle2, Square, MonitorPlay } from "lucide-react";

type ItemType = "TEXT" | "PHOTO" | "AUDIO" | "VIDEO";
type SubMode = "WRITE" | "UPLOAD";
interface Memory { id: string; type: ItemType; label: string; payload?: string; fileName?: string; }
const MAX_ITEMS = 10;

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
  const [isChomping, setIsChomping] = useState(false);
  const [flyingItem, setFlyingItem] = useState<Memory | null>(null);

  const [activeForgeMode, setActiveForgeMode] = useState<ItemType | null>(null);
  const [forgeSubMode, setForgeSubMode] = useState<SubMode>("WRITE");
  const [forgeText, setForgeText] = useState("");
  const [forgeFile, setForgeFile] = useState<File | null>(null);

  const [recordState, setRecordState] = useState<"IDLE" | "RECORDING" | "DONE" | "ERROR">("IDLE");
  const [recordSeconds, setRecordSeconds] = useState(0);

  // === WEBRTC MEDIA DEVICES LOGIC ===
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (recordState === "RECORDING") {
      interval = setInterval(() => { setRecordSeconds(prev => prev + 1); }, 1000);
    }
    return () => clearInterval(interval);
  }, [recordState]);

  const cleanupHardwareTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (liveVideoRef.current) {
      liveVideoRef.current.srcObject = null;
    }
  };

  const startHardwareRecording = async (mode: "AUDIO" | "VIDEO") => {
    try {
      chunksRef.current = [];
      const constraints = { audio: true, video: mode === "VIDEO" };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (mode === "VIDEO" && liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream;
        liveVideoRef.current.muted = true; // prevent feedback loop locally
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        // Quando parar, compila o arquivo de RAM e atrela ao "forgeFile" invisível
        const mimeType = mode === "VIDEO" ? 'video/webm' : 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const fakeFile = new File([blob], `gravacao_${Date.now()}.webm`, { type: mimeType });
        setForgeFile(fakeFile);
        cleanupHardwareTracks();
      };

      mediaRecorder.start();
      setRecordState("RECORDING");
      setRecordSeconds(0);
    } catch (err) {
      console.error("Hardware Recording Error:", err);
      setRecordState("ERROR");
    }
  };

  const stopHardwareRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setRecordState("DONE");
    }
  };

  const initiateForge = (type: ItemType) => {
    if (memories.length >= MAX_ITEMS || isSealed) return;
    setForgeText("");
    setForgeFile(null);
    setRecordState("IDLE");
    setRecordSeconds(0);
    setForgeSubMode("WRITE"); 
    setActiveForgeMode(type);
    setIsOpened(true); 
  };

  const cancelForge = () => {
    cleanupHardwareTracks(); // Desliga luz verde da câmera
    setActiveForgeMode(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setForgeFile(e.target.files[0]);
    }
  };

  const isValidToForge = () => {
    if (activeForgeMode === "TEXT") {
      if (forgeSubMode === "WRITE") return forgeText.trim().length >= 3;
      return forgeFile !== null;
    }
    if (activeForgeMode === "AUDIO" || activeForgeMode === "VIDEO") {
      if (forgeSubMode === "WRITE") return recordState === "DONE" && forgeFile !== null;
      return forgeFile !== null;
    }
    return forgeFile !== null;
  };

  const getAcceptString = () => {
    if (activeForgeMode === "TEXT") return ".pdf,.txt,.doc,.docx,.rtf";
    if (activeForgeMode === "PHOTO") return "image/*";
    if (activeForgeMode === "AUDIO") return "audio/*";
    if (activeForgeMode === "VIDEO") return "video/*";
    return "*";
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const launchMemory = () => {
    if (!activeForgeMode || !isValidToForge()) return;
    
    // Safety stop
    if (recordState === "RECORDING") stopHardwareRecording();
    cleanupHardwareTracks();

    const targetType = activeForgeMode;
    const finalLabel = forgeFile ? forgeFile.name : (targetType === "TEXT" ? "Texto Redigido" : "Registro Temporário");
    
    setActiveForgeMode(null);

    const newMemory: Memory = { 
      id: Math.random().toString(36).substr(2, 9), 
      type: targetType, 
      label: finalLabel,
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

      <div className={`relative w-[340px] h-[340px] md:w-[450px] md:h-[450px] mt-8 flex flex-col items-center justify-center transition-all duration-500 ${isBlurMode ? 'blur-md opacity-30 scale-95 grayscale-[50%]' : ''}`}>
        <motion.div 
           className="absolute w-[80%] h-[40%] bg-amber-600/30 blur-[40px] rounded-full bottom-[20%]"
           animate={{ scale: isOpened && !isSealed ? 1.2 : 1, opacity: isOpened && !isSealed ? 1 : 0.4 }}
        />

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
                 <PhysicalRelic type={flyingItem.type} />
               </motion.div>
            )}
        </AnimatePresence>

        <div className="relative w-full h-full z-20 pointer-events-none filter drop-shadow-2xl flex items-center justify-center">
            <motion.img 
              src="/bau-fechado.png" className="absolute w-full max-h-full object-contain"
              animate={{ opacity: isChomping ? 0 : 1 }} transition={{ duration: 0 }} />
            <motion.img 
              src="/bau-aberto.png" className="absolute w-full max-h-full object-contain"
              animate={{ opacity: isChomping ? 1 : 0 }} transition={{ duration: 0 }} />
        </div>
      </div>

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
      {/* O MODAL DE FORJA (OVERLAY COM HARDWARE ACCESS)           */}
      {/* ======================================================== */}
      <AnimatePresence>
        {activeForgeMode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="absolute inset-x-0 top-10 md:top-20 z-[100] max-w-md w-full mx-auto p-6 md:p-8 rounded-3xl bg-black/90 backdrop-blur-2xl border border-amber-500/40 shadow-[0_0_50px_rgba(245,158,11,0.2)]"
          >
            <button onClick={cancelForge} className="absolute top-4 right-4 text-gray-400 hover:text-amber-500 transition-colors bg-white/5 rounded-full p-2 z-50">
              <X size={20} />
            </button>
            
            <h3 className="text-2xl font-serif text-amber-500 font-bold mb-1 uppercase tracking-widest flex items-center gap-2 relative z-20">
               {activeForgeMode === "TEXT" && <Type size={20}/>}
               {activeForgeMode === "PHOTO" && <Camera size={20}/>}
               {activeForgeMode === "AUDIO" && <Mic size={20}/>}
               {activeForgeMode === "VIDEO" && <FileVideo size={20}/>}
               {activeForgeMode === "TEXT" ? "Documento" : 
                activeForgeMode === "PHOTO" ? "Fotografia" : 
                activeForgeMode === "AUDIO" ? "Áudio" : "Filmagens"}
            </h3>
            <p className="text-xs text-amber-500/60 mb-6 uppercase tracking-wider relative z-20">Configure o registro eterno desta memória</p>

            {/* ABAS (Toggles) DE MÚLTIPLOS CAMINHOS */}
            {(activeForgeMode === "TEXT" || activeForgeMode === "AUDIO" || activeForgeMode === "VIDEO") && (
              <div className="flex w-full bg-white/5 p-1 rounded-xl mb-6 relative z-20">
                <button 
                  onClick={() => setForgeSubMode("WRITE")} 
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold uppercase transition-all ${forgeSubMode === "WRITE" ? 'bg-amber-600/90 text-black shadow-lg shadow-amber-900/50' : 'text-gray-500 hover:text-amber-200'}`}
                >
                  {activeForgeMode === "TEXT" && <PenLine size={16}/>}
                  {activeForgeMode === "AUDIO" && <Mic size={16}/>}
                  {activeForgeMode === "VIDEO" && <MonitorPlay size={16}/>}
                  {activeForgeMode === "TEXT" ? "Redigir" : (activeForgeMode === "AUDIO" ? "Gravar Áudio" : "Ligar Câmera")}
                </button>
                <button 
                  onClick={() => {
                     setForgeSubMode("UPLOAD");
                     cleanupHardwareTracks();
                     setRecordState("IDLE");
                  }} 
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold uppercase transition-all ${forgeSubMode === "UPLOAD" ? 'bg-amber-600/90 text-black shadow-lg shadow-amber-900/50' : 'text-gray-500 hover:text-amber-200'}`}
                >
                  <Paperclip size={16}/>
                  Anexar Arquivo
                </button>
              </div>
            )}

            {/* MODO REDIGIR */}
            {activeForgeMode === "TEXT" && forgeSubMode === "WRITE" && (
              <textarea 
                value={forgeText}
                onChange={e => setForgeText(e.target.value)}
                autoFocus
                placeholder="Insira os pensamentos ou fatos que merecem perdurar pelo tempo (mínimo 3 letras)..."
                className="w-full h-[220px] bg-white/5 border border-amber-900/50 rounded-xl p-4 text-white placeholder-gray-600 outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/80 resize-none mb-6 font-serif leading-relaxed relative z-20"
              />
            )}

            {/* MODO HARDWARE (WEBCAM E MICROFONE REAIS) */}
            {(activeForgeMode === "AUDIO" || activeForgeMode === "VIDEO") && forgeSubMode === "WRITE" && (
               <div className="w-full h-[220px] bg-black/80 border border-amber-900/50 rounded-xl flex flex-col items-center justify-center mb-6 relative overflow-hidden transition-colors">
                  
                  {/* FEED DA WEBCAM AO VIVO NO FUNDO */}
                  {activeForgeMode === "VIDEO" && (
                     <video 
                        ref={liveVideoRef} 
                        autoPlay 
                        playsInline 
                        muted 
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${recordState === "RECORDING" ? 'opacity-100' : 'opacity-20'}`}
                     />
                  )}

                  {recordState === "ERROR" && (
                    <div className="flex flex-col items-center gap-4 relative z-10 px-4 text-center">
                       <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center"><X size={32}/></div>
                       <span className="text-red-400 font-bold uppercase tracking-wider text-xs">Acesso Negado ou Aparelho Indisponível</span>
                       <button onClick={() => setRecordState("IDLE")} className="text-[10px] text-amber-500 underline uppercase mt-2">Tentar Novamente</button>
                    </div>
                  )}

                  {recordState === "IDLE" && (
                    <div className="flex flex-col items-center gap-4 relative z-10">
                      <button onClick={() => startHardwareRecording(activeForgeMode)} className="w-20 h-20 bg-amber-500/20 border-2 border-amber-500 text-amber-500 rounded-full flex items-center justify-center hover:bg-amber-600 hover:text-white transition-all shadow-[0_0_15px_rgba(245,158,11,0.4)]">
                         {activeForgeMode === "AUDIO" ? <Mic size={32} /> : <Camera size={32} />}
                      </button>
                      <span className="text-amber-500/80 font-bold uppercase tracking-wider text-[10px]">
                        Iniciar Permissão e Captura
                      </span>
                    </div>
                  )}

                  {recordState === "RECORDING" && (
                    <div className="flex flex-col items-center gap-4 relative z-10 pt-10">
                      <button onClick={stopHardwareRecording} className="w-16 h-16 bg-red-600 border-2 border-white text-white rounded-full flex items-center justify-center animate-pulse shadow-[0_0_20px_rgba(220,38,38,0.8)] hover:bg-red-700 transition-all">
                         <Square size={20} fill="currentColor" />
                      </button>
                      <span className="text-white drop-shadow-md font-mono font-bold tracking-widest text-lg z-10 bg-black/50 px-3 py-1 rounded-md border border-white/10">{formatTime(recordSeconds)}</span>
                      
                      {activeForgeMode === "AUDIO" && (
                         <div className="absolute inset-x-0 bottom-4 flex items-end justify-center gap-[2px] opacity-80 px-8 z-0">
                           {[...Array(30)].map((_, i) => (
                             <motion.div key={i} className="w-full bg-gradient-to-t from-red-600 to-amber-500 rounded-t-sm"
                                 animate={{ height: [`${Math.random() * 15 + 5}px`, `${Math.random() * 45 + 15}px`, `${Math.random() * 15 + 5}px`] }}
                                 transition={{ duration: 0.3 + Math.random(), repeat: Infinity, ease: "easeInOut" }}
                             />
                           ))}
                         </div>
                      )}
                      
                      {activeForgeMode === "VIDEO" && (
                        <div className="absolute top-4 right-4 flex items-center gap-2 z-10 bg-black/60 px-2 py-1 rounded">
                           <div className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
                           <span className="text-red-500 text-[10px] font-bold uppercase tracking-widest">REC</span>
                        </div>
                      )}
                    </div>
                  )}

                  {recordState === "DONE" && forgeFile && (
                    <div className="flex flex-col items-center gap-3 relative z-10">
                       <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                          <CheckCircle2 size={32}/>
                       </div>
                       <span className="text-emerald-400 font-bold uppercase tracking-wider text-xs text-center px-4">
                         {activeForgeMode === "AUDIO" ? "Áudio" : "Filme"} Capturado com Sucesso!
                       </span>
                       <span className="text-white/60 font-mono text-[10px] bg-black/30 px-2 py-1 rounded truncate max-w-[200px]">
                          {formatSize(forgeFile.size)} 
                       </span>
                       <button onClick={() => { setRecordState("IDLE"); setForgeFile(null); }} className="text-[10px] text-amber-500/80 hover:text-amber-500 uppercase tracking-wider mt-2 border-b border-amber-500/50">
                          Descartar Mídia Bruta
                       </button>
                    </div>
                  )}
               </div>
            )}

            {/* O MODO UPLOAD UNIVERSAL */}
            {(forgeSubMode === "UPLOAD" || activeForgeMode === "PHOTO") && (
              <label htmlFor="file-upload" className={`w-full h-[220px] flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all mb-6 cursor-pointer relative z-20 ${forgeFile ? 'bg-amber-900/20 border-amber-500' : 'bg-white/5 border-amber-900/50 hover:bg-white/10 hover:border-amber-500/50'}`}>
                {forgeFile ? (
                   <motion.div initial={{scale:0}} animate={{scale:1}} className="flex flex-col items-center text-amber-500">
                     <CheckCircle2 size={48} className="mb-3 opacity-80" />
                     <p className="font-bold text-center px-4 truncate w-full max-w-[200px]">{forgeFile.name}</p>
                     <p className="text-xs uppercase opacity-60 font-mono mt-1">{formatSize(forgeFile.size)}</p>
                   </motion.div>
                ) : (
                  <div className="flex flex-col items-center text-amber-500/40">
                     <FileUp size={40} className="mb-3" />
                     <p className="uppercase text-xs font-bold tracking-widest text-center px-4">Clique ou Arraste o Arquivo Aqui</p>
                     <p className="text-[10px] mt-2 font-mono uppercase opacity-50 px-2 text-center">Formatos: {getAcceptString()}</p>
                  </div>
                )}
                <input id="file-upload" type="file" className="hidden" accept={getAcceptString()} onChange={handleFileChange} />
              </label>
            )}

            <button 
              onClick={launchMemory} 
              disabled={!isValidToForge()}
              className="w-full py-5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:from-white/10 disabled:to-white/10 disabled:text-gray-600 disabled:cursor-not-allowed text-black font-extrabold uppercase tracking-widest rounded-xl transition-all shadow-[0_0_30px_rgba(245,158,11,0.2)] disabled:shadow-none relative z-20"
            >
              Forjar e Arremessar
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
}

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
