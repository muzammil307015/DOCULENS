/**
 * DOCULENS Document Memory Inspector
 *
 * Application-specific fact memory with explicit permission controls,
 * source provenance tracking, and full user deletion/purge capability.
 */

import React, { useState } from "react";
import {
  Brain,
  Trash2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Shield,
  Clock,
  Sparkles,
} from "lucide-react";
import { DocumentMemoryItem } from "../../types";

interface DocumentMemoryViewProps {
  memoryItems: DocumentMemoryItem[];
  onToggleReuse: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
}

export const DocumentMemoryView: React.FC<DocumentMemoryViewProps> = ({
  memoryItems,
  onToggleReuse,
  onDeleteItem,
  onClearAll,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = memoryItems.filter(m => {
    if (!searchTerm) return true;
    return (
      m.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.sourceDocName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-[#0E1017] border border-[#252A38] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-[#E5C158]" />
            <h2 className="font-['Space_Grotesk'] text-xl font-bold text-white">
              Document Memory & Provenance Index
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Application-specific memory of verified facts, past credentials, and criteria. Facts are reused only with explicit permission and are never silently assumed current without re-checking expiry.
          </p>
        </div>

        {memoryItems.length > 0 && (
          <button
            onClick={onClearAll}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-950/30 border border-rose-900/50 transition-colors"
          >
            Clear Entire Memory
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search stored memory facts or source documents..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full rounded-xl bg-[#0D121B] border border-[#2B3142] px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-[#E5C158] focus:outline-none"
        />
      </div>

      {/* Memory Cards */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center text-slate-500 rounded-2xl bg-[#0E1017] border border-dashed border-[#252A38]">
          <Brain className="h-10 w-10 mx-auto mb-2 text-slate-600" />
          <p className="text-sm">No memory items recorded yet.</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            When you confirm extracted facts from documents, they appear here with full source citations.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-[#0E1017] border border-[#252A38] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">{item.key}</span>
                  <span className="text-[10px] font-mono text-slate-400 bg-[#1A1E2B] px-1.5 py-0.2 rounded">
                    {item.category}
                  </span>
                </div>
                <div className="text-xs font-mono text-[#E5C158]">{item.value}</div>
                <div className="text-[11px] font-mono text-slate-500 flex items-center gap-2">
                  <span>Source: {item.sourceDocName}</span>
                  <span>·</span>
                  <span>Saved: {new Date(item.savedAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => onToggleReuse(item.id)}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                    item.userApprovedForReuse
                      ? "bg-emerald-950/60 border border-emerald-800/40 text-emerald-400"
                      : "bg-[#161A25] border border-slate-700 text-slate-400"
                  }`}
                  title="Toggle permission for automatic reuse across documents"
                >
                  {item.userApprovedForReuse ? "Reuse Permitted" : "Manual Approval Only"}
                </button>
                <button
                  onClick={() => onDeleteItem(item.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                  title="Delete memory item"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
