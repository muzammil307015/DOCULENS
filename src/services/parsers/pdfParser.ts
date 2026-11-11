/**
 * DOCULENS PDF Parser
 * Extracts text page-by-page with accurate line reconstruction, page boundaries [Page X],
 * metadata extraction, scanned page detection, and strict anti-binary-garbage validation.
 */

import { DocumentPage } from "../../types";

export interface PdfExtractionResult {
  fullText: string;
  pages: DocumentPage[];
  pageCount: number;
  nativeTextPages: number;
  emptyOrScannedPages: number;
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
    creationDate?: string;
  };
  warnings: string[];
}

const PDF_PARSE_TIMEOUT_MS = 60000;

/**
 * Checks whether a candidate string looks like raw PDF binary/syntax garbage rather than readable text
 */
export function isSuspiciousPdfBinaryGarbage(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (/^%PDF-\d\.\d/i.test(trimmed)) return true;

  // Count PDF internal structural tokens
  const pdfSyntaxMatches = trimmed.match(/\b(?:endobj|endstream|startxref|xref|trailer|\/Type\s*\/Catalog|\/Filter\s*\/FlateDecode)\b/g);
  if (pdfSyntaxMatches && pdfSyntaxMatches.length >= 3) {
    return true;
  }

  // Check ratio of normal alphanumeric characters to total non-whitespace characters
  const nonWs = trimmed.replace(/\s+/g, "");
  if (nonWs.length === 0) return false;
  const readableChars = (nonWs.match(/[A-Za-z0-9.,;:'"?!()[\]\-/$₹€£%&@#+=]/g) || []).length;
  const ratio = readableChars / nonWs.length;
  return ratio < 0.55;
}

/**
 * Unescapes PDF literal strings: \( \) \\ \n \r \t and octal \ddd
 */
function unescapePdfLiteral(raw: string): string {
  return raw
    .replace(/\\([nrtbf()\\])/g, (_m, ch) => {
      switch (ch) {
        case "n": return "\n";
        case "r": return "\r";
        case "t": return "\t";
        case "b": return "\b";
        case "f": return "\f";
        default: return ch;
      }
    })
    .replace(/\\([0-7]{1,3})/g, (_m, oct) => String.fromCharCode(parseInt(oct, 8)));
}

/**
 * Extracts text from PDF BT...ET content streams (Tj, TJ, ', " operators)
 */
function extractTextFromPdfContentStream(streamContent: string): string {
  const lines: string[] = [];

  // Match BT ... ET text blocks or search across stream if BT/ET omitted
  const btBlocks = streamContent.match(/BT[\s\S]*?ET/g) || [streamContent];

  for (const block of btBlocks) {
    const blockParts: string[] = [];
    // Match (...) Tj or [...] TJ
    const tokenRegex = /\((?:\\.|[^\\()])*\)\s*(?:Tj|'|")|\[([\s\S]*?)\]\s*TJ/g;
    let match: RegExpExecArray | null;

    while ((match = tokenRegex.exec(block)) !== null) {
      const fullToken = match[0];
      if (match[1] !== undefined) {
        // Array inside [...] TJ
        const arrayContent = match[1];
        const strRegex = /\((?:\\.|[^\\()])*\)/g;
        let strMatch: RegExpExecArray | null;
        let linePiece = "";
        while ((strMatch = strRegex.exec(arrayContent)) !== null) {
          const inner = strMatch[0].slice(1, -1);
          linePiece += unescapePdfLiteral(inner);
        }
        if (linePiece.trim()) {
          blockParts.push(linePiece.trim());
        }
      } else {
        // Single (...) Tj
        const openIdx = fullToken.indexOf("(");
        const closeIdx = fullToken.lastIndexOf(")");
        if (openIdx !== -1 && closeIdx > openIdx) {
          const inner = fullToken.slice(openIdx + 1, closeIdx);
          const decoded = unescapePdfLiteral(inner).trim();
          if (decoded) {
            blockParts.push(decoded);
          }
        }
      }
    }

    if (blockParts.length > 0) {
      lines.push(blockParts.join("\n"));
    }
  }

  return lines.join("\n").trim();
}

/**
 * Reconstructs structured page text from pdfjs getTextContent() items while preserving line breaks
 */
function reconstructPageTextWithLines(items: any[]): string {
  if (!items || items.length === 0) return "";

  const lines: string[] = [];
  let currentLine: string[] = [];
  let lastY: number | null = null;

  for (const item of items) {
    if (!item || typeof item.str !== "string") continue;
    const text = item.str;
    const y = Array.isArray(item.transform) && typeof item.transform[5] === "number"
      ? item.transform[5]
      : null;

    // Check if item moved to a new vertical line (threshold > 3pt)
    if (lastY !== null && y !== null && Math.abs(y - lastY) > 3) {
      if (currentLine.length > 0) {
        lines.push(currentLine.join(" ").replace(/\s+/g, " ").trim());
        currentLine = [];
      }
    }

    if (text.trim().length > 0) {
      currentLine.push(text);
    }

    if (y !== null) {
      lastY = y;
    }

    if (item.hasEOL && currentLine.length > 0) {
      lines.push(currentLine.join(" ").replace(/\s+/g, " ").trim());
      currentLine = [];
      lastY = null;
    }
  }

  if (currentLine.length > 0) {
    lines.push(currentLine.join(" ").replace(/\s+/g, " ").trim());
  }

  return lines.filter(Boolean).join("\n").trim();
}

let cachedPdfjsModule: any = null;

async function getPdfjsModule(isNode: boolean): Promise<any> {
  if (cachedPdfjsModule) return cachedPdfjsModule;
  if (isNode) {
    cachedPdfjsModule = await import("pdfjs-dist/legacy/build/pdf.mjs");
  } else {
    cachedPdfjsModule = await import("pdfjs-dist");
    if (cachedPdfjsModule.GlobalWorkerOptions && !cachedPdfjsModule.GlobalWorkerOptions.workerSrc) {
      try {
        cachedPdfjsModule.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url
        ).toString();
      } catch {
        cachedPdfjsModule.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${cachedPdfjsModule.version || "5.4.624"}/build/pdf.worker.min.mjs`;
      }
    }
  }
  return cachedPdfjsModule;
}

export async function parsePdfBuffer(buffer: ArrayBuffer | Uint8Array | Buffer): Promise<PdfExtractionResult> {
  // Convert input to a clean, isolated Uint8Array slice
  let uint8Array: Uint8Array;
  if (buffer instanceof Uint8Array) {
    uint8Array = new Uint8Array(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
  } else if (buffer instanceof ArrayBuffer) {
    uint8Array = new Uint8Array(buffer.slice(0));
  } else {
    const nodeBuf = buffer as any;
    uint8Array = new Uint8Array(nodeBuf.buffer.slice(nodeBuf.byteOffset, nodeBuf.byteOffset + nodeBuf.byteLength));
  }

  if (uint8Array.byteLength < 8) {
    throw new Error("Invalid PDF file: file is empty or smaller than minimum PDF header size.");
  }

  // Verify %PDF signature within the first 1024 bytes (per PDF specification)
  const headerSlice = new TextDecoder("latin1").decode(uint8Array.slice(0, Math.min(1024, uint8Array.byteLength)));
  if (!headerSlice.includes("%PDF-")) {
    throw new Error("Invalid or corrupted PDF file: missing %PDF- header signature.");
  }

  const warnings: string[] = [];
  const isNode = typeof window === "undefined";

  try {
    const pdfjs = await getPdfjsModule(isNode);

    const loadingTask = pdfjs.getDocument({
      data: uint8Array,
      useSystemFonts: true,
      disableFontFace: true,
      isEvalSupported: false,
      stopAtErrors: false,
      verbosity: 0,
    });

    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
    const doc: any = await Promise.race([
      loadingTask.promise,
      new Promise((_, reject) => {
        timeoutHandle = setTimeout(
          () => reject(new Error(`PDF parsing timed out after ${PDF_PARSE_TIMEOUT_MS / 1000}s`)),
          PDF_PARSE_TIMEOUT_MS
        );
      }),
    ]);
    if (timeoutHandle) clearTimeout(timeoutHandle);

    // Extract PDF metadata if available
    let metadata: PdfExtractionResult["metadata"] = undefined;
    try {
      const metaObj = await doc.getMetadata();
      const info = metaObj?.info as any;
      if (info) {
        metadata = {
          title: typeof info.Title === "string" && info.Title.trim() ? info.Title.trim() : undefined,
          author: typeof info.Author === "string" && info.Author.trim() ? info.Author.trim() : undefined,
          subject: typeof info.Subject === "string" && info.Subject.trim() ? info.Subject.trim() : undefined,
          creationDate: typeof info.CreationDate === "string" && info.CreationDate.trim() ? info.CreationDate.trim() : undefined,
        };
      }
    } catch {
      // Metadata optional
    }

    const numPages = doc.numPages || 1;
    const pages: DocumentPage[] = [];
    const aggregatedChunks: string[] = [];
    let nativeTextPages = 0;
    let emptyOrScannedPages = 0;

    for (let i = 1; i <= numPages; i++) {
      try {
        const page = await doc.getPage(i);
        const textContent = await page.getTextContent();
        const cleanPageText = reconstructPageTextWithLines(textContent.items || []);

        if (cleanPageText && !isSuspiciousPdfBinaryGarbage(cleanPageText)) {
          nativeTextPages++;
          pages.push({
            pageNumber: i,
            text: cleanPageText,
            confidence: 0.98,
            isOcr: false,
          });
          aggregatedChunks.push(`--- [Page ${i}] ---\n${cleanPageText}`);
        } else {
          emptyOrScannedPages++;
          pages.push({
            pageNumber: i,
            text: "",
            confidence: 0,
            isOcr: false,
          });
        }
      } catch (pageErr: any) {
        emptyOrScannedPages++;
        warnings.push(`Page ${i} content stream could not be decoded (${pageErr?.message || "stream error"}).`);
        pages.push({
          pageNumber: i,
          text: "",
          confidence: 0,
          isOcr: false,
        });
      }
    }

    if (emptyOrScannedPages > 0 && nativeTextPages > 0) {
      warnings.push(
        `${emptyOrScannedPages} of ${numPages} page(s) contained no selectable text (possible scanned annexures or blank separator pages).`
      );
    } else if (nativeTextPages === 0) {
      warnings.push(
        `All ${numPages} page(s) in this PDF lacked an embedded selectable text layer (scanned or image-only PDF).`
      );
    }

    return {
      fullText: aggregatedChunks.join("\n\n").trim(),
      pages,
      pageCount: numPages,
      nativeTextPages,
      emptyOrScannedPages,
      metadata,
      warnings,
    };
  } catch (err: any) {
    // Fallback for valid %PDF files whose xref table is non-standard or when pdfjs worker fails:
    // ONLY extract valid BT...ET text operators (and decompress FlateDecode in Node if applicable).
    // NEVER return raw PDF binary stream bytes!
    const binaryString = new TextDecoder("latin1").decode(uint8Array);
    const streamRegex = /<<([\s\S]*?)>>\s*stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
    const pageTexts: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = streamRegex.exec(binaryString)) !== null) {
      const dictHeader = match[1] || "";
      const rawStream = match[2] || "";
      let decodedStream = rawStream;

      if (/\/FlateDecode/i.test(dictHeader) && isNode) {
        try {
          const zlib = await import("zlib");
          const buf = Buffer.from(rawStream, "latin1");
          decodedStream = zlib.inflateSync(buf).toString("latin1");
        } catch {
          continue;
        }
      } else if (/\/FlateDecode/i.test(dictHeader) && !isNode) {
        // Cannot synchronously inflate without zlib; skip compressed binary stream to avoid binary garbage
        continue;
      }

      const extracted = extractTextFromPdfContentStream(decodedStream);
      if (extracted && !isSuspiciousPdfBinaryGarbage(extracted)) {
        pageTexts.push(extracted);
      }
    }

    if (pageTexts.length > 0) {
      const pages: DocumentPage[] = pageTexts.map((txt, idx) => ({
        pageNumber: idx + 1,
        text: txt,
        confidence: 0.92,
        isOcr: false,
      }));
      const fullText = pages.map(p => `--- [Page ${p.pageNumber}] ---\n${p.text}`).join("\n\n");
      return {
        fullText,
        pages,
        pageCount: pages.length,
        nativeTextPages: pages.length,
        emptyOrScannedPages: 0,
        warnings: [`Used PDF content-stream operator parser (${err?.message || "non-standard xref"}).`],
      };
    }

    throw new Error(
      `Failed to extract readable text from PDF (${err?.message || "Corrupted PDF structure"}).`
    );
  }
}

