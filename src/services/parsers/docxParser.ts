/**
 * DOCULENS DOCX Parser using Mammoth
 * Compatible with both Node.js Buffer and Browser ArrayBuffer runtimes.
 */

import mammoth from "mammoth";
import { DocumentPage } from "../../types";

export async function parseDocxBuffer(buffer: ArrayBuffer | Uint8Array | Buffer): Promise<{
  fullText: string;
  pages: DocumentPage[];
}> {
  try {
    const uint8 = buffer instanceof Uint8Array
      ? new Uint8Array(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength))
      : new Uint8Array((buffer as ArrayBuffer).slice(0));

    const isNode = typeof window === "undefined" && typeof Buffer !== "undefined";
    const inputOption = isNode
      ? { buffer: Buffer.from(uint8) }
      : { arrayBuffer: uint8.buffer };

    const result = await mammoth.extractRawText(inputOption as any);
    const fullText = (result.value || "").trim();

    // Break into simulated pages (~350 words per page) for consistent citation navigation
    const words = fullText.split(/\s+/).filter(Boolean);
    const wordsPerPage = 350;
    const pages: DocumentPage[] = [];

    if (words.length <= wordsPerPage) {
      pages.push({
        pageNumber: 1,
        text: fullText,
        confidence: 0.99,
      });
    } else {
      const lines = fullText.split(/\r?\n/);
      let currentChunk: string[] = [];
      let currentWordCount = 0;
      let pageNum = 1;

      for (const line of lines) {
        const lineWords = line.trim().split(/\s+/).filter(Boolean).length;
        if (currentWordCount + lineWords > wordsPerPage && currentChunk.length > 0) {
          pages.push({
            pageNumber: pageNum++,
            text: currentChunk.join("\n").trim(),
            confidence: 0.99,
          });
          currentChunk = [];
          currentWordCount = 0;
        }
        currentChunk.push(line);
        currentWordCount += lineWords;
      }

      if (currentChunk.length > 0) {
        pages.push({
          pageNumber: pageNum++,
          text: currentChunk.join("\n").trim(),
          confidence: 0.99,
        });
      }
    }

    return { fullText, pages };
  } catch (err: any) {
    console.error("DOCX extraction error:", err);
    throw new Error(`Failed to parse DOCX file: ${err?.message || "Corrupted DOCX archive"}`);
  }
}

