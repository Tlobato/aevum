"use client";

import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
    const { i18n } = useTranslation();
    const currentLang = i18n.language || "pt-BR";

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    return (
        <div className="flex items-center gap-1.5 bg-neutral-950/60 backdrop-blur-md border border-neutral-800/80 px-2 py-1 rounded-xl shadow-lg shadow-black/20">
            <Globe className="w-3.5 h-3.5 text-neutral-500" />
            <div className="flex items-center gap-0.5">
                <button
                    onClick={() => changeLanguage("pt-BR")}
                    className={`text-[10px] md:text-xs px-2 py-0.5 rounded-md font-bold tracking-wider transition-all cursor-pointer ${
                        currentLang.startsWith("pt")
                            ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                            : "text-neutral-400 hover:text-white border border-transparent"
                    }`}
                >
                    PT
                </button>
                <button
                    onClick={() => changeLanguage("en")}
                    className={`text-[10px] md:text-xs px-2 py-0.5 rounded-md font-bold tracking-wider transition-all cursor-pointer ${
                        currentLang.startsWith("en")
                            ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                            : "text-neutral-400 hover:text-white border border-transparent"
                    }`}
                >
                    EN
                </button>
            </div>
        </div>
    );
}
