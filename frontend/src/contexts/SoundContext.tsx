"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";

export type SoundEffect =
  | "click"
  | "drop"
  | "modal-open"
  | "modal-close"
  | "seal-ambient"
  | "seal-lock"
  | "unseal-chime"
  | "success"
  | "delete";

interface SoundContextType {
  isMuted: boolean;
  toggleMute: () => void;
  play: (sound: SoundEffect) => void;
}

const SoundContext = createContext<SoundContextType>({
  isMuted: false,
  toggleMute: () => {},
  play: () => {}
});

export const useSound = () => useContext(SoundContext);

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [isMuted, setIsMuted] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  // Inicializa o AudioContext de forma preguiçosa no cliente
  const getAudioContext = useCallback(() => {
    if (typeof window === "undefined") return null;

    if (!audioCtxRef.current) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return null;

      const ctx = new AudioCtxClass();
      const gain = ctx.createGain();
      gain.gain.value = 0.5; // volume equilibrado
      gain.connect(ctx.destination);

      audioCtxRef.current = ctx;
      masterGainRef.current = gain;
    }

    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume().catch(() => {});
    }

    return audioCtxRef.current;
  }, []);

  // Carrega preferência do usuário do localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem("aevum_sound_muted");
      if (saved === "true") setIsMuted(true);
    } catch (_) {}

    // Desbloqueia o AudioContext no primeiro toque/clique do usuário (política de autoplay do mobile)
    const unlock = () => {
      getAudioContext();
    };

    window.addEventListener("pointerdown", unlock, { once: true, passive: true });
    window.addEventListener("keydown", unlock, { once: true, passive: true });

    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [getAudioContext]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      try {
        localStorage.setItem("aevum_sound_muted", String(next));
      } catch (_) {}
      return next;
    });
  }, []);

  // Síntese procedural de efeitos sonoros com Web Audio API
  const play = useCallback((sound: SoundEffect) => {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx || !masterGainRef.current) return;

    try {
      const now = ctx.currentTime;
      const master = masterGainRef.current;

      switch (sound) {
        case "click": {
          // Clique tátil estilo jogo mobile (bubble pop / wood tap com leve variação de pitch)
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const variance = 0.95 + Math.random() * 0.1; // pitch ligeiramente diferente a cada clique

          osc.type = "sine";
          osc.frequency.setValueAtTime(560 * variance, now);
          osc.frequency.exponentialRampToValueAtTime(180 * variance, now + 0.035);

          gain.gain.setValueAtTime(0.35, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

          osc.connect(gain);
          gain.connect(master);

          osc.start(now);
          osc.stop(now + 0.04);
          break;
        }

        case "drop": {
          // Relíquia caindo no baú (whoosh de ar + impacto ressonante no fundo de madeira)
          // 1. Whoosh
          const bufferSize = ctx.sampleRate * 0.08;
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.15;
          }
          const noise = ctx.createBufferSource();
          noise.buffer = buffer;
          const noiseFilter = ctx.createBiquadFilter();
          noiseFilter.type = "bandpass";
          noiseFilter.frequency.setValueAtTime(900, now);
          noiseFilter.frequency.exponentialRampToValueAtTime(250, now + 0.08);

          const noiseGain = ctx.createGain();
          noiseGain.gain.setValueAtTime(0.2, now);
          noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

          noise.connect(noiseFilter);
          noiseFilter.connect(noiseGain);
          noiseGain.connect(master);
          noise.start(now);

          // 2. Thud
          const thud = ctx.createOscillator();
          const thudGain = ctx.createGain();
          thud.type = "triangle";
          thud.frequency.setValueAtTime(140, now + 0.04);
          thud.frequency.exponentialRampToValueAtTime(45, now + 0.22);

          thudGain.gain.setValueAtTime(0.001, now);
          thudGain.gain.setValueAtTime(0.4, now + 0.04);
          thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

          thud.connect(thudGain);
          thudGain.connect(master);

          thud.start(now + 0.04);
          thud.stop(now + 0.24);
          break;
        }

        case "modal-open": {
          // Abertura etérea de modal
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.type = "sine";
          osc2.type = "sine";
          osc1.frequency.setValueAtTime(392, now); // G4
          osc2.frequency.setValueAtTime(587.33, now); // D5

          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(0.2, now + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(master);

          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 0.26);
          osc2.stop(now + 0.26);
          break;
        }

        case "modal-close": {
          // Fechamento suave
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(380, now);
          osc.frequency.exponentialRampToValueAtTime(140, now + 0.04);

          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

          osc.connect(gain);
          gain.connect(master);
          osc.start(now);
          osc.stop(now + 0.05);
          break;
        }

        case "seal-ambient": {
          // Acúmulo de energia mística durante a citação de Platão
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const filter = ctx.createBiquadFilter();
          const gain = ctx.createGain();

          osc1.type = "sawtooth";
          osc2.type = "sine";
          osc1.frequency.setValueAtTime(110, now); // A2
          osc2.frequency.setValueAtTime(111.5, now); // leve batimento binaural

          filter.type = "lowpass";
          filter.frequency.setValueAtTime(200, now);
          filter.frequency.exponentialRampToValueAtTime(1800, now + 2.5);

          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(0.25, now + 1.2);
          gain.gain.linearRampToValueAtTime(0.4, now + 2.4);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 2.8);

          osc1.connect(filter);
          osc2.connect(filter);
          filter.connect(gain);
          gain.connect(master);

          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 2.85);
          osc2.stop(now + 2.85);
          break;
        }

        case "seal-lock": {
          // Fechamento e tranca mecânica pesada do baú
          // 1. Estalo metálico
          const metal = ctx.createOscillator();
          const metalGain = ctx.createGain();
          metal.type = "triangle";
          metal.frequency.setValueAtTime(1250, now);
          metal.frequency.exponentialRampToValueAtTime(600, now + 0.1);
          metalGain.gain.setValueAtTime(0.35, now);
          metalGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
          metal.connect(metalGain);
          metalGain.connect(master);
          metal.start(now);
          metal.stop(now + 0.12);

          // 2. Batida pesada de tranca do cofre
          const clunk = ctx.createOscillator();
          const clunkGain = ctx.createGain();
          clunk.type = "square";
          clunk.frequency.setValueAtTime(95, now + 0.02);
          clunk.frequency.exponentialRampToValueAtTime(35, now + 0.35);

          const clunkFilter = ctx.createBiquadFilter();
          clunkFilter.type = "lowpass";
          clunkFilter.frequency.setValueAtTime(250, now);

          clunkGain.gain.setValueAtTime(0.001, now);
          clunkGain.gain.setValueAtTime(0.45, now + 0.02);
          clunkGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

          clunk.connect(clunkFilter);
          clunkFilter.connect(clunkGain);
          clunkGain.connect(master);
          clunk.start(now + 0.02);
          clunk.stop(now + 0.38);
          break;
        }

        case "unseal-chime": {
          // Despertar celestial / fanfarra mística (arpeggio pentatônico com sino ressonante)
          const notes = [523.25, 659.25, 783.99, 987.77, 1046.50]; // C5, E5, G5, B5, C6
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const startTime = now + idx * 0.08;

            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, startTime);

            gain.gain.setValueAtTime(0.001, startTime);
            gain.gain.linearRampToValueAtTime(0.28, startTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.2);

            osc.connect(gain);
            gain.connect(master);

            osc.start(startTime);
            osc.stop(startTime + 1.25);
          });
          break;
        }

        case "success": {
          // Confirmação alegre de conclusão
          const chord = [659.25, 880.00]; // E5, A5
          chord.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const noteTime = now + i * 0.06;

            osc.type = "triangle";
            osc.frequency.setValueAtTime(freq, noteTime);

            gain.gain.setValueAtTime(0.001, noteTime);
            gain.gain.linearRampToValueAtTime(0.25, noteTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.3);

            osc.connect(gain);
            gain.connect(master);

            osc.start(noteTime);
            osc.stop(noteTime + 0.35);
          });
          break;
        }

        case "delete": {
          // Ação destrutiva consciente (tom descendente suave)
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(240, now);
          osc.frequency.exponentialRampToValueAtTime(75, now + 0.18);

          gain.gain.setValueAtTime(0.28, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

          osc.connect(gain);
          gain.connect(master);
          osc.start(now);
          osc.stop(now + 0.2);
          break;
        }
      }
    } catch (e) {
      // Falha silenciosa para nunca quebrar a interface
      console.warn("Sound playback error:", e);
    }
  }, [isMuted, getAudioContext]);

  return (
    <SoundContext.Provider value={{ isMuted, toggleMute, play }}>
      {children}
    </SoundContext.Provider>
  );
}
