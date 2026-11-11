/**
 * DOCULENS Dashboard Home
 *
 * Operational cockpit featuring:
 * - Prominent "Analyse a document" hero action
 * - Category entry shortcuts (all routing into the shared universal engine)
 * - Recent analyses list with readiness scores and category markers
 * - Upcoming deadlines & urgency countdowns
 * - Incomplete action checklists
 * - Profile completeness & Evidence Vault stats
 * - AI provider status
 */

import React from "react";
import {
  FileText,
  Upload,
  Calendar,
  CheckSquare,
  Archive,
  Sparkles,
  ArrowRight,
  Clock,
  AlertTriangle,
  Scale,
  GraduationCap,
  Briefcase,
  Building,
  Landmark,
  Table2,
  FileSignature,
  FilePlus2,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { APP_CONFIG } from "../../config/appConfig";
import { FullDocumentAnalysis, UserProfile } from "../../types";
import { DEMO_DOCUMENTS, DemoDocumentSpec } from "../../services/demoData";

interface DashboardHomeProps {
  onStartAnalysis: (categoryHint?: string) => void;
  onOpenAnalysis: (analysis: FullDocumentAnalysis) => void;
  onSelectDemoDoc: (demo: DemoDocumentSpec) => void;
  onNavigate: (view: string) => void;
  recentAnalyses: FullDocumentAnalysis[];
  profile: UserProfile | null;
  vaultDocCount: number;
  isAiConnected: boolean;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  onStartAnalysis,
  onOpenAnalysis,
  onSelectDemoDoc,
  onNavigate,
  recentAnalyses,
  profile,
  vaultDocCount,
  isAiConnected,
}) => {
  // Extract upcoming deadlines across all analyzed documents
  const allUpcomingDeadlines = recentAnalyses
    .flatMap(a =>
      a.importantDates.map(d => ({
        ...d,
        docTitle: a.title,
        docId: a.id,
      }))
    )
    .filter(d => !d.isExpired && d.daysRemaining !== undefined && d.daysRemaining >= 0)
    .sort((a, b) => (a.daysRemaining || 999) - (b.daysRemaining || 999))
    .slice(0, 5);

  // Extract incomplete checklist items
  const incompleteTasks = recentAnalyses
    .flatMap(a =>
      a.actionPlan
        .filter(task => task.status !== "completed")
        .map(task => ({
          ...task,
          docTitle: a.title,
          docId: a.id,
        }))
    )
    .slice(0, 6);

  // Profile completeness percentage
  const calculateProfileCompleteness = (): number => {
    if (!profile) return 15;
    let score = 25;
    if (profile.displayName) score += 15;
    if (profile.fieldOrIndustry) score += 15;
    if (profile.qualifications.length > 0) score += 15;
    if (profile.gstNumber || profile.companyRegistrationNumber) score += 15;
    if (vaultDocCount > 0) score += 15;
    return Math.min(100, score);
  };

  const profileScore = calculateProfileCompleteness();

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* 1. Welcome & Primary Action Banner */}
      <div className="p-8 rounded-3xl surface-gold-card relative overflow-hidden">
        <div
          className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full blur-[110px]"
          style={{ background: "rgba(229, 193, 88, 0.16)" }}
        />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-[#E5C158] uppercase tracking-wider bg-[#E5C158]/10 border border-[#E5C158]/35 px-2.5 py-0.5 rounded">
                INTELLIGENCE DASHBOARD · GOLD & PLATINUM
              </span>
              <span className="text-xs text-[#94A3B8] font-mono">Universal Document Engine</span>
            </div>
            <h1 className="font-['Space_Grotesk'] text-3xl font-extrabold tracking-tight text-gold-platinum">
              Welcome to {APP_CONFIG.name}
            </h1>
            <p className="text-sm text-[#CBD5E1] leading-relaxed">
              Upload any RFP, scholarship, job spec, contract, or spreadsheet. Our deterministic pipeline parses pages, sanitizes sensitive data, and surfaces requirements and action plans.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => onStartAnalysis()}
              className="btn-gold-imperial px-6 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
            >
              <Upload className="h-4 w-4" />
              <span>{APP_CONFIG.primaryCta}</span>
            </button>
            <button
              onClick={() => onSelectDemoDoc(DEMO_DOCUMENTS[0])}
              className="px-5 py-3.5 rounded-xl font-medium text-xs bg-[#141822] hover:bg-[#1C2130] text-[#F5F6F8] border border-[rgba(226,232,240,0.2)] transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="h-4 w-4 text-[#E5C158]" />
              <span>Load Sample Tender</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Category Entry Shortcuts */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Category Entry Shortcuts (Single Unified Engine)
          </h3>
          <span className="text-[11px] font-mono text-slate-400">
            Auto-classified on upload with manual correction
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {APP_CONFIG.categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => onStartAnalysis(cat.id)}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#0E1017] border border-[#252A38] hover:border-[#E5C158]/40 hover:bg-[#131A26] transition-all text-center group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#161A25] text-slate-300 group-hover:text-[#E5C158] group-hover:bg-[#1B2536] transition-colors mb-2">
                <FileText className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold text-slate-200 group-hover:text-white line-clamp-1">
                {cat.name}
              </span>
              <span className="text-[10px] text-slate-400 font-mono mt-0.5">Shortcut</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Operational Grid (Recent Analyses, Deadlines, Checklists, Vault) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Analyses */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-['Space_Grotesk'] text-base font-bold text-white flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#E5C158]" />
              <span>Recent Document Analyses</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {recentAnalyses.length} Documents Analyzed
            </span>
          </div>

          {recentAnalyses.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#0E1017] border border-dashed border-[#252A38] text-center space-y-3">
              <FilePlus2 className="h-10 w-10 mx-auto text-slate-600" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-300">No documents analyzed yet</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Upload an RFP, circular, job notice, or spreadsheet to begin structured analysis.
                </p>
              </div>
              <button
                onClick={() => onStartAnalysis()}
                className="px-4 py-2 rounded-lg bg-[#E5C158] text-black font-semibold text-xs hover:bg-[#F3E3AD] transition-all inline-flex items-center gap-1.5"
              >
                <span>Analyse Your First Document</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentAnalyses.map(item => (
                <div
                  key={item.id}
                  onClick={() => onOpenAnalysis(item)}
                  className="p-4 rounded-xl bg-[#0E1017] border border-[#252A38] hover:border-[#2F3E54] hover:bg-[#121824] cursor-pointer transition-all space-y-2 group"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-mono uppercase bg-[#1A1E2B] text-[#E5C158] border border-[#E5C158]/20 px-2 py-0.5 rounded">
                        {item.category.replace("_", " ")}
                      </span>
                      <h4 className="text-sm font-bold text-white group-hover:text-[#E5C158] transition-colors truncate">
                        {item.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-mono text-emerald-400">
                        {item.readinessScore ? `${item.readinessScore.score}% Ready` : "Analyzed"}
                      </span>
                      <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-[#E5C158] group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-1 leading-relaxed">
                    {item.executiveSummary}
                  </p>

                  <div className="flex items-center gap-4 text-[11px] font-mono text-slate-500 pt-1 border-t border-[#192230]">
                    <span>{item.requirements.length} Requirements</span>
                    <span>·</span>
                    <span>{item.actionPlan.length} Checklist Items</span>
                    <span>·</span>
                    <span>{item.importantDates.length} Dates Identified</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Quick Status & Urgency Modules */}
        <div className="space-y-6">
          {/* Upcoming Deadlines Widget */}
          <div className="p-5 rounded-2xl bg-[#0E1017] border border-[#252A38] space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-['Space_Grotesk'] text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="h-4 w-4 text-amber-400" />
                <span>Upcoming Deadlines</span>
              </h4>
              <button
                onClick={() => onNavigate("deadlines")}
                className="text-[11px] text-[#E5C158] hover:underline"
              >
                Calendar →
              </button>
            </div>

            {allUpcomingDeadlines.length === 0 ? (
              <p className="text-xs text-slate-500 py-3">No active upcoming deadlines tracked.</p>
            ) : (
              <div className="space-y-2">
                {allUpcomingDeadlines.map((dl, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-[#141822] border border-[#1E2838] space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200 truncate">{dl.label}</span>
                      <span
                        className={`font-mono text-[11px] ${
                          (dl.daysRemaining || 99) <= 7 ? "text-amber-400 font-bold" : "text-emerald-400"
                        }`}
                      >
                        {dl.daysRemaining}d left
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono truncate">{dl.docTitle}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Evidence Vault & Profile Completeness */}
          <div className="p-5 rounded-2xl bg-[#0E1017] border border-[#252A38] space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-['Space_Grotesk'] text-sm font-bold text-white flex items-center gap-2">
                <Archive className="h-4 w-4 text-sky-400" />
                <span>Evidence Vault</span>
              </h4>
              <button
                onClick={() => onNavigate("vault")}
                className="text-[11px] text-sky-400 hover:underline"
              >
                Manage →
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Profile Completeness</span>
                <span className="text-[#E5C158] font-bold">{profileScore}%</span>
              </div>
              <div className="h-1.5 w-full bg-[#182230] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-400 to-[#E5C158]"
                  style={{ width: `${profileScore}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 pt-1">
                {vaultDocCount} evidence files stored in your vault for Have vs Missing requirement matching.
              </p>
            </div>
          </div>

          {/* AI Connection Status Widget */}
          <div className="p-5 rounded-2xl bg-[#0E1017] border border-[#252A38] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#E5C158]" />
                <h4 className="font-['Space_Grotesk'] text-sm font-bold text-white">AI Provider Layer</h4>
              </div>
              <span
                className={`h-2 w-2 rounded-full ${
                  isAiConnected ? "bg-emerald-400" : "bg-slate-600"
                }`}
              />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isAiConnected
                ? "Connected to OpenRouter / Gemini. AI reasoning active on sanitized copy."
                : "Offline mode active. Deterministic engine handles 100% of extraction, dates, and checklists."}
            </p>
            <button
              onClick={() => onNavigate("settings_ai")}
              className="text-xs font-semibold text-[#E5C158] hover:underline block pt-1"
            >
              Configure Models & BYOK Vault →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
