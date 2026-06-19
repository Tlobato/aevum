"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Type, Mic, FileVideo, Lock } from "lucide-react";
import { ItemType, Memory } from "@/types/capsule";
import { THEME_REGISTRY } from "@/config/themes";
import { PhysicalRelic } from "./relics/PhysicalRelic";
import { ForgeModal } from "./forge/ForgeModal";
import { StorageBar } from "./StorageBar";
import { RelicGallery } from "./RelicGallery";
import { TermsModal } from "./TermsModal";

const DEFAULT_THEME_ID = "bau-classico";

import { useEffect, useRef } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { useTranslation } from "react-i18next";
import { API_URL, getApiHeaders } from "@/lib/api";

export function CinematicCapsule({
  capsuleId,
  themeId = DEFAULT_THEME_ID,
  maxSizeBytes = 1073741824, // 1GB fallback
  initialUsedBytes = 0,
  initialStorageStatus = "DRAFT",
  title = "Sinal Transversal",
  recipientEmail = "herdeiro@futuro.com",
  unlockDate = "2050-01-01",
  paymentSuccess = false,
  earlyUnlockSuccess = false,
  accessToken = null,
  ownerId = null,
  earlyUnlockRule = "TOTAL_LOCK"
}: {
  capsuleId?: string,
  themeId?: string,
  maxSizeBytes?: number,
  initialUsedBytes?: number,
  initialStorageStatus?: string,
  title?: string,
  recipientEmail?: string,
  unlockDate?: string,
  paymentSuccess?: boolean,
  earlyUnlockSuccess?: boolean,
  accessToken?: string | null,
  ownerId?: string | null,
  earlyUnlockRule?: "TOTAL_LOCK" | "CREATOR_ONLY" | "ALLOW_RECIPIENT"
}) {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { t, i18n } = useTranslation();
  const activeTheme = THEME_REGISTRY[themeId] ?? THEME_REGISTRY[DEFAULT_THEME_ID];
  const [localMemoriesCount, setLocalMemoriesCount] = useState(initialUsedBytes > 0 ? 1 : 0);
  const [localUsedBytes, setLocalUsedBytes] = useState(initialUsedBytes);

  const [storageStatus, setStorageStatus] = useState(initialStorageStatus);
  const storageStatusRef = useRef(storageStatus);
  useEffect(() => {
    storageStatusRef.current = storageStatus;
  }, [storageStatus]);
  const [isOpened, setIsOpened] = useState(storageStatus !== "DRAFT");
  const [isSealed, setIsSealed] = useState(storageStatus === "FROZEN" || storageStatus === "AVAILABLE" || storageStatus === "RESTORING");
  const [isChomping, setIsChomping] = useState(false);
  const [flyingItem, setFlyingItem] = useState<Memory | null>(null);

  const [activeForgeMode, setActiveForgeMode] = useState<ItemType | null>(null);
  const [showEarlyUnlockModal, setShowEarlyUnlockModal] = useState(false);
  const [isSealingVideoPlaying, setIsSealingVideoPlaying] = useState(false);
  const [isRedirectingToStripe, setIsRedirectingToStripe] = useState(false);
  const [showFlash, setShowFlash] = useState(false);

  const [earlyUnlockPenalty, setEarlyUnlockPenalty] = useState<number | null>(null);
  const [loadingPenalty, setLoadingPenalty] = useState(false);

  const [acceptTermsSeal, setAcceptTermsSeal] = useState(false);
  const [acceptTermsUnlock, setAcceptTermsUnlock] = useState(false);

  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsModalTarget, setTermsModalTarget] = useState<"seal" | "unlock" | null>(null);

  const isOwner = !accessToken && user && ownerId && user.id === ownerId;
  const isRecipient = !!accessToken || (user && recipientEmail && user.primaryEmailAddress?.emailAddress?.toLowerCase() === recipientEmail.toLowerCase());

  const canEarlyUnlock = 
    earlyUnlockRule === "ALLOW_RECIPIENT" 
      ? (isOwner || isRecipient) 
      : (earlyUnlockRule === "CREATOR_ONLY" && isOwner);

  const openTermsModal = (target: "seal" | "unlock") => {
    setTermsModalTarget(target);
    setShowTermsModal(true);
  };

  const handleAgreeTerms = () => {
    if (termsModalTarget === "seal") {
      setAcceptTermsSeal(true);
    } else if (termsModalTarget === "unlock") {
      setAcceptTermsUnlock(true);
    }
    setShowTermsModal(false);
    setTermsModalTarget(null);
  };

  // Fetch early unlock penalty dynamically when modal opens
  useEffect(() => {
    if (showEarlyUnlockModal && capsuleId) {
      const fetchPenalty = async () => {
        setLoadingPenalty(true);
        try {
          let res;
          if (accessToken) {
            res = await fetch(`${API_URL}/api/v1/public/capsules/${capsuleId}/early-unlock-penalty?token=${accessToken}`, {
              headers: getApiHeaders()
            });
          } else {
            const token = await getToken({ template: 'aevum-session' });
            res = await fetch(`${API_URL}/api/v1/capsules/${capsuleId}/early-unlock-penalty`, {
              headers: getApiHeaders(token)
            });
          }
          if (res.ok) {
            const data = await res.json();
            setEarlyUnlockPenalty(data.penaltyInCents);
          }
        } catch (e) {
          console.error("Erro ao carregar taxa de resgate antecipado:", e);
        } finally {
          setLoadingPenalty(false);
        }
      };
      fetchPenalty();
    }
  }, [showEarlyUnlockModal, capsuleId, getToken, accessToken]);

  // Modo Admin (Bypass de Pagamentos e Tempo)
  const userEmail = user?.primaryEmailAddress?.emailAddress || "";
  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",");
  const isAdmin = adminEmails.includes(userEmail);

  // Estados de Despertar
  const [viewMode, setViewMode] = useState<"VAULT" | "GALLERY">("VAULT");
  const [isUnsealingVideoPlaying, setIsUnsealingVideoPlaying] = useState(false);
  const [memoriesList, setMemoriesList] = useState<Memory[]>([]);

  // Fetch memories when we switch to GALLERY view
  useEffect(() => {
    if (viewMode === "GALLERY" && capsuleId) {
      const fetchMemories = async () => {
        try {
          let res;
          if (accessToken) {
            // Busca pública via token
            res = await fetch(`${API_URL}/api/v1/public/capsules/${capsuleId}/memories?token=${accessToken}`, { headers: getApiHeaders() });
          } else {
            // Busca autenticada (Dono)
            const token = await getToken({ template: 'aevum-session' });
            res = await fetch(`${API_URL}/api/v1/capsules/${capsuleId}/memories`, {
              headers: getApiHeaders(token)
            });
          }

          if (res.ok) {
            const data = await res.json();
            // Maps the backend MemoryResponse to our frontend Memory interface
            const mappedMemories: Memory[] = data.map((m: any) => ({
              id: m.id,
              type: m.type as ItemType,
              label: m.fileName || t("vault.memory"),
              payload: m.presignedUrl || m.textContent || "",
              fileName: m.fileName
            }));
            setMemoriesList(mappedMemories);
          }
        } catch (e) {
          console.error("Failed to fetch memories", e);
        }
      };
      fetchMemories();
    }
  }, [viewMode, capsuleId, getToken, accessToken]);

  const hasProcessedPayment = useRef(false);

  useEffect(() => {
    if (paymentSuccess && !hasProcessedPayment.current && capsuleId) {
      hasProcessedPayment.current = true;
      
      // Verifica se a animação já foi vista nesta sessão para evitar repetição no F5
      const seenKey = `aevum_seal_seen_${capsuleId}`;
      const alreadySeen = sessionStorage.getItem(seenKey);

      if (!alreadySeen) {
          setIsSealingVideoPlaying(true);
          setIsSealed(true);
      } else {
          // Se já viu, apenas atualiza o estado para o fim da animação
          setIsSealed(true);
          setIsOpened(false);
          setStorageStatus("FROZEN");
      }

      const verifyStatus = async () => {
        // ... (resto do código de verificação)
        try {
          const token = await getToken({ template: 'aevum-session' });
          const res = await fetch(`${API_URL}/api/v1/capsules/${capsuleId}`, {
            headers: getApiHeaders(token)
          });
          if (res.ok) {
            const data = await res.json();
            setStorageStatus(data.storageStatus || "FROZEN");
          }
        } catch (e) {
          console.error("Erro ao verificar status pós-pagamento:", e);
          setStorageStatus("FROZEN");
        }
      };
      verifyStatus();
    }
  }, [paymentSuccess, capsuleId, getToken]);

  const hasProcessedEarlyUnlock = useRef(false);

  useEffect(() => {
    if (earlyUnlockSuccess && !hasProcessedEarlyUnlock.current && capsuleId) {
      hasProcessedEarlyUnlock.current = true;
      
      const seenKey = `aevum_unseal_seen_${capsuleId}`;
      const alreadySeen = sessionStorage.getItem(seenKey);

      if (!alreadySeen) {
          setStorageStatus("RESTORING");
          setIsUnsealingVideoPlaying(true);
      } else {
          setStorageStatus("RESTORING");
          // Se já viu a animação de restauração, apenas mantém no estado correto
      }
    }
  }, [earlyUnlockSuccess, capsuleId]);

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
      alert(t("vault.alerts.sizeExceeded"));
      return;
    }

    const memoryIdFallback = Math.random().toString(36).substring(2, 9);
    const newMemory: Memory = {
      id: memoryIdFallback,
      type: newMemoryData.type as ItemType,
      label: newMemoryData.label || t("vault.unknownMemory"),
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
        const token = await getToken({ template: 'aevum-session' });
        // Pede URL Assinada
        const presignRes = await fetch(`${API_URL}/api/v1/capsules/${capsuleId}/presign?fileName=${encodeURIComponent(uploadedFileName)}&sizeBytes=${actualSizeBytes}`, {
          headers: getApiHeaders(token)
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

        if (!s3Res.ok) throw new Error(t("vault.connectionFailed"));
      }

      const token = await getToken({ template: 'aevum-session' });
      // Consolida Memória no Banco Postgres
      await fetch(`${API_URL}/api/v1/capsules/${capsuleId}/memories`, {
        method: "POST",
        headers: getApiHeaders(token),
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
      alert(t("vault.alerts.forgeError"));
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
      setIsRedirectingToStripe(true);
      // Pedimos ao backend a sessão segura do Stripe
      const token = await getToken({ template: 'aevum-session' });
      const res = await fetch(`${API_URL}/api/v1/payments/create-checkout/${capsuleId}`, {
        method: "POST",
        headers: getApiHeaders(token)
      });

      if (!res.ok) {
        setIsRedirectingToStripe(false);
        throw new Error("Falha ao se conectar com o Cofre Central (Stripe).");
      }
      
      const data = await res.json();
      if (data.checkoutUrl) {
        // Redireciona o usuário fisicamente para o domínio do Stripe para ele pagar
        window.location.href = data.checkoutUrl;
      } else {
          setIsRedirectingToStripe(false);
      }
    } catch (e) {
      console.error(e);
      alert(t("vault.alerts.checkoutError"));
      setIsRedirectingToStripe(false);
    }
  };

  const unsealVault = async () => {
    setIsUnsealingVideoPlaying(true);
    // Em paralelo, carrega as memórias do backend para estarem prontas quando o vídeo acabar.
    if (capsuleId && user) {
        try {
            const token = await getToken({ template: 'aevum-session' });
            const res = await fetch(`${API_URL}/api/v1/capsules/${capsuleId}/memories`, {
                headers: getApiHeaders(token)
            });
            if (res.ok) {
                const data = await res.json();
                setMemoriesList(data);
            }
        } catch (e) {
            console.error("Erro ao carregar relíquias", e);
        }
    }
  };

  const isBlurMode = activeForgeMode !== null || showEarlyUnlockModal;

  if (viewMode === "GALLERY") {
    if (memoriesList.length === 0 && capsuleId) {
      return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6">
            <motion.img 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                src="/logo-relic-load.webp" 
                alt="Carregando..." 
                className="w-24 h-24 object-contain drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]"
            />
            <span className="text-amber-500/60 font-mono text-[10px] uppercase tracking-[0.4em] animate-pulse">
                {t("vault.unsealingCutscene")}
            </span>
        </div>
      );
    }
    return <RelicGallery memories={memoriesList} title={title} />;
  }

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
      {/* Wrapper de Layout (Side-by-Side no Desktop quando Selado) */}
      <div className={`flex flex-col ${isSealed ? 'md:flex-row md:items-center md:justify-center md:gap-16 w-full max-w-5xl' : 'items-center w-full'} transition-all duration-700`}>

        {/* Container Principal do Baú */}
        <div className={`relative w-[340px] h-[340px] md:w-[450px] md:h-[450px] mt-8 flex flex-col items-center justify-center transition-all duration-500 shrink-0 ${isBlurMode || showEarlyUnlockModal || isSealingVideoPlaying || isUnsealingVideoPlaying ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
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
              animate={{ opacity: isChomping ? 1 : 0 }} transition={{ duration: 0 }} />

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
                    {t("vault.sealedBadge")}
                  </h3>
                  <Lock className="w-4 h-4 text-amber-200" />
                </div>

                {/* Corpo (Invoice / Metadados) */}
                <div className="p-6 flex flex-col gap-5">

                  <div>
                    <span className="text-[10px] text-amber-500/50 uppercase tracking-[0.2em] font-bold block mb-1">{t("vault.relicCodename")}</span>
                    <span className="text-lg text-amber-100 font-serif font-light">{title}</span>
                  </div>

                  <div className="flex items-center gap-4 border-t border-white/5 pt-4">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex flex-shrink-0 items-center justify-center border border-amber-500/30">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    </div>
                    <div className="flex flex-col truncate">
                      <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">{t("vault.recipientLabel")}</span>
                      <span className="text-sm font-mono text-neutral-300 truncate">{recipientEmail}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 border-t border-white/5 pt-4">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex flex-shrink-0 items-center justify-center border border-blue-500/30">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">{t("vault.unlockScheduled")}</span>
                      <span className="text-sm font-mono text-blue-300 font-bold">
                        {new Date(unlockDate).toLocaleDateString(i18n.language || "pt-BR", { year: "numeric", month: "long", day: "numeric" })}
                      </span>
                    </div>
                  </div>

                  {/* Mensagem Rodapé / Destravamento */}
                  <div className="mt-2 pt-4 border-t border-white/5 text-center flex flex-col gap-3">
                    <span className="text-[10px] text-neutral-600 uppercase tracking-widest font-bold">
                      {t("vault.sealedFooter")}
                    </span>
                    {storageStatus !== "AVAILABLE" && storageStatus === "FROZEN" && canEarlyUnlock && (
                        <button
                          onClick={() => setShowEarlyUnlockModal(true)}
                          className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-xs font-bold text-red-400 uppercase tracking-widest transition-all">
                          {t("vault.earlyUnlockButton")}
                        </button>
                    )}
                    {storageStatus === "AVAILABLE" && (
                        <button
                          onClick={() => setViewMode("GALLERY")}
                          className="w-full py-3 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-xl text-xs font-bold text-green-400 uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)]">
                          {t("vault.exploreButton")}
                        </button>
                    )}
                  </div>

                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Painel Inferior de Criação (Ações) */}
      {!accessToken && storageStatus === "DRAFT" && (
        <motion.div
          animate={{
            opacity: isSealed ? 0 : 1, y: isSealed ? 80 : 0, scale: flyingItem ? 0.95 : 1, pointerEvents: isSealed || flyingItem || isBlurMode ? "none" : "auto"
          }}
          transition={{ duration: 0.5 }}
          className={`mt-2 flex gap-4 w-full max-w-lg justify-center flex-wrap z-10 transition-all duration-500 ${isBlurMode ? 'opacity-0 blur-md translate-y-10' : ''}`}
        >
          <GameButton icon={<Type className="w-5 h-5" />} label={t("vault.write")} onClick={() => initiateForge("TEXT")} disabled={isQuotaFull} />
          <GameButton icon={<Camera className="w-5 h-5" />} label={t("vault.photo")} onClick={() => initiateForge("PHOTO")} disabled={isQuotaFull} />
          <GameButton icon={<Mic className="w-5 h-5" />} label={t("vault.audio")} onClick={() => initiateForge("AUDIO")} disabled={isQuotaFull} />
          <GameButton icon={<FileVideo className="w-5 h-5" />} label={t("vault.video")} onClick={() => initiateForge("VIDEO")} disabled={isQuotaFull} />
        </motion.div>
      )}

      {/* Botão Global de Selagem */}
      {!accessToken && storageStatus === "DRAFT" && (() => {
        const canSeal = !isSealed && localMemoriesCount > 0 && !isBlurMode;
        return (
          <motion.div
            animate={{ opacity: canSeal ? 1 : 0, scale: canSeal ? 1 : 0.8 }}
            className={`mt-8 transition-all flex flex-col items-center gap-4 ${canSeal ? 'pointer-events-auto' : 'pointer-events-none opacity-0'}`}
          >
            {/* Checkbox de Termos */}
            <div className="flex items-center gap-2.5 max-w-xs text-left mb-2 select-none">
              <input 
                type="checkbox" 
                id="terms-seal" 
                checked={acceptTermsSeal} 
                onChange={(e) => setAcceptTermsSeal(e.target.checked)}
                className="w-4 h-4 rounded border-neutral-800 bg-neutral-950 text-amber-500 focus:ring-amber-500/50 cursor-pointer accent-amber-500 shrink-0 animate-fade-in"
              />
              <label htmlFor="terms-seal" className="text-[10px] md:text-xs text-neutral-400 cursor-pointer leading-tight">
                {t("common.termsCheckbox")}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openTermsModal("seal");
                  }}
                  className="text-amber-500 hover:underline hover:text-amber-400 font-medium inline-block pl-1 cursor-pointer"
                >
                  {t("common.termsLink")}
                </button>
              </label>
            </div>

            <button disabled={isRedirectingToStripe || !acceptTermsSeal} onClick={sealVault} className="group relative overflow-hidden px-10 py-5 bg-gradient-to-br from-amber-600 via-amber-500 to-amber-700 rounded-full text-black font-extrabold tracking-widest uppercase transition-all shadow-[0_0_50px_rgba(214,158,46,0.6)] hover:shadow-[0_0_100px_rgba(214,158,46,1)] transform hover:scale-105 active:scale-95 border-2 border-yellow-300 disabled:opacity-50 disabled:transform-none">
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
              <div className="flex items-center gap-2 relative z-10">
                  <Lock className={`w-5 h-5 ${isRedirectingToStripe ? "animate-spin" : ""}`} /> 
                  {isRedirectingToStripe ? t("vault.connectingCentral") : t("vault.sealButton")}
              </div>
            </button>
            {isAdmin && (
               <button 
                  onClick={async () => {
                     try {
                        setIsSealingVideoPlaying(true);
                        const token = await getToken({ template: 'aevum-session' });
                        await fetch(`${API_URL}/api/v1/capsules/${capsuleId}/seal`, {
                           method: "POST",
                           headers: getApiHeaders(token)
                        });
                     } catch(e) { console.error(e); }
                  }}
                  className="flex items-center gap-2 text-xs font-mono text-purple-400 hover:text-purple-300 transition-colors uppercase tracking-widest"
               >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                  [Admin] {t("vault.adminForceSeal")}
               </button>
            )}
          </motion.div>
        );
      })()}

      {/* Botão de Quebrar o Selo — só aparece quando disponível para abertura antecipada */}
      {storageStatus === "AVAILABLE" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 transition-all pointer-events-auto"
          >
            <button onClick={unsealVault} className="group relative overflow-hidden px-10 py-5 bg-gradient-to-br from-amber-600 via-amber-500 to-amber-700 rounded-full text-black font-extrabold tracking-widest uppercase transition-all shadow-[0_0_50px_rgba(214,158,46,0.6)] hover:shadow-[0_0_100px_rgba(214,158,46,1)] transform hover:scale-105 active:scale-95 border-2 border-yellow-300">
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
              <div className="flex items-center gap-2 relative z-10"><Lock className="w-5 h-5" /> {t("vault.breakSeal")}</div>
            </button>
          </motion.div>
      )}

      {/* Estado RESTORING — Desgelo em andamento */}
      {storageStatus === "RESTORING" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 w-full max-w-md mx-auto bg-blue-950/40 backdrop-blur-md px-6 py-5 rounded-2xl border border-blue-500/30 shadow-[0_0_40px_rgba(59,130,246,0.15)] z-[10] text-center flex flex-col items-center gap-3"
          >
            <div className="flex items-center gap-2 text-blue-400">
              <svg className="w-5 h-5 animate-spin text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <h4 className="text-blue-200 font-bold tracking-widest uppercase text-sm">{t("vault.restoringTitle")}</h4>
            </div>
            <p className="text-blue-100/70 text-xs leading-relaxed max-w-xs">
              {t("vault.restoringDesc")}
            </p>
            <div className="flex items-center justify-center gap-2 text-sm font-mono text-cyan-300 mt-1">
              <span className="animate-pulse">⏳</span>
              <span>{t("vault.restoringTime")}</span>
            </div>
          </motion.div>
      )}



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

              <h3 className="text-2xl font-serif text-white font-light text-center mb-2">{t("earlyUnlock.modalTitle")}</h3>
              <p className="text-sm text-neutral-400 text-center leading-relaxed">
                {t("earlyUnlock.modalDesc")}
              </p>

              <div className="bg-black/50 border border-neutral-800 rounded-2xl p-5 mt-6 mb-8 flex flex-col gap-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-500">{t("earlyUnlock.penaltyLabel")}</span>
                  <span className="text-white font-mono">{t("earlyUnlock.penaltyPct")}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-500">{t("earlyUnlock.penaltyMin")}</span>
                  <span className="text-white font-mono">R$ 9,90</span>
                </div>
                <div className="h-[1px] w-full bg-neutral-800 my-1" />
                <div className="flex justify-between items-center font-bold">
                  <span className="text-neutral-300">{t("earlyUnlock.penaltyTotal")}</span>
                  <span className="text-amber-500 font-mono text-sm">
                    {loadingPenalty ? (
                      <span className="text-neutral-500 text-xs animate-pulse">Calculando...</span>
                    ) : earlyUnlockPenalty !== null ? (
                      new Intl.NumberFormat(i18n.language || "pt-BR", {
                        style: "currency",
                        currency: "BRL"
                      }).format(earlyUnlockPenalty / 100)
                    ) : (
                      <span className="text-xs uppercase tracking-widest">{t("earlyUnlock.checkoutEstimate")}</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Checkbox de Termos */}
              <div className="flex items-center gap-2.5 text-left mb-6 select-none w-full">
                <input 
                  type="checkbox" 
                  id="terms-early-unlock" 
                  checked={acceptTermsUnlock} 
                  onChange={(e) => setAcceptTermsUnlock(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-800 bg-neutral-950 text-red-500 focus:ring-red-500/50 cursor-pointer accent-red-500 shrink-0"
                />
                <label htmlFor="terms-early-unlock" className="text-[10px] md:text-xs text-neutral-400 cursor-pointer leading-tight">
                  {t("common.termsCheckbox")}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openTermsModal("unlock");
                    }}
                    className="text-red-400 hover:underline hover:text-red-300 font-medium inline-block pl-1 cursor-pointer"
                  >
                    {t("common.termsLink")}
                  </button>
                </label>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setAcceptTermsUnlock(false);
                    setShowEarlyUnlockModal(false);
                  }}
                  className="flex-1 py-3.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-colors">
                  {t("earlyUnlock.btnCancel")}
                </button>
                <button
                  disabled={isRedirectingToStripe || !acceptTermsUnlock}
                  onClick={async () => {
                    try {
                      setIsRedirectingToStripe(true);
                      if (capsuleId) {
                         let res;
                         if (accessToken) {
                            res = await fetch(`${API_URL}/api/v1/public/capsules/${capsuleId}/create-early-unlock-checkout?token=${accessToken}`, {
                               method: 'POST',
                               headers: getApiHeaders()
                            });
                         } else if (user) {
                            const token = await getToken({ template: 'aevum-session' });
                            res = await fetch(`${API_URL}/api/v1/payments/create-early-unlock-checkout/${capsuleId}`, {
                               method: 'POST',
                               headers: getApiHeaders(token)
                            });
                         } else {
                            throw new Error("Não autorizado.");
                         }
                         
                         if (!res.ok) throw new Error("Falha ao gerar multa.");
                         
                         const data = await res.json();
                         if (data.checkoutUrl) {
                             window.location.href = data.checkoutUrl;
                         } else {
                             setIsRedirectingToStripe(false);
                         }
                      }
                    } catch(e) {
                      console.error("Failed to unlock", e);
                      setIsRedirectingToStripe(false);
                      alert("O Cofre Central negou a quebra do selo temporal.");
                    }
                  }}
                  className="flex-1 py-3.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-colors shadow-lg shadow-red-500/20 disabled:opacity-50">
                  {isRedirectingToStripe ? t("earlyUnlock.btnConnecting") : t("earlyUnlock.btnPay")}
                </button>
              </div>

              {isAdmin && (
                  <button 
                    onClick={async () => {
                        try {
                          setShowEarlyUnlockModal(false);
                          setStorageStatus("RESTORING");
                          setIsUnsealingVideoPlaying(true);
                          const token = await getToken({ template: 'aevum-session' });
                          await fetch(`${API_URL}/api/v1/capsules/${capsuleId}/debug-unlock`, {
                              method: 'POST',
                              headers: getApiHeaders(token)
                          });
                        } catch(e) { console.error(e); }
                    }}
                    className="mt-6 w-full flex justify-center items-center gap-2 py-2 text-xs font-mono text-purple-400 hover:text-purple-300 transition-colors uppercase tracking-widest border border-purple-500/30 rounded-xl bg-purple-500/10"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                    [Admin] {t("earlyUnlock.adminForce")}
                  </button>
              )}

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
                        // Marca como visto para não repetir no F5
                        if (capsuleId) sessionStorage.setItem(`aevum_seal_seen_${capsuleId}`, "true");
                        
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
                        {t("vault.sealingCutscene")}
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

      {/* ======================================================== */}
      {/* Cutscene de Abertura (The Awakening)                       */}
      {/* ======================================================== */}
      <AnimatePresence>
         {isUnsealingVideoPlaying && (
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
                        // Marca como visto para não repetir no F5
                        if (capsuleId) sessionStorage.setItem(`aevum_unseal_seen_${capsuleId}`, "true");

                        setTimeout(() => {
                           setIsUnsealingVideoPlaying(false);
                            if (earlyUnlockSuccess || storageStatusRef.current === "RESTORING") {
                               setViewMode("VAULT");
                            } else {
                               setViewMode("GALLERY");
                            }
                        }, 200); // peak of flash
                        setTimeout(() => setShowFlash(false), 800); // flash fade-out duration
                     }}
                     src="/themes/bau-classico/bau-classico-video-abrindo.webm" 
                     className="w-full h-full object-contain max-h-[75vh] px-4"
                  />
                  {/* Overlay Cinematográfico */}
                  <div className="absolute bottom-8 w-full text-center pointer-events-none">
                     <span className="text-amber-500/70 text-xs md:text-sm tracking-[0.5em] uppercase font-bold animate-pulse">
                        Despertando Relíquias
                     </span>
                  </div>
               </div>
            </motion.div>
         )}
      </AnimatePresence>

      <AnimatePresence>
        {showTermsModal && (
          <TermsModal
            isOpen={showTermsModal}
            onClose={() => {
              setShowTermsModal(false);
              setTermsModalTarget(null);
            }}
            onAgree={handleAgreeTerms}
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
