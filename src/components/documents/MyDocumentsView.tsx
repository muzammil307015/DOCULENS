/**
 * DOCULENS My Documents & Reports Repository
 *
 * Dedicated repository view for managing analyzed documents:
 * - Search by title, issuing entity, or extracted reference number
 * - Filter by category (RFP, Scholarship, Contract, Job, Financial, etc.)
 * - Readiness score indicators & primary deadline status
 * - One-click report opening and multi-format exports (Markdown, CSV, PDF)
 * - Delete and management controls
 */

import React, { useState } from "react";
import {
  FileText,
  Search,
  Filter,
  Trash2,
  ExternalLink,
  Download,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Upload,
  ArrowRight,
  FileSpreadsheet,
  ListChecks,
} from "lucide-react";
import { FullDocumentAnalysis } from "../../types";
import {
  exportAnalysisAsMarkdown,
  exportRequirementsAsCsv,
  exportChecklistAsCsv,
  downloadFile,
} from "../../services/exportService";

interface MyDocumentsViewProps {
  documents: FullDocumentAnalysis[];
  onOpenDocument: (doc: FullDocumentAnalysis) => void;
  onDeleteDocument: (id: string) => void;
  onNavigateToUpload: () => void;
}

export const MyDocumentsView: React.FC<MyDocumentsViewProps> = ({
  documents,
  onOpenDocument,
  onDeleteDocument,
  onNavigateToUpload,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { id: "all", label: "All Categories" },
    { id: "rfp_tender", label: "RFPs & Tenders" },
    { id: "scholarship", label: "Scholarships" },
    { id: "contract_legal", label: "Contracts & Legal" },
    { id: "job", label: "Job Descriptions" },
    { id: "financial_report", label: "Spreadsheets & Financials" },
    { id: "general_document", label: "General Documents" },
  ];

  const filteredDocs = documents.filter(doc => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.keyInfo.issuingOrganisation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.keyInfo.referenceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.executiveSummary.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === "all" || doc.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-[#0E1017] border border-[#252A38] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#E5C158]" />
            <h2 className="font-['Space_Grotesk'] text-2xl font-bold text-white tracking-tight">
              My Documents & Reports
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Central repository of all parsed, sanitized, and analyzed documents with stored provenance.
          </p>
        </div>

        <button
          onClick={onNavigateToUpload}
          className="px-4 py-2.5 rounded-xl font-bold text-xs bg-[#E5C158] text-black hover:bg-[#F3E3AD] transition-all flex items-center justify-center gap-2 shadow-sm self-start sm:self-auto"
        >
          <Upload className="h-4 w-4" />
          <span>Analyse New Document</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-[#0E1017] border border-[#252A38] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search documents by title, issuing entity, reference ID, or keywords..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#141822] border border-[#1E2838] text-xs text-white placeholder-slate-500 focus:border-[#E5C158] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-thin">
          <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? "bg-[#E5C158]/15 text-[#E5C158] border border-[#E5C158]/40 font-medium"
                  : "bg-[#141822] text-slate-400 hover:text-white border border-[#1E2838]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Document Grid / List */}
      {filteredDocs.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#0E1017] border border-dashed border-[#252A38] text-center space-y-4">
          <FileText className="h-12 w-12 mx-auto text-slate-600" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No documents matched</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {searchQuery || selectedCategory !== "all"
                ? "Try clearing filters or search terms."
                : "You haven't analyzed any documents yet. Ingest an RFP, scholarship circular, contract, or spreadsheet to begin."}
            </p>
          </div>
          <button
            onClick={onNavigateToUpload}
            className="px-4 py-2 rounded-lg bg-[#E5C158] text-black font-semibold text-xs hover:bg-[#F3E3AD] transition-all inline-flex items-center gap-1.5"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Upload Document</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map(doc => {
            const officialDeadline = doc.importantDates.find(d => d.type === "official_deadline");
            return (
              <div
                key={doc.id}
                className="p-5 rounded-2xl bg-[#0E1017] border border-[#252A38] hover:border-[#2C3B52] transition-all flex flex-col justify-between group space-y-4 shadow-lg hover:shadow-xl"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono uppercase bg-[#1A1E2B] text-[#E5C158] border border-[#E5C158]/25 px-2 py-0.5 rounded">
                      {doc.category.replace("_", " ")}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {new Date(doc.analyzedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <h3
                      onClick={() => onOpenDocument(doc)}
                      className="font-['Space_Grotesk'] text-base font-bold text-white group-hover:text-[#E5C158] transition-colors cursor-pointer line-clamp-1"
                      title={doc.title}
                    >
                      {doc.title}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">
                      {doc.keyInfo.issuingOrganisation || "Official Body"}
                    </p>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {doc.executiveSummary}
                  </p>

                  {/* Readiness and Deadlines */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#192230] text-xs">
                    <div className="p-2 rounded-lg bg-[#111722] border border-[#1E2838]">
                      <span className="text-[10px] font-mono text-slate-500 block uppercase">Readiness</span>
                      <span className="font-mono font-bold text-[#E5C158] text-sm">
                        {doc.readinessScore ? `${doc.readinessScore.score}%` : "Analyzed"}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-[#111722] border border-[#1E2838]">
                      <span className="text-[10px] font-mono text-slate-500 block uppercase">Deadline</span>
                      <span
                        className={`font-mono text-xs truncate block ${
                          officialDeadline?.isExpired
                            ? "text-rose-400 font-bold"
                            : officialDeadline?.isUrgent
                            ? "text-amber-400 font-bold"
                            : "text-emerald-400 font-medium"
                        }`}
                      >
                        {officialDeadline?.rawText || "Unstated"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action buttons */}
                <div className="pt-3 border-t border-[#1C2636] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        const md = exportAnalysisAsMarkdown(doc);
                        downloadFile(
                          md,
                          `DOCULENS_${doc.title.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 30)}.md`,
                          "text/markdown;charset=utf-8;"
                        );
                      }}
                      className="p-1.5 rounded-lg bg-[#161A25] hover:bg-[#1E293B] text-slate-400 hover:text-white transition-colors"
                      title="Download Markdown Report"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => exportRequirementsAsCsv(doc)}
                      className="p-1.5 rounded-lg bg-[#161A25] hover:bg-[#1E293B] text-slate-400 hover:text-emerald-400 transition-colors"
                      title="Export Requirements CSV"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => exportChecklistAsCsv(doc)}
                      className="p-1.5 rounded-lg bg-[#161A25] hover:bg-[#1E293B] text-slate-400 hover:text-[#E5C158] transition-colors"
                      title="Export Checklist CSV"
                    >
                      <ListChecks className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteDocument(doc.id)}
                      className="p-1.5 rounded-lg bg-[#161A25] hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Delete Record"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => onOpenDocument(doc)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1A1E2B] hover:bg-[#E5C158] hover:text-black text-slate-200 border border-[#2B3142] transition-all flex items-center gap-1"
                  >
                    <span>View Report</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
