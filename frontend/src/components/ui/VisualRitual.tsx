"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { THEME_REGISTRY } from "@/config/themes";

interface VisualRitualProps {
  type: "seal" | "unseal";
  themeId: string;
  onComplete: () => void;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  alpha: number;
  speed: number;
  angle: number;
  radius?: number;
  angularSpeed?: number;
  life?: number;
  maxLife?: number;
}

export function VisualRitual({ type, themeId, onComplete }: VisualRitualProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeTheme = THEME_REGISTRY[themeId] ?? THEME_REGISTRY["bau-classico"];
  const [showFlash, setShowFlash] = useState(false);

  // Estados das imagens do baú
  const [currentChestImage, setCurrentChestImage] = useState(
    type === "seal" ? activeTheme.assets.vault.opened : activeTheme.assets.vault.closed
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    const particles: Particle[] = [];
    
    // Configura o tamanho do canvas com base no container
    const resizeCanvas = () => {
      const container = containerRef.current;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      } else {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Cores de ouro e âmbar premium (fallback)
    const goldColors = [
      "rgba(212, 175, 55, ", // Gold
      "rgba(181, 149, 47, ", // Goldenrod
      "rgba(245, 158, 11, ", // Amber
      "rgba(251, 191, 36, ", // Yellow-500
      "rgba(255, 255, 255, "  // White sparkles
    ];
    const themeColors = activeTheme.ritualColors || goldColors;

    const getRandomColor = (alpha: number) => {
      const base = themeColors[Math.floor(Math.random() * themeColors.length)];
      return `${base}${alpha})`;
    };

    // Inicializa partículas
    const spawnParticle = (isInit = false): Particle => {
      const angle = Math.random() * Math.PI * 2;
      const size = Math.random() * 3 + 1;
      const alpha = Math.random() * 0.7 + 0.3;
      const speed = type === "seal" ? Math.random() * 1.5 + 1 : Math.random() * 4 + 2;

      if (type === "seal") {
        // Para selagem, as partículas vêm de fora (espiral/implosão)
        const startRadius = isInit 
          ? Math.random() * 150 + 50 
          : Math.random() * 200 + 200; // Começa longe
        return {
          x: centerX + Math.cos(angle) * startRadius,
          y: centerY + Math.sin(angle) * startRadius,
          size,
          color: getRandomColor(alpha),
          alpha,
          speed,
          angle,
          radius: startRadius,
          angularSpeed: (Math.random() * 0.05 + 0.02) * (Math.random() > 0.5 ? 1 : -1)
        };
      } else {
        // Para desbloqueio, as partículas explodem do centro
        const life = 0;
        const maxLife = Math.random() * 60 + 40;
        return {
          x: centerX + (Math.random() - 0.5) * 40,
          y: centerY + (Math.random() - 0.5) * 40,
          size,
          color: getRandomColor(alpha),
          alpha,
          speed,
          angle,
          life,
          maxLife
        };
      }
    };

    // Preenche as partículas iniciais
    const maxParticles = type === "seal" ? 150 : 250;
    if (type === "seal") {
      for (let i = 0; i < maxParticles; i++) {
        particles.push(spawnParticle(true));
      }
    }

    let frameCount = 0;

    // Loop de renderização
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frameCount++;

      const currentCenterX = canvas.width / 2;
      const currentCenterY = canvas.height / 2;

      // Desenhar brilho de fundo dinâmico no centro
      const radialGlow = ctx.createRadialGradient(
        currentCenterX, currentCenterY, 5, 
        currentCenterX, currentCenterY, type === "seal" ? 120 : 180
      );

      const glowBase = themeColors[2] || "rgba(245, 158, 11, ";
      const glowBaseAlt = themeColors[3] || "rgba(251, 191, 36, ";
      
      if (type === "seal") {
        // Glow que encolhe/concentra com o tempo
        radialGlow.addColorStop(0, `${glowBase}${0.15 + Math.sin(frameCount * 0.02) * 0.05})`);
        radialGlow.addColorStop(0.5, `${glowBase}0.05)`);
        radialGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      } else {
        // Glow expansivo no início
        const sizeMultiplier = Math.min(1.5, frameCount * 0.03);
        radialGlow.addColorStop(0, `${glowBaseAlt}${Math.max(0, 0.3 - frameCount * 0.002)})`);
        radialGlow.addColorStop(0.4 * sizeMultiplier, `${glowBase}0.08)`);
        radialGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      }

      ctx.fillStyle = radialGlow;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Atualiza e desenha partículas
      if (type === "seal") {
        // Geração contínua para manter o fluxo
        if (particles.length < maxParticles) {
          particles.push(spawnParticle(false));
        }

        particles.forEach((p, index) => {
          if (p.radius !== undefined && p.angularSpeed !== undefined) {
            // Implosão em espiral
            p.radius -= p.speed;
            p.angle += p.angularSpeed;

            p.x = currentCenterX + Math.cos(p.angle) * p.radius;
            p.y = currentCenterY + Math.sin(p.angle) * p.radius;

            // Desenha a partícula
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = "rgba(245, 158, 11, 0.5)";
            ctx.fill();
            ctx.shadowBlur = 0; // reset shadow

            // Se chegou muito perto do centro, reseta para fora
            if (p.radius < 15) {
              particles[index] = spawnParticle(false);
            }
          }
        });
      } else {
        // Explosão radial (apenas gera partículas nas primeiras 40 frames para criar o estouro)
        if (frameCount < 40 && particles.length < maxParticles) {
          for (let i = 0; i < 5; i++) {
            particles.push(spawnParticle(false));
          }
        }

        particles.forEach((p, index) => {
          if (p.life !== undefined && p.maxLife !== undefined) {
            // Movimento radial com fricção/atrito
            p.speed *= 0.97;
            p.x += Math.cos(p.angle) * p.speed;
            p.y += Math.sin(p.angle) * p.speed;
            
            // Leve gravidade puxando as partículas para baixo
            p.y += 0.15;

            p.life++;
            const lifeRatio = p.life / p.maxLife;
            const currentAlpha = p.alpha * (1 - lifeRatio);

            // Desenha a partícula
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (1 - lifeRatio * 0.5), 0, Math.PI * 2);
            
            // Atualiza o canal de opacidade da cor
            const parts = p.color.split(",");
            parts[3] = ` ${currentAlpha})`;
            ctx.fillStyle = parts.join(",");

            ctx.shadowBlur = 8;
            ctx.shadowColor = "rgba(251, 191, 36, 0.4)";
            ctx.fill();
            ctx.shadowBlur = 0; // reset

            // Remove se a vida acabou
            if (p.life >= p.maxLife) {
              particles.splice(index, 1);
            }
          }
        });
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Controle de tempo do ritual (Duração total de 3.5 segundos)
    // - Aos 2.8s, dispara o flash de luz
    // - Aos 3.0s (pico do brilho), altera a imagem do baú para o estado final
    // - Aos 3.5s, executa o onComplete
    let chestImageTimer: any;
    const flashTimer = setTimeout(() => {
      setShowFlash(true);
      chestImageTimer = setTimeout(() => {
        setCurrentChestImage(
          type === "seal" ? activeTheme.assets.vault.closed : activeTheme.assets.vault.opened
        );
      }, 200);
    }, 2800);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 3500);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resizeCanvas);
      clearTimeout(flashTimer);
      clearTimeout(completeTimer);
      if (chestImageTimer) clearTimeout(chestImageTimer);
    };
  }, [type, onComplete]);

  // Efeito de tremor para o baú
  const shakeAnimation = type === "seal"
    ? {
        x: [0, -2, 2, -1, 1, -2, 2, 0],
        y: [0, 1, -1, 1, -1, 1, -1, 0],
        scale: [1, 1.01, 0.99, 1.02, 0.98, 1]
      }
    : {
        x: [0, -4, 4, -4, 4, -2, 2, -4, 4, 0],
        y: [0, 2, -2, 2, -2, 1, -1, 2, -2, 0],
        scale: [1, 1.03, 0.97, 1.04, 0.96, 1.02, 0.98, 1]
      };

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/95 backdrop-blur-3xl px-4 overflow-hidden select-none"
    >
      {/* Canvas para o fundo de partículas */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full pointer-events-none z-10" 
      />

      {/* Container Central para o Baú */}
      <div className="relative w-[340px] h-[340px] md:w-[450px] md:h-[450px] flex items-center justify-center z-20 pointer-events-none">
        
        {/* Glow de fundo pulsante sob o baú */}
        <motion.div 
          className="absolute w-[60%] h-[30%] bg-amber-500/20 blur-[50px] rounded-full bottom-[25%]"
          animate={{
            scale: type === "seal" ? [1, 0.8, 1.2, 0.9, 1] : [1, 1.3, 0.9, 1.4, 1],
            opacity: type === "seal" ? [0.4, 0.2, 0.6, 0.3, 0.4] : [0.4, 0.8, 0.3, 0.9, 0.4]
          }}
          transition={{ duration: 3.5, ease: "easeInOut" }}
        />

        {/* Baú estático animado com tremor de física */}
        <motion.img
          src={currentChestImage}
          alt="Aevum Vault"
          className="w-[85%] max-h-[85%] object-contain filter drop-shadow-[0_0_30px_rgba(245,158,11,0.25)]"
          animate={shakeAnimation}
          transition={{ 
            duration: type === "seal" ? 3.0 : 2.8, 
            ease: "easeInOut",
            times: [0, 0.2, 0.4, 0.6, 0.8, 1]
          }}
        />

        {/* Efeito de Feixe de Luz Volumétrico e Núcleo de Energia (Evita erros de centralização) */}
        <motion.div 
          initial={{ scale: 0, opacity: 0 }}
          animate={type === "seal" 
            ? { scale: [0, 0.5, 1.2, 0.8, 2.5], opacity: [0, 0.4, 0.8, 0.5, 1] }
            : { scale: [0, 0.8, 2.0, 1.2, 3.5], opacity: [0, 0.6, 1.0, 0.7, 1] }
          }
          transition={{ duration: 3.2, ease: "easeIn" }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-[25px] z-25 mix-blend-screen"
          style={{
            backgroundImage: `radial-gradient(circle, ${activeTheme.glowColor || "rgba(245, 158, 11, 0.4)"} 0%, transparent 70%)`
          }}
        />

        <motion.div 
          initial={{ scaleX: 0, opacity: 0 }}
          animate={type === "seal" 
            ? { scaleX: [0, 0.1, 1, 0.2, 6], opacity: [0, 0.3, 0.7, 0.4, 0.9] }
            : { scaleX: [0, 0.3, 2, 0.6, 8], opacity: [0, 0.4, 0.8, 0.5, 0.9] }
          }
          transition={{ duration: 3.2, ease: "easeIn" }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-[160%] blur-[20px] z-30 mix-blend-screen"
          style={{
            backgroundImage: `linear-gradient(to bottom, transparent, ${activeTheme.ritualColors?.[4] || "rgba(255, 255, 255, "}0.15), transparent)`
          }}
        />
      </div>

      {/* Overlay de Subtítulo do Ritual */}
      <div className="absolute bottom-12 w-full text-center pointer-events-none z-20">
        <span className="text-amber-500/70 text-xs md:text-sm tracking-[0.6em] uppercase font-bold animate-pulse font-mono block">
          {type === "seal" ? "Iniciando Lacre Temporal" : "Despertando Relíquias"}
        </span>
      </div>

      {/* ======================================================== */}
      {/* Transição de Flash de Luz Suave (Lens Flare)             */}
      {/* ======================================================== */}
      <AnimatePresence>
        {showFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0, 1, 1, 0],
              transition: { duration: 0.7, times: [0, 0.3, 0.6, 1] }
            }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-white mix-blend-screen pointer-events-none"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
