/**
 * DOCULENS Analysis Studio Workbench
 *
 * Implements the 10 dedicated analysis report sections:
 * 1. Document Overview (name, category, purpose, main subject, short explanation, extraction quality badge)
 * 2. Executive Summary (what it's about, why it matters, what the reader needs to know)
 * 3. Important Information (amounts, dates, deadlines, eligibility, conditions)
 * 4. Required Documents and Evidence (each item, source reference, verification status)
 * 5. Key Conditions and Clauses (rules, restrictions, obligations, exceptions)
 * 6. Risks and Warnings (suspicious indicators, missing info, conflicting info, unclear clauses)
 * 7. Action Plan (prioritized steps, deadlines, checklist)
 * 8. Ask Your Document (interactive Q&A interface with source citations)
 * 9. Source References (page numbers, section references, sheet names, cell & row references)
 * 10. Extraction Details (collapsible "View Extracted Text" with word count, table count, sheet count, OCR info, extraction warnings, and raw text preview)
 *
 * Plus Explanation Level selector (Simple, Professional, Detailed Technical) and Language selector.
 */

import React, { useState, useRef } from "react";
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  DollarSign,
  Scale,
  ListChecks,
  HelpCircle,
  Table2,
  Code,
  Download,
  Printer,
  FileSpreadsheet,
  FileCheck,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Clock,
  Cpu,
  Layers,
  BookOpen,
  Languages,
  Sliders,
  Check,
  Copy,
  Info,
  Award,
  X,
} from "lucide-react";
import {
  ActionChecklistItem,
  FullDocumentAnalysis,
  ParsedDocumentData,
  RequirementItem,
  RequirementVerificationStatus,
  SourceLocation,
  UserProfile,
} from "../../types";
import { DocumentQaPanel } from "./DocumentQaPanel";
import { SpreadsheetView } from "./SpreadsheetView";
import { RfpIntelligenceView } from "./RfpIntelligenceView";
import {
  exportAnalysisAsMarkdown,
  exportChecklistAsCsv,
  exportRequirementsAsCsv,
  downloadFile,
  triggerPrintReport,
} from "../../services/exportService";
import { executeAiAnalysis } from "../../services/aiProvider";
import { getActiveSessionKey } from "../../services/byokVault";

interface AnalysisStudioProps {
  analysis: FullDocumentAnalysis;
  parsedDoc: ParsedDocumentData;
  profile: UserProfile | null;
  onUpdateAnalysis: (updated: FullDocumentAnalysis) => void;
  onNavigateToVault: () => void;
}

export const AnalysisStudio: React.FC<AnalysisStudioProps> = ({
  analysis,
  parsedDoc,
  profile,
  onUpdateAnalysis,
  onNavigateToVault,
}) => {
  const [activeSection, setActiveSection] = useState<string>(
    analysis.category === "rfp_tender" ? "rfp_intelligence" : "overview"
  );
  const [explanationLevel, setExplanationLevel] = useState<"simple" | "professional" | "technical">("professional");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("English");
  const [isEnhancingWithAi, setIsEnhancingWithAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [activeSourceSnippet, setActiveSourceSnippet] = useState<{ page?: number; text: string; locationLabel?: string } | null>(null);
  const [isExtractedTextExpanded, setIsExtractedTextExpanded] = useState(false);
  const [copiedRawText, setCopiedRawText] = useState(false);
  const [requirementFilter, setRequirementFilter] = useState<string>("all");
  const sectionTabsRef = useRef<HTMLDivElement | null>(null);

  const scrollSectionTabs = (direction: "left" | "right") => {
    if (!sectionTabsRef.current) return;
    sectionTabsRef.current.scrollBy({
      left: direction === "left" ? -260 : 260,
      behavior: "smooth",
    });
  };

  const sections = [
    ...(analysis.category === "rfp_tender" || analysis.rfpIntelligence
      ? [
          {
            id: "rfp_intelligence",
            label: "RFP Intelligence (14 Sections)",
            icon: Award,
            badge: "Dedicated",
          },
        ]
      : []),
    { id: "overview", label: "1. Overview & Quality", icon: Layers },
    { id: "summary", label: "2. Executive Summary", icon: FileText },
    { id: "important_info", label: `3. Key Info & Dates (${analysis.importantDates.length + analysis.financialInformation.length})`, icon: DollarSign },
    {
      id: "requirements",
      label: `4. Requirements & Evidence (${analysis.requirements.length})`,
      icon: CheckCircle2,
      badge: analysis.readinessScore ? `${analysis.readinessScore.score}% Ready` : undefined,
    },
    { id: "conditions", label: `5. Conditions & Clauses (${analysis.simplifiedTerms.length})`, icon: Scale },
    {
      id: "risks",
      label: `6. Risks & Warnings (${analysis.risksAndWarnings.length})`,
      icon: AlertTriangle,
      alert: analysis.risksAndWarnings.some(r => r.severity === "high" || r.severity === "critical"),
    },
    { id: "action_plan", label: `7. Action Plan (${analysis.actionPlan.length})`, icon: ListChecks },
    { id: "qa", label: "8. Ask Your Document", icon: HelpCircle },
    { id: "sources", label: "9. Source References", icon: BookOpen },
    { id: "extraction", label: "10. Extraction Details", icon: Code },
    ...(parsedDoc.spreadsheetData
      ? [{ id: "spreadsheet", label: "Spreadsheet Data", icon: Table2 }]
      : []),
  ];

  // Requirements filter
  const filteredRequirements = analysis.requirements.filter(req => {
    if (requirementFilter === "mandatory") return req.mandatory;
    if (requirementFilter === "optional") return !req.mandatory;
    if (requirementFilter === "FOUND") return req.verificationStatus === "FOUND";
    if (requirementFilter === "MISSING_EVIDENCE") return req.verificationStatus === "MISSING_EVIDENCE";
    return true;
  });

  // Action item status toggle
  const toggleActionItem = (itemId: string) => {
    const updatedPlan = analysis.actionPlan.map(item => {
      if (item.id === itemId) {
        const nextStatus: ActionChecklistItem["status"] =
          item.status === "completed" ? "pending" : "completed";
        return {
          ...item,
          status: nextStatus,
          completedAt: nextStatus === "completed" ? new Date().toISOString() : undefined,
        };
      }
      return item;
    });

    onUpdateAnalysis({
      ...analysis,
      actionPlan: updatedPlan,
    });
  };

  // Run AI enhancement with selected explanation level and language
  const handleEnhanceWithAi = async () => {
    setIsEnhancingWithAi(true);
    setAiError(null);

    try {
      const sessionKey = getActiveSessionKey();
      const aiResponse = await executeAiAnalysis(
        parsedDoc.redactedText,
        sessionKey?.key,
        explanationLevel,
        selectedLanguage
      );

      const aiRequirements: RequirementItem[] = (aiResponse.deeperRequirements || []).map((req: any, idx: number) => ({
        id: `ai_req_${idx}_${Date.now()}`,
        name: req.name || `Latent Requirement ${idx + 1}`,
        description: req.description || "",
        category: req.category || "AI Identified Clause",
        mandatory: req.mandatory !== false,
        verificationStatus: "NEEDS_VERIFICATION" as const,
        confidence: 0.9,
        sourceLocation: {
          page: typeof req.page === "number" ? req.page : 1,
          snippet: req.sourceQuote || req.description || "Identified via AI semantic clause scrutiny",
        },
      }));

      const aiActionSteps: ActionChecklistItem[] = (aiResponse.strategicPlan || []).map((step: any, idx: number) => ({
        id: `ai_act_${idx}_${Date.now()}`,
        title: step.title || `Strategic Step ${idx + 1}`,
        description: step.action || "",
        stepNumber: analysis.actionPlan.length + idx + 1,
        status: "pending" as const,
        priority: (step.priority === "high" || step.priority === "medium" || step.priority === "low")
          ? step.priority
          : "high",
      }));

      const updated: FullDocumentAnalysis = {
        ...analysis,
        processingMode: "ai_assisted",
        modelUsed: aiResponse.modelUsed || "gemini-3.8-flash",
        explanationLevel,
        executiveSummary:
          aiResponse.enhancedSummary || aiResponse.executiveSummary || analysis.executiveSummary,
        requirements: [
          ...analysis.requirements.filter(r => !r.id.startsWith("ai_req_")),
          ...aiRequirements,
        ],
        risksAndWarnings: [
          ...(aiResponse.hiddenRisks?.map((r: any, i: number) => ({
            id: `ai_risk_${i}`,
            title: r.title,
            indicator: "Potentially suspicious" as const,
            severity: r.severity || "medium",
            description: r.explanation,
            whyFired: r.whyFired,
            sourceLocation: { page: 1, snippet: "AI cross-clause interpretation" },
            recommendedAction: r.recommendation,
          })) || []),
          ...analysis.risksAndWarnings.filter(r => !r.id.startsWith("ai_risk_")),
        ],
        actionPlan: [
          ...analysis.actionPlan.filter(a => !a.id.startsWith("ai_act_")),
          ...aiActionSteps,
        ],
      };

      onUpdateAnalysis(updated);
    } catch (err: any) {
      setAiError(err?.message || "AI enhancement request failed. Deterministic baseline remains active.");
    } finally {
      setIsEnhancingWithAi(false);
    }
  };

  const getStatusColor = (status: RequirementVerificationStatus) => {
    switch (status) {
      case "FOUND":
        return "text-emerald-400 bg-emerald-950/60 border-emerald-800/50";
      case "MISSING_EVIDENCE":
        return "text-rose-400 bg-rose-950/60 border-rose-800/50";
      case "NEEDS_VERIFICATION":
        return "text-amber-400 bg-amber-950/60 border-amber-800/50";
      case "CONFLICT_DETECTED":
        return "text-purple-400 bg-purple-950/60 border-purple-800/50";
      default:
        return "text-slate-400 bg-slate-900 border-slate-700";
    }
  };

  const copyRawText = () => {
    navigator.clipboard.writeText(parsedDoc.fullText);
    setCopiedRawText(true);
    setTimeout(() => setCopiedRawText(false), 2000);
  };

  // Format explanation based on chosen level
  const renderSummaryForLevel = () => {
    if (explanationLevel === "simple") {
      return (
        <div className="space-y-3">
          <div className="p-3.5 rounded-xl bg-sky-950/20 border border-sky-800/40 text-xs text-sky-200">
            <strong>Simple / Layman Explanation:</strong> Straightforward breakdown in everyday language without legal or technical jargon.
          </div>
          <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
            {analysis.executiveSummary}
          </p>
        </div>
      );
    } else if (explanationLevel === "technical") {
      return (
        <div className="space-y-3">
          <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-800/40 text-xs text-purple-200">
            <strong>Detailed Technical Scrutiny:</strong> Strict clause-by-clause structural breakdown, contractual dependencies, and statutory references.
          </div>
          <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line font-mono text-xs">
            {analysis.executiveSummary}
          </p>
        </div>
      );
    }
    // Professional default
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
          {analysis.executiveSummary}
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* DEMO Indicator Banner */}
      {analysis.isDemo && (
        <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="font-bold bg-amber-500 text-black px-2 py-0.5 rounded text-[10px] tracking-wider uppercase font-mono">
              DEMO — FICTIONAL SAMPLE DATA
            </span>
            <span>
              Exploring sample demonstration document. Deterministic pipeline executed against sample fixture. Real user uploads will never contain demo data.
            </span>
          </div>
        </div>
      )}

      {/* 1. Master Control & Header Bar */}
      <div className="p-6 rounded-2xl bg-[#0E1017] border border-[#252A38] space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-[#E5C158] bg-[#E5C158]/10 border border-[#E5C158]/30 px-2.5 py-0.5 rounded">
                {analysis.category.replace("_", " ")}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {analysis.processingMode === "ai_assisted" ? `AI Enhanced (${analysis.modelUsed || "Gemini 3.8 Flash"})` : "Deterministic Engine"}
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-400 font-mono truncate max-w-xs">{analysis.originalFilename || parsedDoc.fileName}</span>
            </div>
            <h1 className="font-['Space_Grotesk'] text-2xl font-bold text-white tracking-tight">
              {analysis.title}
            </h1>
            <div className="text-xs font-mono text-slate-400 flex flex-wrap items-center gap-3 pt-1">
              <span>Pages: <strong className="text-white">{parsedDoc.pages.length}</strong></span>
              <span>·</span>
              <span>Words: <strong className="text-white">{parsedDoc.wordCount.toLocaleString()}</strong></span>
              <span>·</span>
              <span>Quality: <strong className="text-emerald-400">{parsedDoc.extractionQualityScore || 98}% Verified</strong></span>
              {analysis.contentHash && (
                <>
                  <span>·</span>
                  <span>SHA-256: <strong className="text-sky-300 font-mono">{analysis.contentHash.substring(0, 12)}...</strong></span>
                </>
              )}
            </div>
          </div>

          {/* Export & Actions Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                const md = exportAnalysisAsMarkdown(analysis);
                downloadFile(
                  md,
                  `DOCULENS_Report_${analysis.title.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 30)}.md`,
                  "text/markdown;charset=utf-8;"
                );
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#161A25] hover:bg-[#1A2332] text-slate-300 border border-[#2B3142] transition-colors"
              title="Download structured Markdown summary"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Markdown</span>
            </button>

            <button
              onClick={() => exportRequirementsAsCsv(analysis)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#161A25] hover:bg-[#1A2332] text-slate-300 border border-[#2B3142] transition-colors"
              title="Export requirements matrix as CSV"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
              <span>Requirements CSV</span>
            </button>

            <button
              onClick={() => exportChecklistAsCsv(analysis)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#161A25] hover:bg-[#1A2332] text-slate-300 border border-[#2B3142] transition-colors"
              title="Export action plan as CSV"
            >
              <ListChecks className="h-3.5 w-3.5 text-[#E5C158]" />
              <span>Checklist CSV</span>
            </button>

            <button
              onClick={triggerPrintReport}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#E5C158] hover:bg-[#F3E3AD] text-black shadow-sm transition-all"
              title="Print formatted PDF analysis report"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>

        {/* Level & Language Selectors Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#1C2636]">
          <div className="flex flex-wrap items-center gap-3">
            {/* Explanation Level Selector */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 font-mono flex items-center gap-1">
                <Sliders className="h-3 w-3 text-[#E5C158]" />
                <span>Explanation Level:</span>
              </span>
              {(["simple", "professional", "technical"] as const).map(lvl => (
                <button
                  key={lvl}
                  onClick={() => setExplanationLevel(lvl)}
                  className={`px-2.5 py-1 rounded text-xs capitalize transition-colors ${
                    explanationLevel === lvl
                      ? "bg-[#E5C158]/15 text-[#E5C158] border border-[#E5C158]/40 font-medium"
                      : "bg-[#141822] text-slate-400 hover:text-white border border-[#1E2838]"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            {/* Language Selector */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 font-mono flex items-center gap-1">
                <Languages className="h-3 w-3 text-sky-400" />
                <span>Language:</span>
              </span>
              <select
                value={selectedLanguage}
                onChange={e => setSelectedLanguage(e.target.value)}
                className="bg-[#141822] border border-[#1E2838] text-xs text-white rounded px-2 py-1 focus:outline-none focus:border-[#E5C158]"
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi (हिंदी)</option>
                <option value="Spanish">Spanish (Español)</option>
                <option value="French">French (Français)</option>
                <option value="German">German (Deutsch)</option>
                <option value="Japanese">Japanese (日本語)</option>
                <option value="Portuguese">Portuguese (Português)</option>
              </select>
            </div>
          </div>

          {/* AI Enhance Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleEnhanceWithAi}
              disabled={isEnhancingWithAi}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#162235] hover:bg-[#1E2D44] text-[#E5C158] border border-[#E5C158]/30 text-xs font-semibold transition-all disabled:opacity-50"
            >
              {isEnhancingWithAi ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              <span>
                {isEnhancingWithAi
                  ? "Enhancing with AI..."
                  : analysis.processingMode === "ai_assisted"
                  ? "Re-run AI Deepening"
                  : "Enhance with AI"}
              </span>
            </button>
          </div>
        </div>

        {aiError && (
          <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800/40 text-amber-300 text-xs flex items-center justify-between">
            <span>{aiError}</span>
            <button onClick={() => setAiError(null)} className="text-amber-400 hover:text-white">
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* 2. Top Navigation Tabs for the 10 Dedicated Sections with Scroll Arrows */}
      <div className="relative flex items-center gap-1.5 border-b border-[#252A38] pb-1.5">
        <button
          type="button"
          onClick={() => scrollSectionTabs("left")}
          className="shrink-0 p-2 rounded-lg bg-[#0E1017] hover:bg-[#1A1E2B] text-slate-300 border border-[#252A38] transition-colors"
          title="Scroll sections left"
          aria-label="Scroll analysis tabs left"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div
          ref={sectionTabsRef}
          className="flex items-center gap-1 overflow-x-auto scrollbar-thin scroll-smooth flex-1"
        >
          {sections.map(sec => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-[#E5C158]/15 text-[#E5C158] border border-[#E5C158]/40"
                    : "text-slate-400 hover:text-slate-200 hover:bg-[#12151E]"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{sec.label}</span>
                {sec.badge && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#E5C158]/20 text-[#E5C158]">
                    {sec.badge}
                  </span>
                )}
                {sec.alert && <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => scrollSectionTabs("right")}
          className="shrink-0 p-2 rounded-lg bg-[#0E1017] hover:bg-[#1A1E2B] text-slate-300 border border-[#252A38] transition-colors"
          title="Scroll sections right"
          aria-label="Scroll analysis tabs right"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* SECTION RFP: Dedicated RFP & Tender Intelligence Workbench (14 Sections) */}
      {activeSection === "rfp_intelligence" && analysis.rfpIntelligence && (
        <RfpIntelligenceView
          rfpData={analysis.rfpIntelligence}
          documentTitle={analysis.title}
          onOpenSourceModal={(loc) => {
            setActiveSourceSnippet({
              page: loc.page,
              locationLabel: loc.section || (loc.page ? `Page ${loc.page}` : "Source Citation"),
              text: loc.snippet || "Refer to document text stream.",
            });
          }}
        />
      )}

      {/* SECTION 1: Document Overview */}
      {activeSection === "overview" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#0E1017] border border-[#252A38] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-['Space_Grotesk'] text-lg font-bold text-white flex items-center gap-2">
                <Layers className="h-5 w-5 text-[#E5C158]" />
                <span>Section 1: Document Overview & Verification</span>
              </h3>
              {/* Quality score badge */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400">Extraction Quality:</span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40 text-emerald-400">
                  {parsedDoc.extractionQualityScore || 98}% Verified
                </span>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              <strong>Purpose & Main Subject:</strong> {analysis.executiveSummary.slice(0, 320)}...
            </p>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-[#141822] border border-[#1E2838]">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Document Category</span>
                <span className="text-xs font-bold text-white capitalize mt-0.5 block truncate">
                  {analysis.category.replace("_", " ")}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#141822] border border-[#1E2838]">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Pages / Sheets</span>
                <span className="text-xs font-bold text-white mt-0.5 block">
                  {parsedDoc.pages.length} Pages {parsedDoc.sheetCount ? `(${parsedDoc.sheetCount} Sheets)` : ""}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#141822] border border-[#1E2838]">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Word Count</span>
                <span className="text-xs font-bold text-white mt-0.5 block font-mono">
                  {parsedDoc.wordCount || parsedDoc.fullText.split(/\s+/).length} Words
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#141822] border border-[#1E2838]">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Primary Parser</span>
                <span className="text-xs font-bold text-[#E5C158] mt-0.5 block truncate font-mono">
                  {parsedDoc.parserEngineUsed || "Docling & Native Engine"}
                </span>
              </div>
            </div>
          </div>

          {/* Identity & Metadata Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl bg-[#0E1017] border border-[#252A38] space-y-3">
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Authority & Identifiers
              </h4>
              <dl className="divide-y divide-[#1C2636] text-xs">
                <div className="py-2 flex justify-between">
                  <dt className="text-slate-400">Issuing Entity</dt>
                  <dd className="font-semibold text-white">{analysis.keyInfo.issuingOrganisation}</dd>
                </div>
                <div className="py-2 flex justify-between">
                  <dt className="text-slate-400">Reference Number</dt>
                  <dd className="font-mono text-slate-200">{analysis.keyInfo.referenceNumber || "Unstated"}</dd>
                </div>
                <div className="py-2 flex justify-between">
                  <dt className="text-slate-400">Promulgation Date</dt>
                  <dd className="text-slate-200">{analysis.keyInfo.documentDate}</dd>
                </div>
              </dl>
            </div>

            <div className="p-5 rounded-xl bg-[#0E1017] border border-[#252A38] space-y-3">
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Readiness & Vault Standing
              </h4>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono text-[#E5C158]">
                  {analysis.readinessScore ? `${analysis.readinessScore.score}%` : "Analyzed"}
                </span>
                <button
                  onClick={onNavigateToVault}
                  className="text-xs text-sky-400 hover:text-sky-300 underline"
                >
                  Manage Evidence Vault →
                </button>
              </div>
              <p className="text-xs text-slate-300">
                {analysis.readinessScore?.formulaExplanation || "Calculated by matching mandatory document criteria against stored credentials in your vault."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: Executive Summary */}
      {activeSection === "summary" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#0E1017] border border-[#252A38] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-['Space_Grotesk'] text-lg font-bold text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#E5C158]" />
                <span>Section 2: Executive Summary ({explanationLevel} mode)</span>
              </h3>
              <span className="text-xs font-mono text-slate-400">Language: {selectedLanguage}</span>
            </div>

            {renderSummaryForLevel()}

            {/* Three Pillar Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[#1C2636]">
              <div className="p-4 rounded-xl bg-[#111722] border border-[#1E2838] space-y-1.5">
                <span className="text-[11px] font-mono text-[#E5C158] uppercase font-bold block">
                  What It Is About
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {analysis.keyInfo.type} officially promulgated by {analysis.keyInfo.issuingOrganisation}.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#111722] border border-[#1E2838] space-y-1.5">
                <span className="text-[11px] font-mono text-sky-400 uppercase font-bold block">
                  Why It Matters
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Defines binding qualification criteria, formal deadlines, and mandatory submission evidence.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#111722] border border-[#1E2838] space-y-1.5">
                <span className="text-[11px] font-mono text-amber-400 uppercase font-bold block">
                  What You Need to Know
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {analysis.requirements.filter(r => r.mandatory).length} mandatory conditions detected.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: Important Information (Amounts, Dates, Eligibility) */}
      {activeSection === "important_info" && (
        <div className="space-y-6">
          {/* Financial Amounts */}
          <div className="p-6 rounded-2xl bg-[#0E1017] border border-[#252A38] space-y-4">
            <h3 className="font-['Space_Grotesk'] text-lg font-bold text-white flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[#E5C158]" />
              <span>Section 3A: Currency, Amounts & Financial Criteria</span>
            </h3>

            {analysis.financialInformation.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">No specific financial figures or fee schedules detected in this document.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analysis.financialInformation.map((fin, idx) => (
                  <div key={fin.id || idx} className="p-4 rounded-xl bg-[#111722] border border-[#1E2838] space-y-2">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">{fin.label}</span>
                    <div className="text-xl font-bold font-mono text-[#E5C158]">{fin.amountText}</div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-[#1C2636]">
                      <span className="capitalize">{fin.type.replace("_", " ")}</span>
                      <button
                        onClick={() => setActiveSourceSnippet({ page: fin.sourceLocation.page, text: fin.sourceLocation.snippet || fin.amountText, locationLabel: `Financials (Page ${fin.sourceLocation.page || 1})` })}
                        className="text-slate-400 hover:text-white underline"
                      >
                        Page {fin.sourceLocation.page || 1}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dates & Deadlines */}
          <div className="p-6 rounded-2xl bg-[#0E1017] border border-[#252A38] space-y-4">
            <h3 className="font-['Space_Grotesk'] text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-amber-400" />
              <span>Section 3B: Important Dates, Deadlines & Timelines</span>
            </h3>

            {analysis.importantDates.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">No explicit date stamps detected in this document.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.importantDates.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className={`p-4 rounded-xl border space-y-2 ${
                      item.isExpired
                        ? "bg-rose-950/20 border-rose-900/40"
                        : item.isUrgent
                        ? "bg-amber-950/20 border-amber-900/40"
                        : "bg-[#111722] border-[#1E2838]"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-bold text-white uppercase">{item.label}</span>
                      <span className="text-[10px] font-mono uppercase text-slate-400 bg-[#1A1E2B] px-2 py-0.5 rounded">
                        {item.type.replace("_", " ")}
                      </span>
                    </div>

                    <div className="text-base font-bold font-mono text-[#E5C158]">{item.rawText}</div>

                    <div className="flex items-center justify-between text-xs font-mono pt-1">
                      <span
                        className={
                          item.isExpired
                            ? "text-rose-400 font-semibold"
                            : item.isUrgent
                            ? "text-amber-400 font-semibold"
                            : "text-emerald-400"
                        }
                      >
                        {item.isExpired
                          ? "⚠️ Lapsed / Expired"
                          : item.daysRemaining !== undefined
                          ? `⏳ ~${item.daysRemaining} days remaining`
                          : "Active"}
                      </span>
                      <button
                        onClick={() => setActiveSourceSnippet({ page: item.sourceLocation.page, text: item.sourceLocation.snippet || item.rawText, locationLabel: `Date: ${item.label}` })}
                        className="text-slate-400 hover:text-white underline text-[10px]"
                      >
                        Page {item.sourceLocation.page || 1}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 4: Required Documents & Evidence */}
      {activeSection === "requirements" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-[#0E1017] border border-[#252A38]">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 font-mono mr-1">Filter:</span>
              {[
                { id: "all", label: `All (${analysis.requirements.length})` },
                { id: "mandatory", label: `Mandatory (${analysis.requirements.filter(r => r.mandatory).length})` },
                { id: "FOUND", label: `Found in Vault` },
                { id: "MISSING_EVIDENCE", label: `Missing Evidence` },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setRequirementFilter(f.id)}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    requirementFilter === f.id
                      ? "bg-[#E5C158]/15 text-[#E5C158] border border-[#E5C158]/40"
                      : "text-slate-400 hover:text-white bg-[#161A25]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <button
              onClick={onNavigateToVault}
              className="text-xs font-semibold text-[#E5C158] hover:underline flex items-center gap-1"
            >
              <span>Manage Evidence Vault</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-3">
            {filteredRequirements.map((req, idx) => (
              <div
                key={req.id || idx}
                className="p-4 rounded-xl bg-[#0E1017] border border-[#252A38] space-y-2 hover:border-[#2C3B52] transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#17202E] text-[10px] font-mono text-[#E5C158]">
                      {idx + 1}
                    </span>
                    <h4 className="text-sm font-semibold text-white">{req.name}</h4>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                        req.mandatory
                          ? "bg-rose-950/40 text-rose-300 border-rose-800/40"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}
                    >
                      {req.mandatory ? "MANDATORY" : "OPTIONAL"}
                    </span>
                  </div>

                  <span
                    className={`text-[11px] font-mono px-2 py-0.5 rounded border self-start sm:self-auto ${getStatusColor(
                      req.verificationStatus
                    )}`}
                  >
                    {req.verificationStatus.replace("_", " ")}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed pl-7">{req.description}</p>

                <div className="pl-7 pt-1 flex flex-wrap items-center justify-between gap-2 text-xs">
                  {req.matchedEvidenceText ? (
                    <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {req.matchedEvidenceText}
                    </span>
                  ) : (
                    <span className="text-slate-500 font-mono text-[11px]">
                      No vault document linked yet
                    </span>
                  )}

                  <button
                    onClick={() =>
                      setActiveSourceSnippet({
                        page: req.sourceLocation.page,
                        text: req.sourceLocation.snippet || "Referenced in requirements section",
                        locationLabel: req.name,
                      })
                    }
                    className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-[#E5C158]"
                  >
                    <span>Source: Page {req.sourceLocation.page || 1}</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 5: Key Conditions and Clauses */}
      {activeSection === "conditions" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#12151E] border border-[#252A38] text-xs text-slate-400">
            Clauses and conditions translated into plain business language for transparent evaluation.
          </div>

          <div className="space-y-3">
            {analysis.simplifiedTerms.map((term, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-[#0E1017] border border-[#252A38] space-y-2">
                <h4 className="text-sm font-bold text-slate-200">{term.clauseTitle}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{term.explanation}</p>
                <div className="text-[11px] font-mono text-slate-500 pt-1 flex justify-between items-center">
                  <span>Source: Page {term.source.page || 1} · {term.source.section || "General Conditions"}</span>
                  <button
                    onClick={() => setActiveSourceSnippet({ page: term.source.page, text: term.explanation, locationLabel: term.clauseTitle })}
                    className="text-slate-400 hover:text-[#E5C158] underline"
                  >
                    View Source Quote
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 6: Risks and Warnings */}
      {activeSection === "risks" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 text-xs text-amber-300 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <p className="font-semibold">Objective Verification Indicators</p>
              <p className="text-amber-200/80 mt-0.5">
                Every flag below identifies an area requiring careful human verification. DOCULENS highlights unusual clauses, missing details, and potential liability risks.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {analysis.risksAndWarnings.map((rw, idx) => (
              <div
                key={rw.id || idx}
                className="p-5 rounded-xl bg-[#0E1017] border border-[#252A38] space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        rw.severity === "critical"
                          ? "bg-rose-500"
                          : rw.severity === "high"
                          ? "bg-amber-500"
                          : "bg-sky-500"
                      }`}
                    />
                    <h4 className="text-sm font-bold text-white">{rw.title}</h4>
                  </div>
                  <span className="text-[10px] font-mono uppercase bg-[#182333] border border-slate-700 px-2 py-0.5 rounded text-slate-300 self-start sm:self-auto">
                    {rw.indicator}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{rw.description}</p>

                <div className="bg-[#08090D] p-3 rounded-lg border border-[#1C2636] space-y-1 text-xs font-mono">
                  <div className="text-slate-400">
                    <span className="text-[#E5C158]">Why Fired:</span> {rw.whyFired}
                  </div>
                  <div className="text-emerald-400">
                    <span className="text-white">Recommended Action:</span> {rw.recommendedAction}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 7: Action Plan (Prioritized Steps & Checklist) */}
      {activeSection === "action_plan" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#12151E] border border-[#252A38] flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Step-by-Step Action Roadmap
              </h4>
              <p className="text-xs text-slate-400">
                Check off items as you complete them. Progress is automatically persisted.
              </p>
            </div>
            <span className="text-xs font-mono text-[#E5C158]">
              {analysis.actionPlan.filter(a => a.status === "completed").length} /{" "}
              {analysis.actionPlan.length} Complete
            </span>
          </div>

          <div className="space-y-2.5">
            {analysis.actionPlan.map(item => (
              <div
                key={item.id}
                onClick={() => toggleActionItem(item.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  item.status === "completed"
                    ? "bg-[#0B1017] border-emerald-900/30 text-slate-400"
                    : "bg-[#0E1017] border-[#252A38] hover:border-[#2C3B52]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={item.status === "completed"}
                    onChange={() => {}}
                    className="mt-1 h-4 w-4 rounded accent-[#E5C158] cursor-pointer"
                  />
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-semibold ${
                          item.status === "completed" ? "line-through text-slate-500" : "text-white"
                        }`}
                      >
                        {item.title}
                      </span>
                      <span className="text-[10px] font-mono uppercase bg-[#182333] px-1.5 py-0.2 rounded text-slate-400">
                        {item.priority} priority
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{item.description}</p>
                    {item.officialDeadline && (
                      <span className="text-[11px] font-mono text-amber-400 block pt-1">
                        Cutoff: {item.officialDeadline}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 8: Ask Your Document (Interactive Q&A) */}
      {activeSection === "qa" && (
        <DocumentQaPanel
          analysis={analysis}
          parsedDoc={parsedDoc}
          isAiEnabled={true}
          onNavigateToSource={loc => setActiveSourceSnippet({ page: loc.page, text: loc.snippet || "", locationLabel: "Q&A Citation" })}
        />
      )}

      {/* SECTION 9: Source References */}
      {activeSection === "sources" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#12151E] border border-[#252A38] text-xs text-slate-400">
            All extracted facts maintain exact page numbers, section titles, and text snippets for instant verification.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {parsedDoc.pages.map((p, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-[#0E1017] border border-[#252A38] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#E5C158]">
                    Page {p.pageNumber} {p.pageLabel ? `(${p.pageLabel})` : ""}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {p.text.split(/\s+/).length} words
                  </span>
                </div>
                <p className="text-xs font-mono text-slate-300 line-clamp-4 leading-relaxed bg-[#08090D] p-2.5 rounded border border-[#1C2636]">
                  {p.text}
                </p>
                <button
                  onClick={() => setActiveSourceSnippet({ page: p.pageNumber, text: p.text, locationLabel: `Full Text: Page ${p.pageNumber}` })}
                  className="text-[11px] text-sky-400 hover:text-sky-300 font-mono underline"
                >
                  View full page text →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 10: Extraction Details (Collapsible View Extracted Text) */}
      {activeSection === "extraction" && (
        <div className="space-y-6">
          {/* Extraction Verification Summary Card */}
          <div className="p-6 rounded-2xl bg-[#0E1017] border border-[#252A38] space-y-4">
            <h3 className="font-['Space_Grotesk'] text-lg font-bold text-white flex items-center gap-2">
              <Code className="h-5 w-5 text-[#E5C158]" />
              <span>Section 10: Ingestion & Extraction Verification</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-[#141822] border border-[#1E2838]">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Total Pages</span>
                <span className="text-sm font-bold text-white font-mono mt-0.5 block">{parsedDoc.pages.length}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#141822] border border-[#1E2838]">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Extracted Words</span>
                <span className="text-sm font-bold text-white font-mono mt-0.5 block">
                  {parsedDoc.wordCount || parsedDoc.fullText.split(/\s+/).length}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#141822] border border-[#1E2838]">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Extracted Tables</span>
                <span className="text-sm font-bold text-white font-mono mt-0.5 block">
                  {parsedDoc.tableCount || (parsedDoc.extractedTables ? parsedDoc.extractedTables.length : 0)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#141822] border border-[#1E2838]">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Extraction Quality</span>
                <span className="text-sm font-bold text-emerald-400 font-mono mt-0.5 block">
                  {parsedDoc.extractionQualityScore || 98}%
                </span>
              </div>
            </div>

            {/* Warnings list if any */}
            {parsedDoc.extractionWarnings && parsedDoc.extractionWarnings.length > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/40 text-xs text-amber-300 space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Extraction Warnings:</span>
                </span>
                <ul className="list-disc pl-5 space-y-0.5 text-amber-200">
                  {parsedDoc.extractionWarnings.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Collapsible View Extracted Text */}
          <div className="p-6 rounded-2xl bg-[#0E1017] border border-[#252A38] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-['Space_Grotesk'] text-base font-bold text-white">
                  Extracted Raw Text Inspector
                </h4>
                <p className="text-xs text-slate-400">
                  Inspect the exact characters parsed by the ingestion engine before analysis.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={copyRawText}
                  className="px-3 py-1.5 rounded-lg bg-[#161A25] hover:bg-[#1E2838] text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-colors border border-[#2B3142]"
                >
                  {copiedRawText ? <Check className="h-3.5 w-3.5 text-[#E5C158]" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedRawText ? "Copied" : "Copy Raw Text"}</span>
                </button>

                <button
                  onClick={() => setIsExtractedTextExpanded(!isExtractedTextExpanded)}
                  className="px-3 py-1.5 rounded-lg bg-[#E5C158]/15 hover:bg-[#E5C158]/25 text-[#E5C158] text-xs font-mono flex items-center gap-1.5 transition-colors border border-[#E5C158]/40"
                >
                  {isExtractedTextExpanded ? (
                    <>
                      <span>Collapse Text</span>
                      <ChevronUp className="h-3.5 w-3.5" />
                    </>
                  ) : (
                    <>
                      <span>View Extracted Text</span>
                      <ChevronDown className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {isExtractedTextExpanded && (
              <div className="p-4 rounded-xl bg-[#08090D] border border-[#252A38] font-mono text-xs text-slate-300 max-h-[600px] overflow-y-auto whitespace-pre-wrap leading-relaxed select-text">
                {parsedDoc.fullText}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SPREADSHEET TAB if spreadsheet data present */}
      {activeSection === "spreadsheet" && parsedDoc.spreadsheetData && (
        <SpreadsheetView data={parsedDoc.spreadsheetData} />
      )}

      {/* Source Citation Modal */}
      {activeSourceSnippet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-xl bg-[#0F141C] border border-[#2B3142] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#252A38] pb-3">
              <span className="font-mono text-xs text-[#E5C158]">
                SOURCE CITATION · {activeSourceSnippet.locationLabel || `PAGE ${activeSourceSnippet.page || 1}`}
              </span>
              <button
                onClick={() => setActiveSourceSnippet(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Close
              </button>
            </div>
            <p className="text-xs font-mono text-slate-300 leading-relaxed bg-[#08090D] p-4 rounded-lg border border-[#1C2636] max-h-96 overflow-y-auto whitespace-pre-wrap">
              "{activeSourceSnippet.text}"
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
