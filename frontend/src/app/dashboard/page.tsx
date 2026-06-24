"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser, UserButton, useAuth, useClerk, useReverification } from "@clerk/nextjs";
import { isReverificationCancelledError } from "@clerk/nextjs/errors";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Plus, ArrowRight, Wallet, ShieldAlert, Archive, Clock, X, Trash2, Pencil } from "lucide-react";
import { ThemePicker } from "@/components/ui/ThemePicker";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import { API_URL, getApiHeaders } from "@/lib/api";

type CapsuleCard = {
    id: string;
    title: string;
    status: string;
    storageStatus: string;
    planType: string;
    unlockDate: string;
    totalSizeBytes: number;
    recipientEmail: string;
    isGift: boolean;
    ownerId: string;
    ownerEmail: string;
};

const PLAN_LABELS: Record<string, { label: string; maxBytes: number }> = {
    EPOCH_1GB:    { label: "Epoch (1GB)",    maxBytes: 1073741824     },
    CHRONOS_2GB:  { label: "Chronos (2GB)",  maxBytes: 2147483648     },
    AEON_3GB:     { label: "Aeon (3GB)",     maxBytes: 3221225472     },
    ETERNITY_4GB: { label: "Eternity (4GB)", maxBytes: 4294967296     },
    AEVUM_5GB:    { label: "Aevum (5GB)",    maxBytes: 5368709120     },
};

const STATUS_BADGE: Record<string, string> = {
    DRAFT:     "bg-amber-500/20 text-amber-300 border-amber-500/40",
    SEALED:    "bg-blue-500/20 text-blue-300 border-blue-500/40",
    OPENED:    "bg-green-500/20 text-green-300 border-green-500/40",
    UNLOCKED:  "bg-green-500/20 text-green-300 border-green-500/40",
    RESTORING: "bg-orange-500/20 text-orange-300 border-orange-500/40",
};

export default function Dashboard() {
    const { isLoaded, user } = useUser();
    const { getToken } = useAuth();
    const clerk = useClerk();
    const router = useRouter();
    const { t, i18n } = useTranslation();

    const updateSealedCapsule = useReverification(
        async (capsuleId: string, email: string) => {
            const token = await getToken({ skipCache: true });
            return fetch(`${API_URL}/api/v1/capsules/${capsuleId}`, {
                method: "PATCH",
                headers: getApiHeaders(token),
                body: JSON.stringify({ beneficiaryEmail: email })
            });
        }
    );

    const userEmail = user?.primaryEmailAddress?.emailAddress || "";
    const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",");
    const isAdmin = adminEmails.includes(userEmail);

    const [capsules, setCapsules] = useState<CapsuleCard[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);

    // Form state
    const [title, setTitle]           = useState("Meu Legado");
    const [description, setDescription] = useState("");
    const [unlockDate, setUnlockDate] = useState(() => {
        const d = new Date(); d.setFullYear(d.getFullYear() + 10);
        return d.toISOString().split("T")[0];
    });
    const [planType, setPlanType]           = useState("EPOCH_1GB");
    const [recipientEmail, setRecipientEmail] = useState("");
    const [isGift, setIsGift]               = useState(false);
    const [ownerMessage, setOwnerMessage]   = useState("");
    const [themeId, setThemeId]             = useState("bau-classico");
    const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
    const [isSaving, setIsSaving]           = useState(false);
    const [errors, setErrors]               = useState<Record<string, string>>({});
    const [earlyUnlockRule, setEarlyUnlockRule] = useState<"TOTAL_LOCK" | "CREATOR_ONLY" | "ALLOW_RECIPIENT">("TOTAL_LOCK");

    // Edit Capsule States
    const [editingCapsule, setEditingCapsule] = useState<CapsuleCard | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editRecipientEmail, setEditRecipientEmail] = useState("");
    const [editUnlockDate, setEditUnlockDate] = useState("");
    const [editErrors, setEditErrors] = useState<Record<string, string>>({});
    const [isUpdating, setIsUpdating] = useState(false);

    const openEditModal = (cap: CapsuleCard) => {
        setEditingCapsule(cap);
        setEditTitle(cap.title);
        setEditRecipientEmail(cap.recipientEmail || "");
        const dateOnly = cap.unlockDate.split("T")[0];
        setEditUnlockDate(dateOnly);
        setEditErrors({});
    };

    const validateEditForm = () => {
        const newErrors: Record<string, string> = {};
        const isSealed = editingCapsule?.status === "SEALED";

        if (!isSealed) {
            if (!editTitle || editTitle.trim() === "") {
                newErrors.title = t("forge.validation.titleRequired");
            }
        }

        if (!editRecipientEmail || editRecipientEmail.trim() === "") {
            newErrors.recipientEmail = t("forge.validation.emailRequired");
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(editRecipientEmail)) {
                newErrors.recipientEmail = t("forge.validation.emailInvalid");
            }
        }

        if (!isSealed) {
            if (!editUnlockDate) {
                newErrors.unlockDate = t("forge.validation.dateRequired");
            } else {
                const selectedDate = new Date(`${editUnlockDate}T00:00:00`);
                if (isNaN(selectedDate.getTime())) {
                    newErrors.unlockDate = t("forge.validation.dateInvalid");
                } else {
                    const now = new Date();
                    const diffMs = selectedDate.getTime() - now.getTime();
                    if (diffMs < 48 * 60 * 60 * 1000) {
                        newErrors.unlockDate = t("forge.validation.dateMin");
                    }
                    const maxDate = new Date();
                    maxDate.setFullYear(maxDate.getFullYear() + 100);
                    if (selectedDate > maxDate) {
                        newErrors.unlockDate = t("forge.validation.dateMax");
                    }
                }
            }
        }

        setEditErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleUpdateCapsule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCapsule) return;

        if (!validateEditForm()) {
            return;
        }

        setIsUpdating(true);
        const isSealed = editingCapsule.status === "SEALED";

        try {
            if (isSealed) {
                // A função envelopada pelo useReverification resolve diretamente para o JSON decodificado
                const data = (await updateSealedCapsule(editingCapsule.id, editRecipientEmail)) as any;
                if (data && data.id) {
                    setCapsules(prev => prev.map(c => c.id === editingCapsule.id ? data : c));
                    setEditingCapsule(null);
                } else {
                    alert(data?.message || "Erro ao atualizar destinatário.");
                }
            } else {
                const token = await getToken({ template: 'aevum-session' });
                const res = await fetch(`${API_URL}/api/v1/capsules/${editingCapsule.id}`, {
                    method: "PATCH",
                    headers: getApiHeaders(token),
                    body: JSON.stringify({
                        title: editTitle,
                        beneficiaryEmail: editRecipientEmail,
                        unlockDate: `${editUnlockDate}T00:00:00`,
                        targetTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                    })
                });

                if (res.ok) {
                    const data = await res.json();
                    setCapsules(prev => prev.map(c => c.id === editingCapsule.id ? data : c));
                    setEditingCapsule(null);
                } else {
                    try {
                        const errorData = await res.json();
                        alert(errorData.message || "Erro ao atualizar rascunho.");
                    } catch {
                        alert("Erro ao atualizar rascunho.");
                    }
                }
            }
        } catch (error) {
            if (isReverificationCancelledError(error)) {
                console.warn("Re-autenticação do Clerk cancelada pelo usuário.");
            } else {
                console.error("Erro ao atualizar cápsula:", error);
                alert(t("dashboard.alerts.connError"));
            }
        } finally {
            setIsUpdating(false);
        }
    };

    useEffect(() => {
        if (!isGift && earlyUnlockRule === "ALLOW_RECIPIENT") {
            setEarlyUnlockRule("TOTAL_LOCK");
        }
    }, [isGift, earlyUnlockRule]);

    // Estado para o Modal de Confirmação
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; capsuleId: string | null }>({
        isOpen: false,
        capsuleId: null
    });

    // Calculando a data mínima com folga de pelo menos 48 horas reais para desgelo do Glacier Deep Archive
    const getMinDateStr = () => {
        const now = new Date();
        const testDate = new Date();
        testDate.setDate(testDate.getDate() + 2); // Inicia a busca a partir de D+2
        
        while (true) {
            const year = testDate.getFullYear();
            const month = String(testDate.getMonth() + 1).padStart(2, "0");
            const day = String(testDate.getDate()).padStart(2, "0");
            const dateStr = `${year}-${month}-${day}`;
            
            const localUnlock = new Date(`${dateStr}T00:00:00`);
            const diffMs = localUnlock.getTime() - now.getTime();
            if (diffMs >= 48 * 60 * 60 * 1000) {
                return dateStr;
            }
            testDate.setDate(testDate.getDate() + 1);
        }
    };
    const minDateStr = getMinDateStr();
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                if (showCreateForm) setShowCreateForm(false);
                if (editingCapsule) setEditingCapsule(null);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [showCreateForm, editingCapsule]);

    const fetchCapsules = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = await getToken({ template: 'aevum-session' });
            const res = await fetch(`${API_URL}/api/v1/capsules`, {
                headers: getApiHeaders(token)
            });
            if (res.ok) setCapsules(await res.json());
        } catch (e) {
            console.error("Erro ao buscar cápsulas:", e);
        } finally {
            setIsLoading(false);
        }
    }, [user, getToken]);

    useEffect(() => {
        if (isLoaded && !user) { router.push("/"); return; }
        if (isLoaded && user) fetchCapsules();
    }, [isLoaded, user, router, fetchCapsules]);

    const handleDeleteCapsule = async (id: string) => {
        // Optimistic UI: Remove da lista local imediatamente
        const originalCapsules = [...capsules];
        setCapsules(prev => prev.filter(c => c.id !== id));

        try {
            const token = await getToken({ template: 'aevum-session' });
            const res = await fetch(`${API_URL}/api/v1/capsules/${id}`, {
                method: "DELETE",
                headers: getApiHeaders(token)
            });

            if (!res.ok) {
                // Se falhar no servidor, restaura a lista e avisa
                setCapsules(originalCapsules);
                alert(t("dashboard.alerts.deleteFail"));
            }
        } catch (error) {
            console.error("Erro ao apagar:", error);
            setCapsules(originalCapsules);
            alert(t("dashboard.alerts.connError"));
        }
    };

    // Busca estimativa de preço dinamicamente
    useEffect(() => {
        if (!showCreateForm || !user || !unlockDate) return;
        const fetchEstimate = async () => {
            try {
                const token = await getToken({ template: 'aevum-session' });
                const res = await fetch(`${API_URL}/api/v1/capsules/estimate`, {
                    method: "POST",
                    headers: getApiHeaders(token),
                    body: JSON.stringify({ planType, unlockDate: `${unlockDate}T00:00:00` })
                });
                if (res.ok) { const d = await res.json(); setEstimatedPrice(d.priceInCents); }
            } catch (e) { console.error(e); }
        };
        fetchEstimate();
    }, [planType, unlockDate, showCreateForm, user, getToken]);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!title || title.trim() === "") {
            newErrors.title = t("forge.validation.titleRequired");
        }

        if (isGift) {
            if (!recipientEmail || recipientEmail.trim() === "") {
                newErrors.recipientEmail = t("forge.validation.emailRequired");
            } else {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(recipientEmail)) {
                    newErrors.recipientEmail = t("forge.validation.emailInvalid");
                }
            }
        }

        if (!unlockDate) {
            newErrors.unlockDate = t("forge.validation.dateRequired");
        } else {
            const selectedDate = new Date(`${unlockDate}T00:00:00`);
            if (isNaN(selectedDate.getTime())) {
                newErrors.unlockDate = t("forge.validation.dateInvalid");
            } else {
                const now = new Date();
                const diffMs = selectedDate.getTime() - now.getTime();
                if (diffMs < 48 * 60 * 60 * 1000) {
                    newErrors.unlockDate = t("forge.validation.dateMin");
                }
                const maxDate = new Date();
                maxDate.setFullYear(maxDate.getFullYear() + 100);
                if (selectedDate > maxDate) {
                    newErrors.unlockDate = t("forge.validation.dateMax");
                }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCreateCapsule = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setIsSaving(true);
        try {
            const token = await getToken({ template: 'aevum-session' });
            const res = await fetch(`${API_URL}/api/v1/capsules`, {
                method: "POST",
                headers: getApiHeaders(token),
                body: JSON.stringify({
                    themeId, title, description,
                    unlockDate: `${unlockDate}T00:00:00`,
                    recipientEmail: isGift ? recipientEmail : userEmail,
                    planType, isTestMode: false,
                    isGift, ownerMessage: isGift ? ownerMessage : null,
                    earlyUnlockRule,
                    targetTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                })
            });
            if (res.ok) {
                const data = await res.json();
                router.push(`/vault/${data.id}`);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6">
                <motion.img 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    src="/logo-relic-load.webp" 
                    alt="Loading..." 
                    className="w-24 h-24 object-contain drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                />
                <span className="text-amber-500/60 font-mono text-[10px] uppercase tracking-[0.4em] animate-pulse">
                    {t("dashboard.loading")}
                </span>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-black text-white relative overflow-hidden flex flex-col">
            {/* Fundo sutil */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-5 pointer-events-none" />

            {/* Header */}
            <header className="border-b border-white/5 px-6 lg:px-12 py-6">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <img 
                            src="/logo-relic.png" 
                            alt="Aevum Logo" 
                            className="w-8 h-8 object-contain drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                        />
                        <span className="font-serif text-xl font-light tracking-tight">Aevum</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <LanguageSwitcher />
                        <span className="text-xs font-mono text-neutral-500 bg-neutral-900/80 px-3 py-1.5 rounded-full border border-neutral-800 hidden md:block">
                            {user?.primaryEmailAddress?.emailAddress}
                        </span>
                        <UserButton />
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12 z-10 relative flex-1 w-full">

                {/* Título + Botão de Criar */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <p className="text-amber-500/60 tracking-[0.3em] text-xs uppercase font-bold mb-2">{t("dashboard.title")}</p>
                        <h1 className="text-4xl md:text-5xl font-extralight tracking-tighter">
                            {capsules.length === 0 
                                ? t("dashboard.capsulesCount_zero") 
                                : capsules.length === 1 
                                    ? t("dashboard.capsulesCount_one") 
                                    : t("dashboard.capsulesCount_other", { count: capsules.length })
                            }
                        </h1>
                    </div>
                    <button
                        onClick={() => {
                            setIsGift(false);
                            setOwnerMessage("");
                            setRecipientEmail("");
                            setErrors({});
                            setShowCreateForm(!showCreateForm);
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-500/60 rounded-2xl text-amber-400 font-bold text-sm uppercase tracking-widest transition-all cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        {t("dashboard.tabForgeNew")}
                    </button>
                </div>

                {/* Modal de Criação */}
                <AnimatePresence>
                    {showCreateForm && (
                        <div 
                            onClick={(e) => {
                                if (e.target === e.currentTarget) {
                                    setShowCreateForm(false);
                                }
                            }}
                            className="fixed inset-0 z-[100] flex items-start justify-center bg-black/85 backdrop-blur-md overflow-y-auto py-12 px-4 cursor-pointer"
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 30, scale: 0.95 }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                                className="w-full max-w-5xl bg-neutral-950 border border-white/5 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(245,158,11,0.15)] relative cursor-default"
                            >
                            <button onClick={() => setShowCreateForm(false)}
                                className="absolute top-8 right-8 text-neutral-500 hover:text-white transition-all hover:scale-110 active:scale-95 bg-white/5 p-1.5 rounded-full z-20 cursor-pointer">
                                <X className="w-5 h-5" />
                            </button>

                            <div className="grid lg:grid-cols-3 gap-8 items-start">
                                {/* Form */}
                                <form onSubmit={handleCreateCapsule} noValidate className="lg:col-span-2 space-y-5">
                                    <h2 className="text-xl font-light tracking-tight mb-2">{t("forge.subtitle")}</h2>

                                    {/* Seletor de Fluxo: Para Mim vs Presente */}
                                    <div className="flex gap-3 mb-6 p-1 bg-black/40 rounded-2xl border border-neutral-800">
                                        <button
                                            type="button"
                                            onClick={() => { setIsGift(false); setRecipientEmail(""); setOwnerMessage(""); }}
                                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold uppercase tracking-widest transition-all cursor-pointer ${
                                                !isGift
                                                    ? "bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-inner"
                                                    : "text-neutral-600 hover:text-neutral-400"
                                            }`}
                                        >
                                            <Lock className="w-4 h-4" /> {t("forge.forMe")}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setIsGift(true); setRecipientEmail(""); }}
                                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold uppercase tracking-widest transition-all cursor-pointer ${
                                                isGift
                                                    ? "bg-rose-500/20 border border-rose-500/40 text-rose-300 shadow-inner"
                                                    : "text-neutral-600 hover:text-neutral-400"
                                            }`}
                                        >
                                            🎁 {t("forge.gift")}
                                        </button>
                                    </div>

                                    <div className="flex flex-col gap-5">
                                        <div className="space-y-2">
                                            <label className="text-xs uppercase tracking-widest text-neutral-500 font-semibold">{t("forge.fieldTitle")}</label>
                                            <input 
                                                type="text" 
                                                value={title} 
                                                onChange={e => {
                                                    setTitle(e.target.value);
                                                    if (errors.title) setErrors(prev => ({ ...prev, title: "" }));
                                                }}
                                                placeholder={t("forge.fieldTitlePlaceholder")}
                                                className={`w-full bg-black/50 border rounded-xl px-5 py-3.5 text-white outline-none placeholder:text-neutral-600 text-sm ${
                                                    errors.title 
                                                        ? "border-rose-950/85 focus:border-rose-500/50" 
                                                        : "border-neutral-800 focus:border-amber-500/50"
                                                }`}
                                            />
                                            {errors.title && (
                                                <span className="text-xs text-rose-400 mt-1 block font-medium tracking-wide">
                                                    {errors.title}
                                                </span>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs uppercase tracking-widest text-neutral-500 font-semibold">{t("forge.fieldDesc")}</label>
                                            <textarea 
                                                value={description} 
                                                onChange={e => setDescription(e.target.value)}
                                                placeholder={t("forge.fieldDescPlaceholder")}
                                                maxLength={500}
                                                rows={3}
                                                className="w-full bg-black/50 border border-neutral-800 focus:border-amber-500/50 rounded-xl px-5 py-3.5 text-white outline-none placeholder:text-neutral-600 text-sm resize-none"
                                            />
                                            <p className="text-[10px] text-neutral-600 text-right">{description.length}/500</p>
                                        </div>

                                        {isGift && (
                                            <div className="space-y-2">
                                                <label className="text-xs uppercase tracking-widest text-neutral-500 font-semibold">{t("forge.fieldRecipient")}</label>
                                                <input 
                                                    type="email" 
                                                    value={recipientEmail} 
                                                    onChange={e => {
                                                        setRecipientEmail(e.target.value);
                                                        if (errors.recipientEmail) setErrors(prev => ({ ...prev, recipientEmail: "" }));
                                                    }}
                                                    placeholder={t("forge.fieldRecipientPlaceholder")}
                                                    className={`w-full bg-black/50 border rounded-xl px-5 py-3.5 text-white outline-none placeholder:text-neutral-600 text-sm font-mono ${
                                                        errors.recipientEmail 
                                                            ? "border-rose-950/85 focus:border-rose-500/50" 
                                                            : "border-neutral-800 focus:border-rose-500/50"
                                                    }`}
                                                />
                                                {errors.recipientEmail && (
                                                    <span className="text-xs text-rose-400 mt-1 block font-medium tracking-wide">
                                                        {errors.recipientEmail}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <label className="text-xs uppercase tracking-widest text-neutral-500 font-semibold">{t("forge.fieldUnlock")}</label>
                                            <input 
                                                type="date" 
                                                value={unlockDate} 
                                                max="2099-12-31" min={minDateStr}
                                                onChange={e => {
                                                    setUnlockDate(e.target.value);
                                                    if (errors.unlockDate) setErrors(prev => ({ ...prev, unlockDate: "" }));
                                                }}
                                                className={`w-full bg-black/50 border rounded-xl px-5 py-3.5 text-white outline-none font-mono text-sm ${
                                                    errors.unlockDate
                                                        ? "border-rose-950/80 focus:border-rose-500/50"
                                                        : "border-neutral-800 focus:border-amber-500/50"
                                                }`} 
                                            />
                                            {errors.unlockDate ? (
                                                <span className="text-xs text-rose-400 mt-1 block font-medium tracking-wide">
                                                    {errors.unlockDate}
                                                </span>
                                            ) : (
                                                <p className="text-[10px] text-neutral-600 italic">{t("forge.validation.dateMin")}</p>
                                            )}
                                        </div>

                                         {/* Regras de Despertar Antecipado */}
                                         <div className="space-y-3 border-t border-white/5 pt-5">
                                             <div>
                                                 <label className="text-xs uppercase tracking-widest text-neutral-500 font-semibold">
                                                     {t("forge.earlyUnlockRuleTitle")}
                                                 </label>
                                                 <p className="text-[10px] text-neutral-600 italic mt-0.5">
                                                     {t("forge.earlyUnlockRuleDesc")}
                                                 </p>
                                             </div>

                                             <div className={`grid gap-3 ${isGift ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
                                                 {/* Bloqueio Total */}
                                                 <label className={`flex flex-col gap-1 p-4 rounded-xl border bg-black/35 cursor-pointer select-none transition-all ${
                                                     earlyUnlockRule === "TOTAL_LOCK"
                                                         ? "border-amber-500/50 bg-amber-500/5"
                                                         : "border-neutral-800 hover:border-neutral-700"
                                                 }`}>
                                                     <div className="flex items-center gap-2">
                                                         <input
                                                             type="radio"
                                                             name="earlyUnlockRule"
                                                             value="TOTAL_LOCK"
                                                             checked={earlyUnlockRule === "TOTAL_LOCK"}
                                                             onChange={() => setEarlyUnlockRule("TOTAL_LOCK")}
                                                             className="accent-amber-500 cursor-pointer"
                                                         />
                                                         <span className="text-xs font-bold text-white">
                                                             {t("forge.ruleTotalLock")}
                                                         </span>
                                                     </div>
                                                     <span className="text-xs text-neutral-400 font-light leading-relaxed pl-6">
                                                         {isGift ? t("forge.ruleTotalLockDescGift") : t("forge.ruleTotalLockDescSelf")}
                                                     </span>
                                                 </label>

                                                 {/* Apenas o Criador / Chave de Emergência */}
                                                 <label className={`flex flex-col gap-1 p-4 rounded-xl border bg-black/35 cursor-pointer select-none transition-all ${
                                                     earlyUnlockRule === "CREATOR_ONLY"
                                                         ? "border-amber-500/50 bg-amber-500/5"
                                                         : "border-neutral-800 hover:border-neutral-700"
                                                 }`}>
                                                     <div className="flex items-center gap-2">
                                                         <input
                                                             type="radio"
                                                             name="earlyUnlockRule"
                                                             value="CREATOR_ONLY"
                                                             checked={earlyUnlockRule === "CREATOR_ONLY"}
                                                             onChange={() => setEarlyUnlockRule("CREATOR_ONLY")}
                                                             className="accent-amber-500 cursor-pointer"
                                                         />
                                                         <span className="text-xs font-bold text-white">
                                                             {isGift ? t("forge.ruleCreatorOnly") : t("forge.ruleEmergencyKey")}
                                                         </span>
                                                     </div>
                                                     <span className="text-xs text-neutral-400 font-light leading-relaxed pl-6">
                                                         {isGift ? t("forge.ruleCreatorOnlyDesc") : t("forge.ruleEmergencyKeyDesc")}
                                                     </span>
                                                 </label>

                                                 {/* Permitir Destinatário (apenas se for presente) */}
                                                 {isGift && (
                                                     <label className={`flex flex-col gap-1 p-4 rounded-xl border bg-black/35 cursor-pointer select-none transition-all ${
                                                         earlyUnlockRule === "ALLOW_RECIPIENT"
                                                             ? "border-amber-500/50 bg-amber-500/5"
                                                             : "border-neutral-800 hover:border-neutral-700"
                                                     }`}>
                                                         <div className="flex items-center gap-2">
                                                             <input
                                                                 type="radio"
                                                                 name="earlyUnlockRule"
                                                                 value="ALLOW_RECIPIENT"
                                                                 checked={earlyUnlockRule === "ALLOW_RECIPIENT"}
                                                                 onChange={() => setEarlyUnlockRule("ALLOW_RECIPIENT")}
                                                                 className="accent-amber-500 cursor-pointer"
                                                             />
                                                             <span className="text-xs font-bold text-white">
                                                                 {t("forge.ruleAllowRecipient")}
                                                             </span>
                                                         </div>
                                                         <span className="text-xs text-neutral-400 font-light leading-relaxed pl-6">
                                                             {t("forge.ruleAllowRecipientDesc")}
                                                         </span>
                                                     </label>
                                                 )}
                                             </div>
                                         </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs uppercase tracking-widest text-neutral-500 font-semibold">{t("forge.fieldPlan")}</label>
                                                <span className="text-[10px] text-amber-500/80 font-bold uppercase tracking-wider animate-pulse">{t("forge.alphaPlanNote")}</span>
                                            </div>
                                            <select value={planType} onChange={e => setPlanType(e.target.value)}
                                                className="w-full bg-black/50 border border-neutral-800 focus:border-amber-500/50 rounded-xl px-5 py-3.5 text-white outline-none appearance-none cursor-pointer">
                                                <option value="EPOCH_1GB">Epoch — 1GB ({t("filter.unlocked", "Disponível")})</option>
                                                <option value="CHRONOS_2GB" disabled className="text-neutral-600">Chronos — 2GB ({t("forge.alphaPlanNote")})</option>
                                                <option value="AEON_3GB" disabled className="text-neutral-600">Aeon — 3GB ({t("forge.alphaPlanNote")})</option>
                                                <option value="ETERNITY_4GB" disabled className="text-neutral-600">Eternity — 4GB ({t("forge.alphaPlanNote")})</option>
                                                <option value="AEVUM_5GB" disabled className="text-neutral-600">Aevum — 5GB ({t("forge.alphaPlanNote")})</option>
                                            </select>
                                            <p className="text-[10px] text-neutral-600 italic">{t("forge.storageNote")}</p>
                                        </div>
                                    </div>

                                    {/* Campo de Mensagem Especial — aparece apenas em modo Presente */}
                                    {isGift && (
                                        <div className="space-y-2">
                                            <label className="text-xs uppercase tracking-widest text-neutral-500 font-semibold">{t("forge.fieldGiftMsg")}</label>
                                            <textarea
                                                value={ownerMessage}
                                                onChange={e => setOwnerMessage(e.target.value)}
                                                maxLength={1000}
                                                rows={4}
                                                placeholder={t("forge.fieldGiftMsgPlaceholder")}
                                                className="w-full bg-black/50 border border-neutral-800 focus:border-rose-500/50 rounded-xl px-5 py-3.5 text-white outline-none transition-all placeholder:text-neutral-600 resize-none"
                                            />
                                            <p className="text-[10px] text-neutral-600 text-right">{ownerMessage.length}/1000</p>
                                        </div>
                                    )}

                                    <div className="pt-2">
                                        <ThemePicker selectedThemeId={themeId} onChange={setThemeId} />
                                    </div>
                                    <button type="submit" disabled={isSaving}
                                        className="w-full py-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 rounded-xl text-black font-black uppercase tracking-[0.2em] transition-all disabled:opacity-50 mt-2 cursor-pointer">
                                        {isSaving ? t("forge.verifying") : t("forge.buttonForge")}
                                    </button>
                                </form>

                                {/* Estimativa de Preço */}
                                <div className="bg-amber-900/10 border border-amber-500/10 rounded-2xl p-6 space-y-4 mt-8 lg:mt-12">
                                    <div className="flex items-center gap-2 text-amber-500">
                                        <Wallet className="w-4 h-4" />
                                        <span className="text-xs font-bold uppercase tracking-widest">{t("forge.estimate")}</span>
                                    </div>
                                    <div>
                                        <p className="text-3xl font-mono text-white">
                                            <span className="text-lg text-neutral-500">R$ </span>
                                            {estimatedPrice ? (estimatedPrice / 100).toFixed(2) : "—"}
                                        </p>
                                        <p className="text-xs text-neutral-500 mt-1">{t("forge.estimateNote")}</p>
                                    </div>
                                    <div className="pt-3 border-t border-amber-500/10 text-xs text-neutral-600 leading-relaxed">
                                        <ShieldAlert className="inline w-3 h-3 mr-1" />
                                        {t("forge.paymentNote")}
                                    </div>
                                </div>
                            </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Modal de Edição */}
                <AnimatePresence>
                    {editingCapsule && (
                        <div 
                            onClick={(e) => {
                                if (e.target === e.currentTarget) {
                                    setEditingCapsule(null);
                                }
                            }}
                            className="fixed inset-0 z-[100] flex items-start justify-center bg-black/85 backdrop-blur-md overflow-y-auto py-12 px-4 cursor-pointer"
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 30, scale: 0.95 }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                                className="w-full max-w-2xl bg-neutral-950 border border-white/5 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(245,158,11,0.15)] relative cursor-default"
                            >
                                <button onClick={() => setEditingCapsule(null)}
                                    className="absolute top-8 right-8 text-neutral-500 hover:text-white transition-all hover:scale-110 active:scale-95 bg-white/5 p-1.5 rounded-full z-20 cursor-pointer">
                                    <X className="w-5 h-5" />
                                </button>

                                <form onSubmit={handleUpdateCapsule} noValidate className="space-y-6">
                                    <div>
                                        <h2 className="text-xl font-light tracking-tight">
                                            {editingCapsule.status === "SEALED" 
                                                ? t("dashboard.actions.editRecipient") 
                                                : t("dashboard.actions.edit")}
                                        </h2>
                                        <p className="text-xs text-neutral-500 mt-1">
                                            {editingCapsule.status === "SEALED" 
                                                ? t("forge.editSealedSubtitle") 
                                                : t("forge.editSubtitle")}
                                        </p>
                                    </div>

                                    {editingCapsule.status === "SEALED" && (
                                        <div className="flex gap-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-xs text-amber-200/90 leading-relaxed">
                                            <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                            <div>
                                                {t("forge.sealedWarning")}
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-5">
                                        <div className="space-y-2">
                                            <label className="text-xs uppercase tracking-widest text-neutral-500 font-semibold">{t("forge.fieldTitle")}</label>
                                            <input 
                                                type="text" 
                                                value={editTitle} 
                                                disabled={editingCapsule.status === "SEALED"}
                                                onChange={e => {
                                                    setEditTitle(e.target.value);
                                                    if (editErrors.title) setEditErrors(prev => ({ ...prev, title: "" }));
                                                }}
                                                className={`w-full border rounded-xl px-5 py-3.5 text-sm outline-none placeholder:text-neutral-600 ${
                                                    editingCapsule.status === "SEALED"
                                                        ? "bg-neutral-900/50 border-neutral-900 text-neutral-500 cursor-not-allowed select-none"
                                                        : `bg-black/50 text-white ${
                                                            editErrors.title 
                                                                ? "border-rose-950/85 focus:border-rose-500/50" 
                                                                : "border-neutral-800 focus:border-amber-500/50"
                                                          }`
                                                }`}
                                            />
                                            {editErrors.title && (
                                                <span className="text-xs text-rose-400 mt-1 block font-medium tracking-wide">
                                                    {editErrors.title}
                                                </span>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs uppercase tracking-widest text-neutral-500 font-semibold">{t("forge.fieldRecipient")}</label>
                                            <input 
                                                type="email" 
                                                value={editRecipientEmail} 
                                                onChange={e => {
                                                    setEditRecipientEmail(e.target.value);
                                                    if (editErrors.recipientEmail) setEditErrors(prev => ({ ...prev, recipientEmail: "" }));
                                                }}
                                                className={`w-full bg-black/50 border rounded-xl px-5 py-3.5 text-white outline-none placeholder:text-neutral-600 text-sm font-mono ${
                                                    editErrors.recipientEmail 
                                                        ? "border-rose-950/85 focus:border-rose-500/50" 
                                                        : "border-neutral-800 focus:border-amber-500/50"
                                                }`}
                                            />
                                            {editErrors.recipientEmail && (
                                                <span className="text-xs text-rose-400 mt-1 block font-medium tracking-wide">
                                                    {editErrors.recipientEmail}
                                                </span>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs uppercase tracking-widest text-neutral-500 font-semibold">{t("forge.fieldUnlock")}</label>
                                            <input 
                                                type="date" 
                                                value={editUnlockDate} 
                                                max="2099-12-31" min={minDateStr}
                                                disabled={editingCapsule.status === "SEALED"}
                                                onChange={e => {
                                                    setEditUnlockDate(e.target.value);
                                                    if (editErrors.unlockDate) setEditErrors(prev => ({ ...prev, unlockDate: "" }));
                                                }}
                                                className={`w-full border rounded-xl px-5 py-3.5 text-sm font-mono outline-none ${
                                                    editingCapsule.status === "SEALED"
                                                        ? "bg-neutral-900/50 border-neutral-900 text-neutral-500 cursor-not-allowed select-none"
                                                        : `bg-black/50 text-white ${
                                                            editErrors.unlockDate
                                                                ? "border-rose-950/80 focus:border-rose-500/50"
                                                                : "border-neutral-800 focus:border-amber-500/50"
                                                          }`
                                                }`} 
                                            />
                                            {editErrors.unlockDate ? (
                                                <span className="text-xs text-rose-400 mt-1 block font-medium tracking-wide">
                                                    {editErrors.unlockDate}
                                                </span>
                                            ) : (
                                                editingCapsule.status !== "SEALED" && <p className="text-[10px] text-neutral-600 italic">{t("forge.validation.dateMin")}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <button 
                                            type="button" 
                                            onClick={() => setEditingCapsule(null)}
                                            className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-neutral-300 font-bold uppercase tracking-widest text-xs transition-all cursor-pointer"
                                        >
                                            {t("forge.buttonCancel")}
                                        </button>
                                        <button 
                                            type="submit" 
                                            disabled={isUpdating}
                                            className="flex-1 py-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 rounded-xl text-black font-black uppercase tracking-widest text-xs transition-all disabled:opacity-50 cursor-pointer"
                                        >
                                            {isUpdating ? t("forge.verifying") : t("common.save")}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Galeria de Cápsulas */}
                {capsules.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="text-center py-24 border border-dashed border-neutral-800 rounded-3xl">
                        <Archive className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
                        <p className="text-neutral-500 text-lg font-light">{t("dashboard.noCapsules")}</p>
                        <p className="text-neutral-700 text-sm mt-2">{t("dashboard.noCapsulesSubtitle")}</p>
                    </motion.div>
                ) : (
                    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {capsules.map((cap, i) => {
                            const plan = PLAN_LABELS[cap.planType];
                            const usedPct = plan ? Math.min((cap.totalSizeBytes / plan.maxBytes) * 100, 100) : 0;
                            const unlockStr = new Date(cap.unlockDate).toLocaleDateString(i18n.language || "pt-BR", { year: "numeric", month: "long", day: "numeric" });
                            const isReceivedGift = cap.isGift && cap.ownerId !== user?.id;

                            return (
                                <motion.div key={cap.id}
                                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.08 }}
                                    className="group bg-neutral-900/40 border border-neutral-800 hover:border-amber-500/30 rounded-3xl p-6 flex flex-col gap-5 transition-all duration-300 hover:shadow-[0_0_30px_rgba(245,158,11,0.06)]"
                                >
                                    {/* Cabeçalho do Card */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h3 className="font-serif text-lg font-light leading-tight">{cap.title}</h3>
                                            <p className="text-xs text-neutral-500 mt-1 truncate">
                                                {isReceivedGift
                                                    ? t("dashboard.receivedGiftFrom", { email: cap.ownerEmail })
                                                    : (cap.recipientEmail === userEmail 
                                                        ? t("dashboard.table.personal") 
                                                        : t("dashboard.table.gift", { email: cap.recipientEmail }))}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            {isReceivedGift && (
                                                <span className="shrink-0 text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-300">
                                                    🎁 {t("dashboard.receivedGiftTag")}
                                                </span>
                                            )}
                                            <span className={`shrink-0 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${STATUS_BADGE[cap.status] || STATUS_BADGE["DRAFT"]}`}>
                                                {t(`dashboard.badge.${cap.status}`, cap.status)}
                                            </span>
                                            {!isReceivedGift && (cap.status === "DRAFT" || cap.status === "SEALED") && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); openEditModal(cap); }}
                                                    className="p-1.5 text-neutral-600 hover:text-amber-400 hover:bg-amber-400/10 rounded-lg transition-all cursor-pointer"
                                                    title={cap.status === "SEALED" ? t("dashboard.actions.editRecipient") : t("dashboard.actions.edit")}
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                            )}
                                            {!isReceivedGift && (cap.status === "DRAFT" || isAdmin) && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setDeleteModal({ isOpen: true, capsuleId: cap.id }); }}
                                                    className="p-1.5 text-neutral-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all cursor-pointer"
                                                    title={t("dashboard.actions.delete")}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Barra de Quota */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-xs text-neutral-500">
                                            <span>{plan?.label || cap.planType}</span>
                                            <span className="font-mono">
                                                {cap.totalSizeBytes < 1024 * 1024 
                                                    ? `${(cap.totalSizeBytes / 1024).toFixed(1)} KB` 
                                                    : `${(cap.totalSizeBytes / (1024 * 1024)).toFixed(1)} MB`} {t("vault.storage").toLowerCase()}
                                            </span>
                                        </div>
                                        <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                                            <motion.div className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${usedPct}%` }}
                                                transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.08 + 0.2 }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                                        <Clock className="w-3.5 h-3.5 text-amber-500/50" />
                                        <span>
                                            {cap.status === "UNLOCKED" || cap.status === "OPENED"
                                                ? t("vault.unlockedSubtitle", { date: unlockStr }) 
                                                : t("vault.lockedSubtitle", { date: unlockStr })}
                                        </span>
                                    </div>

                                    {/* Botão de Entrar */}
                                    <button onClick={() => router.push(`/vault/${cap.id}`)}
                                        className="mt-auto w-full py-3 bg-white/5 hover:bg-amber-500/10 border border-white/10 hover:border-amber-500/30 rounded-xl text-sm font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 text-neutral-300 hover:text-amber-400 cursor-pointer">
                                        {t("dashboard.actions.view")} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Rodapé do Dashboard */}
            <footer className="w-full border-t border-white/5 py-8 mt-auto select-none shrink-0">
                <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-neutral-600 font-medium">
                    <span>© {new Date().getFullYear()} Aevum.</span>
                    <a href="/termos" className="hover:text-amber-500 transition-colors underline decoration-neutral-800 underline-offset-2">
                        {t("common.termsLink", "Termos de Uso e Custódia Digital")}
                    </a>
                </div>
            </footer>

            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, capsuleId: null })}
                onConfirm={() => {
                    if (deleteModal.capsuleId) handleDeleteCapsule(deleteModal.capsuleId);
                }}
                title={t("dashboard.deleteModal.title")}
                message={t("dashboard.deleteModal.confirm")}
                confirmText={t("dashboard.deleteModal.buttonDelete")}
                cancelText={t("dashboard.deleteModal.buttonCancel")}
                isDangerous={true}
            />
        </main>
    );
}
