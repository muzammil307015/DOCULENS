/**
 * DOCULENS Redaction & Privacy Review Inspector
 *
 * Allows users to inspect deterministically detected sensitive entities,
 * review default visibility states, reveal hidden values only on deliberate action,
 * and confirms that external AI receives ONLY the redacted copy while original files remain untouched.
 */

import React, { useState } from "react";
import {
  Shield,
  Eye,
  EyeOff,
  AlertTriangle,
  Lock,
  CheckCircle,
  HelpCircle,
  FileCheck,
  X,
  CreditCard,
  Phone,
  Home,
  Key,
} from "lucide-react";
import { SensitiveDetection, VisibilityState } from "../../types";

interface RedactionReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  detections: SensitiveDetection[];
  onUpdateDetection: (id: string, newVisibility: VisibilityState) => void;
  onConfirmAndProceed: () => void;
}

export const RedactionReviewModal: React.FC<RedactionReviewModalProps> = ({
  isOpen,
  onClose,
  detections,
  onUpdateDetection,
  onConfirmAndProceed,
}) => {
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [filterCategory, setFilterCategory] = useState<string>("all");

  if (!isOpen) return null;

  const toggleRevealDeliberate = (id: string) => {
    setRevealedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const hiddenCount = detections.filter(d => d.visibility === "HIDDEN").length;
  const visibleCount = detections.filter(d => d.visibility === "VISIBLE").length;

  const categories = [
    { id: "all", label: `All Entities (${detections.length})` },
    { id: "HIDDEN", label: `Sanitized / Hidden (${hiddenCount})` },
    { id: "VISIBLE", label: `Public / Visible (${visibleCount})` },
  ];

  const filtered = detections.filter(d => {
    if (filterCategory === "HIDDEN") return d.visibility === "HIDDEN";
    if (filterCategory === "VISIBLE") return d.visibility === "VISIBLE";
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl bg-[#0F141C] border border-[#2B3142] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#252A38] flex items-center justify-between bg-[#121924]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-600/40 text-emerald-400">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-['Space_Grotesk'] text-lg font-bold text-white flex items-center gap-2">
                Privacy Review & Sanitization Engine
              </h3>
              <p className="text-xs text-slate-400">
                Original file stays untouched on client. External AI receives ONLY the redacted copy below.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#1C2534] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Guarantees Banner */}
        <div className="bg-[#08090D] px-5 py-3 border-b border-[#252A38] flex flex-wrap items-center justify-between text-xs text-slate-400 gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#E5C158]"></span>
            <span>Deterministic sensitive entity scan completed</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span className="text-emerald-400">Hidden / Redacted: {hiddenCount}</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-300">Visible by Policy: {visibleCount}</span>
          </div>
        </div>

        {/* Filters */}
        <div className="px-5 py-2.5 bg-[#121924] border-b border-[#252A38] flex items-center gap-2">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                filterCategory === cat.id
                  ? "bg-[#E5C158]/15 text-[#E5C158] border border-[#E5C158]/40"
                  : "text-slate-400 hover:text-slate-200 bg-[#1A1E2B]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Entities List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-emerald-400" />
              <p className="text-sm">No entities matching this filter.</p>
            </div>
          ) : (
            filtered.map(item => {
              const isRevealed = revealedIds.has(item.id);
              const isHidden = item.visibility === "HIDDEN";

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-lg border transition-all ${
                    isHidden
                      ? "bg-[#111722] border-[#222E42]"
                      : "bg-[#161A25] border-slate-700/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-300 capitalize font-mono">
                          {item.category.replace(/([A-Z])/g, " $1")}
                        </span>
                        {item.isLuhnValid && (
                          <span className="text-[10px] bg-amber-950/60 border border-amber-600/40 text-amber-400 px-1.5 py-0.2 rounded font-mono">
                            Luhn Validated Card
                          </span>
                        )}
                        <span className="text-[11px] text-slate-500 font-mono">
                          {item.page ? `Page ${item.page}` : "Extracted Passage"}
                        </span>
                      </div>

                      {/* Value Display */}
                      <div className="flex items-center gap-3 font-mono text-sm">
                        <span className={isHidden ? "text-amber-300/90 font-medium" : "text-slate-200"}>
                          {isRevealed ? item.rawText : item.maskedText}
                        </span>

                        {/* Deliberate reveal action */}
                        {isHidden && (
                          <button
                            type="button"
                            onClick={() => toggleRevealDeliberate(item.id)}
                            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-[#172233] px-2 py-0.5 rounded border border-slate-700"
                            title="Click to deliberately reveal sensitive string on this screen"
                          >
                            {isRevealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            <span>{isRevealed ? "Hide" : "Reveal"}</span>
                          </button>
                        )}
                      </div>

                      {/* Source Context */}
                      {item.sourceContext && (
                        <p className="text-xs text-slate-400 italic bg-[#08090D] p-2 rounded border border-[#1A2332]">
                          "{item.sourceContext}"
                        </p>
                      )}
                    </div>

                    {/* Visibility Policy Control */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          onUpdateDetection(item.id, isHidden ? "VISIBLE" : "HIDDEN")
                        }
                        className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                          isHidden
                            ? "bg-amber-950/50 text-amber-300 border border-amber-700/50 hover:bg-amber-900/40"
                            : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
                        }`}
                      >
                        {isHidden ? "HIDDEN (Redacted)" : "VISIBLE (Public)"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#252A38] bg-[#121924] flex items-center justify-between">
          <p className="text-[11px] text-slate-400">
            Rule enforcement: Phone, personal address, government IDs, bank details, cards, and tokens are HIDDEN by default.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-md text-slate-300 hover:bg-[#1B2433]"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirmAndProceed();
                onClose();
              }}
              className="px-4 py-2 text-xs font-semibold rounded-md bg-[#E5C158] text-black hover:bg-[#d4ff1a] shadow-sm flex items-center gap-1.5"
            >
              <FileCheck className="h-4 w-4" />
              <span>Confirm Sanitization & Proceed</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
