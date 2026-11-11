/**
 * DOCULENS — Cinematic Entry Experience & Editorial Landing Page
 * Sovereign Gold (#E5C158 / #D4AF37) & Brushed Platinum (#F5F6F8 / #CBD5E1) Edition
 */

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import {
  ArrowUpRight,
  FileText,
  ShieldCheck,
  CheckCircle2,
  GraduationCap,
  Briefcase,
  Scale,
  Building2,
  BookOpen,
  Landmark,
  FileSpreadsheet,
  FolderKanban,
  Volume2,
  VolumeX,
  RotateCcw,
  Eye,
  Compass,
  Sparkles,
} from "lucide-react";
import { APP_CONFIG } from "../../config/appConfig";
import { DEMO_DOCUMENTS, DemoDocumentSpec } from "../../services/demoData";
import { WebGlParticleField } from "../entry/WebGlParticleField";
import { CustomCursor } from "../entry/CustomCursor";
import { ambientSound } from "../entry/AmbientSoundController";

interface LandingPageProps {
  onStartAnalysis: () => void;
  onExplorePlatform?: () => void;
  onOpenDashboard?: () => void;
  onSelectDemoDoc: (demo: DemoDocumentSpec) => void;
  onNavigate?: (view: string) => void;
  onReplayIntro?: () => void;
  audioEnabled?: boolean;
  onToggleAudio?: (enabled: boolean) => void;
}

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartAnalysis,
  onExplorePlatform,
  onOpenDashboard,
  onSelectDemoDoc,
  onNavigate,
  onReplayIntro,
  audioEnabled = false,
  onToggleAudio,
}) => {
  const [isHoldingOrder, setIsHoldingOrder] = useState<boolean>(false);
  const [holdProgress, setHoldProgress] = useState<number>(0);
  const [activeSpecimenTab, setActiveSpecimenTab] = useState<"rfp" | "scholarship" | "contract">("rfp");
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  const handleOpenApp = useCallback(() => {
    if (onOpenDashboard) {
      onOpenDashboard();
    } else if (onExplorePlatform) {
      onExplorePlatform();
    } else if (onNavigate) {
      onNavigate("overview");
    } else {
      onStartAnalysis();
    }
  }, [onOpenDashboard, onExplorePlatform, onNavigate, onStartAnalysis]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);

  useEffect(() => {
    let raf = 0;
    const updateHold = () => {
      setHoldProgress(prev => {
        const target = isHoldingOrder ? 100 : 0;
        const next = prev + (target - prev) * 0.12;
        if (Math.abs(target - next) < 0.4) return target;
        return next;
      });
      raf = requestAnimationFrame(updateHold);
    };
    raf = requestAnimationFrame(updateHold);
    return () => cancelAnimationFrame(raf);
  }, [isHoldingOrder]);

  useEffect(() => {
    const releaseAll = () => setIsHoldingOrder(false);
    window.addEventListener("mouseup", releaseAll);
    window.addEventListener("touchend", releaseAll);
    window.addEventListener("touchcancel", releaseAll);
    window.addEventListener("pointercancel", releaseAll);
    window.addEventListener("blur", releaseAll);
    return () => {
      window.removeEventListener("mouseup", releaseAll);
      window.removeEventListener("touchend", releaseAll);
      window.removeEventListener("touchcancel", releaseAll);
      window.removeEventListener("pointercancel", releaseAll);
      window.removeEventListener("blur", releaseAll);
    };
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
    }
  };

  const handleAudioToggle = async () => {
    if (audioEnabled) {
      ambientSound.stop();
      onToggleAudio?.(false);
    } else {
      const ok = await ambientSound.start();
      onToggleAudio?.(ok);
    }
  };

  const documentCategories = [
    {
      num: "01",
      title: "Scholarships",
      subtitle: "ACADEMIC & FELLOWSHIP GRANTS",
      description:
        "Decode CGPA cutoffs, family income ceilings, mandatory bonafide certificates, and renewal conditions.",
      icon: GraduationCap,
      demoIndex: 1,
    },
    {
      num: "02",
      title: "RFPs and Tenders",
      subtitle: "PUBLIC & ENTERPRISE PROCUREMENT",
      description:
        "Extract 14-section solicitation intelligence, evaluation matrices, EMD requirements, and Bid/No-Bid signals.",
      icon: Building2,
      demoIndex: 0,
    },
    {
      num: "03",
      title: "College Admissions",
      subtitle: "UNIVERSITY PROSPECTUSES & CIRCULARS",
      description:
        "Surface seat matrices, counseling schedules, fee structures, refund rules, and mandatory admission exhibits.",
      icon: BookOpen,
      demoIndex: 1,
    },
    {
      num: "04",
      title: "Institutional Regulations",
      subtitle: "BYLAWS, ATTENDANCE & ACADEMIC CODES",
      description:
        "Identify minimum attendance thresholds, detainment clauses, credit transfer rules, and disciplinary procedures.",
      icon: Landmark,
      demoIndex: 1,
    },
    {
      num: "05",
      title: "Jobs and Careers",
      subtitle: "ROLES, OFFERS & EMPLOYMENT TERMS",
      description:
        "Align technical requirements against your profile and uncover probation periods, notice terms, and non-competes.",
      icon: Briefcase,
      demoIndex: 2,
    },
    {
      num: "06",
      title: "Government Schemes",
      subtitle: "SUBSIDIES, GAZETTES & PUBLIC POLICY",
      description:
        "Clarify beneficiary eligibility tiers, statutory annexures, disbursement milestones, and issuing authorities.",
      icon: ShieldCheck,
      demoIndex: 0,
    },
    {
      num: "07",
      title: "Contracts",
      subtitle: "MSAs, SOWs & LEGAL AGREEMENTS",
      description:
        "Highlight indemnification traps, uncapped liability, IP ownership, termination windows, and governing law.",
      icon: Scale,
      demoIndex: 3,
    },
    {
      num: "08",
      title: "Financial Documents",
      subtitle: "SCHEDULES, LEDGERS & FEE MATRICES",
      description:
        "Audit multi-sheet workbooks, payment milestones, holdback percentages, and verified numeric distributions.",
      icon: FileSpreadsheet,
      demoIndex: 4,
    },
    {
      num: "09",
      title: "Business Documents",
      subtitle: "VENDOR PACKETS & OPERATIONAL AUDITS",
      description:
        "Cross-reference compliance certificates, insurance coverages, and operational deliverables across attachments.",
      icon: FolderKanban,
      demoIndex: 0,
    },
    {
      num: "10",
      title: "General Documents",
      subtitle: "UNIVERSAL MULTI-FORMAT INGESTION",
      description:
        "Parse PDF, DOCX, XLSX, PPTX, ODT, RTF, and scanned images into source-referenced, queryable intelligence.",
      icon: FileText,
      demoIndex: 3,
    },
  ];

  const sampleSpecimens = {
    rfp: {
      badge: "ILLUSTRATIVE SAMPLE SPECIMEN — PUBLIC SECTOR RFP",
      title: "Enterprise IT & Digital Strategy Master Services Agreement (RFP #2026-MSA-09)",
      issuingOrg: "State Digital Infrastructure Authority (Illustrative)",
      keyDates: "Proposal Due: 15 Dec 2026 (15:00 EST) · Q&A Cutoff: 28 Nov 2026",
      financialAmounts: "Estimated Ceiling: $4,500,000 · EMD: $70,000 · Invoice Holdback: 10%",
      eligibility: "Minimum 5 years public-sector experience · $3M average annual turnover · ISO 9001",
      requiredDocuments: "Technical Proposal (Binder A), Sealed Fee Schedule (Binder B), Audited Balance Sheets",
      mandatoryConditions: "Zero-dollar ($0) Master Agreement structure; work issued strictly via competitive Task Orders",
      importantClauses: "Work-Made-For-Hire IP assignment · 30-day termination for convenience without cause",
      risks: "HIGH RISK: 108-day vs 180-day contract duration discrepancy between Section 2.1 and Attachment A",
      sourceReferences: "Page 4 (Section 2.1 Schedule) · Page 19 (Section 6.4 Holdback) · Page 31 (Exhibit C)",
      checklist: [
        "Verify 3-year audited financial statements against $3M threshold (Page 8)",
        "Submit formal Q&A clarification regarding 108 vs 180 day term conflict (Page 4)",
        "Execute Mandatory Conflict of Interest Affidavit — Attachment D (Page 34)",
      ],
      demoIndex: 0,
    },
    scholarship: {
      badge: "ILLUSTRATIVE SAMPLE SPECIMEN — NATIONAL FELLOWSHIP",
      title: "National STEM Merit & Research Fellowship Circular 2026–2027",
      issuingOrg: "Directorate of Higher Education & Research (Illustrative)",
      keyDates: "Portal Closing: 30 Nov 2026 · Institutional Verification: 10 Dec 2026",
      financialAmounts: "Annual Grant: $12,000 / ₹85,000 per annum + 100% Tuition Waiver",
      eligibility: "Minimum 8.0 CGPA (or 75% aggregate) · Annual family income below ceiling threshold",
      requiredDocuments: "Consolidated Marksheet, Gazetted Income Certificate, Head of Institution Bonafide Letter",
      mandatoryConditions: "Recipient must maintain 75% attendance and zero academic backlogs for annual renewal",
      importantClauses: "Concurrent holding of another central merit fellowship results in retroactive recovery",
      risks: "MEDIUM RISK: Income certificate must be issued after 01 April of current assessment year",
      sourceReferences: "Page 1 (Clause 2: Award Value) · Page 2 (Clause 4: Eligibility) · Page 3 (Annexure II)",
      checklist: [
        "Obtain current-year Income Certificate signed by Tehsildar / Revenue Officer (Page 2)",
        "Get Annexure-I Bonafide cum Character Certificate stamped by Dean/Principal (Page 3)",
        "Upload bank passbook copy showing active account in applicant's name (Page 3)",
      ],
      demoIndex: 1,
    },
    contract: {
      badge: "ILLUSTRATIVE SAMPLE SPECIMEN — COMMERCIAL MSA",
      title: "Master Software Engineering & Advisory Services Agreement",
      issuingOrg: "Apex Global Ventures Inc. (Illustrative)",
      keyDates: "Effective Date: Upon Execution · Initial Term: 24 Months · Auto-Renewal: 60-Day Notice",
      financialAmounts: "Retainer: $18,500/month · Late Fee Interest: 1.5% per month · Net 45 Payment",
      eligibility: "Professional Errors & Omissions (E&O) Insurance minimum $2,000,000 coverage",
      requiredDocuments: "Certificate of Insurance (COI), W-9 / Tax Residency Form, Executed Data Processing Addendum",
      mandatoryConditions: "Written acceptance of Deliverables required within 10 business days of milestone delivery",
      importantClauses: "Section 9.2: Unilateral indemnification & 24-month post-termination non-solicitation",
      risks: "CRITICAL RISK: Limitation of Liability carves out indirect damages for data/IP claims (Uncapped exposure)",
      sourceReferences: "Page 3 (Sec 4.2 Payment) · Page 7 (Sec 9.2 Indemnity) · Page 11 (Sec 12.1 Governing Law)",
      checklist: [
        "Request mutual cap on indemnification limited to 12 months of fees paid (Page 7)",
        "Shorten payment terms from Net 45 to Net 30 before execution (Page 3)",
        "Attach pre-existing IP schedule to exclude background tools from Work-for-Hire (Page 6)",
      ],
      demoIndex: 3,
    },
  };

  const activeSpecimen = sampleSpecimens[activeSpecimenTab];

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden selection:bg-[#E5C158] selection:text-[#060608]"
      style={{
        backgroundColor: "#060608",
        color: "#F5F6F8",
      }}
    >
      {/* Phase 3: Interactive Gold & Platinum Particle Lattice Background */}
      <WebGlParticleField distortActive={isHoldingOrder} />

      {/* Phase 4: Weighted Desktop Custom Cursor */}
      <CustomCursor />

      {/* Fine Platinum & Gold Shimmer Grain Overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-[1] opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(229, 193, 88, 0.75) 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
        aria-hidden="true"
      />

      {/* Lightweight Editorial Top Navigation (Gold & Platinum Atelier) */}
      <header
        className="sticky top-0 z-40 w-full backdrop-blur-xl transition-colors"
        style={{
          backgroundColor: "rgba(6, 6, 8, 0.86)",
          borderBottom: "1px solid rgba(226, 232, 240, 0.12)",
        }}
      >
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 sm:px-10">
          {/* Brand Wordmark */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" })}
              className="group flex items-center gap-3.5 text-left focus:outline-none"
            >
              <span
                className="flex h-9 w-9 items-center justify-center font-mono text-xs font-bold tracking-tighter transition-all"
                style={{
                  background: "linear-gradient(135deg, #1E222D 0%, #0D0F14 100%)",
                  color: "#E5C158",
                  border: "1px solid rgba(229, 193, 88, 0.48)",
                  boxShadow: "0 0 20px rgba(229, 193, 88, 0.16)",
                }}
              >
                DL
              </span>
              <div>
                <span className="font-['Space_Grotesk'] text-sm sm:text-base font-bold tracking-[0.22em] uppercase text-[#F5F6F8] group-hover:text-[#E5C158] transition-colors block">
                  {APP_CONFIG.name}
                </span>
                <span className="font-mono text-[9px] tracking-[0.18em] uppercase text-[#94A3B8] hidden sm:block">
                  GOLD & PLATINUM EDITION · v{APP_CONFIG.version}
                </span>
              </div>
            </button>
          </div>

          {/* Center Editorial Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 font-mono text-[11px] tracking-[0.2em] uppercase text-[#CBD5E1]">
            <button
              type="button"
              onClick={() => scrollToSection("section-problem")}
              className="hover:text-[#E5C158] transition-colors py-1"
            >
              PRODUCT
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("section-process")}
              className="hover:text-[#E5C158] transition-colors py-1"
            >
              HOW IT WORKS
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("section-categories")}
              className="hover:text-[#E5C158] transition-colors py-1"
            >
              DOCUMENT TYPES
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("section-deep-analysis")}
              className="hover:text-[#E5C158] transition-colors py-1"
            >
              INTELLIGENCE
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("section-trust")}
              className="hover:text-[#E5C158] transition-colors py-1"
            >
              ABOUT
            </button>
          </nav>

          {/* Right Controls: Audio Toggle + Replay Intro + ENTER APP */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={handleAudioToggle}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] uppercase transition-colors"
              style={{
                color: audioEnabled ? "#E5C158" : "#94A3B8",
                border: audioEnabled
                  ? "1px solid rgba(229, 193, 88, 0.45)"
                  : "1px solid rgba(226, 232, 240, 0.14)",
                backgroundColor: "#0C0E14",
              }}
              title={audioEnabled ? "Mute ambient tone" : "Enable subtle ambient tone"}
            >
              {audioEnabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
              <span>{audioEnabled ? "LISTEN" : "SILENT"}</span>
            </button>

            {onReplayIntro && (
              <button
                type="button"
                onClick={onReplayIntro}
                className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 font-mono text-[10px] tracking-[0.16em] uppercase text-[#94A3B8] hover:text-[#E5C158] transition-colors"
                title="Replay Cinematic Entry Introduction"
              >
                <RotateCcw className="h-3 w-3" />
                <span>INTRO</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleOpenApp}
              className="btn-gold-imperial inline-flex items-center gap-2 px-4 py-2 font-mono text-[11px] font-bold tracking-[0.18em] uppercase"
            >
              <span>ENTER APP</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================================
          SECTION 01 — HERO EXPERIENCE (PHASE TWO & PHASE FIVE)
         ===================================================================== */}
      <section className="relative z-10 min-h-[calc(100dvh-5rem)] flex flex-col justify-between mx-auto max-w-7xl px-6 sm:px-10 pt-12 pb-10 sm:pt-20 sm:pb-14">
        {/* Top Asymmetric Metadata Row */}
        <div
          className="flex flex-wrap items-center justify-between gap-4 pb-8 border-b"
          style={{ borderColor: "rgba(226, 232, 240, 0.12)" }}
        >
          <div className="flex items-center gap-3">
            <span
              className="h-2 w-2 rounded-full"
              style={{
                backgroundColor: "#E5C158",
                boxShadow: "0 0 12px rgba(229, 193, 88, 0.8)",
              }}
            />
            <span className="font-mono text-[11px] tracking-[0.26em] uppercase text-[#E5C158]">
              UNIVERSAL DOCUMENT INTELLIGENCE · GOLD & PLATINUM ATELIER
            </span>
          </div>

          <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-[#94A3B8]">
            CHAOS → DISCOVERY → STRUCTURE → INTELLIGENCE → CLARITY
          </div>
        </div>

        {/* Main Asymmetric Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end my-auto py-12 sm:py-16">
          {/* Left 8 Columns: Kinetic Split-Text Headline */}
          <div className="lg:col-span-8 space-y-8">
            <h1
              className="font-['Space_Grotesk'] text-4xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-light tracking-[-0.035em] leading-[1.02] text-[#F5F6F8]"
              aria-label="Turn every document into clear intelligence."
            >
              <span className="sr-only">Turn every document into clear intelligence.</span>
              <span aria-hidden="true" className="block space-y-2">
                <span className="block overflow-hidden pb-1">
                  <motion.span
                    initial={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 44 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      x: isHoldingOrder ? -4 : 0,
                    }}
                    transition={{ duration: 0.85, ease: EASE_OUT_EXPO }}
                    className="block text-platinum-sheen"
                  >
                    Turn every document
                  </motion.span>
                </span>
                <span className="block overflow-hidden pb-1">
                  <motion.span
                    initial={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 44 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      x: isHoldingOrder ? 6 : 0,
                    }}
                    transition={{ duration: 0.85, delay: 0.12, ease: EASE_OUT_EXPO }}
                    className="block"
                  >
                    into{" "}
                    <span className="text-gold-platinum font-normal">
                      clear intelligence.
                    </span>
                  </motion.span>
                </span>
              </span>
            </h1>

            {/* Editorial supporting phrase */}
            <motion.div
              initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.25, ease: EASE_OUT_EXPO }}
              className="font-mono text-xs sm:text-sm tracking-[0.22em] uppercase text-[#E5C158]"
            >
              Complex information. Structured understanding.
            </motion.div>

            {/* Primary & Secondary Hero CTAs */}
            <motion.div
              initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.38, ease: EASE_OUT_EXPO }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2"
            >
              <button
                type="button"
                onClick={onStartAnalysis}
                className="btn-gold-imperial group inline-flex items-center justify-center gap-4 px-8 py-4 font-['Space_Grotesk'] text-sm font-bold tracking-[0.18em] uppercase"
              >
                <span>ANALYZE A DOCUMENT</span>
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>

              <button
                type="button"
                onClick={handleOpenApp}
                className="inline-flex items-center justify-center gap-3 px-7 py-4 font-mono text-xs tracking-[0.18em] uppercase transition-all hover:border-[#E5C158] hover:text-[#E5C158]"
                style={{
                  background: "linear-gradient(180deg, rgba(22, 26, 36, 0.9) 0%, rgba(12, 14, 20, 0.95) 100%)",
                  color: "#F5F6F8",
                  border: "1px solid rgba(226, 232, 240, 0.22)",
                }}
              >
                <Compass className="h-3.5 w-3.5 text-[#E5C158]" />
                <span>EXPLORE THE SYSTEM</span>
              </button>
            </motion.div>
          </div>

          {/* Right 4 Columns: Editorial Supporting Paragraph & Phase 5 Hold-to-Distort Control */}
          <div
            className="lg:col-span-4 space-y-8 lg:pl-6 lg:border-l"
            style={{ borderColor: "rgba(226, 232, 240, 0.14)" }}
          >
            <motion.p
              initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: EASE_OUT_EXPO }}
              className="text-sm sm:text-base leading-relaxed"
              style={{ color: "#CBD5E1" }}
            >
              Upload documents, uncover critical information, understand requirements, identify
              risks and turn information into actionable decisions.
            </motion.p>

            {/* PHASE FIVE — SPECIAL INTERACTION: "PRESS AND HOLD TO BREAK THE ORDER" */}
            <motion.div
              initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.44, ease: EASE_OUT_EXPO }}
              className="pt-2"
            >
              <button
                type="button"
                onMouseDown={() => setIsHoldingOrder(true)}
                onMouseUp={() => setIsHoldingOrder(false)}
                onMouseLeave={() => setIsHoldingOrder(false)}
                onTouchStart={() => setIsHoldingOrder(true)}
                onTouchEnd={() => setIsHoldingOrder(false)}
                onTouchCancel={() => setIsHoldingOrder(false)}
                onPointerCancel={() => setIsHoldingOrder(false)}
                onKeyDown={e => {
                  if (e.key === " " || e.key === "Enter") {
                    e.preventDefault();
                    setIsHoldingOrder(true);
                  }
                }}
                onKeyUp={e => {
                  if (e.key === " " || e.key === "Enter") {
                    e.preventDefault();
                    setIsHoldingOrder(false);
                  }
                }}
                onBlur={() => setIsHoldingOrder(false)}
                className="w-full text-left p-5 transition-all duration-300 select-none focus:outline-none focus-visible:ring-1 focus-visible:ring-[#E5C158]"
                style={{
                  background: isHoldingOrder
                    ? "linear-gradient(145deg, rgba(34, 30, 20, 0.95) 0%, rgba(14, 16, 24, 0.98) 100%)"
                    : "linear-gradient(180deg, rgba(18, 21, 30, 0.88) 0%, rgba(10, 12, 18, 0.94) 100%)",
                  border: isHoldingOrder
                    ? "1px solid #E5C158"
                    : "1px solid rgba(226, 232, 240, 0.16)",
                  boxShadow: isHoldingOrder
                    ? "0 0 42px rgba(229, 193, 88, 0.25)"
                    : "0 10px 30px rgba(0, 0, 0, 0.45)",
                }}
                aria-pressed={isHoldingOrder}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className="font-mono text-[11px] font-semibold tracking-[0.2em] uppercase"
                    style={{ color: isHoldingOrder ? "#E5C158" : "#F5F6F8" }}
                  >
                    PRESS AND HOLD TO BREAK THE ORDER
                  </span>
                  <span className="font-mono text-[10px] text-[#E5C158]">
                    {Math.round(holdProgress)}%
                  </span>
                </div>

                <p className="text-xs leading-relaxed mb-3" style={{ color: "#94A3B8" }}>
                  Discover the structure hidden beneath complexity.
                </p>

                <div
                  className="h-0.5 w-full overflow-hidden"
                  style={{ backgroundColor: "rgba(226, 232, 240, 0.14)" }}
                >
                  <div
                    className="h-full transition-all duration-75"
                    style={{
                      width: `${holdProgress}%`,
                      background: "linear-gradient(90deg, #E5C158 0%, #F5F6F8 100%)",
                    }}
                  />
                </div>
              </button>
            </motion.div>
          </div>
        </div>

        {/* Bottom Hero Metadata Bar */}
        <div
          className="pt-8 border-t grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-[11px] tracking-[0.2em] uppercase text-[#CBD5E1]"
          style={{ borderColor: "rgba(226, 232, 240, 0.12)" }}
        >
          <div className="flex items-center gap-2">
            <span className="text-[#E5C158]">01 /</span>
            <span>DOCUMENT EXTRACTION</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#E5C158]">02 /</span>
            <span>AI-POWERED ANALYSIS</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#E5C158]">03 /</span>
            <span>SOURCE-GROUNDED INSIGHTS</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#E5C158]">04 /</span>
            <span>ACTIONABLE CHECKLISTS</span>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 02 — THE PROBLEM
         ===================================================================== */}
      <section
        id="section-problem"
        className="relative z-10 border-t py-24 sm:py-32"
        style={{
          backgroundColor: "#0B0D12",
          borderColor: "rgba(226, 232, 240, 0.12)",
        }}
      >
        <div className="mx-auto max-w-7xl px-6 sm:px-10 space-y-16">
          <motion.div
            initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 48 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.85, ease: EASE_OUT_EXPO }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end"
          >
            <div className="lg:col-span-4 space-y-2">
              <span className="font-mono text-xs tracking-[0.24em] uppercase text-[#E5C158] block">
                SECTION 02 // THE PROBLEM
              </span>
              <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-[#94A3B8] block">
                ASYMMETRY OF DENSE DOCUMENTATION
              </span>
            </div>

            <div className="lg:col-span-8">
              <h2 className="font-['Space_Grotesk'] text-3xl sm:text-5xl font-light tracking-[-0.025em] leading-[1.1] text-[#F5F6F8]">
                Important information should never be hidden in documents.
              </h2>
            </div>
          </motion.div>

          {/* 6 Editorial Problem Cells */}
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l"
            style={{ borderColor: "rgba(226, 232, 240, 0.12)" }}
          >
            {[
              {
                idx: "01",
                title: "Important deadlines get missed.",
                body: "Submission cutoffs, pre-bid conferences, and clarification windows are frequently split across cover pages and late addenda.",
              },
              {
                idx: "02",
                title: "Critical requirements are buried.",
                body: "A single mandatory notarized annexure or turnover threshold on page 34 can disqualify an otherwise strong submission.",
              },
              {
                idx: "03",
                title: "Financial terms are overlooked.",
                body: "Earnest money deposits, invoice holdbacks, liquidated damages, and tuition refund rules hide inside dense paragraphs.",
              },
              {
                idx: "04",
                title: "Eligibility conditions are confusing.",
                body: "Cross-referenced academic, experience, or certification prerequisites make it difficult to know whether you qualify before applying.",
              },
              {
                idx: "05",
                title: "Large documents take too long to review.",
                body: "Manually auditing 80-page solicitations, multi-sheet workbooks, or legal agreements drains hours of analytical focus.",
              },
              {
                idx: "06",
                title: "Important information is scattered across pages.",
                body: "When schedules, commercial tables, and compliance clauses live in separate sections, contradictions go unnoticed.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.idx}
                initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 36 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.7, delay: i * 0.06, ease: EASE_OUT_EXPO }}
                className="p-8 sm:p-10 space-y-5 border-r border-b transition-colors hover:bg-[#131722]"
                style={{ borderColor: "rgba(226, 232, 240, 0.12)" }}
              >
                <div className="flex items-center justify-between font-mono text-xs text-[#E5C158]">
                  <span>// {item.idx}</span>
                  <span className="text-[#94A3B8]">FRICTION POINT</span>
                </div>
                <h3 className="font-['Space_Grotesk'] text-xl font-normal text-[#F5F6F8]">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "#CBD5E1" }}>
                  {item.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 03 — THE DOCULENS PROCESS
         ===================================================================== */}
      <section
        id="section-process"
        className="relative z-10 border-t py-24 sm:py-32"
        style={{
          backgroundColor: "#060608",
          borderColor: "rgba(226, 232, 240, 0.12)",
        }}
      >
        <div className="mx-auto max-w-7xl px-6 sm:px-10 space-y-16">
          <motion.div
            initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 48 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.85, ease: EASE_OUT_EXPO }}
            className="flex flex-col lg:flex-row lg:items-end justify-between gap-8"
          >
            <div className="space-y-3 max-w-2xl">
              <span className="font-mono text-xs tracking-[0.24em] uppercase text-[#E5C158] block">
                SECTION 03 // THE DOCULENS PROCESS
              </span>
              <h2 className="font-['Space_Grotesk'] text-3xl sm:text-5xl font-light tracking-[-0.025em] leading-[1.1] text-[#F5F6F8]">
                Five stages from raw file to structured decision.
              </h2>
            </div>

            <p className="font-mono text-xs tracking-[0.16em] uppercase text-[#94A3B8]">
              DETERMINISTIC EXTRACTION + OPTIONAL AI DEEPENING
            </p>
          </motion.div>

          {/* 5-Stage Process Architecture */}
          <div
            className="grid grid-cols-1 md:grid-cols-5 border-t border-l"
            style={{ borderColor: "rgba(226, 232, 240, 0.12)" }}
          >
            {[
              {
                step: "01",
                label: "UPLOAD",
                summary: "Upload supported documents.",
                detail:
                  "Ingests PDF, DOCX, DOC, XLSX, CSV, ODS, PPTX, ODT, RTF, HTML, Markdown, TXT, and scanned images with SHA-256 integrity hashing.",
              },
              {
                step: "02",
                label: "EXTRACT",
                summary: "Extract available text, pages, tables and document structure.",
                detail:
                  "Preserves page boundaries, multi-sheet workbooks, slide notes, and OCR confidence without fabricating unreadable passages.",
              },
              {
                step: "03",
                label: "UNDERSTAND",
                summary: "Identify document type, purpose and important information.",
                detail:
                  "Automatically classifies RFPs, scholarships, contracts, admission circulars, job specs, and financial tables while redacting sensitive PII.",
              },
              {
                step: "04",
                label: "ANALYZE",
                summary: "Evaluate requirements, dates, eligibility, finances and risks.",
                detail:
                  "Combines 100% offline deterministic rules with optional Gemini 3.8 Flash / OpenRouter reasoning on sanitized text.",
              },
              {
                step: "05",
                label: "ACT",
                summary: "Generate checklists, readiness indicators and next steps.",
                detail:
                  "Cross-checks mandatory criteria against your Evidence Vault, separates Extraction Quality from Eligibility Match, and exports reports.",
              },
            ].map((stage, i) => (
              <motion.div
                key={stage.step}
                initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.75, delay: i * 0.08, ease: EASE_OUT_EXPO }}
                className="p-7 sm:p-8 flex flex-col justify-between border-r border-b space-y-8 bg-[#0C0E14]/80 hover:bg-[#141822] transition-colors"
                style={{ borderColor: "rgba(226, 232, 240, 0.12)" }}
              >
                <div className="space-y-4">
                  <div className="font-mono text-xs tracking-[0.22em] text-[#E5C158]">
                    {stage.step} — {stage.label}
                  </div>
                  <h3 className="font-['Space_Grotesk'] text-lg font-normal text-[#F5F6F8]">
                    {stage.summary}
                  </h3>
                </div>

                <p className="text-xs leading-relaxed" style={{ color: "#CBD5E1" }}>
                  {stage.detail}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 04 — DOCUMENT INTELLIGENCE (10 CATEGORIES)
         ===================================================================== */}
      <section
        id="section-categories"
        className="relative z-10 border-t py-24 sm:py-32"
        style={{
          backgroundColor: "#0B0D12",
          borderColor: "rgba(226, 232, 240, 0.12)",
        }}
      >
        <div className="mx-auto max-w-7xl px-6 sm:px-10 space-y-14">
          <motion.div
            initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 48 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.85, ease: EASE_OUT_EXPO }}
            className="flex flex-col lg:flex-row lg:items-end justify-between gap-6"
          >
            <div className="space-y-3 max-w-2xl">
              <span className="font-mono text-xs tracking-[0.24em] uppercase text-[#E5C158] block">
                SECTION 04 // DOCUMENT INTELLIGENCE
              </span>
              <h2 className="font-['Space_Grotesk'] text-3xl sm:text-5xl font-light tracking-[-0.025em] leading-[1.1] text-[#F5F6F8]">
                Ten specialized lenses. One unified intelligence architecture.
              </h2>
            </div>

            <button
              type="button"
              onClick={onStartAnalysis}
              className="self-start lg:self-auto inline-flex items-center gap-2 font-mono text-xs tracking-[0.2em] uppercase text-[#E5C158] hover:text-[#F5F6F8] transition-colors"
            >
              <span>OPEN UPLOAD WORKSPACE</span>
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </motion.div>

          {/* 10 Functional Editorial Category Cards */}
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 border-t border-l"
            style={{ borderColor: "rgba(226, 232, 240, 0.12)" }}
          >
            {documentCategories.map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <motion.div
                  key={cat.num}
                  initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 32 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.65, delay: idx * 0.04, ease: EASE_OUT_EXPO }}
                  className="group p-6 sm:p-7 flex flex-col justify-between border-r border-b transition-colors bg-[#060608]/75 hover:bg-[#141822]"
                  style={{ borderColor: "rgba(226, 232, 240, 0.12)" }}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] tracking-[0.2em] text-[#94A3B8] group-hover:text-[#E5C158] transition-colors">
                        {cat.num}
                      </span>
                      <Icon className="h-4 w-4 text-[#E5C158]" />
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-['Space_Grotesk'] text-lg font-normal text-[#F5F6F8]">
                        {cat.title}
                      </h3>
                      <p className="font-mono text-[9px] tracking-[0.18em] uppercase text-[#E5C158]">
                        {cat.subtitle}
                      </p>
                    </div>

                    <p className="text-xs leading-relaxed" style={{ color: "#CBD5E1" }}>
                      {cat.description}
                    </p>
                  </div>

                  <div className="pt-6 mt-6 border-t border-[rgba(226,232,240,0.08)] flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={onStartAnalysis}
                      className="font-mono text-[10px] tracking-[0.18em] uppercase text-[#F5F6F8] group-hover:text-[#E5C158] inline-flex items-center gap-1 transition-colors"
                    >
                      <span>ANALYZE</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const demo = DEMO_DOCUMENTS[cat.demoIndex] || DEMO_DOCUMENTS[0];
                        if (demo) onSelectDemoDoc(demo);
                      }}
                      className="font-mono text-[10px] tracking-[0.16em] uppercase text-[#94A3B8] hover:text-[#F5F6F8] transition-colors"
                    >
                      SAMPLE
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 05 — DEEP ANALYSIS (ILLUSTRATIVE SPECIMEN INTERFACE)
         ===================================================================== */}
      <section
        id="section-deep-analysis"
        className="relative z-10 border-t py-24 sm:py-32"
        style={{
          backgroundColor: "#060608",
          borderColor: "rgba(226, 232, 240, 0.12)",
        }}
      >
        <div className="mx-auto max-w-7xl px-6 sm:px-10 space-y-14">
          <motion.div
            initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 48 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.85, ease: EASE_OUT_EXPO }}
            className="flex flex-col lg:flex-row lg:items-end justify-between gap-8"
          >
            <div className="space-y-3 max-w-3xl">
              <span className="font-mono text-xs tracking-[0.24em] uppercase text-[#E5C158] block">
                SECTION 05 // DEEP ANALYSIS
              </span>
              <h2 className="font-['Space_Grotesk'] text-3xl sm:text-5xl font-light tracking-[-0.025em] leading-[1.1] text-[#F5F6F8]">
                Not just a summary. A complete understanding.
              </h2>
            </div>

            {/* Specimen Switcher */}
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
              {(
                [
                  { id: "rfp", label: "01 / RFP & TENDER" },
                  { id: "scholarship", label: "02 / SCHOLARSHIP" },
                  { id: "contract", label: "03 / CONTRACT" },
                ] as const
              ).map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSpecimenTab(tab.id)}
                  className="px-4 py-2.5 tracking-[0.16em] uppercase transition-all font-semibold"
                  style={{
                    background:
                      activeSpecimenTab === tab.id
                        ? "linear-gradient(135deg, #F3E3AD 0%, #E5C158 50%, #C99E2C 100%)"
                        : "#0C0E14",
                    color: activeSpecimenTab === tab.id ? "#060608" : "#CBD5E1",
                    border:
                      activeSpecimenTab === tab.id
                        ? "1px solid #E5C158"
                        : "1px solid rgba(226, 232, 240, 0.16)",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Sample Analysis Specimen Frame */}
          <div
            className="p-6 sm:p-10 space-y-8"
            style={{
              background: "linear-gradient(180deg, rgba(16, 19, 28, 0.92) 0%, rgba(10, 12, 18, 0.96) 100%)",
              border: "1px solid rgba(226, 232, 240, 0.16)",
              boxShadow: "0 24px 60px rgba(0, 0, 0, 0.65)",
            }}
          >
            {/* Clear Illustrative Disclaimer Header */}
            <div
              className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b"
              style={{ borderColor: "rgba(226, 232, 240, 0.12)" }}
            >
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 font-mono text-[10px] tracking-[0.2em] uppercase bg-[#141822] text-[#E5C158] border border-[rgba(229,193,88,0.4)]">
                  <Eye className="h-3 w-3" />
                  <span>{activeSpecimen.badge}</span>
                </div>
                <h3 className="font-['Space_Grotesk'] text-xl sm:text-2xl font-normal text-[#F5F6F8]">
                  {activeSpecimen.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => {
                  const demo = DEMO_DOCUMENTS[activeSpecimen.demoIndex];
                  if (demo) onSelectDemoDoc(demo);
                }}
                className="btn-gold-imperial self-start md:self-auto inline-flex items-center gap-2 px-5 py-3 font-mono text-xs font-bold tracking-[0.18em] uppercase"
              >
                <span>OPEN INTERACTIVE DEMO IN STUDIO</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* 10 Extracted Intelligence Dimensions Grid */}
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l"
              style={{ borderColor: "rgba(226, 232, 240, 0.12)" }}
            >
              {[
                { label: "01 / ISSUING ORGANIZATION", value: activeSpecimen.issuingOrg },
                { label: "02 / KEY DATES", value: activeSpecimen.keyDates },
                { label: "03 / FINANCIAL AMOUNTS", value: activeSpecimen.financialAmounts },
                { label: "04 / ELIGIBILITY", value: activeSpecimen.eligibility },
                { label: "05 / REQUIRED DOCUMENTS", value: activeSpecimen.requiredDocuments },
                { label: "06 / MANDATORY CONDITIONS", value: activeSpecimen.mandatoryConditions },
                { label: "07 / IMPORTANT CLAUSES", value: activeSpecimen.importantClauses },
                { label: "08 / RISKS & WARNINGS", value: activeSpecimen.risks, highlight: true },
                { label: "09 / SOURCE REFERENCES", value: activeSpecimen.sourceReferences },
              ].map(dim => (
                <div
                  key={dim.label}
                  className="p-6 border-r border-b space-y-2"
                  style={{
                    borderColor: "rgba(226, 232, 240, 0.12)",
                    backgroundColor: dim.highlight ? "rgba(229, 193, 88, 0.06)" : "transparent",
                  }}
                >
                  <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#94A3B8] block">
                    {dim.label}
                  </span>
                  <p
                    className="text-xs sm:text-sm leading-relaxed font-normal"
                    style={{ color: dim.highlight ? "#E5C158" : "#F5F6F8" }}
                  >
                    {dim.value}
                  </p>
                </div>
              ))}
            </div>

            {/* 10th Dimension: Actionable Checklists */}
            <div
              className="p-6 space-y-4"
              style={{
                backgroundColor: "#12151E",
                border: "1px solid rgba(229, 193, 88, 0.28)",
              }}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-[#E5C158]">
                  10 / ACTIONABLE CHECKLISTS (ILLUSTRATIVE)
                </span>
                <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-[#94A3B8]">
                  SOURCE-LINKED EXECUTION STEPS
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {activeSpecimen.checklist.map((step, i) => (
                  <div
                    key={i}
                    className="p-4 flex items-start gap-3 border"
                    style={{
                      backgroundColor: "#0B0D12",
                      borderColor: "rgba(226, 232, 240, 0.12)",
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4 text-[#E5C158] shrink-0 mt-0.5" />
                    <span className="text-xs leading-relaxed text-[#F5F6F8]">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 06 — INTELLIGENCE THAT LEADS TO ACTION
         ===================================================================== */}
      <section
        className="relative z-10 border-t py-24 sm:py-32"
        style={{
          backgroundColor: "#0B0D12",
          borderColor: "rgba(226, 232, 240, 0.12)",
        }}
      >
        <div className="mx-auto max-w-7xl px-6 sm:px-10 space-y-14">
          <motion.div
            initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 48 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.85, ease: EASE_OUT_EXPO }}
            className="space-y-3 max-w-3xl"
          >
            <span className="font-mono text-xs tracking-[0.24em] uppercase text-[#E5C158] block">
              SECTION 06 // INTELLIGENCE THAT LEADS TO ACTION
            </span>
            <h2 className="font-['Space_Grotesk'] text-3xl sm:text-5xl font-light tracking-[-0.025em] leading-[1.1] text-[#F5F6F8]">
              Built for the moment you have to decide.
            </h2>
          </motion.div>

          <div
            className="grid grid-cols-1 md:grid-cols-5 border-t border-l"
            style={{ borderColor: "rgba(226, 232, 240, 0.12)" }}
          >
            {[
              {
                domain: "Scholarship",
                quote: "Understand what you qualify for and what you need to apply.",
                actionLabel: "Test Scholarship Notice",
                demoIndex: 1,
              },
              {
                domain: "RFP",
                quote:
                  "Evaluate whether to bid, identify compliance gaps and prepare a submission checklist.",
                actionLabel: "Test RFP Solicitation",
                demoIndex: 0,
              },
              {
                domain: "College",
                quote:
                  "Understand admission requirements, fees, deadlines and institutional rules.",
                actionLabel: "Upload Admission PDF",
                demoIndex: 1,
              },
              {
                domain: "Careers",
                quote:
                  "Understand job requirements and identify skills that match your experience.",
                actionLabel: "Test Job Description",
                demoIndex: 2,
              },
              {
                domain: "Contracts",
                quote: "Find obligations, risks, important clauses and deadlines.",
                actionLabel: "Test MSA Contract",
                demoIndex: 3,
              },
            ].map((item, i) => (
              <motion.div
                key={item.domain}
                initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 36 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.7, delay: i * 0.07, ease: EASE_OUT_EXPO }}
                className="p-7 flex flex-col justify-between border-r border-b space-y-8 bg-[#060608]/75 hover:bg-[#141822] transition-colors"
                style={{ borderColor: "rgba(226, 232, 240, 0.12)" }}
              >
                <div className="space-y-4">
                  <span className="font-mono text-xs tracking-[0.22em] uppercase text-[#E5C158] block">
                    0{i + 1} // {item.domain}
                  </span>
                  <p className="font-['Space_Grotesk'] text-lg font-light leading-snug text-[#F5F6F8]">
                    “{item.quote}”
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const demo = DEMO_DOCUMENTS[item.demoIndex];
                    if (demo) onSelectDemoDoc(demo);
                  }}
                  className="font-mono text-[10px] tracking-[0.18em] uppercase text-[#CBD5E1] hover:text-[#E5C158] inline-flex items-center gap-1.5 transition-colors pt-4 border-t border-[rgba(226,232,240,0.08)]"
                >
                  <span>{item.actionLabel}</span>
                  <ArrowUpRight className="h-3 w-3" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 07 — TRUST AND ACCURACY
         ===================================================================== */}
      <section
        id="section-trust"
        className="relative z-10 border-t py-24 sm:py-32"
        style={{
          backgroundColor: "#060608",
          borderColor: "rgba(226, 232, 240, 0.12)",
        }}
      >
        <div className="mx-auto max-w-7xl px-6 sm:px-10 space-y-16">
          <motion.div
            initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 48 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.85, ease: EASE_OUT_EXPO }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end"
          >
            <div className="lg:col-span-5 space-y-3">
              <span className="font-mono text-xs tracking-[0.24em] uppercase text-[#E5C158] block">
                SECTION 07 // TRUST AND ACCURACY
              </span>
              <h2 className="font-['Space_Grotesk'] text-3xl sm:text-5xl font-light tracking-[-0.025em] leading-[1.1] text-[#F5F6F8]">
                Every important detail deserves a source.
              </h2>
            </div>

            <div className="lg:col-span-7">
              <p className="text-sm sm:text-base leading-relaxed" style={{ color: "#CBD5E1" }}>
                DOCULENS is engineered around epistemic honesty. It never fabricates missing fields,
                never invents OCR confidence when a scan is unreadable, and separates extraction
                quality from profile readiness.
              </p>
            </div>
          </motion.div>

          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l"
            style={{ borderColor: "rgba(226, 232, 240, 0.12)" }}
          >
            {[
              {
                title: "Page references where available",
                desc: "Extracted requirements, dates, financial criteria, and clauses retain their source page or worksheet reference for one-click inspection.",
              },
              {
                title: "Missing-information detection",
                desc: "When an expected field or attachment is absent from the document, DOCULENS explicitly reports 'Not specified in this document'.",
              },
              {
                title: "Confidence and verification labels",
                desc: "Every requirement is tagged with clear verification states (Found in Vault, Missing Evidence, Needs Verification, or Conflict Detected).",
              },
              {
                title: "Conflict identification",
                desc: "Detects internal schedule and duration discrepancies across sections (such as conflicting contract terms or mismatched fee tables).",
              },
              {
                title: "Privacy-aware AI processing",
                desc: "Luhn payment cards, SSNs, PANs, Aadhaar numbers, phones, and emails are redacted client-side before any optional AI call.",
              },
              {
                title: "Honest extraction status",
                desc: "Separates Extraction Quality, Analysis Completeness, Profile/Vault Match, and Checklist Progress into transparent formulas.",
              },
            ].map((trust, idx) => (
              <motion.div
                key={trust.title}
                initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.65, delay: idx * 0.05, ease: EASE_OUT_EXPO }}
                className="p-8 border-r border-b space-y-3 bg-[#0B0D12]/70"
                style={{ borderColor: "rgba(226, 232, 240, 0.12)" }}
              >
                <div className="font-mono text-[11px] tracking-[0.2em] text-[#E5C158]">
                  0{idx + 1} // VERIFICATION STANDARD
                </div>
                <h3 className="font-['Space_Grotesk'] text-lg font-normal text-[#F5F6F8]">
                  {trust.title}
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed" style={{ color: "#CBD5E1" }}>
                  {trust.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 08 — FINAL CTA
         ===================================================================== */}
      <section
        className="relative z-10 border-t py-28 sm:py-36"
        style={{
          backgroundColor: "#0B0D12",
          borderColor: "rgba(226, 232, 240, 0.12)",
        }}
      >
        <div className="mx-auto max-w-5xl px-6 sm:px-10 text-center space-y-8">
          <motion.div
            initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.85, ease: EASE_OUT_EXPO }}
            className="space-y-6"
          >
            <span className="font-mono text-xs tracking-[0.28em] uppercase text-[#E5C158] block">
              From documents to decisions.
            </span>

            <h2 className="font-['Space_Grotesk'] text-4xl sm:text-6xl lg:text-7xl font-light tracking-[-0.03em] leading-[1.05] text-gold-platinum">
              Bring clarity to your next decision.
            </h2>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <button
                type="button"
                onClick={handleOpenApp}
                className="btn-gold-imperial group w-full sm:w-auto inline-flex items-center justify-center gap-4 px-9 py-4 font-['Space_Grotesk'] text-sm sm:text-base font-bold tracking-[0.18em] uppercase"
              >
                <span>ENTER DOCULENS</span>
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>

              <button
                type="button"
                onClick={onStartAnalysis}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 font-mono text-xs tracking-[0.18em] uppercase transition-colors hover:border-[#E5C158] hover:text-[#E5C158]"
                style={{
                  backgroundColor: "#12151E",
                  color: "#F5F6F8",
                  border: "1px solid rgba(226, 232, 240, 0.2)",
                }}
              >
                <span>UPLOAD & ANALYZE NOW</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-[#E5C158]" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 09 — EDITORIAL FOOTER
         ===================================================================== */}
      <footer
        className="relative z-10 border-t py-16 px-6 sm:px-10"
        style={{
          backgroundColor: "#060608",
          borderColor: "rgba(226, 232, 240, 0.12)",
        }}
      >
        <div className="mx-auto max-w-7xl space-y-12">
          <div
            className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b"
            style={{ borderColor: "rgba(226, 232, 240, 0.12)" }}
          >
            {/* Col 1: DOCULENS Identity */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-7 w-7 items-center justify-center font-mono text-xs font-bold"
                  style={{
                    background: "linear-gradient(135deg, #1E222D 0%, #0D0F14 100%)",
                    color: "#E5C158",
                    border: "1px solid rgba(229, 193, 88, 0.48)",
                  }}
                >
                  DL
                </span>
                <span className="font-['Space_Grotesk'] text-base font-bold tracking-[0.22em] uppercase text-[#F5F6F8]">
                  {APP_CONFIG.name}
                </span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "#CBD5E1" }}>
                Universal AI-Powered Document Intelligence Platform. Deterministic extraction,
                source-grounded verification, and client-side privacy redaction.
              </p>
              <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-[#E5C158]">
                GOLD & PLATINUM EDITION · v{APP_CONFIG.version}
              </div>
            </div>

            {/* Col 2: Product Navigation */}
            <div className="space-y-3">
              <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-[#E5C158]">
                PRODUCT NAVIGATION
              </div>
              <ul className="space-y-2 font-mono text-xs text-[#CBD5E1]">
                <li>
                  <button
                    type="button"
                    onClick={handleOpenApp}
                    className="hover:text-[#E5C158] transition-colors"
                  >
                    Overview Dashboard
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onStartAnalysis}
                    className="hover:text-[#E5C158] transition-colors"
                  >
                    New Document Analysis
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate?.("my_documents")}
                    className="hover:text-[#E5C158] transition-colors"
                  >
                    Saved Documents Repository
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate?.("compare")}
                    className="hover:text-[#E5C158] transition-colors"
                  >
                    Multi-Document Comparison
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate?.("profile")}
                    className="hover:text-[#E5C158] transition-colors"
                  >
                    Evidence Vault & Profile
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Supported Document Categories */}
            <div className="space-y-3">
              <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-[#E5C158]">
                DOCUMENT CATEGORIES
              </div>
              <ul className="space-y-1.5 font-mono text-xs text-[#CBD5E1]">
                <li>Scholarships & Fellowships</li>
                <li>RFPs, Tenders & Procurement</li>
                <li>College Admissions & Regulations</li>
                <li>Jobs, Careers & Offer Letters</li>
                <li>Government Schemes & Contracts</li>
                <li>Financial & Business Workbooks</li>
              </ul>
            </div>

            {/* Col 4: Privacy, Terms & Controls */}
            <div className="space-y-3">
              <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-[#E5C158]">
                PRIVACY & SYSTEM
              </div>
              <ul className="space-y-2 font-mono text-xs text-[#CBD5E1]">
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate?.("privacy_center")}
                    className="hover:text-[#E5C158] transition-colors"
                  >
                    Privacy Center & Redaction Audit
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate?.("settings_ai")}
                    className="hover:text-[#E5C158] transition-colors"
                  >
                    AI Provider & BYOK Vault Settings
                  </button>
                </li>
                {onReplayIntro && (
                  <li>
                    <button
                      type="button"
                      onClick={onReplayIntro}
                      className="hover:text-[#E5C158] transition-colors"
                    >
                      Replay Entry Introduction
                    </button>
                  </li>
                )}
              </ul>
              <p className="text-[11px] leading-relaxed pt-2" style={{ color: "#94A3B8" }}>
                Analytical verification system. Does not constitute legal counsel or guarantee of
                award.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] tracking-[0.16em] uppercase text-[#94A3B8]">
            <span>© 2026 {APP_CONFIG.name}. ALL RIGHTS RESERVED.</span>
            <span className="text-[#E5C158]">SOVEREIGN GOLD & BRUSHED PLATINUM EDITION</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
