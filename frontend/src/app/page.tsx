"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";

export default function Home() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const { login } = useAuth();
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await login(email);
            router.push("/dashboard");
        } catch (err) {
            setError("Falha ao entrar no cofre secular. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-black selection:bg-amber-500/30">
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
                        className="mx-auto w-16 h-16 border border-amber-500/30 rounded-full flex items-center justify-center bg-black/50 shadow-[0_0_30px_rgba(245,158,11,0.15)] mb-6"
                    >
                        <Lock className="w-6 h-6 text-amber-500/80" />
                    </motion.div>
                    <h1 className="text-5xl md:text-6xl font-extralight tracking-tighter text-white">
                        Aevum
                    </h1>
                    <p className="text-amber-500/60 tracking-[0.4em] text-xs uppercase font-bold">A Forja do Tempo</p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleLogin} className="w-full space-y-6">
                    <div className="space-y-2">
                        <label htmlFor="email" className="text-xs uppercase tracking-widest text-neutral-500 font-semibold pl-2">
                            E-mail de Acesso
                        </label>
                        <input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="seu@legado.com"
                            disabled={loading}
                            className="w-full bg-neutral-900/50 border border-neutral-800 focus:border-amber-500/50 rounded-2xl px-6 py-4 text-white placeholder:text-neutral-700 outline-none transition-all duration-300 focus:bg-neutral-900 focus:shadow-[0_0_20px_rgba(245,158,11,0.1)]"
                        />
                    </div>

                    {error && (
                        <p className="text-red-500/80 text-sm text-center font-medium bg-red-500/10 py-2 rounded-lg border border-red-500/20">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !email}
                        className="group relative w-full px-8 py-4 bg-gradient-to-br from-amber-600 via-amber-500 to-amber-700 rounded-2xl text-black font-extrabold tracking-widest uppercase transition-all overflow-hidden hover:shadow-[0_0_40px_rgba(214,158,46,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
                        <span className="relative z-10 flex items-center justify-center gap-2">
                            {loading ? "Acessando Salão..." : "Entrar no Cofre"}
                        </span>
                    </button>
                    
                    <p className="text-center text-xs text-neutral-600 font-medium">
                        Seu e-mail será convertido em uma chave permanente.
                    </p>
                </form>
            </motion.div>

            <style dangerouslySetInnerHTML={{__html: `
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
            `}} />
        </main>
    );
}
