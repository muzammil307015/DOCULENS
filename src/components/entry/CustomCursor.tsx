/**
 * DOCULENS Weighted Custom Cursor — Sovereign Gold & Brushed Platinum Edition
 */

import React, { useEffect, useRef, useState } from "react";

export const CustomCursor: React.FC = () => {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isHoveringInteractive, setIsHoveringInteractive] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isCoarsePointer || isReducedMotion) {
      setIsEnabled(false);
      return;
    }

    setIsEnabled(true);

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;
    let rafId = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
      }

      const target = e.target as HTMLElement | null;
      if (target) {
        const interactive = target.closest(
          'button, a, [role="button"], input, select, textarea, [data-cursor-interactive="true"]'
        );
        setIsHoveringInteractive(Boolean(interactive));
      }
    };

    const handleMouseDown = () => setIsPressed(true);
    const handleMouseUp = () => setIsPressed(false);

    const animateRing = () => {
      ringX += (mouseX - ringX) * 0.16;
      ringY += (mouseY - ringY) * 0.16;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
      }
      rafId = requestAnimationFrame(animateRing);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mousedown", handleMouseDown, { passive: true });
    window.addEventListener("mouseup", handleMouseUp, { passive: true });
    rafId = requestAnimationFrame(animateRing);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  if (!isEnabled) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden hidden md:block" aria-hidden="true">
      {/* 24K Gold central dot */}
      <div
        ref={dotRef}
        className="pointer-events-none fixed top-0 left-0 -ml-1 -mt-1 h-2 w-2 rounded-full transition-opacity duration-200"
        style={{
          backgroundColor: "#E5C158",
          boxShadow: "0 0 12px rgba(229, 193, 88, 0.75)",
        }}
      />

      {/* Brushed Platinum & Gold weighted ring */}
      <div
        ref={ringRef}
        className="pointer-events-none fixed top-0 left-0 flex items-center justify-center transition-[width,height,margin,border-color,background-color,box-shadow] duration-200 ease-out rounded-full"
        style={{
          width: isPressed ? "26px" : isHoveringInteractive ? "50px" : "34px",
          height: isPressed ? "26px" : isHoveringInteractive ? "50px" : "34px",
          marginLeft: isPressed ? "-13px" : isHoveringInteractive ? "-25px" : "-17px",
          marginTop: isPressed ? "-13px" : isHoveringInteractive ? "-25px" : "-17px",
          border: isHoveringInteractive
            ? "1px solid rgba(229, 193, 88, 0.85)"
            : "1px solid rgba(226, 232, 240, 0.32)",
          backgroundColor: isHoveringInteractive
            ? "rgba(229, 193, 88, 0.10)"
            : "transparent",
          boxShadow: isHoveringInteractive
            ? "0 0 24px rgba(229, 193, 88, 0.22)"
            : "none",
        }}
      />
    </div>
  );
};
