import { CinematicCapsule } from "@/components/ui/CinematicCapsule";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-black">
      {/* Estrelas sutis ou poeira */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none" />

      {/* Main Title Area */}
      <div className="mb-2 text-center z-10 space-y-2 mt-10">
        <h1 className="text-4xl md:text-5xl font-extralight tracking-tighter text-white">
          Aevum
        </h1>
        <p className="text-amber-500/80 tracking-[0.3em] text-xs uppercase font-bold">A Forja do Tempo</p>
      </div>

      <CinematicCapsule />

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}} />
    </main>
  );
}
