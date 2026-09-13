"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";

export type SoundEffect =
  | "click"
  | "drop"
  | "wind-launch"
  | "keystroke"
  | "crystallize"
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
  play: (sound: SoundEffect, customAudioUrl?: string) => void;
}

const SoundContext = createContext<SoundContextType>({
  isMuted: false,
  toggleMute: () => {},
  play: () => {}
});

const AUDIO_ASSETS: Partial<Record<SoundEffect, string>> = {
  "seal-lock": "/sounds/treasure-chest-locking.mp3",
  "unseal-chime": "/sounds/chest-opening.mp3"
};

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
      gain.gain.value = 0.55; // volume equilibrado
      gain.connect(ctx.destination);

      audioCtxRef.current = ctx;
      masterGainRef.current = gain;
    }

    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume().catch(() => {});
    }

    return audioCtxRef.current;
  }, []);

  // Reproduz arquivo de áudio estático (.mp3) com fallback resiliente
  const playAudioFile = useCallback((url: string) => {
    if (typeof window === "undefined" || isMuted) return;

    const ctx = getAudioContext();
    if (ctx && masterGainRef.current) {
      fetch(url)
        .then(r => r.arrayBuffer())
        .then(ab => ctx.decodeAudioData(ab))
        .then(buf => {
          const source = ctx.createBufferSource();
          source.buffer = buf;
          source.connect(masterGainRef.current!);
          source.start();
        })
        .catch(() => {
          try {
            const a = new Audio(url);
            a.volume = 0.65;
            a.play().catch(() => {});
          } catch (_) {}
        });
      return;
    }

    try {
      const a = new Audio(url);
      a.volume = 0.65;
      a.play().catch(() => {});
    } catch (_) {}
  }, [getAudioContext, isMuted]);

  // Carrega preferência do usuário do localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem("aevum_sound_muted");
      if (saved === "true") setIsMuted(true);
    } catch (_) {}

    // Desbloqueia o AudioContext e pré-carrega os áudios no primeiro toque/clique
    const unlock = () => {
      getAudioContext();
      Object.values(AUDIO_ASSETS).forEach(url => {
        if (url) fetch(url).catch(() => {});
      });
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

  // Síntese procedural de efeitos sonoros com Web Audio API + suporte a arquivos .mp3
  const play = useCallback((sound: SoundEffect, customAudioUrl?: string) => {
    if (isMuted) return;

    // Se houver arquivo gravado (.mp3) configurado para este efeito ou via tema, prioriza a reprodução dele
    const audioAsset = customAudioUrl || AUDIO_ASSETS[sound];
    if (audioAsset) {
      playAudioFile(audioAsset);
      return;
    }

    const ctx = getAudioContext();
    if (!ctx || !masterGainRef.current) return;

    try {
      const now = ctx.currentTime;
      const master = masterGainRef.current;

      switch (sound) {
        case "click": {
          // Clique orgânico e atemporal: sopro sutil de vento/pergaminho com leve toque em madeira antiga
          const bufferSize = Math.floor(ctx.sampleRate * 0.04);
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.2;
          }
          const noise = ctx.createBufferSource();
          noise.buffer = buffer;
          const noiseFilter = ctx.createBiquadFilter();
          noiseFilter.type = "bandpass";
          noiseFilter.frequency.setValueAtTime(650, now);
          noiseFilter.frequency.exponentialRampToValueAtTime(180, now + 0.04);

          const noiseGain = ctx.createGain();
          noiseGain.gain.setValueAtTime(0.18, now);
          noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

          noise.connect(noiseFilter);
          noiseFilter.connect(noiseGain);
          noiseGain.connect(master);
          noise.start(now);

          // Toque suave e profundo de madeira rústica
          const tap = ctx.createOscillator();
          const tapGain = ctx.createGain();
          tap.type = "sine";
          tap.frequency.setValueAtTime(220, now);
          tap.frequency.exponentialRampToValueAtTime(80, now + 0.035);

          tapGain.gain.setValueAtTime(0.15, now);
          tapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

          tap.connect(tapGain);
          tapGain.connect(master);
          tap.start(now);
          tap.stop(now + 0.04);
          break;
        }

        case "drop": {
          // Relíquia caindo no baú: sopro de vento temporal + fundo oco de baú de carvalho antigo
          // 1. Vento suave
          const windSize = Math.floor(ctx.sampleRate * 0.22);
          const windBuffer = ctx.createBuffer(1, windSize, ctx.sampleRate);
          const windData = windBuffer.getChannelData(0);
          for (let i = 0; i < windSize; i++) {
            windData[i] = (Math.random() * 2 - 1) * 0.25;
          }
          const wind = ctx.createBufferSource();
          wind.buffer = windBuffer;
          const windFilter = ctx.createBiquadFilter();
          windFilter.type = "lowpass";
          windFilter.frequency.setValueAtTime(800, now);
          windFilter.frequency.exponentialRampToValueAtTime(200, now + 0.22);

          const windGain = ctx.createGain();
          windGain.gain.setValueAtTime(0.22, now);
          windGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

          wind.connect(windFilter);
          windFilter.connect(windGain);
          windGain.connect(master);
          wind.start(now);

          // 2. Impacto grave e oco de baú antigo
          const chestThud = ctx.createOscillator();
          const chestGain = ctx.createGain();
          chestThud.type = "triangle";
          chestThud.frequency.setValueAtTime(110, now + 0.03);
          chestThud.frequency.exponentialRampToValueAtTime(32, now + 0.25);

          chestGain.gain.setValueAtTime(0.001, now);
          chestGain.gain.setValueAtTime(0.35, now + 0.03);
          chestGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

          chestThud.connect(chestGain);
          chestGain.connect(master);
          chestThud.start(now + 0.03);
          chestThud.stop(now + 0.26);
          break;
        }

        case "keystroke": {
          // Barulho sutil e realista de teclas mecânicas / máquina de escrever vintage
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const randPitch = 1800 + Math.random() * 400;

          osc.type = "triangle";
          osc.frequency.setValueAtTime(randPitch, now);
          osc.frequency.exponentialRampToValueAtTime(400, now + 0.015);

          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

          osc.connect(gain);
          gain.connect(master);
          osc.start(now);
          osc.stop(now + 0.018);
          break;
        }

        case "crystallize": {
          // Som de cristalização do projeto: rajada de vento etérea + brilho harmônico temporal
          const bufferSize = Math.floor(ctx.sampleRate * 0.4);
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.15;
          }
          const wind = ctx.createBufferSource();
          wind.buffer = buffer;
          const filter = ctx.createBiquadFilter();
          filter.type = "bandpass";
          filter.frequency.setValueAtTime(350, now);
          filter.frequency.exponentialRampToValueAtTime(1200, now + 0.2);
          filter.frequency.exponentialRampToValueAtTime(200, now + 0.4);

          const windGain = ctx.createGain();
          windGain.gain.setValueAtTime(0.2, now);
          windGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

          wind.connect(filter);
          filter.connect(windGain);
          windGain.connect(master);
          wind.start(now);

          // Sino harmônico místico
          [587.33, 880.00].forEach((freq, i) => {
            const bell = ctx.createOscillator();
            const bellGain = ctx.createGain();
            bell.type = "sine";
            bell.frequency.setValueAtTime(freq, now + i * 0.08);

            bellGain.gain.setValueAtTime(0.001, now + i * 0.08);
            bellGain.gain.linearRampToValueAtTime(0.25, now + i * 0.08 + 0.03);
            bellGain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.6);

            bell.connect(bellGain);
            bellGain.connect(master);
            bell.start(now + i * 0.08);
            bell.stop(now + i * 0.08 + 0.65);
          });
          break;
        }

        case "wind-launch": {
          // Sopro de vento puro ao arremessar a memória (substitui o antigo som de puzzle)
          const bufferSize = Math.floor(ctx.sampleRate * 0.22);
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.2;
          }
          const wind = ctx.createBufferSource();
          wind.buffer = buffer;
          const filter = ctx.createBiquadFilter();
          filter.type = "bandpass";
          filter.frequency.setValueAtTime(450, now);
          filter.frequency.exponentialRampToValueAtTime(950, now + 0.08);
          filter.frequency.exponentialRampToValueAtTime(250, now + 0.22);

          const windGain = ctx.createGain();
          windGain.gain.setValueAtTime(0.22, now);
          windGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

          wind.connect(filter);
          filter.connect(windGain);
          windGain.connect(master);
          wind.start(now);
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
          // Brisa suave e silenciosa durante a convergência das partículas (SEM zumbidos agudos)
          const bufferSize = Math.floor(ctx.sampleRate * 2.8);
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.06;
          }
          const breeze = ctx.createBufferSource();
          breeze.buffer = buffer;
          const filter = ctx.createBiquadFilter();
          filter.type = "lowpass";
          filter.frequency.setValueAtTime(160, now);
          filter.frequency.linearRampToValueAtTime(220, now + 2.5);

          const breezeGain = ctx.createGain();
          breezeGain.gain.setValueAtTime(0.001, now);
          breezeGain.gain.linearRampToValueAtTime(0.08, now + 1.0);
          breezeGain.gain.exponentialRampToValueAtTime(0.001, now + 2.8);

          breeze.connect(filter);
          filter.connect(breezeGain);
          breezeGain.connect(master);
          breeze.start(now);
          breeze.stop(now + 2.85);
          break;
        }

        case "seal-lock": {
          // Tranca sutil, mecânica e limpa de baú antigo (sem estrondos ou estridências)
          // 1. Clique mecânico de encaixe da tranca
          const latch = ctx.createOscillator();
          const latchGain = ctx.createGain();
          latch.type = "sine";
          latch.frequency.setValueAtTime(580, now);
          latch.frequency.exponentialRampToValueAtTime(240, now + 0.025);

          latchGain.gain.setValueAtTime(0.18, now);
          latchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

          latch.connect(latchGain);
          latchGain.connect(master);
          latch.start(now);
          latch.stop(now + 0.03);

          // 2. Batida seca e suave da tampa de madeira assentando
          const thud = ctx.createOscillator();
          const thudGain = ctx.createGain();
          thud.type = "triangle";
          thud.frequency.setValueAtTime(85, now + 0.01);
          thud.frequency.exponentialRampToValueAtTime(35, now + 0.14);

          thudGain.gain.setValueAtTime(0.001, now);
          thudGain.gain.setValueAtTime(0.25, now + 0.01);
          thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

          thud.connect(thudGain);
          thudGain.connect(master);
          thud.start(now + 0.01);
          thud.stop(now + 0.15);
          break;
        }

        case "unseal-chime": {
          // Destranca sutil e sopro de ar ao abrir o baú (sem fanfarra alta ou zumbido)
          // 1. Estalo suave da tranca se soltando
          const unlatch = ctx.createOscillator();
          const unlatchGain = ctx.createGain();
          unlatch.type = "sine";
          unlatch.frequency.setValueAtTime(460, now);
          unlatch.frequency.exponentialRampToValueAtTime(680, now + 0.03);

          unlatchGain.gain.setValueAtTime(0.16, now);
          unlatchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

          unlatch.connect(unlatchGain);
          unlatchGain.connect(master);
          unlatch.start(now);
          unlatch.stop(now + 0.035);

          // 2. Sopro de ar escapando da cápsula
          const airSize = Math.floor(ctx.sampleRate * 0.3);
          const airBuffer = ctx.createBuffer(1, airSize, ctx.sampleRate);
          const airData = airBuffer.getChannelData(0);
          for (let i = 0; i < airSize; i++) {
            airData[i] = (Math.random() * 2 - 1) * 0.12;
          }
          const air = ctx.createBufferSource();
          air.buffer = airBuffer;
          const airFilter = ctx.createBiquadFilter();
          airFilter.type = "bandpass";
          airFilter.frequency.setValueAtTime(400, now + 0.02);
          airFilter.frequency.exponentialRampToValueAtTime(700, now + 0.15);
          airFilter.frequency.exponentialRampToValueAtTime(200, now + 0.3);

          const airGain = ctx.createGain();
          airGain.gain.setValueAtTime(0.001, now + 0.02);
          airGain.gain.linearRampToValueAtTime(0.14, now + 0.08);
          airGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

          air.connect(airFilter);
          airFilter.connect(airGain);
          airGain.connect(master);
          air.start(now + 0.02);
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
