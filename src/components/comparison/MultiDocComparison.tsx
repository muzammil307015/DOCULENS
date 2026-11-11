/**
 * DOCULENS Multi-Document Cross-Comparison
 * Compares 2-3 tenders, scholarships, contracts, or policies side by side:
 * - Common mandatory requirements
 * - Differing financial & eligibility clauses
 * - Comparative submission deadlines
 * - Combined actionable checklist
 */

import React, { useState } from "react";
import {
  Layers,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Calendar,
  DollarSign,
  Scale,
  ListChecks,
} from "lucide-react";
import { FullDocumentAnalysis } from "../../types";
import { compareMultipleDocuments } from "../../services/comparisonEngine";

interface MultiDocComparisonProps {
  availableAnalyses: FullDocumentAnalysis[];
  onOpenAnalysis: (analysis: FullDocumentAnalysis) => void;
}

export const MultiDocComparison: React.FC<MultiDocComparisonProps> = ({
  availableAnalyses,
  onOpenAnalysis,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    availableAnalyses.slice(0, 2).map(a => a.id)
  );

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      } else {
        if (prev.length >= 3) return [...prev.slice(1), id];
        return [...prev, id];
      }
    });
  };

  const selectedAnalyses = availableAnalyses.filter(a => selectedIds.includes(a.id));
  const comparison = compareMultipleDocuments(selectedAnalyses);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-[#0E1017] border border-[#252A38] space-y-2">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-[#E5C158]" />
          <h2 className="font-['Space_Grotesk'] text-xl font-bold text-white">
            Multi-Document Intelligence Comparison
          </h2>
        </div>
        <p className="text-xs text-slate-400">
          Select 2 or 3 analyzed documents to compare common requirements, conflicting conditions, differing payment terms, and compile a merged submission checklist.
        </p>
      </div>

      {/* Document Selector Pills */}
      <div className="p-4 rounded-xl bg-[#08090D] border border-[#252A38] space-y-2">
        <span className="text-xs font-mono uppercase text-slate-400 block">
          Select Documents To Compare (Max 3):
        </span>
        <div className="flex flex-wrap gap-2">
          {availableAnalyses.map(a => {
            const isSelected = selectedIds.includes(a.id);
            return (
              <button
                key={a.id}
                onClick={() => toggleSelect(a.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? "bg-[#E5C158] text-black font-semibold"
                    : "bg-[#161A25] text-slate-300 border border-[#2B3142] hover:bg-[#1A2332]"
                }`}
              >
                {a.title}
              </button>
            );
          })}
        </div>
      </div>

      {selectedAnalyses.length < 2 ? (
        <div className="p-12 text-center text-slate-500 rounded-xl bg-[#0E1017] border border-dashed border-[#252A38]">
          <Layers className="h-10 w-10 mx-auto mb-3 text-slate-600" />
          <p className="text-sm">Please select at least two documents from the list above to view cross-comparison.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Side-by-Side Metadata Headers */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedAnalyses.map(a => (
              <div key={a.id} className="p-4 rounded-xl bg-[#0E1017] border border-[#252A38] space-y-2">
                <span className="text-[10px] font-mono uppercase bg-[#182333] text-[#E5C158] px-2 py-0.5 rounded">
                  {a.category.replace("_", " ")}
                </span>
                <h4 className="text-sm font-bold text-white truncate">{a.title}</h4>
                <div className="text-xs text-slate-400 font-mono space-y-1">
                  <div>Authority: {a.keyInfo.issuingOrganisation}</div>
                  <div>Primary Value: {a.financialInformation[0]?.amountText || "N/A"}</div>
                  <div>Mandatory Docs: {a.requirements.filter(r => r.mandatory).length}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Section 1: Deadlines Comparison */}
          <div className="p-5 rounded-xl bg-[#0E1017] border border-[#252A38] space-y-3">
            <h3 className="font-['Space_Grotesk'] text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="h-4 w-4 text-amber-400" />
              <span>Comparative Deadlines & Urgency</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {comparison.deadlinesComparison.map((dl, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-[#141822] border border-[#252A38] space-y-1">
                  <div className="text-xs font-semibold text-slate-200 truncate">{dl.docTitle}</div>
                  <div className="text-sm font-mono font-bold text-[#E5C158]">{dl.deadline}</div>
                  {dl.daysRemaining !== undefined && (
                    <div className="text-[11px] font-mono text-emerald-400">
                      {dl.daysRemaining} days remaining
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Differing Clauses Matrix */}
          <div className="p-5 rounded-xl bg-[#0E1017] border border-[#252A38] space-y-3">
            <h3 className="font-['Space_Grotesk'] text-sm font-bold text-white flex items-center gap-2">
              <Scale className="h-4 w-4 text-[#E5C158]" />
              <span>Differing Conditions Matrix</span>
            </h3>

            <div className="space-y-2">
              {comparison.differingClauses.map((diff, idx) => (
                <div key={idx} className="p-3.5 rounded-lg bg-[#141822] border border-[#252A38] space-y-2">
                  <span className="text-xs font-bold text-slate-200 uppercase font-mono">
                    {diff.clause}
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {diff.values.map((v, vIdx) => (
                      <div key={vIdx} className="p-2 rounded bg-[#08090D] border border-[#1C2636] text-xs">
                        <span className="text-[10px] text-slate-500 font-mono block truncate">
                          {v.docTitle}
                        </span>
                        <span className="text-slate-200 font-medium">{v.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Combined Action Checklist */}
          <div className="p-5 rounded-xl bg-[#0E1017] border border-[#252A38] space-y-3">
            <h3 className="font-['Space_Grotesk'] text-sm font-bold text-white flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-emerald-400" />
              <span>Merged Master Action Checklist Across Selected Documents</span>
            </h3>
            <div className="space-y-2">
              {comparison.combinedChecklist.slice(0, 10).map((task, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-[#141822] border border-[#252A38] flex items-center justify-between gap-3 text-xs"
                >
                  <span className="text-slate-200 font-medium">{task.title}</span>
                  <div className="flex items-center gap-1">
                    {task.sourceDocs.map((doc, dIdx) => (
                      <span
                        key={dIdx}
                        className="text-[10px] font-mono bg-[#1A2332] px-1.5 py-0.5 rounded text-slate-400 truncate max-w-[120px]"
                      >
                        {doc}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
