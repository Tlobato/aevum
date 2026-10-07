import React from "react";
import { Lock, Database, Clock, Sparkles, ShieldCheck } from "lucide-react";

export function MaintenancePage() {
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-between p-6 sm:p-10 bg-[#030303] text-white selection:bg-amber-500/30 overflow-hidden font-sans">
      {/* Background glow effects */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-950/20 via-black to-[#030303] pointer-events-none" />
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Header com logo sutil */}
      <header className="relative z-10 w-full max-w-4xl flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 relative flex items-center justify-center">
            <img
              src="/logo-relic.webp"
              alt="Aevum Relic"
              className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]"
            />
          </div>
          <span className="text-xl font-extralight tracking-wider text-white">
            Aevum
          </span>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium tracking-wide">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span>Status: Pausado</span>
        </div>
      </header>

      {/* Conteúdo Central */}
      <main className="relative z-10 max-w-2xl w-full my-auto text-center flex flex-col items-center py-12">
        {/* Ícone / Relíquia em Destaque */}
        <div className="relative mb-8 group">
          <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full scale-125 animate-pulse" />
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-neutral-950/80 border border-amber-500/30 p-5 flex items-center justify-center shadow-2xl backdrop-blur-xl">
            <img
              src="/logo-relic.webp"
              alt="Aevum Relic"
              className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(245,158,11,0.6)]"
            />
          </div>
        </div>

        {/* Título Principal */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-900/80 border border-neutral-800 text-neutral-400 text-xs font-semibold uppercase tracking-widest mb-6">
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          <span>Suspensão Temporal de Serviços</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-light tracking-tight text-white mb-6 leading-tight">
          O Aevum está em{" "}
          <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent font-normal">
            manutenção
          </span>
        </h1>

        <p className="text-base sm:text-lg text-neutral-400 leading-relaxed max-w-xl mb-10 font-light">
          Nossas cápsulas do tempo foram temporariamente lacradas para reestruturação
          e manutenção da nossa infraestrutura de servidores.
        </p>

        {/* Painel Informativo */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4 text-left mb-10">
          <div className="p-4 sm:p-5 rounded-2xl bg-neutral-950/60 border border-neutral-800/80 backdrop-blur-sm flex flex-col gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-medium text-neutral-200">Acesso Restrito</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Logins, novos registros e o dashboard estão temporariamente bloqueados.
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-neutral-950/60 border border-neutral-800/80 backdrop-blur-sm flex flex-col gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-medium text-neutral-200">Dados Protegidos</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Todas as cápsulas e arquivos salvos continuam armazenados e seguros.
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-neutral-950/60 border border-neutral-800/80 backdrop-blur-sm flex flex-col gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-medium text-neutral-200">Retorno Futuro</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              O projeto retornará quando a nova infraestrutura estiver restabelecida.
            </p>
          </div>
        </div>

        {/* Aviso de cancelamento de requisições */}
        <div className="inline-flex items-center gap-2 text-xs text-neutral-500 border border-neutral-900 bg-neutral-950/40 px-4 py-2 rounded-xl">
          <Database className="w-3.5 h-3.5 text-neutral-500" />
          <span>Serviços de API desconectados para evitar consumo desnecessário.</span>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-4xl pt-8 pb-4 border-t border-neutral-900/60 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-2">
        <span>© {new Date().getFullYear()} Aevum. Cápsula do tempo digital.</span>
        <span className="text-neutral-600">Preservando memórias para a eternidade.</span>
      </footer>
    </div>
  );
}
