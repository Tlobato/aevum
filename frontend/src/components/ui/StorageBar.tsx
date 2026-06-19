"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

interface StorageBarProps {
    usedBytes: number;
    maxBytes: number;
    isQuotaFull: boolean;
    isBlurMode?: boolean;
}

export function StorageBar({ usedBytes, maxBytes, isQuotaFull, isBlurMode = false }: StorageBarProps) {
    const { t, i18n } = useTranslation();
    const [pulseTrigger, setPulseTrigger] = useState(0);

    // Dispara animação de brilho toda vez que usedBytes aumenta ou diminui
    useEffect(() => {
        setPulseTrigger(prev => prev + 1);
    }, [usedBytes]);

    const formatDynamic = (b: number) => {
        if (b < 1024 * 1024) return (b / 1024).toFixed(2) + " KB";
        if (b >= 1024 * 1024 * 1024) return (b / (1024 * 1024 * 1024)).toFixed(2) + " GB";
        return (b / (1024 * 1024)).toFixed(2) + " MB";
    };

    const formatMax = (b: number) => {
        if (b >= 1024 * 1024 * 1024) return (b / (1024 * 1024 * 1024)).toFixed(0) + " GB";
        return (b / (1024 * 1024)).toFixed(0) + " MB";
    };

    // Usando precisão de float pontual. 
    // Para uploads ínfimos pelo menos garantimos que a largura renderizada não sofra arredondamento a 0.
    const percentage = Math.min((usedBytes / maxBytes) * 100, 100);

    return (
        <motion.div
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className={`relative md:absolute top-0 right-0 left-0 md:right-8 md:left-auto w-full md:w-auto max-w-sm md:max-w-none bg-black/50 px-6 py-4 rounded-xl border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.2)] select-none z-10 transition-all min-w-[250px] mb-6 md:mb-0 ${isBlurMode ? 'opacity-20 blur-sm' : ''}`}
        >
            <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-amber-500/90 tracking-widest uppercase">
                    {t("vault.storage")}
                </span>
                
                {/* Exibição Híbrida: Formato Amigável em cima, Formato Bytes Embaixo */}
                <div className="flex flex-col items-end">
                    <span className="text-xs font-mono text-amber-200">
                        {formatDynamic(usedBytes)} / {formatMax(maxBytes)}
                    </span>
                    <span className="text-[9px] font-mono text-amber-500/50 mt-0.5">
                        {usedBytes.toLocaleString(i18n.language)} / {maxBytes.toLocaleString(i18n.language)} Bytes
                    </span>
                </div>
            </div>

            <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden relative">
                <motion.div 
                    key={pulseTrigger > 0 ? "update" : "init"} // Força restart da animação se quisermos, mas o animate base é melhor
                    className={`absolute inset-y-0 left-0 ${isQuotaFull ? 'bg-red-500' : 'bg-gradient-to-r from-amber-600 to-amber-300'}`}
                    initial={{ width: 0 }}
                    animate={{ 
                        width: `${percentage}%`,
                        boxShadow: pulseTrigger > 1 ? [
                            "0px 0px 0px rgba(245,158,11,0)", 
                            "0px 0px 15px rgba(245,158,11,0.8)", 
                            "0px 0px 0px rgba(245,158,11,0)"
                        ] : "none"
                    }}
                    transition={{ 
                        width: { duration: 0.5, ease: "easeOut" },
                        boxShadow: { duration: 0.8, ease: "easeInOut" }
                    }}
                />
            </div>
            
            {/* Indicador de "Pulsar" (Glow Global da Barra ao atualizar) */}
            <AnimatePresence>
                {pulseTrigger > 1 && (
                    <motion.div 
                        key={pulseTrigger}
                        initial={{ opacity: 0.8, scale: 1 }}
                        animate={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 bg-amber-500/20 rounded-xl pointer-events-none"
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}
