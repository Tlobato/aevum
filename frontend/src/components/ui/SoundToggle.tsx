"use client";

import React from "react";
import { Volume2, VolumeX } from "lucide-react";
import { useSound } from "@/hooks/useSound";

interface SoundToggleProps {
  className?: string;
}

export function SoundToggle({ className = "" }: SoundToggleProps) {
  const { isMuted, toggleMute, play } = useSound();

  const handleToggle = () => {
    toggleMute();
    if (isMuted) {
      // Pequeno clique de teste ao desmutar
      setTimeout(() => play("click"), 50);
    }
  };

  return (
    <button
      onClick={handleToggle}
      aria-label={isMuted ? "Ativar efeitos sonoros" : "Silenciar efeitos sonoros"}
      title={isMuted ? "Ativar efeitos sonoros" : "Silenciar efeitos sonoros"}
      className={`relative p-2.5 rounded-full border transition-all duration-300 backdrop-blur-md cursor-pointer group ${
        isMuted
          ? "bg-neutral-900/60 border-neutral-800 text-neutral-500 hover:text-neutral-300 hover:border-neutral-700"
          : "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/50 hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]"
      } ${className}`}
    >
      {isMuted ? (
        <VolumeX className="w-4 h-4 transition-transform group-hover:scale-110" />
      ) : (
        <Volume2 className="w-4 h-4 transition-transform group-hover:scale-110" />
      )}
    </button>
  );
}
