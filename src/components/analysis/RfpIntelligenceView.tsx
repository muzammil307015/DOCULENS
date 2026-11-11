/**
 * DOCULENS Dedicated RFP & Tender Intelligence Workbench
 *
 * Implements the 14 comprehensive procurement sections required by Phase 4 & Phase 5:
 * 1. Solicitation Snapshot
 * 2. Executive Opportunity Summary
 * 3. Complete Solicitation Schedule & Milestones
 * 4. Scope of Work & Deliverables
 * 5. Eligibility & Minimum Qualifications
 * 6. Mandatory Response Checklist
 * 7. Key Personnel & Staffing (8 Named Roles)
 * 8. Commercial & Financial Terms ($0 MSA Caveat, Rate Cards, 10% Holdback)
 * 9. Evaluation Criteria & Scoring Matrix (600 Tech / 250 Fee, Formula, 650 Min)
 * 10. Contractual & Compliance Obligations (Work Made for Hire, Liability, Indemnification)
 * 11. Risks & Red Flags (108 vs 180 Day Discrepancy, Historical Lapsed, $0 MSA)
 * 12. Missing & Ambiguous Information ("Not specified in this document", Missing Attachment B)
 * 13. Questions & Answers / FAQ Archive
 * 14. Bidder Recommendations & Win Strategy
 *
 * Plus interactive "View Source" inspection for every single fact.
 */

import React, { useState, useRef } from "react";
import {
  FileText,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building,
  Users,
  Award,
  Scale,
  HelpCircle,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  BookOpen,
  Info,
  Check,
  ListChecks,
  AlertCircle,
  Eye,
  FileCheck,
} from "lucide-react";
import { RfpIntelligenceData, SourceLocation } from "../../types";

interface RfpIntelligenceViewProps {
  rfpData: RfpIntelligenceData;
  documentTitle: string;
  onOpenSourceModal: (source: SourceLocation) => void;
}

export const RfpIntelligenceView: React.FC<RfpIntelligenceViewProps> = ({
  rfpData,
  documentTitle,
  onOpenSourceModal,
}) => {
  const [activeTab, setActiveTab] = useState<string>("snapshot");
  const [checklistCompleted, setChecklistCompleted] = useState<Record<string, boolean>>({});
  const tabScrollRef = useRef<HTMLDivElement | null>(null);

  const scrollTabs = (direction: "left" | "right") => {
    if (!tabScrollRef.current) return;
    tabScrollRef.current.scrollBy({
      left: direction === "left" ? -280 : 280,
      behavior: "smooth",
    });
  };

  const toggleChecklist = (componentName: string) => {
    setChecklistCompleted(prev => ({
      ...prev,
      [componentName]: !prev[componentName],
    }));
  };

  const tabs = [
    { id: "snapshot", label: "1. Snapshot & Status", icon: FileText },
    { id: "opportunity", label: "2. Opportunity Summary", icon: Building },
    { id: "schedule", label: `3. Schedule (${rfpData.schedule.length})`, icon: Calendar },
    { id: "scope", label: `4. Scope of Work (${rfpData.scopeOfWork.length})`, icon: BookOpen },
    { id: "eligibility", label: `5. Eligibility (${rfpData.eligibilityQualifications.length})`, icon: CheckCircle2 },
    { id: "checklist", label: `6. Response Checklist (${rfpData.responseChecklist.length})`, icon: ListChecks },
    { id: "personnel", label: `7. Key Personnel (${rfpData.keyPersonnel.length})`, icon: Users },
    { id: "commercials", label: "8. Commercial Terms", icon: DollarSign },
    { id: "evaluation", label: `9. Evaluation & Scoring (${rfpData.evaluationMatrix.totalPoints} pts)`, icon: Award },
    { id: "compliance", label: `10. Compliance & Legal (${rfpData.complianceObligations.length})`, icon: Scale },
    {
      id: "risks",
      label: `11. Risks & Red Flags (${rfpData.risksAndRedFlags.length})`,
      icon: AlertTriangle,
      badge: rfpData.risksAndRedFlags.some(r => r.severity === "high" || r.severity === "critical") ? "High" : undefined,
    },
    { id: "missing", label: `12. Missing Info (${rfpData.missingInformation.length})`, icon: HelpCircle },
    { id: "qa", label: `13. Q&A / Clarifications (${rfpData.qaItems.length})`, icon: Info },
    { id: "recommendations", label: `14. Win Strategy (${rfpData.bidderRecommendations.length})`, icon: Award },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-[#0E1017] to-sky-950/40 border border-amber-600/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">Dedicated RFP & Tender Intelligence Workbench</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                14 Comprehensive Sections
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Structured extraction tailored to procurement professionals, capture managers, and bid teams.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Opportunity Status:</span>
          <span
            className={`px-2.5 py-1 rounded text-xs font-bold font-mono ${
              rfpData.snapshot.opportunityStatus === "Open"
                ? "bg-emerald-950 text-emerald-300 border border-emerald-600/50"
                : rfpData.snapshot.opportunityStatus === "Closing soon"
                ? "bg-amber-950 text-amber-300 border border-amber-600/50"
                : "bg-rose-950/80 text-rose-300 border border-rose-600/50"
            }`}
          >
            {rfpData.snapshot.opportunityStatus}
          </span>
        </div>
      </div>

      {/* 14-Section Horizontal Tab Navigation with Scroll Arrow Controls */}
      <div className="relative flex items-center gap-1.5 border-b border-[#252A38] pb-2">
        <button
          type="button"
          onClick={() => scrollTabs("left")}
          className="shrink-0 p-2 rounded-lg bg-[#0E1017] hover:bg-[#1A1E2B] text-slate-300 border border-slate-800 transition-colors"
          title="Scroll tabs left"
          aria-label="Scroll RFP tabs left"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div
          ref={tabScrollRef}
          className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin scroll-smooth flex-1"
        >
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-amber-500 text-black font-bold shadow-lg shadow-amber-500/10"
                    : "bg-[#0E1017] text-slate-300 hover:text-white hover:bg-[#1A1E2B] border border-slate-800"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] bg-rose-500 text-white font-bold">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => scrollTabs("right")}
          className="shrink-0 p-2 rounded-lg bg-[#0E1017] hover:bg-[#1A1E2B] text-slate-300 border border-slate-800 transition-colors"
          title="Scroll tabs right"
          aria-label="Scroll RFP tabs right"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* TAB CONTENT PANELS */}

      {/* 1. SNAPSHOT */}
      {activeTab === "snapshot" && (
        <div className="p-6 rounded-2xl bg-[#0E1017] border border-[#252A38] space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white font-['Space_Grotesk'] flex items-center gap-2">
              <FileText className="h-5 w-5 text-amber-400" />
              Section 1: Solicitation Snapshot
            </h3>
            <button
              onClick={() => onOpenSourceModal(rfpData.snapshot.sourceCitation)}
              className="px-2.5 py-1 rounded bg-[#1A1E2B] hover:bg-[#202B3D] text-xs font-mono text-amber-300 border border-amber-500/30 flex items-center gap-1.5"
            >
              <Eye className="h-3.5 w-3.5" />
              View Source (Page {rfpData.snapshot.sourceCitation.page || 1})
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#141822] border border-slate-800 space-y-1">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Issuing Authority</span>
              <p className="text-sm font-bold text-white">{rfpData.snapshot.issuingAuthority}</p>
            </div>
            <div className="p-4 rounded-xl bg-[#141822] border border-slate-800 space-y-1">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Solicitation Title</span>
              <p className="text-sm font-bold text-amber-200">{rfpData.snapshot.rfpTitle}</p>
            </div>
            <div className="p-4 rounded-xl bg-[#141822] border border-slate-800 space-y-1">
              <span className="text-[11px] font-mono text-slate-400 uppercase">RFP Reference Number</span>
              <p className="text-sm font-mono font-bold text-sky-300">{rfpData.snapshot.rfpNumber}</p>
            </div>
            <div className="p-4 rounded-xl bg-[#141822] border border-slate-800 space-y-1">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Publication Date</span>
              <p className="text-sm font-medium text-slate-200">{rfpData.snapshot.publicationDate}</p>
            </div>
            <div className="p-4 rounded-xl bg-[#141822] border border-slate-800 space-y-1">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Proposal Submission Deadline</span>
              <p className="text-sm font-bold text-rose-300">{rfpData.snapshot.proposalDeadline}</p>
            </div>
            <div className="p-4 rounded-xl bg-[#141822] border border-slate-800 space-y-1">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Contract Type</span>
              <p className="text-sm font-medium text-purple-200">{rfpData.snapshot.contractType}</p>
            </div>
            <div className="p-4 rounded-xl bg-[#141822] border border-slate-800 space-y-1">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Contract Term</span>
              <p className="text-sm font-medium text-slate-200">{rfpData.snapshot.contractTerm}</p>
            </div>
            <div className="p-4 rounded-xl bg-[#141822] border border-slate-800 space-y-1 lg:col-span-2">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Submission Channel & Address</span>
              <p className="text-xs font-mono text-emerald-300">{rfpData.snapshot.submissionChannel}</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. OPPORTUNITY SUMMARY */}
      {activeTab === "opportunity" && (
        <div className="p-6 rounded-2xl bg-[#0E1017] border border-[#252A38] space-y-6">
          <h3 className="text-lg font-bold text-white font-['Space_Grotesk'] flex items-center gap-2">
            <Building className="h-5 w-5 text-amber-400" />
            Section 2: Executive Opportunity Summary
          </h3>

          <div className="p-4 rounded-xl bg-sky-950/20 border border-sky-800/40 text-sm text-slate-200 leading-relaxed space-y-2">
            <span className="font-mono text-xs text-sky-400 font-bold uppercase tracking-wider block">
              Plain Language Procurement Summary
            </span>
            <p>{rfpData.opportunitySummary.plainLanguageSummary}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#141822] border border-slate-800 space-y-2">
              <span className="text-xs font-mono text-slate-400 uppercase block">Primary Objectives</span>
              <p className="text-sm text-slate-200">{rfpData.opportunitySummary.primaryObjective}</p>
            </div>

            <div className="p-4 rounded-xl bg-[#141822] border border-slate-800 space-y-2">
              <span className="text-xs font-mono text-slate-400 uppercase block">Procurement Structure</span>
              <p className="text-sm text-amber-200 font-medium">{rfpData.opportunitySummary.procurementStructure}</p>
              <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-600/30 text-xs text-amber-300">
                <strong>Work Guarantee Caveat:</strong> {rfpData.opportunitySummary.guaranteedWorkCaveat}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#141822] border border-slate-800 space-y-3">
            <span className="text-xs font-mono text-slate-400 uppercase block">Requested Core Services & Workstreams</span>
            <ul className="space-y-2">
              {rfpData.opportunitySummary.requestedServices.map((srv, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{srv}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* 3. SOLICITATION SCHEDULE */}
      {activeTab === "schedule" && (
        <div className="p-6 rounded-2xl bg-[#0E1017] border border-[#252A38] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white font-['Space_Grotesk'] flex items-center gap-2">
              <Calendar className="h-5 w-5 text-amber-400" />
              Section 3: Complete Solicitation Schedule & Milestones
            </h3>
            <span className="text-xs font-mono text-slate-400">All dates checked against calendar (2026-11-09)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#252A38] text-slate-400 font-mono">
                  <th className="py-2.5 px-3">Event Milestone</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Time & Zone</th>
                  <th className="py-2.5 px-3">Nature</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1E2B]">
                {rfpData.schedule.map((item, i) => (
                  <tr key={i} className="hover:bg-[#141822]">
                    <td className="py-3 px-3 font-medium text-white">{item.event}</td>
                    <td className="py-3 px-3 font-mono text-amber-300 font-bold">{item.date}</td>
                    <td className="py-3 px-3 text-slate-300">
                      {item.time ? `${item.time} ${item.timezone || ""}` : "Not specified"}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          item.nature === "Mandatory"
                            ? "bg-rose-950 text-rose-300 border border-rose-800"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {item.nature}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-slate-400 border border-slate-700">
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() =>
                          onOpenSourceModal({
                            page: item.page,
                            section: item.event,
                            snippet: item.snippet,
                          })
                        }
                        className="text-amber-400 hover:text-amber-300 font-mono text-[11px] underline"
                      >
                        P.{item.page}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. SCOPE OF WORK */}
      {activeTab === "scope" && (
        <div className="p-6 rounded-2xl bg-[#0E1017] border border-[#252A38] space-y-4">
          <h3 className="text-lg font-bold text-white font-['Space_Grotesk'] flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-amber-400" />
            Section 4: Scope of Work & Deliverables
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rfpData.scopeOfWork.map((item, i) => (
              <div key={i} className="p-4 rounded-xl bg-[#141822] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-sky-950 text-sky-300 border border-sky-800">
                    {item.category}
                  </span>
                  <button
                    onClick={() =>
                      onOpenSourceModal({
                        page: item.page,
                        section: item.title,
                        snippet: item.snippet,
                      })
                    }
                    className="text-xs font-mono text-amber-400 hover:underline"
                  >
                    Source P.{item.page}
                  </button>
                </div>
                <h4 className="text-sm font-bold text-white">{item.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. ELIGIBILITY & MINIMUM QUALIFICATIONS */}
      {activeTab === "eligibility" && (
        <div className="p-6 rounded-2xl bg-[#0E1017] border border-[#252A38] space-y-4">
          <h3 className="text-lg font-bold text-white font-['Space_Grotesk'] flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-amber-400" />
            Section 5: Eligibility & Minimum Qualifications (Pass / Fail Criteria)
          </h3>

          <div className="space-y-3">
            {rfpData.eligibilityQualifications.map((elig, i) => (
              <div key={i} className="p-4 rounded-xl bg-[#141822] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-rose-950 text-rose-300 border border-rose-800 font-bold">
                      {elig.passFail ? "Mandatory Pass/Fail" : "Evaluation Criterion"}
                    </span>
                    <h4 className="text-sm font-bold text-white">{elig.requirement}</h4>
                  </div>
                  <button
                    onClick={() =>
                      onOpenSourceModal({
                        page: elig.page,
                        section: elig.requirement,
                        snippet: elig.snippet,
                      })
                    }
                    className="text-xs font-mono text-amber-400 hover:underline"
                  >
                    Source P.{elig.page}
                  </button>
                </div>
                <p className="text-xs text-slate-300">{elig.explanation}</p>
                <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 bg-black/30 p-2 rounded">
                  <strong className="text-amber-300">Required Proof:</strong> {elig.evidenceNeeded}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. MANDATORY RESPONSE CHECKLIST */}
      {activeTab === "checklist" && (
        <div className="p-6 rounded-2xl bg-[#0E1017] border border-[#252A38] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white font-['Space_Grotesk'] flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-amber-400" />
              Section 6: Mandatory Response Checklist & Submission Order
            </h3>
            <span className="text-xs font-mono text-slate-400">
              Completed: {Object.values(checklistCompleted).filter(Boolean).length} / {rfpData.responseChecklist.length}
            </span>
          </div>

          <div className="space-y-2">
            {rfpData.responseChecklist.map((item, i) => {
              const isDone = !!checklistCompleted[item.component];
              return (
                <div
                  key={i}
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                    isDone
                      ? "bg-emerald-950/20 border-emerald-800/40 text-slate-400"
                      : "bg-[#141822] border-slate-800 text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleChecklist(item.component)}
                      className={`h-5 w-5 rounded border flex items-center justify-center transition-all ${
                        isDone
                          ? "bg-emerald-500 border-emerald-400 text-black"
                          : "border-slate-600 hover:border-amber-400"
                      }`}
                    >
                      {isDone && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${isDone ? "line-through text-slate-500" : "text-white"}`}>
                          {item.component}
                        </span>
                        {item.maxPages && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                            {item.maxPages}
                          </span>
                        )}
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-950 text-purple-300">
                          {item.format}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      onOpenSourceModal({
                        page: item.page,
                        section: item.component,
                        snippet: item.snippet,
                      })
                    }
                    className="text-xs font-mono text-amber-400 hover:underline shrink-0"
                  >
                    P.{item.page}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 7. KEY PERSONNEL */}
      {activeTab === "personnel" && (
        <div className="p-6 rounded-2xl bg-[#0E1017] border border-[#252A38] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white font-['Space_Grotesk'] flex items-center gap-2">
              <Users className="h-5 w-5 text-amber-400" />
              Section 7: Key Personnel & Staffing (8 Named Roles Required)
            </h3>
            <span className="text-xs font-mono text-slate-400">Strict substitution rules apply</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rfpData.keyPersonnel.map((role, i) => (
              <div key={i} className="p-4 rounded-xl bg-[#141822] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-amber-400 font-bold uppercase">Role #{i + 1}</span>
                  <button
                    onClick={() =>
                      onOpenSourceModal({
                        page: role.page,
                        section: role.roleTitle,
                        snippet: role.snippet,
                      })
                    }
                    className="text-xs font-mono text-amber-400 hover:underline"
                  >
                    Source P.{role.page}
                  </button>
                </div>
                <h4 className="text-base font-bold text-white">{role.roleTitle}</h4>
                <div className="space-y-1 text-xs text-slate-300">
                  <p>
                    <strong className="text-slate-400 font-mono">Min Experience:</strong>{" "}
                    {role.minExperienceYears} Years
                  </p>
                  <p>
                    <strong className="text-slate-400 font-mono">Required Qualifications:</strong>{" "}
                    {role.requiredQualifications}
                  </p>
                  {role.certifications && (
                    <p>
                      <strong className="text-slate-400 font-mono">Certifications:</strong>{" "}
                      <span className="text-sky-300 font-mono">{role.certifications}</span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. COMMERCIAL TERMS */}
      {activeTab === "commercials" && (
        <div className="p-6 rounded-2xl bg-[#0E1017] border border-[#252A38] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white font-['Space_Grotesk'] flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-amber-400" />
              Section 8: Commercial & Financial Terms
            </h3>
            <button
              onClick={() =>
                onOpenSourceModal({
                  page: rfpData.commercials.page,
                  section: "Commercial Terms",
                  snippet: rfpData.commercials.snippet,
                })
              }
              className="text-xs font-mono text-amber-400 hover:underline"
            >
              Source P.{rfpData.commercials.page}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#141822] border border-slate-800 space-y-1">
              <span className="text-xs font-mono text-slate-400 uppercase">Contract Ceiling / Value Baseline</span>
              <p className="text-base font-bold text-amber-300">{rfpData.commercials.contractValue}</p>
            </div>
            <div className="p-4 rounded-xl bg-[#141822] border border-slate-800 space-y-1">
              <span className="text-xs font-mono text-slate-400 uppercase">Hourly Rate Requirements</span>
              <p className="text-sm text-slate-200">{rfpData.commercials.hourlyRateRequirement}</p>
            </div>
            <div className="p-4 rounded-xl bg-[#141822] border border-slate-800 space-y-1">
              <span className="text-xs font-mono text-slate-400 uppercase">Performance Holdback / Retainage</span>
              <p className="text-sm font-bold text-rose-300">{rfpData.commercials.retainageHoldback}</p>
            </div>
            <div className="p-4 rounded-xl bg-[#141822] border border-slate-800 space-y-1">
              <span className="text-xs font-mono text-slate-400 uppercase">Payment Terms & Currencies</span>
              <p className="text-sm text-slate-200">
                {rfpData.commercials.paymentTerms} ({rfpData.commercials.taxesAndCurrency})
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 9. EVALUATION & SCORING */}
      {activeTab === "evaluation" && (
        <div className="p-6 rounded-2xl bg-[#0E1017] border border-[#252A38] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white font-['Space_Grotesk'] flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-400" />
              Section 9: Evaluation Criteria & Scoring Matrix
            </h3>
            <span className="text-xs font-mono text-amber-400">Total Available: {rfpData.evaluationMatrix.totalPoints} Points</span>
          </div>

          <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-800/40 text-xs text-purple-200 space-y-1">
            <strong>Fee Scoring Mathematical Formula:</strong>
            <p className="font-mono text-white text-sm">{rfpData.evaluationMatrix.feeScoringFormula}</p>
            <p className="text-slate-400 mt-1">{rfpData.evaluationMatrix.notes}</p>
          </div>

          <div className="space-y-3">
            {rfpData.evaluationMatrix.categories.map((cat, i) => (
              <div key={i} className="p-4 rounded-xl bg-[#141822] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">{cat.category}</h4>
                  <span className="text-sm font-mono font-bold text-amber-400">{cat.maxPoints} Points</span>
                </div>
                <p className="text-xs text-slate-400">{cat.description}</p>
                {cat.subcategories && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                    {cat.subcategories.map((sub, j) => (
                      <div key={j} className="flex items-center justify-between text-xs text-slate-300 p-1.5 rounded bg-black/20">
                        <span>{sub.name}</span>
                        <span className="font-mono text-amber-300 font-bold">{sub.points} pts</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 10. COMPLIANCE & LEGAL */}
      {activeTab === "compliance" && (
        <div className="p-6 rounded-2xl bg-[#0E1017] border border-[#252A38] space-y-4">
          <h3 className="text-lg font-bold text-white font-['Space_Grotesk'] flex items-center gap-2">
            <Scale className="h-5 w-5 text-amber-400" />
            Section 10: Contractual & Compliance Obligations
          </h3>

          <div className="space-y-3">
            {rfpData.complianceObligations.map((comp, i) => (
              <div key={i} className="p-4 rounded-xl bg-[#141822] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-purple-950 text-purple-300 border border-purple-800 font-bold">
                      {comp.topic}
                    </span>
                    <span className="text-xs font-mono text-slate-400">{comp.clause}</span>
                  </div>
                  <button
                    onClick={() =>
                      onOpenSourceModal({
                        page: comp.page,
                        section: comp.topic,
                        snippet: comp.snippet,
                      })
                    }
                    className="text-xs font-mono text-amber-400 hover:underline"
                  >
                    Source P.{comp.page}
                  </button>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">{comp.summary}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 11. RISKS & RED FLAGS */}
      {activeTab === "risks" && (
        <div className="p-6 rounded-2xl bg-[#0E1017] border border-[#252A38] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white font-['Space_Grotesk'] flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              Section 11: Risks, Red Flags & Procurement Anomalies
            </h3>
            <span className="text-xs font-mono text-slate-400">Automated Risk Auditing</span>
          </div>

          <div className="space-y-3">
            {rfpData.risksAndRedFlags.map(risk => (
              <div
                key={risk.id}
                className={`p-4 rounded-xl border space-y-2 ${
                  risk.severity === "critical"
                    ? "bg-rose-950/20 border-rose-600/50"
                    : risk.severity === "high"
                    ? "bg-amber-950/20 border-amber-600/50"
                    : "bg-[#141822] border-slate-800"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                        risk.severity === "critical" || risk.severity === "high"
                          ? "bg-rose-900 text-rose-200"
                          : "bg-amber-900 text-amber-200"
                      }`}
                    >
                      {risk.severity} Severity
                    </span>
                    <h4 className="text-sm font-bold text-white">{risk.title}</h4>
                  </div>
                  <button
                    onClick={() =>
                      onOpenSourceModal({
                        page: risk.page,
                        section: risk.title,
                        snippet: risk.snippet,
                      })
                    }
                    className="text-xs font-mono text-amber-400 hover:underline"
                  >
                    Source P.{risk.page}
                  </button>
                </div>
                <p className="text-xs text-slate-300">{risk.reason}</p>
                <div className="text-xs text-amber-300 font-mono bg-black/30 p-2 rounded">
                  <strong>Recommended Action:</strong> {risk.recommendation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 12. MISSING INFORMATION */}
      {activeTab === "missing" && (
        <div className="p-6 rounded-2xl bg-[#0E1017] border border-[#252A38] space-y-4">
          <h3 className="text-lg font-bold text-white font-['Space_Grotesk'] flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-amber-400" />
            Section 12: Missing & Ambiguous Information (Explicitly Checked)
          </h3>
          <p className="text-xs text-slate-400">
            DOCULENS explicitly flags missing specifications rather than making assumptions or hallucinating details.
          </p>

          <div className="space-y-3">
            {rfpData.missingInformation.map((item, i) => (
              <div key={i} className="p-4 rounded-xl bg-[#141822] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-950 text-amber-300 border border-amber-800">
                    {item.status}
                  </span>
                  <span className="text-xs font-mono text-slate-400">{item.category}</span>
                </div>
                <h4 className="text-sm font-bold text-white">{item.item}</h4>
                <div className="text-xs text-slate-300 space-y-1">
                  <p>
                    <strong className="text-slate-400">Impact on Bidding:</strong> {item.impact}
                  </p>
                  <p>
                    <strong className="text-slate-400">Recommendation:</strong> {item.recommendation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 13. QUESTIONS & ANSWERS */}
      {activeTab === "qa" && (
        <div className="p-6 rounded-2xl bg-[#0E1017] border border-[#252A38] space-y-4">
          <h3 className="text-lg font-bold text-white font-['Space_Grotesk'] flex items-center gap-2">
            <Info className="h-5 w-5 text-amber-400" />
            Section 13: Questions, Answers & Clarifications
          </h3>

          <div className="space-y-3">
            {rfpData.qaItems.length === 0 ? (
              <p className="text-xs text-slate-400">No official Q&A addenda embedded in this document.</p>
            ) : (
              rfpData.qaItems.map(item => (
                <div key={item.number} className="p-4 rounded-xl bg-[#141822] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-amber-400 font-bold uppercase">
                      Inquiry #{item.number}
                    </span>
                    <button
                      onClick={() =>
                        onOpenSourceModal({
                          page: item.page,
                          section: `Q&A #${item.number}`,
                          snippet: item.answer,
                        })
                      }
                      className="text-xs font-mono text-amber-400 hover:underline"
                    >
                      P.{item.page}
                    </button>
                  </div>
                  <h4 className="text-sm font-bold text-white">{item.question}</h4>
                  <div className="p-3 rounded-lg bg-black/30 border border-slate-800 text-xs text-slate-300">
                    <strong className="text-emerald-400">Official Clarification:</strong> {item.answer}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 14. BIDDER RECOMMENDATIONS & WIN STRATEGY */}
      {activeTab === "recommendations" && (
        <div className="p-6 rounded-2xl bg-[#0E1017] border border-[#252A38] space-y-4">
          <h3 className="text-lg font-bold text-white font-['Space_Grotesk'] flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-400" />
            Section 14: Bidder Recommendations & Win Strategy
          </h3>

          <div className="space-y-3">
            {rfpData.bidderRecommendations.map((rec, i) => (
              <div key={i} className="p-4 rounded-xl bg-[#141822] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                        rec.priority === "High"
                          ? "bg-rose-950 text-rose-300 border border-rose-800"
                          : "bg-amber-950 text-amber-300 border border-amber-800"
                      }`}
                    >
                      {rec.priority} Priority
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
                      {rec.sourceOrigin}
                    </span>
                  </div>
                </div>
                <h4 className="text-sm font-bold text-white">{rec.step}</h4>
                <p className="text-xs text-slate-300">{rec.action}</p>
                <div className="text-xs text-sky-300 font-mono bg-black/30 p-2 rounded">
                  <strong>Strategic Rationale:</strong> {rec.rationale}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
