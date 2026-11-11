/**
 * DOCULENS PPTX Text Extractor
 * Supports both raw XML strings and ZIP-compressed .pptx binary containers,
 * extracting slide-by-slide text in reading order.
 */

import { DocumentPage } from "../../types";

function decodeXmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function extractTextFromSlideXml(xml: string): string {
  // Split by paragraph <a:p> to preserve slide bullet lines
  const paragraphs = xml.match(/<a:p\b[^>]*>[\s\S]*?<\/a:p>/gi);
  if (paragraphs && paragraphs.length > 0) {
    const lines: string[] = [];
    for (const p of paragraphs) {
      const tMatches = p.match(/<a:t[^>]*>([\s\S]*?)<\/a:t>/gi);
      if (tMatches && tMatches.length > 0) {
        const line = tMatches
          .map(tag => decodeXmlEntities(tag.replace(/<\/?a:t[^>]*>/gi, "")))
          .join("")
          .trim();
        if (line) lines.push(line);
      }
    }
    if (lines.length > 0) return lines.join("\n");
  }

  const textMatches = xml.match(/<a:t[^>]*>([\s\S]*?)<\/a:t>/gi);
  if (textMatches && textMatches.length > 0) {
    return textMatches
      .map(tag => decodeXmlEntities(tag.replace(/<\/?a:t[^>]*>/gi, "")))
      .join(" ")
      .trim();
  }
  return "";
}

async function inflateRawBytes(compressed: Uint8Array): Promise<Uint8Array | null> {
  if (typeof window === "undefined") {
    try {
      const zlib = await import("zlib");
      return new Uint8Array(zlib.inflateRawSync(Buffer.from(compressed)));
    } catch {
      return null;
    }
  } else if (typeof DecompressionStream !== "undefined") {
    try {
      const ds = new DecompressionStream("deflate-raw");
      const writer = ds.writable.getWriter();
      writer.write(new Uint8Array(compressed));
      writer.close();
      const response = new Response(ds.readable);
      const ab = await response.arrayBuffer();
      return new Uint8Array(ab);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Extracts files matching a predicate from a ZIP container via Central Directory
 */
export async function extractZipEntries(
  buffer: ArrayBuffer | Uint8Array,
  fileFilter: (name: string) => boolean
): Promise<Array<{ name: string; content: string }>> {
  const bytes = buffer instanceof Uint8Array
    ? new Uint8Array(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength))
    : new Uint8Array(buffer.slice(0));

  if (bytes.byteLength < 22 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
    return [];
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  // Find End of Central Directory (EOCD) signature 0x06054b50
  let eocdOffset = -1;
  const minEocd = Math.max(0, bytes.byteLength - 65557);
  for (let i = bytes.byteLength - 22; i >= minEocd; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset === -1) return [];

  const cdEntries = view.getUint16(eocdOffset + 10, true);
  const cdOffset = view.getUint32(eocdOffset + 16, true);
  const results: Array<{ name: string; content: string }> = [];

  let ptr = cdOffset;
  for (let i = 0; i < cdEntries && ptr + 46 <= bytes.byteLength; i++) {
    if (view.getUint32(ptr, true) !== 0x02014b50) break;
    const compressionMethod = view.getUint16(ptr + 10, true);
    const compressedSize = view.getUint32(ptr + 20, true);
    const fileNameLen = view.getUint16(ptr + 28, true);
    const extraLen = view.getUint16(ptr + 30, true);
    const commentLen = view.getUint16(ptr + 32, true);
    const localHeaderOffset = view.getUint32(ptr + 42, true);

    const entryName = new TextDecoder("utf-8").decode(bytes.subarray(ptr + 46, ptr + 46 + fileNameLen));
    ptr += 46 + fileNameLen + extraLen + commentLen;

    if (!fileFilter(entryName)) continue;
    if (localHeaderOffset + 30 > bytes.byteLength) continue;
    if (view.getUint32(localHeaderOffset, true) !== 0x04034b50) continue;

    const localNameLen = view.getUint16(localHeaderOffset + 26, true);
    const localExtraLen = view.getUint16(localHeaderOffset + 28, true);
    const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
    const dataEnd = dataStart + compressedSize;
    if (dataEnd > bytes.byteLength) continue;

    const rawSlice = bytes.subarray(dataStart, dataEnd);
    let uncompressedBytes: Uint8Array | null = null;

    if (compressionMethod === 0) {
      uncompressedBytes = rawSlice;
    } else if (compressionMethod === 8) {
      uncompressedBytes = await inflateRawBytes(rawSlice);
    }

    if (uncompressedBytes) {
      results.push({
        name: entryName,
        content: new TextDecoder("utf-8").decode(uncompressedBytes),
      });
    }
  }

  return results;
}

export async function parsePptxBuffer(buffer: ArrayBuffer | Uint8Array): Promise<{
  fullText: string;
  pages: DocumentPage[];
}> {
  const entries = await extractZipEntries(buffer, name => /^ppt\/slides\/slide\d+\.xml$/i.test(name));
  if (entries.length > 0) {
    // Sort slides numerically: slide1.xml, slide2.xml, ...
    entries.sort((a, b) => {
      const numA = parseInt(a.name.match(/slide(\d+)\.xml/i)?.[1] || "1", 10);
      const numB = parseInt(b.name.match(/slide(\d+)\.xml/i)?.[1] || "1", 10);
      return numA - numB;
    });

    const pages: DocumentPage[] = [];
    const fullTextChunks: string[] = [];

    entries.forEach((entry, idx) => {
      const slideNum = idx + 1;
      const slideText = extractTextFromSlideXml(entry.content);
      pages.push({
        pageNumber: slideNum,
        pageLabel: `Slide ${slideNum}`,
        text: slideText,
        confidence: 0.96,
      });
      if (slideText) {
        fullTextChunks.push(`--- [Page ${slideNum}] ---\n${slideText}`);
      }
    });

    return {
      fullText: fullTextChunks.join("\n\n").trim(),
      pages,
    };
  }

  // Fallback if buffer was plain XML text
  const rawText = new TextDecoder("utf-8").decode(buffer);
  return parsePptxText(rawText);
}

export function parsePptxText(xmlOrBufferText: string): {
  fullText: string;
  pages: DocumentPage[];
} {
  const extracted = extractTextFromSlideXml(xmlOrBufferText);

  const pages: DocumentPage[] = [
    {
      pageNumber: 1,
      text: extracted,
      confidence: extracted ? 0.92 : 0.4,
    },
  ];

  return {
    fullText: extracted,
    pages,
  };
}

