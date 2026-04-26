"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser, useAuth } from "@clerk/nextjs";
import { CinematicCapsule } from "@/components/ui/CinematicCapsule";
import { ArrowLeft } from "lucide-react";

export default function VaultPage() {
    const { isLoaded, user } = useUser();
    const { getToken } = useAuth();
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [capsuleData, setCapsuleData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isLoaded) return;
        if (!user) { router.push("/"); return; }
        
        const fetchCapsule = async () => {
            try {
                const token = await getToken();
                const res = await fetch(`http://localhost:8080/api/v1/capsules/${id}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setCapsuleData(data);
                } else {
                    router.push("/dashboard");
                }
            } catch (e) {
                console.error("Failed to load capsule", e);
            } finally {
                setLoading(false);
            }
        };

        fetchCapsule();
    }, [id, user, router]);

    if (loading) {
        return <div className="min-h-screen bg-black flex items-center justify-center text-amber-500">Invocando Câmara...</div>;
    }

    if (!capsuleData) {
        return null;
    }

    // Determine limit internally based on the enum name if backend didn't provide bytes directly:
    // (We actually updated backend to return planType, storageStatus, and totalSizeBytes).
    // Let's resolve plan bytes.
    const planLimits: Record<string, number> = {
        "ESQUIRE_1GB": 1073741824,
        "KNIGHT_5GB": 5368709120,
        "BARON_10GB": 10737418240,
        "MARQUIS_25GB": 26843545600,
        "KING_50GB": 53687091200
    };
    
    // We expect the Spring boot to return: planType, storageStatus, totalSizeBytes.
    const maxSizeBytes = planLimits[capsuleData.planType] || 1073741824;

    return (
        <main className="min-h-screen bg-black relative overflow-hidden flex flex-col items-center justify-center p-6">
            <div className="absolute top-8 left-8 z-50">
                <button onClick={() => router.push("/dashboard")} className="flex items-center gap-2 text-neutral-500 hover:text-amber-500 text-xs font-bold uppercase tracking-widest transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Altar de Criação
                </button>
            </div>
            
            <CinematicCapsule 
                capsuleId={id}
                themeId={capsuleData.themeId}
                maxSizeBytes={maxSizeBytes}
                initialUsedBytes={capsuleData.totalSizeBytes}
                initialStorageStatus={capsuleData.storageStatus}
                title={capsuleData.title}
                recipientEmail={capsuleData.recipientEmail}
                unlockDate={capsuleData.unlockDate}
            />
        </main>
    );
}
