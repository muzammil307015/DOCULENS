/**
 * DOCULENS In-App Deadlines & Reminders Manager
 *
 * Categorizes and tracks:
 * - Official document deadlines
 * - Personal target dates
 * - Certificate / Licence expiry dates
 * - Pre-bid / Clarification reminder dates
 *
 * Explicitly confirms reminders are in-app only (no unconfigured SMS/email claims).
 */

import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  AlertTriangle,
  CheckCircle,
  Bell,
  ArrowRight,
  ShieldCheck,
  Plus,
} from "lucide-react";
import { FullDocumentAnalysis, ImportantDateItem } from "../../types";

interface DeadlinesViewProps {
  analyses: FullDocumentAnalysis[];
  onOpenAnalysis: (analysis: FullDocumentAnalysis) => void;
}

export const DeadlinesView: React.FC<DeadlinesViewProps> = ({
  analyses,
  onOpenAnalysis,
}) => {
  const [filterType, setFilterType] = useState<string>("all");

  // Aggregate all dates from analyzed documents and re-calculate relative days dynamically
  const allDates = analyses.flatMap(a =>
    a.importantDates.map(d => {
      // Re-check dates on open
      let currentDaysRemaining = d.daysRemaining;
      let isExpired = d.isExpired;
      const parsed = Date.parse(d.rawText);
      if (!isNaN(parsed)) {
        const diff = Math.ceil((parsed - Date.now()) / (1000 * 60 * 60 * 24));
        currentDaysRemaining = diff;
        isExpired = diff < 0;
      }
      return {
        ...d,
        daysRemaining: currentDaysRemaining,
        isExpired,
        docTitle: a.title,
        docId: a.id,
        analysisRef: a,
      };
    })
  );

  const filteredDates = allDates.filter(d => {
    if (filterType === "urgent") return !d.isExpired && (d.daysRemaining || 99) <= 7;
    if (filterType === "active") return !d.isExpired;
    if (filterType === "expired") return d.isExpired;
    if (filterType === "official_deadline") return d.type === "official_deadline";
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-[#0E1017] border border-[#252A38] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-amber-400" />
            <h2 className="font-['Space_Grotesk'] text-xl font-bold text-white">
              In-App Deadlines & Expiry Calendar
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dates are re-calculated upon every app launch. Notification policy: Reminders are tracked strictly within this app interface.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-[#121924] border border-[#252A38] px-3 py-1.5 rounded-lg">
          <Bell className="h-3.5 w-3.5 text-amber-400" />
          <span>In-App Only Alerts</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: "all", label: `All Tracked Dates (${allDates.length})` },
          { id: "urgent", label: "Urgent (< 7 Days)" },
          { id: "active", label: "Active Submissions" },
          { id: "expired", label: "Lapsed / Expired" },
          { id: "official_deadline", label: "Official Submission Deadlines" },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilterType(f.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterType === f.id
                ? "bg-[#E5C158]/15 text-[#E5C158] border border-[#E5C158]/40"
                : "text-slate-400 hover:text-slate-200 bg-[#12151E] border border-[#252A38]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Deadlines List */}
      {filteredDates.length === 0 ? (
        <div className="p-12 text-center text-slate-500 rounded-2xl bg-[#0E1017] border border-dashed border-[#252A38]">
          <CalendarIcon className="h-10 w-10 mx-auto mb-2 text-slate-600" />
          <p className="text-sm">No dates found matching this filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDates.map((item, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${
                item.isExpired
                  ? "bg-rose-950/20 border-rose-900/40"
                  : (item.daysRemaining || 99) <= 7
                  ? "bg-amber-950/20 border-amber-900/40"
                  : "bg-[#0E1017] border-[#252A38]"
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                    {item.label}
                  </span>
                  <span className="text-[10px] font-mono uppercase bg-[#1A1E2B] text-slate-400 px-1.5 py-0.5 rounded">
                    {item.type.replace("_", " ")}
                  </span>
                </div>

                <div className="text-xl font-bold font-mono text-[#E5C158]">{item.rawText}</div>

                <p className="text-xs text-slate-400 font-mono truncate">{item.docTitle}</p>
              </div>

              <div className="pt-2 border-t border-[#1C2636] flex items-center justify-between">
                <span
                  className={`text-xs font-mono font-semibold ${
                    item.isExpired
                      ? "text-rose-400"
                      : (item.daysRemaining || 99) <= 7
                      ? "text-amber-400"
                      : "text-emerald-400"
                  }`}
                >
                  {item.isExpired
                    ? "⚠️ Expired"
                    : item.daysRemaining !== undefined
                    ? `⏳ ${item.daysRemaining} days left`
                    : "Tracked"}
                </span>

                <button
                  onClick={() => onOpenAnalysis(item.analysisRef)}
                  className="text-xs text-slate-300 hover:text-[#E5C158] flex items-center gap-1 font-mono"
                >
                  <span>View Doc</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
