/**
 * DOCULENS Interactive WebGL / Hardware Canvas Particle Lattice — Gold & Platinum Edition
 *
 * Renders an intelligent 3D-projected information landscape of 24K Sovereign Gold (#E5C158)
 * and Brushed Platinum (#E2E8F0) nodes connected by delicate metallic hairlines.
 */

import React, { useEffect, useRef, useState } from "react";

interface WebGlParticleFieldProps {
  /** 0 = calm structured equilibrium, 1 = maximum "break the order" distortion */
  distortActive?: boolean;
  /** Optional className for positioning */
  className?: string;
}

interface ParticleNode {
  baseX: number;
  baseY: number;
  baseZ: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  size: number;
  tone: "gold" | "platinum" | "champagne";
  phase: number;
}

export const WebGlParticleField: React.FC<WebGlParticleFieldProps> = ({
  distortActive = false,
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const distortRef = useRef<boolean>(distortActive);
  const distortStrengthRef = useRef<number>(0);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  useEffect(() => {
    distortRef.current = distortActive;
  }, [distortActive]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId = 0;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const configureCanvasSize = () => {
      if (!canvas) return;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    configureCanvasSize();

    const isMobile = width < 768;
    const cols = isMobile ? 11 : 19;
    const rows = isMobile ? 8 : 12;
    const particles: ParticleNode[] = [];

    const buildLattice = () => {
      particles.length = 0;
      const spacingX = width / (cols - 1);
      const spacingY = height / (rows - 1);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const jitterX = Math.sin(r * 17.3 + c * 9.1) * 0.35 * spacingX;
          const jitterY = Math.cos(r * 11.7 + c * 23.4) * 0.35 * spacingY;
          const bx = c * spacingX + jitterX;
          const by = r * spacingY + jitterY;
          const bz = (Math.sin(r * 0.8 + c * 0.6) + 1) * 0.5;
          const idx = r * cols + c;
          const tone: ParticleNode["tone"] =
            idx % 4 === 0 ? "gold" : idx % 3 === 0 ? "champagne" : "platinum";

          particles.push({
            baseX: bx,
            baseY: by,
            baseZ: bz,
            x: bx,
            y: by,
            z: bz,
            vx: 0,
            vy: 0,
            size: tone === "gold" ? 2.0 : tone === "champagne" ? 1.55 : 1.15,
            tone,
            phase: (r * 0.45 + c * 0.31) % (Math.PI * 2),
          });
        }
      }
    };

    buildLattice();

    const pointer = {
      targetX: width * 0.5,
      targetY: height * 0.42,
      x: width * 0.5,
      y: height * 0.42,
      active: false,
    };

    const handlePointerMove = (e: MouseEvent) => {
      pointer.targetX = e.clientX;
      pointer.targetY = e.clientY;
      pointer.active = true;
    };

    const handleResize = () => {
      configureCanvasSize();
      buildLattice();
    };

    window.addEventListener("mousemove", handlePointerMove, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });

    let time = 0;

    const renderFrame = () => {
      if (document.hidden) {
        animationFrameId = requestAnimationFrame(renderFrame);
        return;
      }

      time += 0.0085;

      const targetDistort = distortRef.current ? 1 : 0;
      distortStrengthRef.current += (targetDistort - distortStrengthRef.current) * 0.065;
      const distort = distortStrengthRef.current;

      pointer.x += (pointer.targetX - pointer.x) * 0.07;
      pointer.y += (pointer.targetY - pointer.y) * 0.07;

      ctx.clearRect(0, 0, width, height);

      // Dual-tone Gold & Platinum radial ambient illumination
      const grad = ctx.createRadialGradient(
        pointer.x,
        pointer.y,
        12,
        pointer.x,
        pointer.y,
        Math.max(width, height) * (0.45 + distort * 0.16)
      );
      grad.addColorStop(0, `rgba(229, 193, 88, ${0.085 + distort * 0.08})`);
      grad.addColorStop(0.45, `rgba(203, 213, 225, ${0.03 + distort * 0.03})`);
      grad.addColorStop(1, "rgba(6, 6, 8, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      const interactionRadius = isMobile ? 130 : 230 + distort * 190;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        const waveX = Math.sin(time + p.phase) * (4.8 + p.baseZ * 4);
        const waveY = Math.cos(time * 0.85 + p.phase) * (4.8 + p.baseZ * 4);

        const chaosX =
          distort > 0.005
            ? Math.sin(time * 4.5 + p.baseY * 0.025 + p.phase) * 62 * distort +
              Math.cos(p.phase * 3.1 + time * 3) * 34 * distort
            : 0;
        const chaosY =
          distort > 0.005
            ? Math.cos(time * 4.2 + p.baseX * 0.025 - p.phase) * 62 * distort +
              Math.sin(p.phase * 2.7 - time * 2.8) * 34 * distort
            : 0;

        let targetX = p.baseX + waveX + chaosX;
        let targetY = p.baseY + waveY + chaosY;

        if (pointer.active || distort > 0.01) {
          const dx = targetX - pointer.x;
          const dy = targetY - pointer.y;
          const distSq = dx * dx + dy * dy;
          const maxR = interactionRadius;

          if (distSq < maxR * maxR && distSq > 1) {
            const dist = Math.sqrt(distSq);
            const force = (1 - dist / maxR) * (20 + distort * 56);
            const angle = Math.atan2(dy, dx) + distort * 0.7;
            targetX += Math.cos(angle) * force;
            targetY += Math.sin(angle) * force;
          }
        }

        p.vx = (p.vx + (targetX - p.x) * 0.09) * 0.78;
        p.vy = (p.vy + (targetY - p.y) * 0.09) * 0.78;
        p.x += p.vx;
        p.y += p.vy;
      }

      // Draw fine Gold & Platinum geometric connections
      const maxConnectDist = isMobile ? 120 : 150;
      const maxConnectDistSq = maxConnectDist * maxConnectDist;

      ctx.lineWidth = 0.65;
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        const candidates = [i + 1, i + cols, i + cols + 1];
        for (let k = 0; k < candidates.length; k++) {
          const j = candidates[k];
          if (j >= particles.length) continue;
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dSq = dx * dx + dy * dy;

          if (dSq < maxConnectDistSq) {
            const alpha = (1 - dSq / maxConnectDistSq) * (0.11 + distort * 0.09);
            ctx.strokeStyle =
              a.tone === "gold" || b.tone === "gold"
                ? `rgba(229, 193, 88, ${alpha * 1.35})`
                : `rgba(226, 232, 240, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Draw Gold, Champagne & Platinum nodes
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const pulse = 0.65 + 0.35 * Math.sin(time * 1.7 + p.phase);
        if (p.tone === "gold") {
          ctx.fillStyle = `rgba(229, 193, 88, ${0.72 * pulse + distort * 0.25})`;
        } else if (p.tone === "champagne") {
          ctx.fillStyle = `rgba(245, 230, 179, ${0.5 * pulse + distort * 0.2})`;
        } else {
          ctx.fillStyle = `rgba(226, 232, 240, ${0.34 * pulse})`;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size + distort * 0.65, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(renderFrame);
    };

    animationFrameId = requestAnimationFrame(renderFrame);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("resize", handleResize);
    };
  }, [reducedMotion]);

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* Static Platinum & Gold architectural grid & ambient glow fallback */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(226,232,240,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(229,193,88,0.03) 1px, transparent 1px)",
          backgroundSize: "76px 76px",
        }}
      />
      <div
        className="absolute -top-36 left-1/4 h-[540px] w-[540px] rounded-full blur-[160px]"
        style={{ background: "rgba(229, 193, 88, 0.09)" }}
      />
      <div
        className="absolute bottom-0 right-1/5 h-[460px] w-[460px] rounded-full blur-[170px]"
        style={{ background: "rgba(203, 213, 225, 0.06)" }}
      />

      {!reducedMotion && (
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 h-full w-full"
        />
      )}
    </div>
  );
};
