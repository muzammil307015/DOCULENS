/**
 * DOCULENS Dedicated Spreadsheet Intelligence Dashboard
 *
 * Visualizes column summaries, totals, averages, null counts, duplicate records,
 * and renders verified deterministic charts from real cell data.
 */

import React, { useState } from "react";
import {
  Table2,
  BarChart3,
  PieChart as PieIcon,
  AlertTriangle,
  Copy,
  Hash,
  Database,
  Search,
  Filter,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { SpreadsheetAnalysisData } from "../../types";

interface SpreadsheetViewProps {
  data: SpreadsheetAnalysisData;
}

const CHART_COLORS = ["#E5C158", "#38BDF8", "#F472B6", "#A78BFA", "#34D399", "#FBBF24"];

export const SpreadsheetView: React.FC<SpreadsheetViewProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "table" | "columns" | "charts">("overview");

  // Search filter on table rows
  const filteredRows = data.rows.filter(row => {
    if (!searchTerm) return true;
    return Object.values(row).some(
      val => val !== null && String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-[#12151E] border border-[#252A38]">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Total Rows</span>
            <Database className="h-4 w-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{data.rowCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Active Sheet: {data.activeSheet}</div>
        </div>

        <div className="p-4 rounded-xl bg-[#12151E] border border-[#252A38]">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Columns</span>
            <Table2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{data.columnCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">{data.headers.length} mapped headers</div>
        </div>

        <div className="p-4 rounded-xl bg-[#12151E] border border-[#252A38]">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Duplicate Records</span>
            <Copy className="h-4 w-4 text-amber-400" />
          </div>
          <div className={`text-2xl font-bold font-mono ${data.duplicateRowCount > 0 ? "text-amber-400" : "text-white"}`}>
            {data.duplicateRowCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Identified via row hash match</div>
        </div>

        <div className="p-4 rounded-xl bg-[#12151E] border border-[#252A38]">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Missing / Null Cells</span>
            <AlertTriangle className="h-4 w-4 text-rose-400" />
          </div>
          <div className={`text-2xl font-bold font-mono ${data.missingValueCellCount > 0 ? "text-rose-400" : "text-white"}`}>
            {data.missingValueCellCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Incomplete cells across table</div>
        </div>
      </div>

      {/* Segmented Sub-Navigation */}
      <div className="flex items-center gap-2 border-b border-[#252A38] pb-3">
        {[
          { id: "overview", label: "Overview & Charts", icon: BarChart3 },
          { id: "table", label: `Data Records (${data.rowCount})`, icon: Table2 },
          { id: "columns", label: `Column Statistics (${data.columnSummaries.length})`, icon: Hash },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? "bg-[#E5C158]/15 text-[#E5C158] border border-[#E5C158]/40"
                  : "text-slate-400 hover:text-slate-200 bg-[#121824]"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview & Verified Charts */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Anomalies Alert Box if detected */}
          {data.anomalies.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/40 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <span>Detected Data Anomalies & Outliers ({data.anomalies.length})</span>
              </div>
              <ul className="space-y-1 text-xs text-amber-200/90 pl-6 list-disc">
                {data.anomalies.map((anom, i) => (
                  <li key={i}>
                    Row {anom.row} [{anom.column}]: {anom.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Formulas Detected Alert (Confirming NO EXECUTION) */}
          {data.formulasDetected.length > 0 && (
            <div className="p-3.5 rounded-xl bg-[#101724] border border-[#1F2B3E] text-xs text-slate-300 flex items-start gap-2.5">
              <span className="font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-[#E5C158]">
                FORMULA INTEGRITY
              </span>
              <div>
                <p className="font-semibold text-slate-200">
                  {data.formulasDetected.length} formula cells parsed as static text strings
                </p>
                <p className="text-slate-400 mt-0.5 text-[11px]">
                  DOCULENS security policy strictly prohibits the execution of embedded Excel formulas, macros, or VBA routines.
                </p>
              </div>
            </div>
          )}

          {/* Real Charts Grid */}
          {data.charts.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {data.charts.map((chart, idx) => (
                <div key={idx} className="p-5 rounded-xl bg-[#0E141E] border border-[#252A38] space-y-3">
                  <div>
                    <h4 className="font-['Space_Grotesk'] text-sm font-bold text-white">{chart.title}</h4>
                    <p className="text-[11px] font-mono text-slate-500">{chart.sourceNote}</p>
                  </div>

                  <div className="h-64 w-full pt-2">
                    {chart.type === "pie" ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chart.data}
                            dataKey={chart.dataKey}
                            nameKey={chart.xAxisKey}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          >
                            {chart.data.map((_, i) => (
                              <Cell key={`cell-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ backgroundColor: "#08090D", borderColor: "#2B3142", fontSize: 12 }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chart.data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                          <XAxis
                            dataKey={chart.xAxisKey}
                            stroke="#64748B"
                            fontSize={11}
                            interval={0}
                            angle={-20}
                            textAnchor="end"
                          />
                          <YAxis stroke="#64748B" fontSize={11} />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#08090D", borderColor: "#2B3142", fontSize: 12 }}
                          />
                          <Bar dataKey={chart.dataKey} fill="#E5C158" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 rounded-xl bg-[#0D121B] border border-dashed border-[#252A38]">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 text-slate-600" />
              <p className="text-xs">No suitable numeric distribution columns available for chart plotting.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Interactive Data Records Table */}
      {activeTab === "table" && (
        <div className="space-y-3">
          {/* Search bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search across extracted rows..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full rounded-lg bg-[#0D121B] border border-[#2B3142] pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-[#E5C158] focus:outline-none"
              />
            </div>
            <span className="text-xs font-mono text-slate-500">
              Showing {filteredRows.length} of {data.rows.length}
            </span>
          </div>

          <div className="rounded-xl border border-[#252A38] overflow-x-auto bg-[#08090D]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#252A38] bg-[#111722] text-slate-300 font-mono">
                  <th className="py-2.5 px-3 w-16 text-slate-500">Row</th>
                  {data.headers.map((h, i) => (
                    <th key={i} className="py-2.5 px-3 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1E2B]">
                {filteredRows.slice(0, 50).map((row, idx) => (
                  <tr
                    key={idx}
                    className={`hover:bg-[#141822] transition-colors ${
                      row._isDuplicate ? "bg-amber-950/20" : ""
                    }`}
                  >
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-500">
                      {row._rowIndex || idx + 2}
                      {row._isDuplicate && (
                        <span className="ml-1 text-[9px] text-amber-400 font-bold">[DUP]</span>
                      )}
                    </td>
                    {data.headers.map((h, cIdx) => {
                      const val = row[h];
                      return (
                        <td key={cIdx} className="py-2 px-3 whitespace-nowrap font-mono text-slate-300">
                          {val === null || val === undefined || val === "" ? (
                            <span className="text-slate-600 italic">null</span>
                          ) : (
                            String(val)
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Deep Column Summaries */}
      {activeTab === "columns" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.columnSummaries.map((col, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-[#0F141E] border border-[#252A38] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white font-mono truncate">{col.name}</span>
                <span className="text-[10px] font-mono uppercase bg-[#182333] px-1.5 py-0.5 rounded text-sky-400">
                  {col.type}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 rounded bg-[#08090D] border border-[#1A1E2B]">
                  <span className="text-slate-500 text-[10px] block">Distinct Values</span>
                  <span className="text-slate-200 font-semibold">{col.distinctCount}</span>
                </div>
                <div className="p-2 rounded bg-[#08090D] border border-[#1A1E2B]">
                  <span className="text-slate-500 text-[10px] block">Missing Nulls</span>
                  <span className={col.nullCount > 0 ? "text-rose-400 font-semibold" : "text-slate-400"}>
                    {col.nullCount}
                  </span>
                </div>
                {col.sum !== undefined && (
                  <div className="p-2 rounded bg-[#08090D] border border-[#1A1E2B]">
                    <span className="text-slate-500 text-[10px] block">Sum Total</span>
                    <span className="text-[#E5C158] font-semibold">{col.sum.toLocaleString()}</span>
                  </div>
                )}
                {col.average !== undefined && (
                  <div className="p-2 rounded bg-[#08090D] border border-[#1A1E2B]">
                    <span className="text-slate-500 text-[10px] block">Average Mean</span>
                    <span className="text-slate-200 font-semibold">{col.average.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {col.sampleValues && col.sampleValues.length > 0 && (
                <div>
                  <span className="text-[10px] font-mono text-slate-500 block mb-1">Sample Values</span>
                  <div className="flex flex-wrap gap-1">
                    {col.sampleValues.map((s, sIdx) => (
                      <span
                        key={sIdx}
                        className="text-[10px] font-mono bg-[#161A25] text-slate-300 px-1.5 py-0.5 rounded border border-slate-800 truncate max-w-[140px]"
                      >
                        {String(s)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
