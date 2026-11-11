/**
 * DOCULENS RTF (Rich Text Format) Parser
 * Strips RTF control words and groups while preserving structured plain text and paragraphs.
 */

import { DocumentPage } from "../../types";

export function parseRtfBuffer(buffer: ArrayBuffer | Uint8Array): {
  fullText: string;
  pages: DocumentPage[];
} {
  let rtfStr = "";
  try {
    const utf8Decoder = new TextDecoder("utf-8", { fatal: true });
    rtfStr = utf8Decoder.decode(buffer);
  } catch {
    const latinDecoder = new TextDecoder("latin1");
    rtfStr = latinDecoder.decode(buffer);
  }

  // RTF stripping logic
  let text = rtfStr;

  // Remove font tables, color tables, stylesheets, info blocks
  text = text.replace(/\{\\(?:fonttbl|colortbl|stylesheet|info|pict)[^}]*\}/gi, "");

  // Replace \par and \line with newlines
  text = text.replace(/\\(?:par|line)\b/gi, "\n");

  // Replace \tab with tab/spaces
  text = text.replace(/\\tab\b/gi, "    ");

  // Decode hex characters e.g. \'e9 -> character
  text = text.replace(/\\'([0-9a-fA-F]{2})/g, (_, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });

  // Remove any remaining control words: \word or \word123
  text = text.replace(/\\[a-zA-Z]+-?\d* ?/g, "");

  // Remove unescaped braces { and }
  text = text.replace(/[{}]/g, "");

  // Clean extra spaces while preserving paragraph breaks
  const cleanLines = text
    .split(/\r?\n/)
    .map(line => line.replace(/[^\x20-\x7E\t\n\r\u00A0-\uFFFF]/g, " ").replace(/\s+/g, " ").trim())
    .filter(line => line.length > 0);

  const fullText = cleanLines.join("\n\n");
  const words = fullText.split(/\s+/).filter(Boolean);

  const pages: DocumentPage[] = [
    {
      pageNumber: 1,
      text: fullText || "RTF document parsed. Structured text extracted.",
      confidence: words.length > 10 ? 0.95 : 0.6,
    },
  ];

  return { fullText, pages };
}
