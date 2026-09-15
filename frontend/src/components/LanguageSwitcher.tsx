"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Globe, ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const LANGUAGES = [
    { code: "pt-BR", label: "Português", flag: "🇧🇷", short: "PT" },
    { code: "en",    label: "English",   flag: "🇺🇸", short: "EN" },
    { code: "es",    label: "Español",   flag: "🇪🇸", short: "ES" },
];

export function LanguageSwitcher() {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const currentLang = i18n.language || "pt-BR";
    const currentOption = LANGUAGES.find(l => currentLang.startsWith(l.code.split("-")[0])) || LANGUAGES[0];

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} className="relative inline-block text-left">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 bg-neutral-950/70 hover:bg-neutral-900 border border-neutral-800/80 hover:border-amber-500/40 px-2.5 py-1.5 rounded-xl shadow-lg shadow-black/20 text-xs font-bold tracking-wider transition-all cursor-pointer select-none text-neutral-300 hover:text-white"
                title="Alterar idioma / Change language"
            >
                <Globe className="w-3.5 h-3.5 text-amber-500/90" />
                <span className="font-mono text-[11px] text-amber-400 font-bold">{currentOption.short}</span>
                <ChevronDown className={`w-3 h-3 text-neutral-500 transition-transform duration-200 ${isOpen ? "rotate-180 text-amber-400" : ""}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute right-0 top-full mt-2 z-50 min-w-[145px] bg-neutral-950/95 backdrop-blur-xl border border-neutral-800/90 rounded-2xl shadow-2xl p-1.5 flex flex-col gap-1 select-none"
                    >
                        {LANGUAGES.map((lang) => {
                            const isActive = currentLang.startsWith(lang.code.split("-")[0]);
                            return (
                                <button
                                    key={lang.code}
                                    type="button"
                                    onClick={() => {
                                        changeLanguage(lang.code);
                                        setIsOpen(false);
                                    }}
                                    className={`flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                                        isActive
                                            ? "bg-amber-500/15 text-amber-400 font-bold border border-amber-500/25"
                                            : "text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent"
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm leading-none">{lang.flag}</span>
                                        <span>{lang.label}</span>
                                    </div>
                                    {isActive && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
