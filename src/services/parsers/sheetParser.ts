/**
 * DOCULENS Spreadsheet Intelligence Parser (XLSX, XLS, CSV, ODS)
 *
 * Extracts all sheets, headers, rows, and data types across multi-sheet workbooks.
 * Computes deterministic statistics (sums, averages, min/max, duplicates, missing values).
 * Preserves formula strings as raw text — NEVER executes formulas, macros, or code.
 * Never truncates rows arbitrarily to 25 or 30 rows.
 */

import * as XLSX from "xlsx";
import { ColumnSummary, DocumentPage, SpreadsheetAnalysisData } from "../../types";

export function parseSpreadsheetBuffer(buffer: ArrayBuffer | Uint8Array, fileName: string): SpreadsheetAnalysisData {
  const workbook = XLSX.read(buffer, {
    type: "array",
    cellFormula: true,
    cellHTML: false,
    cellStyles: false,
    codepage: 65001,
    // Do NOT run macros or formula execution
  });

  const sheetNames = workbook.SheetNames || [];
  const activeSheet = sheetNames[0] || "Sheet1";

  if (sheetNames.length === 0) {
    return {
      sheetNames: [],
      activeSheet: "Sheet1",
      rowCount: 0,
      columnCount: 0,
      headers: [],
      rows: [],
      columnSummaries: [],
      duplicateRowCount: 0,
      missingValueCellCount: 0,
      anomalies: [],
      formulasDetected: [],
      charts: [],
    };
  }

  const allHeadersSet = new Set<string>();
  const rows: Record<string, any>[] = [];
  const formulasDetected: { cell: string; formula: string }[] = [];
  let missingValueCellCount = 0;
  const rowSignatures = new Set<string>();
  let duplicateRowCount = 0;

  for (const sName of sheetNames) {
    const worksheet = workbook.Sheets[sName];
    if (!worksheet) continue;

    // Inspect cells for formulas without execution
    for (const cellAddress in worksheet) {
      if (cellAddress[0] === "!") continue;
      const cell = worksheet[cellAddress];
      if (cell && cell.f) {
        formulasDetected.push({
          cell: sheetNames.length > 1 ? `${sName}!${cellAddress}` : cellAddress,
          formula: String(cell.f),
        });
      }
    }

    const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: null,
      blankrows: false,
      raw: false,
    });

    if (!rawData || rawData.length === 0) continue;

    const headerRow: any[] = rawData[0] || [];
    const sheetHeaders: string[] = headerRow.map((h, i) => (h ? String(h).trim() : `Column_${i + 1}`));
    sheetHeaders.forEach(h => allHeadersSet.add(h));

    const dataRows = rawData.slice(1);
    for (let rIdx = 0; rIdx < dataRows.length; rIdx++) {
      const rawRow = dataRows[rIdx];
      const rowObj: Record<string, any> = {
        _rowIndex: rIdx + 2,
        ...(sheetNames.length > 1 ? { _sheetName: sName } : {}),
      };
      let rowValuesConcatenated = sheetNames.length > 1 ? `${sName}::` : "";

      for (let cIdx = 0; cIdx < sheetHeaders.length; cIdx++) {
        const colName = sheetHeaders[cIdx];
        const val = rawRow && rawRow[cIdx] !== undefined ? rawRow[cIdx] : null;

        if (val === null || val === "" || val === undefined) {
          missingValueCellCount++;
          rowObj[colName] = null;
        } else {
          rowObj[colName] = val;
          rowValuesConcatenated += String(val).trim().toLowerCase() + "|";
        }
      }

      if (rowValuesConcatenated.length > (sheetNames.length > 1 ? `${sName}::`.length : 0)) {
        if (rowSignatures.has(rowValuesConcatenated)) {
          duplicateRowCount++;
          rowObj._isDuplicate = true;
        } else {
          rowSignatures.add(rowValuesConcatenated);
        }
      }

      rows.push(rowObj);
    }
  }

  const headers = Array.from(allHeadersSet);

  if (rows.length === 0 && headers.length === 0) {
    return {
      sheetNames,
      activeSheet,
      rowCount: 0,
      columnCount: 0,
      headers: [],
      rows: [],
      columnSummaries: [],
      duplicateRowCount: 0,
      missingValueCellCount: 0,
      anomalies: [],
      formulasDetected,
      charts: [],
    };
  }

  // Compute column summaries across all extracted rows
  const columnSummaries: ColumnSummary[] = [];
  const numericColumns: { name: string; sum: number; values: number[] }[] = [];
  const categoricalColumns: { name: string; values: string[] }[] = [];

  for (const colName of headers) {
    const nonNullValues = rows
      .map(r => r[colName])
      .filter(v => v !== null && v !== undefined && v !== "");

    const distinctSet = new Set(nonNullValues);
    let numCount = 0;
    const numericVals: number[] = [];

    for (const val of nonNullValues) {
      const cleanNum = String(val).replace(/[$,€£₹%]/g, "").trim();
      const n = parseFloat(cleanNum);
      if (!isNaN(n) && isFinite(n) && !/^\d{4}-\d{2}-\d{2}/.test(cleanNum) && cleanNum.length > 0) {
        numCount++;
        numericVals.push(n);
      }
    }

    const isNumeric = nonNullValues.length > 0 && numCount / nonNullValues.length > 0.7;

    const summary: ColumnSummary = {
      name: colName,
      type: isNumeric ? "number" : "string",
      totalCount: rows.length,
      nullCount: rows.length - nonNullValues.length,
      distinctCount: distinctSet.size,
      sampleValues: nonNullValues.slice(0, 5),
    };

    if (isNumeric && numericVals.length > 0) {
      const sum = numericVals.reduce((acc, curr) => acc + curr, 0);
      summary.sum = Math.round(sum * 100) / 100;
      summary.average = Math.round((sum / numericVals.length) * 100) / 100;
      summary.min = Math.min(...numericVals);
      summary.max = Math.max(...numericVals);
      numericColumns.push({ name: colName, sum, values: numericVals });
    } else {
      categoricalColumns.push({
        name: colName,
        values: nonNullValues.map(v => String(v)),
      });
    }

    columnSummaries.push(summary);
  }

  // Generate deterministic charts from real extracted data
  const charts: SpreadsheetAnalysisData["charts"] = [];

  const categoryCandidate = categoricalColumns.find(c => {
    const set = new Set(c.values);
    return set.size >= 2 && set.size <= 10;
  });

  if (categoryCandidate) {
    const counts: Record<string, number> = {};
    for (const val of categoryCandidate.values) {
      counts[val] = (counts[val] || 0) + 1;
    }
    const chartData = Object.entries(counts).map(([name, count]) => ({
      name: name.length > 20 ? name.slice(0, 18) + "..." : name,
      count,
    }));

    charts.push({
      title: `Distribution by ${categoryCandidate.name}`,
      type: "pie",
      xAxisKey: "name",
      dataKey: "count",
      data: chartData,
      sourceNote: `Calculated from ${categoryCandidate.name} column (${rows.length} total rows)`,
    });
  }

  if (categoricalColumns.length > 0 && numericColumns.length > 0) {
    const catCol = categoricalColumns[0];
    const numCol = numericColumns[0];

    const aggregated: Record<string, number> = {};
    for (const r of rows) {
      const catVal = r[catCol.name];
      const rawNum = r[numCol.name];
      if (catVal && rawNum) {
        const n = parseFloat(String(rawNum).replace(/[$,€£₹%]/g, ""));
        if (!isNaN(n)) {
          aggregated[catVal] = (aggregated[catVal] || 0) + n;
        }
      }
    }

    const chartData = Object.entries(aggregated)
      .slice(0, 8)
      .map(([name, total]) => ({
        name: name.length > 15 ? name.slice(0, 15) + "..." : name,
        total: Math.round(total * 100) / 100,
      }));

    if (chartData.length > 1) {
      charts.push({
        title: `${numCol.name} by ${catCol.name}`,
        type: "bar",
        xAxisKey: "name",
        dataKey: "total",
        data: chartData,
        sourceNote: `Aggregated from ${catCol.name} vs ${numCol.name} across ${sheetNames.length} sheet(s)`,
      });
    }
  }

  // Detect anomalies
  const anomalies: { row: number; column: string; message: string }[] = [];
  for (const numCol of numericColumns) {
    if (numCol.values.length > 5) {
      const avg = numCol.sum / numCol.values.length;
      for (let rIdx = 0; rIdx < rows.length; rIdx++) {
        const val = rows[rIdx][numCol.name];
        if (val !== null && val !== undefined) {
          const n = parseFloat(String(val).replace(/[$,₹€£]/g, ""));
          if (!isNaN(n) && n > avg * 4 && avg > 0) {
            anomalies.push({
              row: rows[rIdx]._rowIndex || rIdx + 2,
              column: numCol.name,
              message: `High outlier: ${val} is significantly higher than column average of ${Math.round(avg)}`,
            });
          }
        }
      }
    }
  }

  return {
    sheetNames,
    activeSheet,
    rowCount: rows.length,
    columnCount: headers.length,
    headers,
    rows,
    columnSummaries,
    duplicateRowCount,
    missingValueCellCount,
    anomalies: anomalies.slice(0, 20),
    formulasDetected,
    charts,
  };
}

/**
 * Builds structured fullText, per-sheet pages, and extractedTables from spreadsheet data
 * without arbitrarily truncating at 25 or 30 rows.
 */
export function buildSpreadsheetDocumentRepresentation(
  spreadsheetData: SpreadsheetAnalysisData,
  fileName: string
): {
  fullText: string;
  pages: DocumentPage[];
  extractedTables: Array<{
    tableIndex: number;
    page: number;
    headers: string[];
    rows: string[][];
    markdown: string;
  }>;
} {
  const sheetNames = spreadsheetData.sheetNames.length > 0 ? spreadsheetData.sheetNames : [spreadsheetData.activeSheet || "Sheet1"];
  const pages: DocumentPage[] = [];
  const extractedTables: Array<{
    tableIndex: number;
    page: number;
    headers: string[];
    rows: string[][];
    markdown: string;
  }> = [];
  const fullTextChunks: string[] = [];

  const hasSheetTag = spreadsheetData.rows.some(r => r._sheetName !== undefined);

  sheetNames.forEach((sName, idx) => {
    const pageNum = idx + 1;
    const sheetRows = hasSheetTag
      ? spreadsheetData.rows.filter(r => r._sheetName === sName)
      : idx === 0
      ? spreadsheetData.rows
      : [];

    const headers = spreadsheetData.headers;
    let sheetText = `--- [Page ${pageNum}] ---\n`;
    sheetText += `Spreadsheet Document: ${fileName} | Sheet (${pageNum}/${sheetNames.length}): ${sName}\n`;
    sheetText += `Columns (${headers.length}): ${headers.join(", ")}\n`;
    sheetText += `Sheet Rows: ${sheetRows.length} | Total Workbook Rows: ${spreadsheetData.rowCount} | Missing Cells: ${spreadsheetData.missingValueCellCount} | Duplicate Rows: ${spreadsheetData.duplicateRowCount}\n\n`;

    const tableRows: string[][] = [];
    for (let rIdx = 0; rIdx < sheetRows.length; rIdx++) {
      const r = sheetRows[rIdx];
      const rowNum = r._rowIndex || rIdx + 2;
      const kvPairs = Object.entries(r)
        .filter(([k]) => !k.startsWith("_"))
        .map(([k, v]) => `${k}=${v ?? ""}`);
      sheetText += `Row ${rowNum}: ${kvPairs.join(", ")}\n`;
      tableRows.push(headers.map(h => (r[h] !== null && r[h] !== undefined ? String(r[h]) : "")));
    }

    pages.push({
      pageNumber: pageNum,
      pageLabel: `Sheet: ${sName}`,
      text: sheetText.trim(),
      confidence: 1.0,
    });

    fullTextChunks.push(sheetText.trim());

    if (headers.length > 0) {
      const mdHeader = `| ${headers.join(" | ")} |\n| ${headers.map(() => "---").join(" | ")} |`;
      const mdBody = tableRows.map(tr => `| ${tr.join(" | ")} |`).join("\n");
      extractedTables.push({
        tableIndex: pageNum,
        page: pageNum,
        headers,
        rows: tableRows,
        markdown: `${mdHeader}\n${mdBody}`,
      });
    }
  });

  const fullText = fullTextChunks.join("\n\n");
  return {
    fullText,
    pages: pages.length > 0 ? pages : [{ pageNumber: 1, text: `Spreadsheet Document: ${fileName} (0 rows)`, confidence: 1.0 }],
    extractedTables,
  };
}

