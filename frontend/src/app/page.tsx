"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Lock, 
  ChevronDown, 
  Sparkles, 
  ShieldCheck, 
  Database, 
  KeyRound, 
  Heart, 
  Baby, 
  Compass, 
  Gift, 
  ArrowRight,
  Clock,
  HelpCircle,
  FileText,
  Camera,
  Mic,
  Video
} from "lucide-react";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SoundToggle } from "@/components/ui/SoundToggle";
import { useSound } from "@/hooks/useSound";
import { trackEvent } from "@/providers/PostHogProvider";

export default function Home() {
    const router = useRouter();
    const { t } = useTranslation();
    const { play } = useSound();
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const toggleFaq = (index: number) => {
        play("click");
        const next = openFaq === index ? null : index;
        setOpenFaq(next);
        if (next !== null) {
            trackEvent("faq_opened", { questionIndex: index });
        }
    };

    const scrollToSection = (id: string) => {
        play("click");
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <main className="min-h-screen bg-black text-white selection:bg-amber-500/30 overflow-x-hidden font-sans">
            {/* Background elements globais */}
            <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none z-0" />
            <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-amber-900/10 rounded-full blur-[140px] pointer-events-none mix-blend-screen z-0" />

            {/* HEADER FLUTUANTE DE NAVEGAÇÃO */}
            <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/60 border-b border-neutral-900/80 transition-all">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
                    {/* Brand */}
                    <div 
                        onClick={() => scrollToSection("hero")}
                        className="flex items-center gap-3 cursor-pointer group select-none"
                    >
                        <div className="w-10 h-10 relative flex items-center justify-center">
                            <img 
                                src="/logo-relic.png" 
                                alt="Aevum Relic" 
                                className="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(245,158,11,0.5)] group-hover:scale-105 transition-transform"
                            />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-2xl font-extralight tracking-tighter text-white group-hover:text-amber-400 transition-colors">
                                Aevum
                            </span>
                        </div>
                    </div>

                    {/* Navigation Actions */}
                    <div className="flex items-center gap-2 sm:gap-4">
                        <SoundToggle />
                        <LanguageSwitcher />

                        <Show when="signed-out">
                            <SignInButton mode="modal" forceRedirectUrl="/dashboard" fallbackRedirectUrl="/dashboard">
                                <button 
                                    onClick={() => { play("click"); trackEvent("enter_vault_clicked", { source: "header" }); }}
                                    className="px-4 sm:px-6 py-2.5 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 hover:brightness-110 text-black text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] cursor-pointer"
                                >
                                    {t("landing.ctaSecondary")}
                                </button>
                            </SignInButton>
                        </Show>

                        <Show when="signed-in">
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => { play("click"); trackEvent("access_dashboard_clicked", { source: "header" }); router.push("/dashboard"); }}
                                    className="px-4 sm:px-6 py-2.5 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 hover:brightness-110 text-black text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] cursor-pointer flex items-center gap-1.5"
                                >
                                    <span>{t("home.accessDashboard")}</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                                <UserButton />
                            </div>
                        </Show>
                    </div>
                </div>
            </header>

            {/* SEÇÃO 1: HERO PRINCIPAL */}
            <section id="hero" className="relative min-h-screen flex flex-col items-center justify-center pt-28 pb-16 px-4 sm:px-6 text-center z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="max-w-4xl mx-auto flex flex-col items-center"
                >
                    {/* Cadeado Dourado Imponente */}
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 1 }}
                        className="w-36 h-36 sm:w-44 sm:h-44 relative flex items-center justify-center mb-8 select-none"
                    >
                        <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full animate-pulse" />
                        <img 
                            src="/logo-relic.png" 
                            alt="Aevum Relic" 
                            className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_35px_rgba(245,158,11,0.7)]"
                        />
                    </motion.div>

                    {/* Título Monumental */}
                    <h1 className="text-4xl sm:text-6xl md:text-7xl font-extralight tracking-tight text-white leading-tight mb-6">
                        {t("landing.heroTitle1")}{" "}
                        <span className="font-semibold bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent">
                            {t("landing.heroTitle2")}
                        </span>
                    </h1>

                    {/* Subtítulo Narrativo */}
                    <p className="text-base sm:text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto font-light leading-relaxed mb-10">
                        {t("landing.heroSubtitle")}
                    </p>

                    {/* Botão de Ação do Hero */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-sm">
                        <Show when="signed-out">
                            <SignUpButton mode="modal" forceRedirectUrl="/dashboard" fallbackRedirectUrl="/dashboard">
                                <button 
                                    onClick={() => { play("click"); trackEvent("create_legacy_clicked", { source: "hero" }); }}
                                    className="w-full px-8 py-4 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 hover:brightness-110 text-black font-extrabold text-sm uppercase tracking-widest rounded-2xl shadow-[0_0_35px_rgba(245,158,11,0.4)] hover:shadow-[0_0_45px_rgba(245,158,11,0.6)] transition-all cursor-pointer flex items-center justify-center gap-3 group"
                                >
                                    <span>{t("landing.ctaPrimary")}</span>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </SignUpButton>
                        </Show>

                        <Show when="signed-in">
                            <button 
                                onClick={() => { play("click"); trackEvent("access_dashboard_clicked", { source: "hero" }); router.push("/dashboard"); }}
                                className="w-full px-8 py-4 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 hover:brightness-110 text-black font-extrabold text-sm uppercase tracking-widest rounded-2xl shadow-[0_0_35px_rgba(245,158,11,0.4)] hover:shadow-[0_0_45px_rgba(245,158,11,0.6)] transition-all cursor-pointer flex items-center justify-center gap-3 group"
                            >
                                <span>{t("home.accessDashboard")}</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </Show>
                    </div>

                    {/* Scroll Indicator */}
                    <button 
                        onClick={() => scrollToSection("como-funciona")}
                        className="mt-16 inline-flex flex-col items-center gap-2 text-xs text-neutral-500 hover:text-amber-400 transition-colors cursor-pointer group"
                    >
                        <span>{t("landing.scrollDown")}</span>
                        <ChevronDown className="w-4 h-4 animate-bounce group-hover:text-amber-400" />
                    </button>
                </motion.div>
            </section>

            {/* SEÇÃO 2: O CONTRASTE (A EFEMERIDADE DIGITAL) */}
            <section className="py-24 px-4 sm:px-6 relative z-10 border-t border-neutral-900 bg-neutral-950/40">
                <div className="max-w-5xl mx-auto text-center">
                    <span className="text-amber-500/80 tracking-[0.3em] text-xs uppercase font-bold">
                        {t("landing.problemBadge")}
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-extralight text-white mt-3 mb-6 max-w-3xl mx-auto">
                        {t("landing.problemTitle")}
                    </h2>
                    <p className="text-neutral-400 text-base sm:text-lg font-light leading-relaxed max-w-3xl mx-auto">
                        {t("landing.problemText")}
                    </p>

                    {/* Grid Comparativo */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-14 text-left">
                        {/* Caixa 1: O Mundo Efêmero */}
                        <div className="p-8 rounded-3xl bg-neutral-900/40 border border-neutral-800/80 backdrop-blur-md relative overflow-hidden">
                            <div className="w-12 h-12 rounded-2xl bg-neutral-800 flex items-center justify-center mb-6 text-neutral-400">
                                <Clock className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-medium text-neutral-300 mb-3">
                                {t("landing.problemCard1Title")}
                            </h3>
                            <ul className="space-y-3 text-sm text-neutral-400 font-light">
                                <li className="flex items-start gap-2">
                                    <span className="text-neutral-600">✕</span>
                                    <span>{t("landing.problemCard1Item1")}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-neutral-600">✕</span>
                                    <span>{t("landing.problemCard1Item2")}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-neutral-600">✕</span>
                                    <span>{t("landing.problemCard1Item3")}</span>
                                </li>
                            </ul>
                        </div>

                        {/* Caixa 2: O Santuário Aevum */}
                        <div className="p-8 rounded-3xl bg-gradient-to-b from-amber-500/10 via-amber-950/20 to-neutral-900/40 border border-amber-500/30 backdrop-blur-md relative overflow-hidden shadow-[0_0_40px_rgba(245,158,11,0.1)]">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mb-6 text-amber-400">
                                <Lock className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-semibold text-amber-200 mb-3">
                                {t("landing.problemCard2Title")}
                            </h3>
                            <ul className="space-y-3 text-sm text-neutral-300 font-light">
                                <li className="flex items-start gap-2">
                                    <span className="text-amber-400 font-bold">✓</span>
                                    <span>{t("landing.problemCard2Item1")}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-amber-400 font-bold">✓</span>
                                    <span>{t("landing.problemCard2Item2")}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-amber-400 font-bold">✓</span>
                                    <span>{t("landing.problemCard2Item3")}</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* SEÇÃO 3: COMO FUNCIONA (3 PASSOS SOLENES) */}
            <section id="como-funciona" className="py-28 px-4 sm:px-6 relative z-10 border-t border-neutral-900">
                <div className="max-w-5xl mx-auto text-center">
                    <span className="text-amber-500/80 tracking-[0.3em] text-xs uppercase font-bold">
                        {t("landing.stepsBadge")}
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-extralight text-white mt-3 mb-4">
                        {t("landing.stepsTitle")}
                    </h2>
                    <p className="text-neutral-400 text-base sm:text-lg font-light max-w-2xl mx-auto mb-16">
                        {t("landing.stepsSubtitle")}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                        {/* Passo 1 */}
                        <div className="p-8 rounded-3xl bg-neutral-950/60 border border-neutral-800/80 hover:border-amber-500/40 transition-all group relative">
                            <div className="text-5xl font-extralight text-neutral-800 group-hover:text-amber-500/40 transition-colors mb-6">
                                01
                            </div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-14 h-14 relative p-1.5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 group-hover:border-amber-500/40 transition-all flex items-center justify-center">
                                    <img 
                                        src="/themes/bau-classico/bau-classico-fechado.png" 
                                        alt="Baú Clássico"
                                        className="w-full h-full object-contain group-hover:scale-110 transition-transform drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                                    />
                                </div>
                                <div className="w-14 h-14 relative p-1.5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 group-hover:border-amber-500/40 transition-all flex items-center justify-center">
                                    <img 
                                        src="/themes/bau-grego/bau-grego-fechado.png" 
                                        alt="Baú Grego"
                                        className="w-full h-full object-contain group-hover:scale-110 transition-transform drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                                    />
                                </div>
                                <div className="w-14 h-14 relative p-1.5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 group-hover:border-amber-500/40 transition-all flex items-center justify-center">
                                    <img 
                                        src="/themes/bau-maritimo/bau-maritimo-fechado.png" 
                                        alt="Baú Marítimo"
                                        className="w-full h-full object-contain group-hover:scale-110 transition-transform drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                                    />
                                </div>
                            </div>
                            <h3 className="text-xl font-medium text-white mb-3">
                                {t("landing.step1Title")}
                            </h3>
                            <p className="text-sm text-neutral-400 font-light leading-relaxed">
                                {t("landing.step1Desc")}
                            </p>
                        </div>

                        {/* Passo 2 */}
                        <div className="p-8 rounded-3xl bg-neutral-950/60 border border-neutral-800/80 hover:border-amber-500/40 transition-all group relative">
                            <div className="text-5xl font-extralight text-neutral-800 group-hover:text-amber-500/40 transition-colors mb-6">
                                02
                            </div>
                            <div className="flex items-center gap-2 mb-6 h-16">
                                <span className="p-3 rounded-xl bg-neutral-900 text-amber-400 border border-neutral-800"><FileText className="w-5 h-5" /></span>
                                <span className="p-3 rounded-xl bg-neutral-900 text-amber-400 border border-neutral-800"><Camera className="w-5 h-5" /></span>
                                <span className="p-3 rounded-xl bg-neutral-900 text-amber-400 border border-neutral-800"><Mic className="w-5 h-5" /></span>
                                <span className="p-3 rounded-xl bg-neutral-900 text-amber-400 border border-neutral-800"><Video className="w-5 h-5" /></span>
                            </div>
                            <h3 className="text-xl font-medium text-white mb-3">
                                {t("landing.step2Title")}
                            </h3>
                            <p className="text-sm text-neutral-400 font-light leading-relaxed">
                                {t("landing.step2Desc")}
                            </p>
                        </div>

                        {/* Passo 3 */}
                        <div className="p-8 rounded-3xl bg-neutral-950/60 border border-neutral-800/80 hover:border-amber-500/40 transition-all group relative">
                            <div className="text-5xl font-extralight text-neutral-800 group-hover:text-amber-500/40 transition-colors mb-6">
                                03
                            </div>
                            <div className="w-16 h-16 mb-6 flex items-center justify-center">
                                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                                    <Lock className="w-7 h-7" />
                                </div>
                            </div>
                            <h3 className="text-xl font-medium text-white mb-3">
                                {t("landing.step3Title")}
                            </h3>
                            <p className="text-sm text-neutral-400 font-light leading-relaxed">
                                {t("landing.step3Desc")}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* SEÇÃO 4: CASOS DE USO EMOCIONAIS */}
            <section className="py-28 px-4 sm:px-6 relative z-10 border-t border-neutral-900 bg-neutral-950/30">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="text-amber-500/80 tracking-[0.3em] text-xs uppercase font-bold">
                            {t("landing.useCasesBadge")}
                        </span>
                        <h2 className="text-3xl sm:text-5xl font-extralight text-white mt-3 mb-4">
                            {t("landing.useCasesTitle")}
                        </h2>
                        <p className="text-neutral-400 text-base sm:text-lg font-light">
                            {t("landing.useCasesSubtitle")}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Caso 1: Filhos */}
                        <div className="p-8 rounded-3xl bg-neutral-900/40 border border-neutral-800 hover:border-amber-500/30 transition-all">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6 text-amber-400">
                                <Baby className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">
                                {t("landing.useCase1Title")}
                            </h3>
                            <p className="text-neutral-400 text-sm leading-relaxed">
                                {t("landing.useCase1Desc")}
                            </p>
                        </div>

                        {/* Caso 2: Casamento */}
                        <div className="p-8 rounded-3xl bg-neutral-900/40 border border-neutral-800 hover:border-amber-500/30 transition-all">
                            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-6 text-rose-400">
                                <Heart className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">
                                {t("landing.useCase2Title")}
                            </h3>
                            <p className="text-neutral-400 text-sm leading-relaxed">
                                {t("landing.useCase2Desc")}
                            </p>
                        </div>

                        {/* Caso 3: Futuro Pessoal */}
                        <div className="p-8 rounded-3xl bg-neutral-900/40 border border-neutral-800 hover:border-amber-500/30 transition-all">
                            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 flex items-center justify-center mb-6 text-sky-400">
                                <Compass className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">
                                {t("landing.useCase3Title")}
                            </h3>
                            <p className="text-neutral-400 text-sm leading-relaxed">
                                {t("landing.useCase3Desc")}
                            </p>
                        </div>

                        {/* Caso 4: Presente */}
                        <div className="p-8 rounded-3xl bg-neutral-900/40 border border-neutral-800 hover:border-amber-500/30 transition-all">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 text-emerald-400">
                                <Gift className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">
                                {t("landing.useCase4Title")}
                            </h3>
                            <p className="text-neutral-400 text-sm leading-relaxed">
                                {t("landing.useCase4Desc")}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* SEÇÃO 5: SEGURANÇA & ARQUITETURA */}
            <section className="py-28 px-4 sm:px-6 relative z-10 border-t border-neutral-900">
                <div className="max-w-5xl mx-auto text-center">
                    <span className="text-amber-500/80 tracking-[0.3em] text-xs uppercase font-bold">
                        {t("landing.securityBadge")}
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-extralight text-white mt-3 mb-4">
                        {t("landing.securityTitle")}
                    </h2>
                    <p className="text-neutral-400 text-base sm:text-lg font-light max-w-2xl mx-auto mb-16">
                        {t("landing.securitySubtitle")}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                        <div className="p-8 rounded-3xl bg-neutral-950/70 border border-neutral-800">
                            <ShieldCheck className="w-10 h-10 text-amber-400 mb-6" />
                            <h3 className="text-lg font-semibold text-white mb-2">
                                {t("landing.securityItem1Title")}
                            </h3>
                            <p className="text-sm text-neutral-400 leading-relaxed font-light">
                                {t("landing.securityItem1Desc")}
                            </p>
                        </div>

                        <div className="p-8 rounded-3xl bg-neutral-950/70 border border-neutral-800">
                            <Database className="w-10 h-10 text-amber-400 mb-6" />
                            <h3 className="text-lg font-semibold text-white mb-2">
                                {t("landing.securityItem2Title")}
                            </h3>
                            <p className="text-sm text-neutral-400 leading-relaxed font-light">
                                {t("landing.securityItem2Desc")}
                            </p>
                        </div>

                        <div className="p-8 rounded-3xl bg-neutral-950/70 border border-neutral-800">
                            <KeyRound className="w-10 h-10 text-amber-400 mb-6" />
                            <h3 className="text-lg font-semibold text-white mb-2">
                                {t("landing.securityItem3Title")}
                            </h3>
                            <p className="text-sm text-neutral-400 leading-relaxed font-light">
                                {t("landing.securityItem3Desc")}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* SEÇÃO 6: PERGUNTAS FREQUENTES (FAQ) */}
            <section className="py-28 px-4 sm:px-6 relative z-10 border-t border-neutral-900 bg-neutral-950/40">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="text-amber-500/80 tracking-[0.3em] text-xs uppercase font-bold">
                            {t("landing.faqBadge")}
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-extralight text-white mt-3">
                            {t("landing.faqTitle")}
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {[
                            { q: t("landing.faqQ1"), a: t("landing.faqA1") },
                            { q: t("landing.faqQ2"), a: t("landing.faqA2") },
                            { q: t("landing.faqQ3"), a: t("landing.faqA3") },
                            { q: t("landing.faqQ4"), a: t("landing.faqA4") },
                        ].map((faq, idx) => (
                            <div 
                                key={idx}
                                className="rounded-2xl border border-neutral-800/80 bg-neutral-900/30 overflow-hidden transition-colors"
                            >
                                <button
                                    onClick={() => toggleFaq(idx)}
                                    className="w-full p-6 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-neutral-900/60 transition-colors"
                                >
                                    <span className="text-base font-medium text-neutral-200">
                                        {faq.q}
                                    </span>
                                    <ChevronDown 
                                        className={`w-5 h-5 text-amber-400 transition-transform duration-300 shrink-0 ${openFaq === idx ? "rotate-180" : ""}`}
                                    />
                                </button>
                                <AnimatePresence>
                                    {openFaq === idx && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="px-6 pb-6 text-sm text-neutral-400 font-light leading-relaxed border-t border-neutral-800/40 pt-4"
                                        >
                                            {faq.a}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* SEÇÃO 7: CTA FINAL MONUMENTAL */}
            <section className="py-28 px-4 sm:px-6 relative z-10 border-t border-neutral-900">
                <div className="max-w-4xl mx-auto p-12 sm:p-16 rounded-[40px] bg-gradient-to-b from-amber-500/10 via-amber-950/20 to-black border border-amber-500/30 text-center relative overflow-hidden shadow-[0_0_80px_rgba(245,158,11,0.15)]">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 blur-[100px] rounded-full pointer-events-none" />

                    <h2 className="text-3xl sm:text-5xl font-extralight text-white mb-4 relative z-10">
                        {t("landing.ctaFinalTitle")}
                    </h2>
                    <p className="text-neutral-400 text-base sm:text-lg font-light mb-10 max-w-xl mx-auto relative z-10">
                        {t("landing.ctaFinalSubtitle")}
                    </p>

                    <div className="flex justify-center relative z-10">
                        <Show when="signed-out">
                            <SignUpButton mode="modal" forceRedirectUrl="/dashboard" fallbackRedirectUrl="/dashboard">
                                <button 
                                    onClick={() => { play("click"); trackEvent("create_legacy_clicked", { source: "cta_final" }); }}
                                    className="px-10 py-5 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 hover:brightness-110 text-black font-extrabold text-sm uppercase tracking-widest rounded-2xl shadow-[0_0_40px_rgba(245,158,11,0.4)] transition-all cursor-pointer flex items-center gap-3"
                                >
                                    <span>{t("landing.ctaFinalButton")}</span>
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </SignUpButton>
                        </Show>

                        <Show when="signed-in">
                            <button 
                                onClick={() => { play("click"); trackEvent("access_dashboard_clicked", { source: "cta_final" }); router.push("/dashboard"); }}
                                className="px-10 py-5 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 hover:brightness-110 text-black font-extrabold text-sm uppercase tracking-widest rounded-2xl shadow-[0_0_40px_rgba(245,158,11,0.4)] transition-all cursor-pointer flex items-center gap-3"
                            >
                                <span>{t("home.accessDashboard")}</span>
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </Show>
                    </div>
                </div>
            </section>

            {/* FOOTER INSTITUCIONAL */}
            <footer className="py-12 border-t border-neutral-900 text-center z-10 text-xs text-neutral-600 font-light select-none">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <img src="/logo-relic.png" alt="Aevum" className="w-5 h-5 object-contain" />
                        <span className="text-neutral-400 font-extralight tracking-wider">Aevum</span>
                        <span>• © {new Date().getFullYear()}</span>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
                        <a 
                            href="mailto:contato@myaevum.space" 
                            className="text-neutral-400 hover:text-amber-400 transition-colors flex items-center gap-1.5"
                            title={t("common.contact", "Suporte & Dúvidas")}
                        >
                            <span>contato@myaevum.space</span>
                        </a>
                        <span>•</span>
                        <a href="/termos" className="hover:text-amber-400 transition-colors">
                            {t("common.termsLink", "Termos de Uso e Custódia Digital")}
                        </a>
                        <span className="hidden md:inline">•</span>
                        <span className="text-neutral-500 hidden md:inline">Criptografia Avançada & Nuvem de Preservação Profunda</span>
                    </div>
                </div>
            </footer>
        </main>
    );
}
