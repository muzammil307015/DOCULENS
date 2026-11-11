/**
 * DOCULENS OpenDocument Parser (ODT & ODP)
 * Extracts text, headings, lists, and tables from content.xml inside OpenDocument packages.
 */

import { DocumentPage } from "../../types";
import { extractZipEntries } from "./pptxParser";

function extractLinesFromOdtXml(xmlString: string): string[] {
  const paragraphMatches = xmlString.match(/<text:[ph][^>]*>([\s\S]*?)<\/text:[ph]>/gi);
  if (paragraphMatches && paragraphMatches.length > 0) {
    return paragraphMatches
      .map(p =>
        p
          .replace(/<[^>]+>/g, " ")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
          .replace(/\s+/g, " ")
          .trim()
      )
      .filter(l => l.length > 0);
  }
  return [];
}

export async function parseOdtArchiveBuffer(buffer: ArrayBuffer | Uint8Array): Promise<{
  fullText: string;
  pages: DocumentPage[];
}> {
  const entries = await extractZipEntries(buffer, name => name.toLowerCase() === "content.xml");
  if (entries.length > 0) {
    const lines = extractLinesFromOdtXml(entries[0].content);
    const fullText = lines.join("\n\n");
    return {
      fullText,
      pages: [
        {
          pageNumber: 1,
          text: fullText,
          confidence: lines.length > 0 ? 0.96 : 0.4,
        },
      ],
    };
  }
  return parseOdtBuffer(buffer);
}

export function parseOdtBuffer(buffer: ArrayBuffer | Uint8Array): {
  fullText: string;
  pages: DocumentPage[];
} {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const binaryString = new TextDecoder("latin1").decode(bytes);

  const extractedLines = extractLinesFromOdtXml(binaryString);

  // Only fall back to plain text if buffer is not a binary ZIP archive
  if (extractedLines.length === 0 && !(bytes[0] === 0x50 && bytes[1] === 0x4b)) {
    const cleaned = binaryString
      .replace(/[^\x20-\x7E\t\n\r]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (cleaned.length > 10) {
      extractedLines.push(cleaned);
    }
  }

  const fullText = extractedLines.join("\n\n");
  const words = fullText.split(/\s+/).filter(Boolean);

  const pages: DocumentPage[] = [
    {
      pageNumber: 1,
      text: fullText,
      confidence: words.length > 10 ? 0.94 : 0.5,
    },
  ];

  return { fullText, pages };
}

