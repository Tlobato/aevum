"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { Show, SignInButton, SignUpButton } from "@clerk/nextjs";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function Home() {
    const router = useRouter();
    const { t } = useTranslation();

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-black selection:bg-amber-500/30">
            {/* Language Switcher */}
            <div className="absolute top-6 right-6 z-20">
                <LanguageSwitcher />
            </div>

            {/* Background elements */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-900/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="w-full max-w-md z-10 flex flex-col items-center"
            >
                {/* Logo Area */}
                <div className="mb-12 text-center space-y-4">
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.5, duration: 1 }}
                        className="mx-auto w-24 h-24 flex items-center justify-center mb-4"
                    >
                        <img 
                            src="/logo-relic.png" 
                            alt="Aevum Relic" 
                            className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(245,158,11,0.6)]"
                        />
                    </motion.div>
                    <h1 className="text-5xl md:text-6xl font-extralight tracking-tighter text-white">
                        Aevum
                    </h1>
                    <p className="text-amber-500/60 tracking-[0.4em] text-xs uppercase font-bold">{t("home.subtitle")}</p>
                </div>

                <div className="w-full space-y-4">
                    <Show when="signed-out">
                        <SignInButton mode="modal">
                            <button className="group relative w-full px-8 py-4 bg-gradient-to-br from-amber-600 via-amber-500 to-amber-700 rounded-2xl text-black font-extrabold tracking-widest uppercase transition-all overflow-hidden hover:shadow-[0_0_40px_rgba(214,158,46,0.4)] cursor-pointer">
                                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
                                <span className="relative z-10 flex items-center justify-center gap-2">{t("home.enterVault")}</span>
                            </button>
                        </SignInButton>
                        <SignUpButton mode="modal">
                            <button className="w-full px-8 py-4 bg-transparent border border-neutral-800 hover:border-amber-500/50 rounded-2xl text-white font-extrabold tracking-widest uppercase transition-all hover:bg-neutral-900/50 cursor-pointer">
                                {t("home.createNewLegacy")}
                            </button>
                        </SignUpButton>
                    </Show>
                    <Show when="signed-in">
                        <button onClick={() => router.push("/dashboard")} className="group relative w-full px-8 py-4 bg-gradient-to-br from-amber-600 via-amber-500 to-amber-700 rounded-2xl text-black font-extrabold tracking-widest uppercase transition-all overflow-hidden hover:shadow-[0_0_40px_rgba(214,158,46,0.4)] cursor-pointer">
                            {t("home.accessDashboard")}
                        </button>
                    </Show>
                    
                    <p className="text-center text-xs text-neutral-600 font-medium pt-4">
                        {t("home.securedByClerk")}
                    </p>
                </div>
            </motion.div>

            {/* Rodapé Institucional */}
            <footer className="absolute bottom-6 left-0 right-0 text-center z-10 select-none">
                <div className="max-w-md mx-auto flex flex-col md:flex-row items-center justify-center gap-1 md:gap-3 text-[10px] text-neutral-700 font-medium">
                    <span>© {new Date().getFullYear()} Aevum.</span>
                    <span className="hidden md:inline">•</span>
                    <a href="/termos" className="hover:text-amber-500 transition-colors underline decoration-neutral-800 underline-offset-2">
                        {t("common.termsLink", "Termos de Uso e Custódia Digital")}
                    </a>
                </div>
            </footer>

            <style dangerouslySetInnerHTML={{__html: `
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
            `}} />
        </main>
    );
}
