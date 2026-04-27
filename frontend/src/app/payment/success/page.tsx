"use client"

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@clerk/nextjs";
import { API_URL } from "@/lib/api";

export default function PaymentSuccessPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const capsuleId = searchParams.get("capsule_id");
    const { getToken } = useAuth();
    const sealed = useRef(false);

    useEffect(() => {
        if (!capsuleId) {
            router.push("/dashboard");
            return;
        }

        const confirmSeal = async () => {
            if (sealed.current) return;
            sealed.current = true;
            try {
                const token = await getToken();
                await fetch(`${API_URL}/api/v1/capsules/${capsuleId}/seal`, {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${token}` }
                });
            } catch (e) {
                console.error("Erro ao selar via fallback", e);
            }
        };

        confirmSeal();

        // Aumentando o tempo de celebração para 10 segundos
        const timer = setTimeout(() => {
            router.push(`/vault/${capsuleId}`);
        }, 10000);

        return () => clearTimeout(timer);
    }, [capsuleId, router, getToken]);

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900/20 via-black to-black" />
            <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

            <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="z-10 flex flex-col items-center text-center"
            >
                <div className="w-24 h-24 rounded-full bg-amber-500/20 border-2 border-amber-500/50 flex items-center justify-center mb-8 relative">
                    <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full animate-pulse" />
                    <Lock className="w-10 h-10 text-amber-500" />
                </div>
                
                <h1 className="text-4xl md:text-5xl font-serif text-amber-500 font-light mb-4 tracking-wide">
                    O Selo foi Forjado
                </h1>
                
                <p className="text-neutral-400 max-w-md mx-auto text-lg leading-relaxed font-light mb-8">
                    Seu pagamento foi confirmado pelo Cofre Central. A anomalia temporal está sendo estabilizada e sua cápsula foi permanentemente trancada.
                </p>

                <div className="flex items-center gap-3 text-amber-500/70 text-sm tracking-widest uppercase font-bold animate-pulse">
                    <span>Redirecionando para a Câmara</span>
                    <span className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    </span>
                </div>
            </motion.div>
        </div>
    );
}
