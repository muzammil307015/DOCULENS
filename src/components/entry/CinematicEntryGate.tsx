/**
 * DOCULENS Phase One — Cinematic Pre-Loader & Entry Gate (Sovereign Gold & Brushed Platinum Edition)
 *
 * Implements Section 3 of the Master Frontend Design & Animation Prompt in a luxury
 * 24K Gold (#E5C158 / #D4AF37) & Brushed Platinum (#F5F6F8 / #CBD5E1) over Obsidian (#060608) palette.
 */

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowUpRight, Volume2, VolumeX } from "lucide-react";
import { APP_CONFIG } from "../../config/appConfig";
import { ambientSound } from "./AmbientSoundController";

interface CinematicEntryGateProps {
  isOpen: boolean;
  onCompleteEntry: (audioEnabled: boolean) => void;
  audioEnabled: boolean;
  onChangeAudioPreference: (enabled: boolean) => void;
}

export const CinematicEntryGate: React.FC<CinematicEntryGateProps> = ({
  isOpen,
  onCompleteEntry,
  audioEnabled,
  onChangeAudioPreference,
}) => {
  const [stage, setStage] = useState<number>(0);
  const [isExiting, setIsExiting] = useState<boolean>(false);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setIsExiting(false);

    if (reducedMotion) {
      setStage(5);
      return;
    }

    setStage(0);
    const t1 = window.setTimeout(() => setStage(1), 300);
    const t2 = window.setTimeout(() => setStage(2), 700);
    const t3 = window.setTimeout(() => setStage(3), 1000);
    const t4 = window.setTimeout(() => setStage(4), 1600);
    const t5 = window.setTimeout(() => setStage(5), 2000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [isOpen, reducedMotion]);

  const handleSelectListen = async () => {
    const started = await ambientSound.start();
    onChangeAudioPreference(started);
  };

  const handleSelectSilent = () => {
    ambientSound.stop();
    onChangeAudioPreference(false);
  };

  const triggerExitSequence = () => {
    if (isExiting) return;
    setIsExiting(true);

    if (audioEnabled) {
      ambientSound.triggerEntryTransitionTone();
    }

    if (reducedMotion) {
      window.setTimeout(() => {
        onCompleteEntry(audioEnabled);
      }, 280);
      return;
    }

    window.setTimeout(() => {
      onCompleteEntry(audioEnabled);
    }, 1150);
  };

  const titleWords = ["Enter", "the", "world", "of", "clarity."];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="doculens-entry-gate"
          initial={{ y: "0%" }}
          animate={{
            y: isExiting && !reducedMotion ? "-100%" : "0%",
            opacity: isExiting && reducedMotion ? 0 : 1,
          }}
          exit={{ y: reducedMotion ? "0%" : "-100%", opacity: reducedMotion ? 0 : 1 }}
          transition={{
            duration: reducedMotion ? 0.3 : 1.05,
            delay: isExiting && !reducedMotion ? 0.22 : 0,
            ease: [0.76, 0, 0.24, 1],
          }}
          className="fixed inset-0 z-[90] flex h-[100dvh] w-screen flex-col justify-between overflow-hidden select-none"
          style={{
            backgroundColor: "#060608",
            color: "#F5F6F8",
          }}
          role="dialog"
          aria-modal="true"
          aria-label="DOCULENS Entry Introduction"
        >
          {/* Atmospheric Gold & Platinum background lighting & structural lattice */}
          <motion.div
            animate={{ opacity: isExiting ? 0 : 1 }}
            transition={{ duration: 0.5 }}
            className="pointer-events-none absolute inset-0 overflow-hidden"
            aria-hidden="true"
          >
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgba(226,232,240,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(229,193,88,0.035) 1px, transparent 1px)",
                backgroundSize: "88px 88px",
              }}
            />
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[520px] w-[760px] rounded-full blur-[170px]"
              style={{ background: "rgba(229, 193, 88, 0.13)" }}
            />
            <div
              className="absolute top-1/4 right-1/4 h-[360px] w-[480px] rounded-full blur-[150px]"
              style={{ background: "rgba(226, 232, 240, 0.07)" }}
            />
          </motion.div>

          {/* TOP BAR: Asymmetric Editorial Header */}
          <div className="relative z-10 w-full px-6 pt-6 sm:px-12 sm:pt-10">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: stage >= 1 && !isExiting ? 1 : 0 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-start justify-between gap-4 pb-6"
            >
              <div className="flex items-center gap-3.5">
                <div
                  className="flex h-9 w-9 items-center justify-center font-mono text-xs font-bold tracking-tighter"
                  style={{
                    background: "linear-gradient(135deg, #1E222D 0%, #0D0F14 100%)",
                    color: "#E5C158",
                    border: "1px solid rgba(229, 193, 88, 0.48)",
                    boxShadow: "0 0 20px rgba(229, 193, 88, 0.18)",
                  }}
                >
                  DL
                </div>
                <div className="space-y-0.5">
                  <div className="font-['Space_Grotesk'] text-sm sm:text-base font-bold tracking-[0.24em] uppercase text-[#F5F6F8]">
                    {APP_CONFIG.name}
                  </div>
                  <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#94A3B8]">
                    GOLD & PLATINUM INTELLIGENCE ATELIER
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2.5 font-mono text-[11px] tracking-[0.2em] text-[#CBD5E1]">
                  <span
                    className="h-1.5 w-1.5 rounded-full animate-pulse"
                    style={{
                      backgroundColor: "#E5C158",
                      boxShadow: "0 0 10px rgba(229,193,88,0.9)",
                    }}
                  />
                  <span>SYSTEM / 01</span>
                </div>

                <button
                  type="button"
                  onClick={triggerExitSequence}
                  className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#94A3B8] hover:text-[#E5C158] transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#E5C158] px-2.5 py-1 border border-transparent hover:border-[rgba(229,193,88,0.3)]"
                >
                  Skip Intro
                </button>
              </div>
            </motion.div>

            {/* Platinum & Gold Hairline Divider */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{
                scaleX: stage >= 1 && !isExiting ? 1 : 0,
                opacity: stage >= 1 && !isExiting ? 1 : 0,
              }}
              transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
              className="h-px w-full origin-left"
              style={{
                background:
                  "linear-gradient(90deg, rgba(229,193,88,0.55) 0%, rgba(226,232,240,0.22) 50%, rgba(226,232,240,0.06) 100%)",
              }}
            />
          </div>

          {/* CENTER: Main Editorial Choreography */}
          <div className="relative z-10 my-auto w-full max-w-6xl mx-auto px-6 sm:px-12 py-8">
            <div className="max-w-4xl space-y-6">
              {/* 0.7s: Introductory phrase */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{
                  opacity: stage >= 2 && !isExiting ? 1 : 0,
                  y: stage >= 2 ? (isExiting ? -16 : 0) : 12,
                }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center gap-3"
              >
                <span
                  className="inline-block h-px w-10"
                  style={{
                    background: "linear-gradient(90deg, #E5C158 0%, #CBD5E1 100%)",
                  }}
                />
                <span
                  className="font-mono text-xs sm:text-sm tracking-[0.28em] uppercase"
                  style={{ color: "#E5C158" }}
                >
                  INFORMATION, RECONSTRUCTED.
                </span>
              </motion.div>

              {/* 1.0s: Main title staggered reveal */}
              <h1
                className="font-['Space_Grotesk'] text-4xl sm:text-6xl md:text-7xl lg:text-[5.4rem] font-light tracking-[-0.03em] leading-[1.04]"
                aria-label="Enter the world of clarity."
              >
                <span className="sr-only">Enter the world of clarity.</span>
                <span aria-hidden="true" className="flex flex-wrap gap-x-4 gap-y-2">
                  {titleWords.map((word, idx) => (
                    <span key={idx} className="inline-block overflow-hidden py-1">
                      <motion.span
                        initial={{ y: "110%", opacity: 0 }}
                        animate={{
                          y: stage >= 3 ? (isExiting ? "-110%" : "0%") : "110%",
                          opacity: stage >= 3 ? (isExiting ? 0 : 1) : 0,
                        }}
                        transition={{
                          duration: 0.75,
                          delay: isExiting ? idx * 0.03 : idx * 0.08,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        className={`inline-block ${
                          word === "clarity." ? "text-gold-platinum font-normal" : "text-[#F5F6F8]"
                        }`}
                      >
                        {word}
                      </motion.span>
                    </span>
                  ))}
                </span>
              </h1>

              {/* Supporting editorial sentence */}
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{
                  opacity: stage >= 3 && !isExiting ? 1 : 0,
                  y: stage >= 3 ? (isExiting ? -12 : 0) : 16,
                }}
                transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-xl text-sm sm:text-base leading-relaxed font-normal"
                style={{ color: "#CBD5E1" }}
              >
                An executive document intelligence environment crafted in sovereign gold and
                brushed platinum—transforming dense RFPs, scholarships, and contracts into
                verified clarity.
              </motion.p>
            </div>
          </div>

          {/* BOTTOM BAR: Audio Preference (Left) + Primary Entry Trigger (Right) + Footer */}
          <div className="relative z-10 w-full px-6 pb-6 sm:px-12 sm:pb-10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8">
              {/* 1.6s: Bottom-left Audio Preference Controls */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{
                  opacity: stage >= 4 && !isExiting ? 1 : 0,
                  y: stage >= 4 && !isExiting ? 0 : 12,
                }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-2.5"
              >
                <div className="flex items-center gap-2 font-mono text-[11px] tracking-[0.14em] text-[#94A3B8]">
                  {audioEnabled ? (
                    <Volume2 className="h-3.5 w-3.5 text-[#E5C158]" />
                  ) : (
                    <VolumeX className="h-3.5 w-3.5 text-[#94A3B8]" />
                  )}
                  <span>Headphones recommended.</span>
                </div>

                <div className="flex items-center gap-4 font-mono text-xs tracking-[0.2em]">
                  <button
                    type="button"
                    onClick={handleSelectListen}
                    className="px-2 py-1 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#E5C158]"
                    style={{
                      color: audioEnabled ? "#E5C158" : "#CBD5E1",
                      borderBottom: audioEnabled
                        ? "1px solid #E5C158"
                        : "1px solid transparent",
                    }}
                    aria-pressed={audioEnabled}
                  >
                    [ LISTEN ]
                  </button>

                  <button
                    type="button"
                    onClick={handleSelectSilent}
                    className="px-2 py-1 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#E5C158]"
                    style={{
                      color: !audioEnabled ? "#F5F6F8" : "#64748B",
                      borderBottom: !audioEnabled
                        ? "1px solid rgba(226,232,240,0.6)"
                        : "1px solid transparent",
                    }}
                    aria-pressed={!audioEnabled}
                  >
                    [ SILENT ]
                  </button>
                </div>
              </motion.div>

              {/* 2.0s: Bottom-right Primary Action */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{
                  opacity: stage >= 5 && !isExiting ? 1 : 0,
                  y: stage >= 5 && !isExiting ? 0 : 14,
                }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col sm:items-end space-y-2"
              >
                <span className="font-mono text-[10px] tracking-[0.24em] uppercase text-[#94A3B8]">
                  TRANSFORM COMPLEXITY INTO CLARITY.
                </span>

                <button
                  type="button"
                  onClick={triggerExitSequence}
                  disabled={isExiting}
                  className="btn-gold-imperial group relative inline-flex items-center gap-4 px-8 py-4 font-['Space_Grotesk'] text-sm sm:text-base font-bold tracking-[0.18em] uppercase focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E5C158]"
                >
                  <span>ENTER DOCULENS</span>
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
              </motion.div>
            </div>

            {/* Footer Hairline & Metadata */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: stage >= 1 && !isExiting ? 1 : 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-3"
            >
              <div
                className="h-px w-full"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(226,232,240,0.16) 0%, rgba(229,193,88,0.35) 50%, rgba(226,232,240,0.12) 100%)",
                }}
              />
              <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] tracking-[0.2em] uppercase text-[#94A3B8]">
                <span className="text-[#E5C158]">DOCULENS v{APP_CONFIG.version}</span>
                <span>CHAOS → DISCOVERY → STRUCTURE → INTELLIGENCE → CLARITY</span>
                <span className="text-[#CBD5E1]">UNIVERSAL DOCUMENT INTELLIGENCE</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
