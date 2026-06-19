"use client";

import { motion } from "framer-motion";
import { THEME_REGISTRY } from "@/config/themes";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ThemePickerProps {
    selectedThemeId: string;
    onChange: (themeId: string) => void;
}

export function ThemePicker({ selectedThemeId, onChange }: ThemePickerProps) {
    const { t } = useTranslation();
    const themes = Object.values(THEME_REGISTRY);

    return (
        <div className="space-y-3">
            <label className="text-xs uppercase tracking-widest text-neutral-500 font-semibold pl-1">
                {t("themes.label")}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {themes.map((theme) => {
                    const isSelected = selectedThemeId === theme.id;
                    return (
                        <motion.button
                            key={theme.id}
                            type="button"
                            onClick={() => onChange(theme.id)}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className={`relative flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all duration-200 cursor-pointer
                                ${isSelected
                                    ? "border-amber-500/70 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                                    : "border-neutral-800 bg-neutral-900/40 hover:border-neutral-600 hover:bg-neutral-900/60"
                                }`}
                        >
                            {/* Preview do Baú */}
                            <div className="w-full h-24 flex items-center justify-center relative">
                                <img
                                    src={theme.assets.vault.closed}
                                    alt={theme.name}
                                    className="max-h-full max-w-full object-contain drop-shadow-lg"
                                />
                                {/* Badge de "Em Breve" para temas sem ícones */}
                                {Object.keys(theme.assets.relics).length === 0 && (
                                    <div className="absolute top-0 right-0 bg-neutral-700/80 text-neutral-300 text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full">
                                        WIP
                                    </div>
                                )}
                            </div>

                            {/* Nome */}
                            <span className={`text-xs font-bold tracking-wider transition-colors ${isSelected ? "text-amber-300" : "text-neutral-400"}`}>
                                {t(`themes.${theme.id}`, { defaultValue: theme.name })}
                            </span>

                            {/* Indicador de selecionado */}
                            {isSelected && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center shadow-lg"
                                >
                                    <Check className="w-3 h-3 text-black" strokeWidth={3} />
                                </motion.div>
                            )}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
