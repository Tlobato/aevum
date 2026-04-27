"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser, UserButton, useAuth } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Plus, ArrowRight, Wallet, ShieldAlert, Archive, Clock, X } from "lucide-react";
import { ThemePicker } from "@/components/ui/ThemePicker";
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
    ESQUIRE_1GB:  { label: "Esquire (1GB)",  maxBytes: 1073741824     },
    KNIGHT_5GB:   { label: "Knight (5GB)",   maxBytes: 5368709120     },
    BARON_10GB:   { label: "Baron (10GB)",   maxBytes: 10737418240    },
    MARQUIS_25GB: { label: "Marquis (25GB)", maxBytes: 26843545600    },
    KING_50GB:    { label: "King (50GB)",    maxBytes: 53687091200    },
};

const STATUS_BADGE: Record<string, string> = {
    DRAFT:  "bg-amber-500/20 text-amber-300 border-amber-500/40",
    SEALED: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    OPENED: "bg-green-500/20 text-green-300 border-green-500/40",
};

export default function Dashboard() {
    const { isLoaded, user } = useUser();
    const { getToken } = useAuth();
    const router = useRouter();

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
    const [planType, setPlanType]           = useState("ESQUIRE_1GB");
    const [recipientEmail, setRecipientEmail] = useState("");
    const [isCustomEmail, setIsCustomEmail] = useState(false);
    const [themeId, setThemeId]             = useState("bau-classico");
    const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
    const [isSaving, setIsSaving]           = useState(false);



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
            const token = await getToken();
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

    // Busca estimativa de preço dinamicamente
    useEffect(() => {
        if (!showCreateForm || !user) return;
        const fetchEstimate = async () => {
            try {
                const token = await getToken();
                const res = await fetch(`${API_URL}/api/v1/capsules/estimate`, {
                    method: "POST",
                    headers: { 
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ planType, unlockDate: new Date(unlockDate).toISOString() })
                });
                if (res.ok) { const d = await res.json(); setEstimatedPrice(d.priceInCents); }
            } catch (e) { console.error(e); }
        };
        fetchEstimate();
    }, [planType, unlockDate, showCreateForm, user]);

    const handleCreateCapsule = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/api/v1/capsules`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json", 
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    themeId, title, description,
                    unlockDate: new Date(unlockDate).toISOString(),
                    recipientEmail, planType, isTestMode: false
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
            <div className="min-h-screen bg-black flex items-center justify-center text-amber-500 font-mono text-sm tracking-widest">
                Consultando o Registro Temporal...
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
                        <div className="w-8 h-8 border border-amber-500/30 rounded-full flex items-center justify-center">
                            <Lock className="w-3.5 h-3.5 text-amber-500" />
                        </div>
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
                            setIsCustomEmail(false);
                            setRecipientEmail(user?.primaryEmailAddress?.emailAddress || "");
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
                                className="absolute top-6 right-6 text-neutral-500 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>

                            <div className="grid lg:grid-cols-3 gap-8 items-start">
                                {/* Form */}
                                <form onSubmit={handleCreateCapsule} className="lg:col-span-2 space-y-5">
                                    <h2 className="text-xl font-light tracking-tight mb-6">Definir os Parâmetros da Relíquia</h2>
                                    <div className="grid md:grid-cols-2 gap-5">
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-xs uppercase tracking-widest text-neutral-500 font-semibold">Gravura / Título</label>
                                            <input type="text" required value={title} onChange={e => setTitle(e.target.value)}
                                                className="w-full bg-black/50 border border-neutral-800 focus:border-amber-500/50 rounded-xl px-5 py-3.5 text-white outline-none transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs uppercase tracking-widest text-neutral-500 font-semibold">Portador (E-mail)</label>
                                                {!isCustomEmail && (
                                                    <button type="button" onClick={() => { setIsCustomEmail(true); setRecipientEmail(""); }} className="text-[10px] text-amber-500 hover:text-amber-400 uppercase tracking-widest font-bold">
                                                        Usar Outro Email
                                                    </button>
                                                )}
                                            </div>
                                            {isCustomEmail ? (
                                                <div className="relative">
                                                    <input type="email" required value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)}
                                                        placeholder="herdeiro@futuro.com" autoFocus
                                                        className="w-full bg-black/50 border border-neutral-800 focus:border-amber-500/50 rounded-xl px-5 py-3.5 text-white outline-none transition-all placeholder:text-neutral-700" />
                                                    <button type="button" onClick={() => { setIsCustomEmail(false); setRecipientEmail(user?.primaryEmailAddress?.emailAddress || ""); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-neutral-500 hover:text-white uppercase font-bold tracking-wider">
                                                        Cancelar
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-5 py-3.5 text-neutral-300 flex items-center justify-between">
                                                    <span>{user?.primaryEmailAddress?.emailAddress}</span>
                                                    <span className="text-[10px] bg-white/5 px-2 py-1 rounded text-neutral-500 uppercase tracking-wider font-bold">Meu Email</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs uppercase tracking-widest text-neutral-500 font-semibold">Data do Despertar</label>
                                            <input type="date" required value={unlockDate} onChange={e => setUnlockDate(e.target.value)}
                                                className="w-full bg-black/50 border border-neutral-800 focus:border-amber-500/50 rounded-xl px-5 py-3.5 text-white outline-none font-mono text-sm" />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-xs uppercase tracking-widest text-neutral-500 font-semibold">Plano Dimensional</label>
                                            <select value={planType} onChange={e => setPlanType(e.target.value)}
                                                className="w-full bg-black/50 border border-neutral-800 focus:border-amber-500/50 rounded-xl px-5 py-3.5 text-white outline-none appearance-none">
                                                <option value="ESQUIRE_1GB">Esquire — 1GB</option>
                                                <option value="KNIGHT_5GB">Knight — 5GB</option>
                                                <option value="BARON_10GB">Baron — 10GB</option>
                                                <option value="MARQUIS_25GB">Marquis — 25GB</option>
                                                <option value="KING_50GB">King — 50GB</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="pt-2">
                                        <ThemePicker selectedThemeId={themeId} onChange={setThemeId} />
                                    </div>
                                    <button type="submit" disabled={isSaving}
                                        className="w-full py-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 rounded-xl text-black font-black uppercase tracking-[0.2em] transition-all disabled:opacity-50 mt-2">
                                        {isSaving ? "Cristalizando..." : "Cristalizar Projeto →"}
                                    </button>
                                </form>

                                {/* Estimativa de Preço */}
                                <div className="bg-amber-900/10 border border-amber-500/10 rounded-2xl p-6 space-y-4">
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
                                        <span className={`shrink-0 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${STATUS_BADGE[cap.status] || STATUS_BADGE["DRAFT"]}`}>
                                            {cap.status}
                                        </span>
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
        </main>
    );
}
