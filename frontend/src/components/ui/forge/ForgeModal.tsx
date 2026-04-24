"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Type, Mic, FileVideo, X, FileUp, PenLine, Paperclip, CheckCircle2, Square, MonitorPlay } from "lucide-react";
import { ItemType, SubMode, Memory } from "@/types/capsule";
import { useWebRTC } from "@/hooks/useWebRTC";

interface ForgeModalProps {
  activeForgeMode: ItemType;
  onCancel: () => void;
  onLaunch: (memory: Partial<Memory>) => void;
}

export function ForgeModal({ activeForgeMode, onCancel, onLaunch }: ForgeModalProps) {
  const [forgeSubMode, setForgeSubMode] = useState<SubMode>("WRITE");
  const [forgeText, setForgeText] = useState("");
  const [forgeFile, setForgeFile] = useState<File | null>(null);

  const {
     recordState,
     recordSeconds,
     capturedFile,
     liveVideoRef,
     startHardwareRecording,
     stopHardwareRecording,
     capturePhoto,
     resetRecordingState,
     cleanupHardwareTracks
  } = useWebRTC();

  // Garante a morte do hardware se o modal desmontar inesperadamente
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
         cleanupHardwareTracks();
         onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      cleanupHardwareTracks();
    };
  }, [cleanupHardwareTracks, onCancel]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setForgeFile(e.target.files[0]);
    }
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

  const isValidToForge = () => {
    if (activeForgeMode === "TEXT") {
      if (forgeSubMode === "WRITE") return forgeText.trim().length >= 3;
      return forgeFile !== null;
    }
    if (activeForgeMode === "AUDIO" || activeForgeMode === "VIDEO" || activeForgeMode === "PHOTO") {
      // Se usar o form nativo hardware, verifica se o blob fantasma existe
      if (forgeSubMode === "WRITE") return recordState === "DONE" && capturedFile !== null;
      return forgeFile !== null; // se foi upload local
    }
    return forgeFile !== null;
  };

  const executeLaunch = () => {
    if (recordState === "RECORDING") stopHardwareRecording();
    cleanupHardwareTracks();
    
    // O file físico que será entregue à cápsula
    const targetFile = (forgeSubMode === "WRITE" && (activeForgeMode === "AUDIO" || activeForgeMode === "VIDEO" || activeForgeMode === "PHOTO")) ? capturedFile : forgeFile;
    
    const finalLabel = targetFile ? targetFile.name : (activeForgeMode === "TEXT" ? "Texto Redigido" : "Registro Temporário");
    
    // Passa os dados cruciais para cima (pro Maestro)
    onLaunch({
       type: activeForgeMode,
       label: finalLabel,
       payload: (activeForgeMode === "TEXT" && forgeSubMode === "WRITE") ? forgeText : (targetFile ?? undefined),
       fileName: targetFile?.name
    });
  };

  const handleModeSwitch = (mode: SubMode) => {
      setForgeSubMode(mode);
      if (mode === "UPLOAD") {
         resetRecordingState(); 
      }
  };

  // Alias para o arquivo virtual no formulário
  const activeFile = forgeSubMode === "WRITE" ? capturedFile : forgeFile;

  return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 50 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="absolute inset-x-0 top-10 md:top-20 z-[100] max-w-md w-full mx-auto p-6 md:p-8 rounded-3xl bg-black/90 backdrop-blur-2xl border border-amber-500/40 shadow-[0_0_50px_rgba(245,158,11,0.2)]"
      >
        <button onClick={() => { cleanupHardwareTracks(); onCancel(); }} className="absolute top-4 right-4 text-gray-400 hover:text-amber-500 transition-colors bg-white/5 rounded-full p-2 z-50">
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
        {(activeForgeMode === "TEXT" || activeForgeMode === "AUDIO" || activeForgeMode === "VIDEO" || activeForgeMode === "PHOTO") && (
          <div className="flex w-full bg-white/5 p-1 rounded-xl mb-6 relative z-20">
            <button 
              onClick={() => handleModeSwitch("WRITE")} 
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold uppercase transition-all ${forgeSubMode === "WRITE" ? 'bg-amber-600/90 text-black shadow-lg shadow-amber-900/50' : 'text-gray-500 hover:text-amber-200'}`}
            >
              {activeForgeMode === "TEXT" && <PenLine size={16}/>}
              {activeForgeMode === "AUDIO" && <Mic size={16}/>}
              {(activeForgeMode === "VIDEO" || activeForgeMode === "PHOTO") && <MonitorPlay size={16}/>}
              {activeForgeMode === "TEXT" ? "Redigir" : (activeForgeMode === "AUDIO" ? "Gravar Áudio" : "Ligar Câmera")}
            </button>
            <button 
              onClick={() => handleModeSwitch("UPLOAD")} 
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold uppercase transition-all ${forgeSubMode === "UPLOAD" ? 'bg-amber-600/90 text-black shadow-lg shadow-amber-900/50' : 'text-gray-500 hover:text-amber-200'}`}
            >
              <Paperclip size={16}/>
              Anexar Arquivo
            </button>
          </div>
        )}

        {/* MODO REDIGIR TEXTO */}
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
        {(activeForgeMode === "AUDIO" || activeForgeMode === "VIDEO" || activeForgeMode === "PHOTO") && forgeSubMode === "WRITE" && (
            <div className="w-full h-[220px] bg-black/80 border border-amber-900/50 rounded-xl flex flex-col items-center justify-center mb-6 relative overflow-hidden transition-colors">
              
              {(activeForgeMode === "VIDEO" || activeForgeMode === "PHOTO") && (
                  <video 
                    ref={liveVideoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${(recordState === "RECORDING" || recordState === "CAMERA_READY") ? 'opacity-100' : 'opacity-20'}`}
                  />
              )}

              {recordState === "ERROR" && (
                <div className="flex flex-col items-center gap-4 relative z-10 px-4 text-center">
                    <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center"><X size={32}/></div>
                    <span className="text-red-400 font-bold uppercase tracking-wider text-xs">Acesso Negado ou Indisponível</span>
                    <button onClick={resetRecordingState} className="text-[10px] text-amber-500 underline uppercase mt-2">Tentar Novamente</button>
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

              {recordState === "CAMERA_READY" && activeForgeMode === "PHOTO" && (
                <div className="flex flex-col items-center gap-4 relative z-10 pt-10">
                  <button onClick={capturePhoto} className="w-16 h-16 bg-white/20 border-4 border-white text-white rounded-full flex items-center justify-center hover:bg-white/40 transition-all shadow-[0_0_20px_rgba(255,255,255,0.8)] backdrop-blur-sm">
                      <Camera size={24} fill="currentColor" />
                  </button>
                  <span className="text-white drop-shadow-md font-mono font-bold tracking-widest text-xs z-10 bg-black/50 px-3 py-1 rounded-md border border-white/10 uppercase">
                      Tirar Foto
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

              {recordState === "DONE" && capturedFile && (
                <div className="flex flex-col items-center gap-3 relative z-10">
                    <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                      <CheckCircle2 size={32}/>
                    </div>
                    <span className="text-emerald-400 font-bold uppercase tracking-wider text-xs text-center px-4">
                      {activeForgeMode === "AUDIO" ? "Áudio" : activeForgeMode === "PHOTO" ? "Fotografia" : "Filme"} Capturado com Sucesso!
                    </span>
                    <span className="text-white/60 font-mono text-[10px] bg-black/30 px-2 py-1 rounded truncate max-w-[200px]">
                      {formatSize(capturedFile.size)} 
                    </span>
                    <button onClick={resetRecordingState} className="text-[10px] text-amber-500/80 hover:text-amber-500 uppercase tracking-wider mt-2 border-b border-amber-500/50">
                      Descartar Mídia Bruta
                    </button>
                </div>
              )}
            </div>
        )}

        {/* O MODO UPLOAD UNIVERSAL */}
        {forgeSubMode === "UPLOAD" && (
          <label htmlFor="file-upload" className={`w-full h-[220px] flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all mb-6 cursor-pointer relative z-20 overflow-hidden ${forgeFile ? 'bg-amber-900/20 border-amber-500' : 'bg-white/5 border-amber-900/50 hover:bg-white/10 hover:border-amber-500/50'}`}>
            {forgeFile ? (
                <motion.div initial={{scale:0}} animate={{scale:1}} className="flex flex-col items-center text-amber-500 w-full h-full relative">
                  {forgeFile.type.startsWith("image/") ? (
                    <>
                      {/* URL.createObjectURL is safe here locally for visual preview */}
                      <img src={URL.createObjectURL(forgeFile)} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-90" />
                      <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-black/80 to-transparent z-10 pointer-events-none" />
                      
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-black/60 backdrop-blur-md rounded-lg px-3 py-2 z-20 border border-white/20 shadow-xl">
                          <div className="flex flex-col overflow-hidden text-left w-full pr-2">
                            <p className="font-bold text-white text-xs truncate drop-shadow-md">{forgeFile.name}</p>
                            <p className="text-[10px] uppercase font-mono text-emerald-400 font-bold drop-shadow mt-0.5">{formatSize(forgeFile.size)}</p>
                          </div>
                          <CheckCircle2 size={24} className="text-emerald-500 drop-shadow-lg shrink-0" />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                        <CheckCircle2 size={48} className="mb-3 opacity-80" />
                        <p className="font-bold text-center px-4 truncate w-full max-w-[200px]">{forgeFile.name}</p>
                        <p className="text-xs uppercase opacity-60 font-mono mt-1">{formatSize(forgeFile.size)}</p>
                    </div>
                  )}
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
          onClick={executeLaunch} 
          disabled={!isValidToForge()}
          className="w-full py-5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:from-white/10 disabled:to-white/10 disabled:text-gray-600 disabled:cursor-not-allowed text-black font-extrabold uppercase tracking-widest rounded-xl transition-all shadow-[0_0_30px_rgba(245,158,11,0.2)] disabled:shadow-none relative z-20"
        >
          Forjar e Arremessar
        </button>
      </motion.div>
  );
}
