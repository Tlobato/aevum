"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useUser, useAuth, RedirectToSignIn } from "@clerk/nextjs";
import { CinematicCapsule } from "@/components/ui/CinematicCapsule";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { API_URL, getApiHeaders } from "@/lib/api";

function VaultContent() {
    const { isLoaded, user } = useUser();
    const { getToken } = useAuth();
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const id = params.id as string;
    const { t } = useTranslation();
    
    // Parâmetro injetado pelo Stripe ao retornar da compra de selagem
    const paymentSuccess = searchParams.get("payment_success") === "true";
    const earlyUnlockSuccess = searchParams.get("early_unlock_success") === "true";
    const accessToken = searchParams.get("token");

    const [capsuleData, setCapsuleData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Se o Clerk carregou e o usuário não está logado nem possui token de acesso público,
    // redireciona de forma segura para a tela de login do Clerk e traz de volta para o cofre.
    if (isLoaded && !accessToken && !user) {
        return (
            <RedirectToSignIn 
                signInFallbackRedirectUrl={`/vault/${id}`}
                signUpFallbackRedirectUrl={`/vault/${id}`}
            />
        );
    }

    useEffect(() => {
        if (!isLoaded) return;
        if (!accessToken && !user) return;
        
        const fetchCapsule = async () => {
            try {
                let res;
                if (accessToken) {
                    // Busca via endpoint público
                    res = await fetch(`${API_URL}/api/v1/public/capsules/${id}?token=${accessToken}`, {
                        headers: getApiHeaders()
                    });
                } else {
                    // Busca autenticada (Dono)
                    const token = await getToken();
                    res = await fetch(`${API_URL}/api/v1/capsules/${id}`, {
                        headers: getApiHeaders(token)
                    });
                }

                if (res.ok) {
                    const data = await res.json();
                    setCapsuleData(data);
                } else {
                    // Se falhar a busca (ex: token inválido), vai pro dashboard ou home
                    router.push(user ? "/dashboard" : "/");
                }
            } catch (e) {
                console.error("Failed to load capsule", e);
            } finally {
                setLoading(false);
            }
        };

        fetchCapsule();
    }, [id, user, isLoaded, router, accessToken, getToken]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6">
                <div className="w-24 h-24 overflow-hidden relative rounded-full drop-shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                    <img 
                        src="/logo-relic-load.webp" 
                        alt="Loading..." 
                        className="w-[115%] h-[115%] max-w-none object-cover -translate-x-[7%] -translate-y-[7%]" 
                    />
                </div>
                <span className="text-amber-500/60 font-mono text-[10px] uppercase tracking-[0.4em] animate-pulse">
                    {t("vault.loading")}
                </span>
            </div>
        );
    }

    if (!capsuleData) {
        return null;
    }

    // Determine limit internally based on the enum name if backend didn't provide bytes directly:
    // (We actually updated backend to return planType, storageStatus, and totalSizeBytes).
    // Let's resolve plan bytes.
    const planLimits: Record<string, number> = {
        "EPOCH_1GB": 1073741824,
        "CHRONOS_2GB": 2147483648,
        "AEON_3GB": 3221225472,
        "ETERNITY_4GB": 4294967296,
        "AEVUM_5GB": 5368709120
    };
    
    // We expect the Spring boot to return: planType, storageStatus, totalSizeBytes.
    const maxSizeBytes = planLimits[capsuleData.planType] || 1073741824;

    return (
        <main className="min-h-screen bg-black relative overflow-hidden flex flex-col items-center justify-between md:justify-center p-4 md:p-6">
            <div className="w-full max-w-5xl mb-6 md:mb-0 md:absolute md:top-8 md:left-8 z-50 flex justify-start">
                <button onClick={() => router.push("/dashboard")} className="flex items-center gap-2 text-neutral-500 hover:text-amber-500 text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer">
                    <ArrowLeft className="w-4 h-4" /> {t("vault.addMemories")}
                </button>
            </div>
            
            <div className="w-full flex-1 flex items-center justify-center">
                <CinematicCapsule 
                    capsuleId={id}
                    themeId={capsuleData.themeId}
                    maxSizeBytes={maxSizeBytes}
                    initialUsedBytes={capsuleData.totalSizeBytes}
                    initialStorageStatus={capsuleData.storageStatus}
                    title={capsuleData.title}
                    recipientEmail={capsuleData.recipientEmail}
                    unlockDate={capsuleData.unlockDate}
                    paymentSuccess={paymentSuccess}
                    earlyUnlockSuccess={earlyUnlockSuccess}
                    accessToken={searchParams.get("token")}
                    ownerId={capsuleData.ownerId}
                    earlyUnlockRule={capsuleData.earlyUnlockRule}
                />
            </div>
        </main>
    );
}

export default function VaultPage() {
    const { t } = useTranslation();
    return (
        <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-amber-500">{t("vault.loading")}</div>}>
            <VaultContent />
        </Suspense>
    );
}
