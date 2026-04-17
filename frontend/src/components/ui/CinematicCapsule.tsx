"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Type, Mic, FileVideo, Lock } from "lucide-react";
import { ItemType, Memory } from "@/types/capsule";
import { THEME_REGISTRY } from "@/config/themes";
import { PhysicalRelic } from "./relics/PhysicalRelic";
import { ForgeModal } from "./forge/ForgeModal";
import { StorageBar } from "./StorageBar";

const DEFAULT_THEME_ID = "bau-classico";

import { useAuth } from "@/components/auth/AuthContext";

export function CinematicCapsule({
  capsuleId,
  themeId = DEFAULT_THEME_ID,
  maxSizeBytes = 1073741824, // 1GB fallback
  initialUsedBytes = 0,
  initialStorageStatus = "DRAFT",
  title = "Sinal Transversal",
  recipientEmail = "herdeiro@futuro.com",
  unlockDate = "2050-01-01"
}: {
  capsuleId?: string,
  themeId?: string,
  maxSizeBytes?: number,
  initialUsedBytes?: number,
  initialStorageStatus?: string,
  title?: string,
  recipientEmail?: string,
  unlockDate?: string
}) {
  const { user } = useAuth();
  const activeTheme = THEME_REGISTRY[themeId] ?? THEME_REGISTRY[DEFAULT_THEME_ID];
  const [localMemoriesCount, setLocalMemoriesCount] = useState(initialUsedBytes > 0 ? 1 : 0);
  const [localUsedBytes, setLocalUsedBytes] = useState(initialUsedBytes);

  const [storageStatus, setStorageStatus] = useState(initialStorageStatus);
  const [isOpened, setIsOpened] = useState(storageStatus !== "DRAFT");
  const [isSealed, setIsSealed] = useState(storageStatus === "FROZEN" || storageStatus === "AVAILABLE");
  const [isChomping, setIsChomping] = useState(false);
  const [flyingItem, setFlyingItem] = useState<Memory | null>(null);

  const [activeForgeMode, setActiveForgeMode] = useState<ItemType | null>(null);
  const [showEarlyUnlockModal, setShowEarlyUnlockModal] = useState(false);
  const [isSealingVideoPlaying, setIsSealingVideoPlaying] = useState(false);
  const [showFlash, setShowFlash] = useState(false);

  const handleLaunchMemory = async (newMemoryData: Partial<Memory>) => {
    setActiveForgeMode(null);

    // Identificar tamanho em Bytes (optimistic approach)
    let actualSizeBytes = 0;
    let actualFile: File | Blob | null = null;
    let textContent = "";

    if ((newMemoryData.payload as any) instanceof Blob || (newMemoryData.payload as any) instanceof File) {
      actualFile = newMemoryData.payload as Blob;
      actualSizeBytes = actualFile.size;
    } else if (typeof newMemoryData.payload === "string") {
      textContent = newMemoryData.payload;
      actualSizeBytes = new Blob([textContent]).size;
    }

    if (localUsedBytes + actualSizeBytes > maxSizeBytes) {
      alert("O artefato excede o limite estipulado pela dimensão da relíquia.");
      return;
    }

    const memoryIdFallback = Math.random().toString(36).substring(2, 9);
    const newMemory: Memory = {
      id: memoryIdFallback,
      type: newMemoryData.type as ItemType,
      label: newMemoryData.label || "Memória Desconhecida",
      payload: newMemoryData.payload,
      fileName: newMemoryData.fileName || `memoria_${memoryIdFallback}.bin`
    };

    // 1. Optimistic UI Update (Animação voando na hora!)
    setFlyingItem(newMemory);
    setLocalMemoriesCount(prev => prev + 1);
    setLocalUsedBytes(prev => prev + actualSizeBytes);

    setTimeout(() => { setIsChomping(true); }, 650);
    setTimeout(() => {
      setFlyingItem(null);
      setIsChomping(false);
    }, 1200);

    // 2. Transação Furtiva de Cloud (Em Background)
    if (!capsuleId || !user) return;

    try {
      let uploadedFileName = "";

      if (actualFile) {
        uploadedFileName = newMemory.fileName || `media_${Date.now()}`;
        // Pede URL Assinada
        const presignRes = await fetch(`http://localhost:8080/api/v1/capsules/${capsuleId}/presign?fileName=${encodeURIComponent(uploadedFileName)}&sizeBytes=${actualSizeBytes}`, {
          headers: { "X-User-Id": user.id }
        });

        if (!presignRes.ok) throw new Error("Falha ao obter URL assinada.");
        const presignedUrl = await presignRes.text();

        // Upa para AWS S3!
        const s3Res = await fetch(presignedUrl, {
          method: "PUT",
          body: actualFile,
          headers: {
            "Content-Type": actualFile.type || "application/octet-stream"
          }
        });

        if (!s3Res.ok) throw new Error("A conexão dimensional falhou durante a transferência.");
      }

      // Consolida Memória no Banco Postgres
      await fetch(`http://localhost:8080/api/v1/capsules/${capsuleId}/memories`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-User-Id": user.id },
        body: JSON.stringify({
          type: newMemory.type,
          textContent: textContent,
          fileName: uploadedFileName,
          sizeBytes: actualSizeBytes
        })
      });

    } catch (e) {
      console.error("Erro na Forja", e);
      // Rollback Optimistic 
      setLocalMemoriesCount(prev => prev - 1);
      setLocalUsedBytes(prev => prev - actualSizeBytes);
      alert("Uma interferência magnética impediu que a memória fosse ancorada no tempo.");
    }
  };

  const isQuotaFull = localUsedBytes >= maxSizeBytes;

  const initiateForge = (type: ItemType) => {
    if (isQuotaFull || isSealed || storageStatus === "RESTORING") return;
    setActiveForgeMode(type);
    setIsOpened(true);
  };

  const cancelForge = () => {
    setActiveForgeMode(null);
  };



  const sealVault = async () => {
    if (!capsuleId || !user) return;
    try {
      // Abre a cutscene e escurece a tela, mas mantemos o baú visualmente focado e intacto atrás
      setIsSealingVideoPlaying(true);

      const res = await fetch(`http://localhost:8080/api/v1/capsules/${capsuleId}/seal`, {
        method: "POST",
        headers: { "X-User-Id": user.id }
      });

      if (!res.ok) {
        throw new Error("A anomalia temporal impediu a selagem.");
      }
      // Sucesso no backend. A cutscene se encarregará da troca de estados com o onEnded.
    } catch (e) {
      setIsSealingVideoPlaying(false);
      console.log("Error sealing:", e);
    }
  };

  const isBlurMode = activeForgeMode !== null;

  return (
    <div className="flex flex-col items-center w-full min-h-[650px] relative pointer-events-auto">

      {/* Marcador de Armazenamento - Barra de Quota Externa */}
      {storageStatus === "DRAFT" && (
        <StorageBar
          usedBytes={localUsedBytes}
          maxBytes={maxSizeBytes}
          isQuotaFull={isQuotaFull}
          isBlurMode={isBlurMode}
        />
      )}

      {/* Alerta de Desgelo (RESTORING Storage) */}
      <AnimatePresence>
        {storageStatus === "RESTORING" && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
            className="absolute top-10 w-full max-w-md mx-auto bg-blue-900/60 backdrop-blur-md px-6 py-4 rounded-xl border border-blue-400/50 shadow-[0_0_30px_rgba(59,130,246,0.3)] z-[100] text-center"
          >
            <h4 className="text-blue-200 font-black tracking-widest uppercase mb-1">Processo de Desgelo</h4>
            <p className="text-blue-100/70 text-sm mb-3">Sua relíquia está sendo restaurada dos confins do tempo (Glacier). Este processo requer calor contínuo.</p>
            <div className="flex items-center justify-center gap-2 text-xl font-mono text-cyan-300">
              <span className="animate-pulse">⏳</span>
              <span>Tempo Restante Estimado: ~24h</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wrapper de Layout (Side-by-Side no Desktop quando Selado) */}
      <div className={`flex flex-col ${isSealed ? 'md:flex-row md:items-center md:justify-center md:gap-16 w-full max-w-5xl' : 'items-center w-full'} transition-all duration-700`}>

        {/* Container Principal do Baú */}
        <div className={`relative w-[340px] h-[340px] md:w-[450px] md:h-[450px] mt-8 flex flex-col items-center justify-center transition-all duration-500 shrink-0 ${isBlurMode || showEarlyUnlockModal ? 'blur-md opacity-30 scale-95 grayscale-[50%]' : ''}`}>
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
                transition={{ duration: 1.0, times: [0, 0.4, 0.8, 1], ease: "easeInOut" }}
                className="absolute left-1/2 top-1/3 ml-[-40px] mt-[-50px] z-[60] flex items-center justify-center"
                style={{ perspective: "500px" }}
              >
                <PhysicalRelic type={flyingItem.type} theme={activeTheme} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Máquina de Estado do PNG (O 'Chomp') */}
          <div className="relative w-full h-full z-20 pointer-events-none filter drop-shadow-2xl flex items-center justify-center overflow-visible">

            <motion.img
              src={activeTheme.assets.vault.closed} className="absolute w-full max-h-full object-contain"
              animate={{ opacity: isChomping ? 0 : 1 }} transition={{ duration: 0 }} />
            <motion.img
              src={activeTheme.assets.vault.opened} className="absolute w-full max-h-full object-contain"
              animate={{ opacity: (isChomping || storageStatus === "AVAILABLE") ? 1 : 0 }} transition={{ duration: 0 }} />

            {/* Camada de Gelo se estiver Restoring */}
            <AnimatePresence>
              {storageStatus === "RESTORING" && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-blue-500/20 backdrop-blur-[2px] backdrop-brightness-150 rounded-full mix-blend-overlay border-[3px] border-cyan-200/40 shadow-[inset_0_0_50px_rgba(165,243,252,0.6)] animate-pulse"
                />
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Splash Cênico de Selagem Final / Receipt Holográfico */}
        <AnimatePresence>
          {isSealed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: -30 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 1, type: "spring", bounce: 0.4 }}
              className={`relative mt-8 md:mt-0 z-[110] w-full max-w-sm shrink-0 transition-all duration-300 ${showEarlyUnlockModal ? 'blur-md opacity-30 grayscale-[50%]' : ''}`}
            >
              <div className="relative mx-auto rounded-3xl bg-black/60 shadow-[0_0_50px_rgba(245,158,11,0.15)] backdrop-blur-2xl border border-amber-500/20 overflow-hidden text-left flex flex-col">

                {/* Header Fita Seladora */}
                <div className="w-full bg-gradient-to-r from-amber-600 to-amber-900 py-3 px-6 shadow-md border-b border-amber-500/40 flex justify-between items-center">
                  <h3 className="text-white font-serif font-black tracking-widest uppercase text-left text-sm drop-shadow-md">
                    Selo Ativado
                  </h3>
                  <Lock className="w-4 h-4 text-amber-200" />
                </div>

                {/* Corpo (Invoice / Metadados) */}
                <div className="p-6 flex flex-col gap-5">

                  <div>
                    <span className="text-[10px] text-amber-500/50 uppercase tracking-[0.2em] font-bold block mb-1">Códinome da Relíquia</span>
                    <span className="text-lg text-amber-100 font-serif font-light">{title}</span>
                  </div>

                  <div className="flex items-center gap-4 border-t border-white/5 pt-4">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex flex-shrink-0 items-center justify-center border border-amber-500/30">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="M19 21v-2a4 4 string 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    </div>
                    <div className="flex flex-col truncate">
                      <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Destinado Para</span>
                      <span className="text-sm font-mono text-neutral-300 truncate">{recipientEmail}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 border-t border-white/5 pt-4">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex flex-shrink-0 items-center justify-center border border-blue-500/30">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Despertar Agendado</span>
                      <span className="text-sm font-mono text-blue-300 font-bold">
                        {new Date(unlockDate).toLocaleDateString("pt-BR", { year: "numeric", month: "long", day: "numeric" })}
                      </span>
                    </div>
                  </div>

                  {/* Mensagem Rodapé / Destravamento */}
                  <div className="mt-2 pt-4 border-t border-white/5 text-center flex flex-col gap-3">
                    <span className="text-[10px] text-neutral-600 uppercase tracking-widest font-bold">
                      Receptáculo protegido pelo selo da eternidade
                    </span>
                    <button
                      onClick={() => setShowEarlyUnlockModal(true)}
                      className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-xs font-bold text-red-400 uppercase tracking-widest transition-all">
                      Solicitar Resgate Imediato
                    </button>
                  </div>

                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Painel Inferior de Criação (Ações) */}
      {storageStatus === "DRAFT" && (
        <motion.div
          animate={{
            opacity: isSealed ? 0 : 1, y: isSealed ? 80 : 0, scale: flyingItem ? 0.95 : 1, pointerEvents: isSealed || flyingItem || isBlurMode ? "none" : "auto"
          }}
          transition={{ duration: 0.5 }}
          className={`mt-2 flex gap-4 w-full max-w-lg justify-center flex-wrap z-10 transition-all duration-500 ${isBlurMode ? 'opacity-0 blur-md translate-y-10' : ''}`}
        >
          <GameButton icon={<Type className="w-5 h-5" />} label="Escrever" onClick={() => initiateForge("TEXT")} disabled={isQuotaFull} />
          <GameButton icon={<Camera className="w-5 h-5" />} label="Revelar" onClick={() => initiateForge("PHOTO")} disabled={isQuotaFull} />
          <GameButton icon={<Mic className="w-5 h-5" />} label="Gravar" onClick={() => initiateForge("AUDIO")} disabled={isQuotaFull} />
          <GameButton icon={<FileVideo className="w-5 h-5" />} label="Filmar" onClick={() => initiateForge("VIDEO")} disabled={isQuotaFull} />
        </motion.div>
      )}

      {/* Botão Global de Selagem */}
      {storageStatus === "DRAFT" && (() => {
        const canSeal = !isSealed && localMemoriesCount > 0 && !isBlurMode;
        return (
          <motion.div
            animate={{ opacity: canSeal ? 1 : 0, scale: canSeal ? 1 : 0.8 }}
            className={`mt-8 transition-all ${canSeal ? 'pointer-events-auto' : 'pointer-events-none opacity-0'}`}
          >
            <button onClick={sealVault} className="group relative overflow-hidden px-10 py-5 bg-gradient-to-br from-amber-600 via-amber-500 to-amber-700 rounded-full text-black font-extrabold tracking-widest uppercase transition-all shadow-[0_0_50px_rgba(214,158,46,0.6)] hover:shadow-[0_0_100px_rgba(214,158,46,1)] transform hover:scale-105 active:scale-95 border-2 border-yellow-300">
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
              <div className="flex items-center gap-2 relative z-10"><Lock className="w-5 h-5" /> LACRAR PERMANENTEMENTE</div>
            </button>
          </motion.div>
        );
      })()}

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

      {/* ======================================================== */}
      {/* Modal Mock de Resgate Antecipado                           */}
      {/* ======================================================== */}
      <AnimatePresence>
        {showEarlyUnlockModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl"
          >
            <div className="bg-neutral-900/90 border border-red-500/30 rounded-3xl p-8 max-w-md w-full shadow-[0_0_40px_rgba(239,68,68,0.15)] relative">
              <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                <Lock className="w-8 h-8 text-red-500" />
              </div>

              <h3 className="text-2xl font-serif text-white font-light text-center mb-2">Quebra do Paradoxo Temporal</h3>
              <p className="text-sm text-neutral-400 text-center leading-relaxed">
                Extrair esses artefatos do arquivamento profundo antes da data acordada exige recursos computacionais de recuperação acelerada de nosso provedor físico subjacente.
              </p>

              <div className="bg-black/50 border border-neutral-800 rounded-2xl p-5 mt-6 mb-8 flex flex-col gap-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-500">Multa de Resgate AWS Glacier</span>
                  <span className="text-white font-mono">R$ 45,00</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-500">Taxa de Reintegração Aevum</span>
                  <span className="text-white font-mono">R$ 24,90</span>
                </div>
                <div className="h-[1px] w-full bg-neutral-800 my-1" />
                <div className="flex justify-between items-center font-bold">
                  <span className="text-neutral-300">Total a Pagar</span>
                  <span className="text-amber-500 font-mono text-xl">R$ 69,90</span>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowEarlyUnlockModal(false)}
                  className="flex-1 py-3.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    alert("Integração de pagamento pendente. \nNeste momento da aplicação, simularíamos o checkout do Stripe para quebrar o selo!");
                    setShowEarlyUnlockModal(false);
                  }}
                  className="flex-1 py-3.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-colors shadow-lg shadow-red-500/20">
                  Processar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* Cutscene de Selagem (O Modal Épico)                        */}
      {/* ======================================================== */}
      <AnimatePresence>
         {isSealingVideoPlaying && (
            <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-3xl px-4"
            >
               <div className="relative w-full max-w-3xl aspect-video rounded-3xl overflow-hidden shadow-[0_0_120px_rgba(245,158,11,0.15)] bg-black flex items-center justify-center border border-white/5">
                  <video 
                     autoPlay muted playsInline
                     onEnded={() => {
                        setShowFlash(true);
                        setTimeout(() => {
                           setIsSealingVideoPlaying(false);
                           setStorageStatus("FROZEN");
                           setIsSealed(true);
                           setIsOpened(false);
                        }, 200); // peak of flash
                        setTimeout(() => setShowFlash(false), 800); // flash fade-out duration
                     }}
                     src="/themes/bau-classico/bau-classico-video-selado.webm" 
                     className="w-full h-full object-contain max-h-[75vh] px-4"
                  />
                  {/* Overlay Cinematográfico */}
                  <div className="absolute bottom-8 w-full text-center pointer-events-none">
                     <span className="text-amber-500/70 text-xs md:text-sm tracking-[0.5em] uppercase font-bold animate-pulse">
                        Forjando Relíquia no Tempo
                     </span>
                  </div>
               </div>
            </motion.div>
         )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* Transição Cinematográfica Fade-To-Black                    */}
      {/* ======================================================== */}
      <AnimatePresence>
         {showFlash && (
            <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1, transition: { duration: 0.2 } }}
               exit={{ opacity: 0, transition: { duration: 0.6, ease: "easeOut" } }}
               className="fixed inset-0 z-[300] bg-black pointer-events-none"
            />
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
