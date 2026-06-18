"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser, UserButton, useAuth } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Plus, ArrowRight, Wallet, ShieldAlert, Archive, Clock, X, Trash2 } from "lucide-react";
import { ThemePicker } from "@/components/ui/ThemePicker";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { API_URL } from "@/lib/api";

type CapsuleCard = {
    id: string;
    title: string;
    status: string;
    storageStatus: string;
    planType: string;
    unlockDate: string;
    totalSizeBytes: number;
    recipientEmail: string;
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
    RESTORING: "bg-orange-500/20 text-orange-300 border-orange-500/40",
};

export default function Dashboard() {
    const { isLoaded, user } = useUser();
    const { getToken } = useAuth();
    const router = useRouter();

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

    // Estado para o Modal de Confirmação
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; capsuleId: string | null }>({
        isOpen: false,
        capsuleId: null
    });

    // Calculando a data mínima de 2 dias para maturação e custo AWS Glacier
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 2);
    const minDateStr = minDate.toISOString().split("T")[0];
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && showCreateForm) {
                setShowCreateForm(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [showCreateForm]);

    const fetchCapsules = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = await getToken({ template: 'aevum-session' });
            const res = await fetch(`${API_URL}/api/v1/capsules`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) setCapsules(await res.json());
        } catch (e) {
            console.error("Erro ao buscar cápsulas:", e);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

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
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!res.ok) {
                // Se falhar no servidor, restaura a lista e avisa
                setCapsules(originalCapsules);
                alert("Falha ao apagar a cápsula no Registro Temporal. Verifique suas permissões.");
            }
        } catch (error) {
            console.error("Erro ao apagar:", error);
            setCapsules(originalCapsules);
            alert("Erro de conexão ao tentar apagar.");
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
                    headers: { 
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ planType, unlockDate: `${unlockDate}T00:00:00` })
                });
                if (res.ok) { const d = await res.json(); setEstimatedPrice(d.priceInCents); }
            } catch (e) { console.error(e); }
        };
        fetchEstimate();
    }, [planType, unlockDate, showCreateForm, user]);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!title || title.trim() === "") {
            newErrors.title = "O título da relíquia é obrigatório.";
        }

        if (isGift) {
            if (!recipientEmail || recipientEmail.trim() === "") {
                newErrors.recipientEmail = "O e-mail do destinatário é obrigatório.";
            } else {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(recipientEmail)) {
                    newErrors.recipientEmail = "Insira um endereço de e-mail válido.";
                }
            }
        }

        if (!unlockDate) {
            newErrors.unlockDate = "A data de despertar é obrigatória.";
        } else {
            const selectedDate = new Date(`${unlockDate}T00:00:00`);
            if (isNaN(selectedDate.getTime())) {
                newErrors.unlockDate = "Insira uma data válida.";
            } else {
                const limitDate = new Date(`${minDateStr}T00:00:00`);
                if (selectedDate < limitDate) {
                    newErrors.unlockDate = "O despertar deve ser no mínimo 2 dias no futuro.";
                }
                const maxDate = new Date();
                maxDate.setFullYear(maxDate.getFullYear() + 100);
                if (selectedDate > maxDate) {
                    newErrors.unlockDate = "O despertar deve ser de no máximo 100 anos no futuro.";
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
                headers: { 
                    "Content-Type": "application/json", 
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    themeId, title, description,
                    unlockDate: `${unlockDate}T00:00:00`,
                    recipientEmail: isGift ? recipientEmail : userEmail,
                    planType, isTestMode: false,
                    isGift, ownerMessage: isGift ? ownerMessage : null
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
                    alt="Carregando..." 
                    className="w-24 h-24 object-contain drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                />
                <span className="text-amber-500/60 font-mono text-[10px] uppercase tracking-[0.4em] animate-pulse">
                    Sincronizando com o Registro Temporal
                </span>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-black text-white relative overflow-hidden">
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
                    <div className="flex items-center gap-6">
                        <span className="text-xs font-mono text-neutral-500 bg-neutral-900/80 px-3 py-1.5 rounded-full border border-neutral-800 hidden md:block">
                            {user?.primaryEmailAddress?.emailAddress}
                        </span>
                        <UserButton />
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12 z-10 relative">

                {/* Título + Botão de Criar */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <p className="text-amber-500/60 tracking-[0.3em] text-xs uppercase font-bold mb-2">Câmara dos Legados</p>
                        <h1 className="text-4xl md:text-5xl font-extralight tracking-tighter">
                            {capsules.length === 0 ? "Nenhuma relíquia forjada." : `${capsules.length} relíquia${capsules.length > 1 ? "s" : ""} registrada${capsules.length > 1 ? "s" : ""}.`}
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
                        className="flex items-center gap-2 px-6 py-3 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-500/60 rounded-2xl text-amber-400 font-bold text-sm uppercase tracking-widest transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Forjar Nova Relíquia
                    </button>
                </div>

                {/* Modal de Criação */}
                <AnimatePresence>
                    {showCreateForm && (
                        <motion.div
                            initial={{ opacity: 0, y: -16, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -16, scale: 0.98 }}
                            transition={{ duration: 0.3 }}
                            className="mb-12 bg-neutral-900/60 border border-neutral-700/50 rounded-3xl p-8 backdrop-blur-sm relative"
                        >
                            <button onClick={() => setShowCreateForm(false)}
                                className="absolute top-8 right-8 text-neutral-500 hover:text-white transition-all hover:scale-110 active:scale-95 bg-white/5 p-1.5 rounded-full z-20">
                                <X className="w-5 h-5" />
                            </button>

                            <div className="grid lg:grid-cols-3 gap-8 items-start">
                                {/* Form */}
                                <form onSubmit={handleCreateCapsule} noValidate className="lg:col-span-2 space-y-5">
                                    <h2 className="text-xl font-light tracking-tight mb-2">Definir os Parâmetros da Relíquia</h2>

                                {/* Seletor de Fluxo: Para Mim vs Presente */}
                                <div className="flex gap-3 mb-6 p-1 bg-black/40 rounded-2xl border border-neutral-800">
                                    <button
                                        type="button"
                                        onClick={() => { setIsGift(false); setRecipientEmail(""); setOwnerMessage(""); }}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold uppercase tracking-widest transition-all ${
                                            !isGift
                                                ? "bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-inner"
                                                : "text-neutral-600 hover:text-neutral-400"
                                        }`}
                                    >
                                        <Lock className="w-4 h-4" /> Para Mim
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setIsGift(true); setRecipientEmail(""); }}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold uppercase tracking-widest transition-all ${
                                            isGift
                                                ? "bg-rose-500/20 border border-rose-500/40 text-rose-300 shadow-inner"
                                                : "text-neutral-600 hover:text-neutral-400"
                                        }`}
                                    >
                                        🎁 Presente
                                    </button>
                                </div>

                                <div className="grid md:grid-cols-2 gap-5">
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-xs uppercase tracking-widest text-neutral-500 font-semibold">Gravura / Título</label>
                                        <input 
                                            type="text" 
                                            value={title} 
                                            onChange={e => {
                                                setTitle(e.target.value);
                                                if (errors.title) setErrors(prev => ({ ...prev, title: "" }));
                                            }}
                                            className={`w-full bg-black/50 border rounded-xl px-5 py-3.5 text-white outline-none transition-all ${
                                                errors.title 
                                                    ? "border-rose-950/80 focus:border-rose-500/50" 
                                                    : "border-neutral-800 focus:border-amber-500/50"
                                            }`} 
                                        />
                                        {errors.title && (
                                            <span className="text-xs text-rose-400 mt-1 block font-medium tracking-wide">
                                                {errors.title}
                                            </span>
                                        )}
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-xs uppercase tracking-widest text-neutral-500 font-semibold">
                                            {isGift ? "E-mail do Destinatário" : "Portador (E-mail)"}
                                        </label>
                                        {isGift ? (
                                            <>
                                                <input
                                                    type="email"
                                                    value={recipientEmail}
                                                    onChange={e => {
                                                        setRecipientEmail(e.target.value);
                                                        if (errors.recipientEmail) setErrors(prev => ({ ...prev, recipientEmail: "" }));
                                                    }}
                                                    placeholder="herdeiro@futuro.com"
                                                    className={`w-full bg-black/50 border rounded-xl px-5 py-3.5 text-white outline-none transition-all placeholder:text-neutral-700 ${
                                                        errors.recipientEmail
                                                            ? "border-rose-950/80 focus:border-rose-500/50"
                                                            : "border-neutral-800 focus:border-rose-500/50"
                                                    }`}
                                                />
                                                {errors.recipientEmail && (
                                                    <span className="text-xs text-rose-400 mt-1 block font-medium tracking-wide">
                                                        {errors.recipientEmail}
                                                    </span>
                                                )}
                                            </>
                                        ) : (
                                            <div className="w-full bg-neutral-900/80 border border-neutral-800 rounded-xl px-5 py-3.5 text-neutral-400 flex items-center justify-between cursor-not-allowed">
                                                <span>{userEmail}</span>
                                                <span className="text-[10px] bg-amber-500/10 text-amber-500/70 px-2 py-1 rounded font-bold uppercase tracking-wider">Bloqueado</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs uppercase tracking-widest text-neutral-500 font-semibold">Data do Despertar</label>
                                            <span className="text-[10px] text-amber-500/60 font-medium">Mínimo 2 dias</span>
                                        </div>
                                        <input 
                                            type="date" 
                                            value={unlockDate} 
                                            max="2099-12-31"
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
                                            <p className="text-[10px] text-neutral-600 italic">Relíquias precisam de tempo para maturar. O selo mínimo é de 2 dias.</p>
                                        )}
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs uppercase tracking-widest text-neutral-500 font-semibold">Plano Dimensional</label>
                                            <span className="text-[10px] text-amber-500/80 font-bold uppercase tracking-wider animate-pulse">Fase Alpha: Apenas 1GB</span>
                                        </div>
                                        <select value={planType} onChange={e => setPlanType(e.target.value)}
                                            className="w-full bg-black/50 border border-neutral-800 focus:border-amber-500/50 rounded-xl px-5 py-3.5 text-white outline-none appearance-none">
                                            <option value="EPOCH_1GB">Epoch — 1GB (Disponível)</option>
                                            <option value="CHRONOS_2GB" disabled className="text-neutral-600">Chronos — 2GB (Indisponível na Fase Alpha)</option>
                                            <option value="AEON_3GB" disabled className="text-neutral-600">Aeon — 3GB (Indisponível na Fase Alpha)</option>
                                            <option value="ETERNITY_4GB" disabled className="text-neutral-600">Eternity — 4GB (Indisponível na Fase Alpha)</option>
                                            <option value="AEVUM_5GB" disabled className="text-neutral-600">Aevum — 5GB (Indisponível na Fase Alpha)</option>
                                        </select>
                                        <p className="text-[10px] text-neutral-600 italic">Durante os testes, limitamos o armazenamento para garantir a estabilidade do sistema.</p>
                                    </div>
                                </div>

                                    {/* Campo de Mensagem Especial — aparece apenas em modo Presente */}
                                    {isGift && (
                                        <div className="space-y-2">
                                            <label className="text-xs uppercase tracking-widest text-neutral-500 font-semibold">Mensagem Especial 💌</label>
                                            <textarea
                                                value={ownerMessage}
                                                onChange={e => setOwnerMessage(e.target.value)}
                                                maxLength={1000}
                                                rows={4}
                                                placeholder="Escreva algo para o destinatário ler quando o baú abrir..."
                                                className="w-full bg-black/50 border border-neutral-800 focus:border-rose-500/50 rounded-xl px-5 py-3.5 text-white outline-none transition-all placeholder:text-neutral-600 resize-none"
                                            />
                                            <p className="text-[10px] text-neutral-600 text-right">{ownerMessage.length}/1000</p>
                                        </div>
                                    )}

                                    <div className="pt-2">
                                        <ThemePicker selectedThemeId={themeId} onChange={setThemeId} />
                                    </div>
                                    <button type="submit" disabled={isSaving}
                                        className="w-full py-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 rounded-xl text-black font-black uppercase tracking-[0.2em] transition-all disabled:opacity-50 mt-2">
                                        {isSaving ? "Cristalizando..." : "Cristalizar Projeto →"}
                                    </button>
                                </form>

                                {/* Estimativa de Preço */}
                                <div className="bg-amber-900/10 border border-amber-500/10 rounded-2xl p-6 space-y-4 mt-8 lg:mt-12">
                                    <div className="flex items-center gap-2 text-amber-500">
                                        <Wallet className="w-4 h-4" />
                                        <span className="text-xs font-bold uppercase tracking-widest">Custo do Selo</span>
                                    </div>
                                    <div>
                                        <p className="text-3xl font-mono text-white">
                                            <span className="text-lg text-neutral-500">R$ </span>
                                            {estimatedPrice ? (estimatedPrice / 100).toFixed(2) : "—"}
                                        </p>
                                        <p className="text-xs text-neutral-500 mt-1">Estimativa baseada no plano e data escolhida</p>
                                    </div>
                                    <div className="pt-3 border-t border-amber-500/10 text-xs text-neutral-600 leading-relaxed">
                                        <ShieldAlert className="inline w-3 h-3 mr-1" />
                                        Pagamento único. Sem custos futuros para os herdeiros.
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Galeria de Cápsulas */}
                {capsules.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="text-center py-24 border border-dashed border-neutral-800 rounded-3xl">
                        <Archive className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
                        <p className="text-neutral-500 text-lg font-light">O cofre está vazio.</p>
                        <p className="text-neutral-700 text-sm mt-2">Clique em "Forjar Nova Relíquia" para começar.</p>
                    </motion.div>
                ) : (
                    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {capsules.map((cap, i) => {
                            const plan = PLAN_LABELS[cap.planType];
                            const usedPct = plan ? Math.min((cap.totalSizeBytes / plan.maxBytes) * 100, 100) : 0;
                            const unlockStr = new Date(cap.unlockDate).toLocaleDateString("pt-BR", { year: "numeric", month: "long", day: "numeric" });

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
                                            <p className="text-xs text-neutral-500 mt-1 truncate">{cap.recipientEmail}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className={`shrink-0 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${STATUS_BADGE[cap.status] || STATUS_BADGE["DRAFT"]}`}>
                                                {cap.status}
                                            </span>
                                            {(cap.status === "DRAFT" || isAdmin) && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setDeleteModal({ isOpen: true, capsuleId: cap.id }); }}
                                                    className="p-1.5 text-neutral-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                                                    title="Apagar Relíquia"
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
                                                    : `${(cap.totalSizeBytes / (1024 * 1024)).toFixed(1)} MB`} usados
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

                                    {/* Data de Desbloqueio */}
                                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                                        <Clock className="w-3.5 h-3.5 text-amber-500/50" />
                                        <span>Desperta em <span className="text-neutral-300">{unlockStr}</span></span>
                                    </div>

                                    {/* Botão de Entrar */}
                                    <button onClick={() => router.push(`/vault/${cap.id}`)}
                                        className="mt-auto w-full py-3 bg-white/5 hover:bg-amber-500/10 border border-white/10 hover:border-amber-500/30 rounded-xl text-sm font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 text-neutral-300 hover:text-amber-400">
                                        Ingressar no Cofre <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, capsuleId: null })}
                onConfirm={() => {
                    if (deleteModal.capsuleId) handleDeleteCapsule(deleteModal.capsuleId);
                }}
                title="Excluir Relíquia"
                message="Tem certeza que deseja apagar esta relíquia permanentemente? Todos os arquivos e mensagens guardados serão perdidos para sempre no fluxo do tempo."
                confirmText="Excluir Permanentemente"
                cancelText="Manter Relíquia"
                isDangerous={true}
            />
        </main>
    );
}
