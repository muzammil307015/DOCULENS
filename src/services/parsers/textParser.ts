/**
 * DOCULENS Text & Markdown Parser
 */

import { DocumentPage } from "../../types";

export function parsePlainText(content: string): {
  fullText: string;
  pages: DocumentPage[];
} {
  const fullText = content || "";
  const lines = fullText.split(/\r?\n/);
  const linesPerPage = 55;
  const pages: DocumentPage[] = [];

  if (lines.length <= linesPerPage) {
    pages.push({
      pageNumber: 1,
      text: fullText,
      confidence: 1.0,
    });
  } else {
    let pageNum = 1;
    for (let i = 0; i < lines.length; i += linesPerPage) {
      const pageText = lines.slice(i, i + linesPerPage).join("\n");
      pages.push({
        pageNumber: pageNum++,
        text: pageText,
        confidence: 1.0,
      });
    }
  }

  return { fullText, pages };
}
