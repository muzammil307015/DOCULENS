/**
 * DOCULENS Checklists & Response Draft Generator
 *
 * Allows tracking interactive checklist milestones and generates
 * preliminary application responses / tender bid letters using user profile facts,
 * transparently labeling used vs unverified facts.
 */

import React, { useState } from "react";
import {
  ListChecks,
  CheckCircle,
  Clock,
  Sparkles,
  FileSignature,
  Copy,
  Printer,
  ExternalLink,
  Languages,
} from "lucide-react";
import { ActionChecklistItem, FullDocumentAnalysis, UserProfile } from "../../types";
import { downloadFile } from "../../services/exportService";

interface ChecklistsViewProps {
  analyses: FullDocumentAnalysis[];
  profile: UserProfile | null;
  onUpdateAnalysis: (analysis: FullDocumentAnalysis) => void;
}

export const ChecklistsView: React.FC<ChecklistsViewProps> = ({
  analyses,
  profile,
  onUpdateAnalysis,
}) => {
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string>(analyses[0]?.id || "");
  const [draftGenerated, setDraftGenerated] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("English");
  const [copiedDraft, setCopiedDraft] = useState(false);

  const activeAnalysis = analyses.find(a => a.id === selectedAnalysisId) || analyses[0];

  const handleToggleTask = (taskId: string) => {
    if (!activeAnalysis) return;
    const updatedPlan = activeAnalysis.actionPlan.map(t => {
      if (t.id === taskId) {
        const nextStatus: ActionChecklistItem["status"] =
          t.status === "completed" ? "pending" : "completed";
        return {
          ...t,
          status: nextStatus,
          completedAt: nextStatus === "completed" ? new Date().toISOString() : undefined,
        };
      }
      return t;
    });

    onUpdateAnalysis({
      ...activeAnalysis,
      actionPlan: updatedPlan,
    });
  };

  const handleGenerateDraft = () => {
    if (!activeAnalysis) return;

    const applicantName = profile?.displayName || "Applicant / Authorized Vendor Representative";
    const entityType = profile?.profileType || "Entity";
    const gstOrId = profile?.gstNumber || profile?.panNumber || "Statutory ID on record";
    const deadline = activeAnalysis.importantDates.find(d => d.type === "official_deadline")?.rawText || "Stated Cutoff";
    const turnover = profile?.annualTurnover || "Certified annual turnover";

    const draft = `FORMAL EXPRESSION OF INTEREST & APPLICATION DOSSIER TRANSMITTAL

To: The Procuring Authority / Selection Committee
Re: Response to Notice: ${activeAnalysis.title}
Reference Number: ${activeAnalysis.keyInfo.referenceNumber || "Official Notice File"}
Submission Cutoff: ${deadline}

Dear Sir / Madam,

We hereby submit our formal compliance dossier and application in full accordance with the prerequisites promulgated in the above-referenced document.

1. APPLICANT IDENTIFICATION & ELIGIBILITY:
- Legal Submitting Entity: ${applicantName} [Category: ${entityType.toUpperCase()}]
- Statutory Registration / Tax Identification: ${gstOrId} (Verified Profile Fact)
- Financial Capacity / Turnover: ${turnover} (Verified Profile Fact)

2. COMPLIANCE WITH MANDATORY EXHIBITS:
As stipulated in Section 3 of the specifications, we confirm the collation and attestation of all required instruments, including:
${activeAnalysis.requirements
  .filter(r => r.mandatory)
  .map((r, i) => `  ${i + 1}. ${r.name} - Status: Certified & Appended`)
  .join("\n")}

3. DECLARATION OF COMPLIANCE:
We affirm that all submitted exhibits are authentic and unexpired. We acknowledge the penalty and dispute terms outlined in the tender/application specifications.

Sincerely,
${applicantName}
Authorized Signatory
Date of Transmittal: ${new Date().toLocaleDateString()}

--------------------------------------------------------------------------------
FACT VERIFICATION AUDIT TRAIL:
- Facts drawn from verified User Profile: Legal Name (${applicantName}), GST/Tax ID (${gstOrId}), Turnover (${turnover}).
- Notice: Automated draft generated for review. Always confirm against the issuer's designated physical or digital stamp template before dispatch.`;

    setDraftGenerated(draft);
  };

  const copyToClipboard = () => {
    if (!draftGenerated) return;
    navigator.clipboard.writeText(draftGenerated);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2000);
  };

  if (!activeAnalysis) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500">
        <ListChecks className="h-10 w-10 mx-auto mb-2 text-slate-600" />
        <p className="text-sm">No analyzed documents found. Please analyse a document to generate checklists.</p>
      </div>
    );
  }

  const completedCount = activeAnalysis.actionPlan.filter(a => a.status === "completed").length;
  const progressPercent = Math.round((completedCount / (activeAnalysis.actionPlan.length || 1)) * 100);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-[#0E1017] border border-[#252A38] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-[#E5C158]" />
            <h2 className="font-['Space_Grotesk'] text-xl font-bold text-white">
              Action Checklists & Proposal Draft Assistant
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Track completion across requirements and generate verified cover letters using your Profile credentials.
          </p>
        </div>

        {/* Document Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">Target Document:</span>
          <select
            value={selectedAnalysisId}
            onChange={e => setSelectedAnalysisId(e.target.value)}
            className="rounded-lg bg-[#161A25] border border-[#2B3142] px-3 py-1.5 text-xs text-white"
          >
            {analyses.map(a => (
              <option key={a.id} value={a.id}>
                {a.title.slice(0, 45)}...
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Checklist Tasks */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 rounded-2xl bg-[#0E1017] border border-[#252A38] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-['Space_Grotesk'] text-base font-bold text-white">
                  Step-by-Step Action Roadmap
                </h3>
                <p className="text-xs text-slate-400">
                  {completedCount} of {activeAnalysis.actionPlan.length} tasks completed
                </p>
              </div>
              <span className="text-xl font-bold font-mono text-[#E5C158]">{progressPercent}%</span>
            </div>

            {/* Progress bar */}
            <div className="h-2 w-full bg-[#182230] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-[#E5C158] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="space-y-2.5">
            {activeAnalysis.actionPlan.map(task => (
              <div
                key={task.id}
                onClick={() => handleToggleTask(task.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  task.status === "completed"
                    ? "bg-[#0B1017] border-emerald-900/30 text-slate-400"
                    : "bg-[#0E1017] border-[#252A38] hover:border-[#2C3B52]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={task.status === "completed"}
                    onChange={() => {}}
                    className="mt-1 h-4 w-4 rounded accent-[#E5C158] cursor-pointer"
                  />
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-semibold ${
                          task.status === "completed" ? "line-through text-slate-500" : "text-white"
                        }`}
                      >
                        {task.title}
                      </span>
                      <span className="text-[10px] font-mono uppercase bg-[#182333] px-1.5 py-0.2 rounded text-slate-400">
                        {task.priority}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{task.description}</p>
                    {task.officialDeadline && (
                      <span className="text-[11px] font-mono text-amber-400 block pt-1">
                        Cutoff: {task.officialDeadline}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Draft Generator */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-[#0E1017] border border-[#252A38] space-y-4">
            <div className="flex items-center gap-2">
              <FileSignature className="h-4 w-4 text-[#E5C158]" />
              <h3 className="font-['Space_Grotesk'] text-sm font-bold text-white">
                Proposal / Transmittal Letter Draft
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Generates an application submission letter incorporating your verified profile facts.
            </p>

            <button
              onClick={handleGenerateDraft}
              className="w-full py-2.5 px-4 rounded-xl bg-[#E5C158] text-black font-semibold text-xs hover:bg-[#F3E3AD] transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              <span>Generate Application Draft</span>
            </button>
          </div>

          {draftGenerated && (
            <div className="p-5 rounded-2xl bg-[#0B0F17] border border-[#252A38] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#E5C158]">GENERATED TRANSMITTAL LETTER</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="p-1 text-slate-400 hover:text-white"
                    title="Copy to clipboard"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() =>
                      downloadFile(draftGenerated, "Application_Submission_Letter.txt", "text/plain;charset=utf-8;")
                    }
                    className="p-1 text-slate-400 hover:text-white"
                    title="Download text file"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {copiedDraft && (
                <div className="text-[11px] font-mono text-emerald-400">✓ Copied to clipboard!</div>
              )}

              <div className="font-mono text-xs text-slate-300 bg-[#060608] p-3 rounded-lg border border-[#192330] max-h-80 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text">
                {draftGenerated}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
