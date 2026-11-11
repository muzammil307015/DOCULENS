/**
 * DOCULENS Privacy-First Pipeline & Redaction Engine
 *
 * Deterministically scans extracted text, cells, and metadata for sensitive identifiers.
 * Enforces strict default visibility policies and guarantees external AI only receives
 * the sanitized redacted copy.
 */

import { APP_CONFIG } from "../config/appConfig";
import { SensitiveCategory, SensitiveDetection, VisibilityState } from "../types";

/**
 * Luhn Algorithm check for payment card numbers
 */
export function isValidLuhn(cardNumber: string): boolean {
  const digits = cardNumber.replace(/[\s-]/g, "");
  if (!/^\d{13,19}$/.test(digits)) return false;

  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

/**
 * Mask string revealing only last 4 chars if long enough
 */
export function maskSensitiveText(val: string, category: SensitiveCategory): string {
  const clean = val.trim();
  if (category === "paymentCard" || category === "bankAccount" || category === "phoneNumber" || category === "governmentId") {
    if (clean.length > 4) {
      const lastFour = clean.slice(-4);
      return `••••••••${lastFour}`;
    }
    return "••••••••";
  }
  if (category === "passwordOrToken") {
    return "••••••••[SECRET]";
  }
  if (category === "personalAddress") {
    return "•••••••• [REDACTED ADDRESS]";
  }
  return "••••••••";
}

/**
 * Deterministic detection patterns
 */
export function detectSensitiveEntities(text: string): SensitiveDetection[] {
  const detections: SensitiveDetection[] = [];
  let idCounter = 1;

  // 1. Payment Cards (13-19 digits with spaces/dashes, tested with Luhn)
  const cardRegex = /\b(?:\d{4}[-\s]?){3}\d{4}\b|\b\d{15,16}\b/g;
  let match: RegExpExecArray | null;
  while ((match = cardRegex.exec(text)) !== null) {
    const raw = match[0];
    const isLuhn = isValidLuhn(raw);
    if (isLuhn) {
      detections.push({
        id: `sens_${idCounter++}`,
        category: "paymentCard",
        rawText: raw,
        maskedText: maskSensitiveText(raw, "paymentCard"),
        start: match.index,
        end: match.index + raw.length,
        sourceContext: extractContext(text, match.index, raw.length),
        isLuhnValid: true,
        visibility: APP_CONFIG.defaultVisibilityPolicy.paymentCard,
      });
    }
  }

  // 2. Government IDs (SSN, Aadhaar, PAN, Passports, Tax IDs)
  // SSN: \b\d{3}-\d{2}-\d{4}\b
  const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/g;
  while ((match = ssnRegex.exec(text)) !== null) {
    const raw = match[0];
    detections.push({
      id: `sens_${idCounter++}`,
      category: "governmentId",
      rawText: raw,
      maskedText: maskSensitiveText(raw, "governmentId"),
      start: match.index,
      end: match.index + raw.length,
      sourceContext: extractContext(text, match.index, raw.length),
      visibility: APP_CONFIG.defaultVisibilityPolicy.governmentId,
    });
  }

  // Indian PAN card: [A-Z]{5}[0-9]{4}[A-Z]{1}
  const panRegex = /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g;
  while ((match = panRegex.exec(text)) !== null) {
    const raw = match[0];
    detections.push({
      id: `sens_${idCounter++}`,
      category: "governmentId",
      rawText: raw,
      maskedText: maskSensitiveText(raw, "governmentId"),
      start: match.index,
      end: match.index + raw.length,
      sourceContext: extractContext(text, match.index, raw.length),
      visibility: APP_CONFIG.defaultVisibilityPolicy.governmentId,
    });
  }

  // Aadhaar: 12 digits (often 4 4 4)
  const aadhaarRegex = /\b\d{4}\s\d{4}\s\d{4}\b/g;
  while ((match = aadhaarRegex.exec(text)) !== null) {
    const raw = match[0];
    detections.push({
      id: `sens_${idCounter++}`,
      category: "governmentId",
      rawText: raw,
      maskedText: maskSensitiveText(raw, "governmentId"),
      start: match.index,
      end: match.index + raw.length,
      sourceContext: extractContext(text, match.index, raw.length),
      visibility: APP_CONFIG.defaultVisibilityPolicy.governmentId,
    });
  }

  // 3. Bank Account Numbers & IBAN
  // IBAN: 2 letters followed by 2 digits and up to 30 alphanumeric characters
  const ibanRegex = /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/g;
  while ((match = ibanRegex.exec(text)) !== null) {
    const raw = match[0];
    detections.push({
      id: `sens_${idCounter++}`,
      category: "bankAccount",
      rawText: raw,
      maskedText: maskSensitiveText(raw, "bankAccount"),
      start: match.index,
      end: match.index + raw.length,
      sourceContext: extractContext(text, match.index, raw.length),
      visibility: APP_CONFIG.defaultVisibilityPolicy.bankAccount,
    });
  }

  // Bank account labelled context e.g. "Account No: 9182391283" or "A/c: 23123123"
  const acctRegex = /(?:account\s*no\.?|a\/c\s*no\.?|acct#?)\s*[:=\-]?\s*([0-9]{9,18})/gi;
  while ((match = acctRegex.exec(text)) !== null) {
    const raw = match[1];
    const startIndex = match.index + match[0].indexOf(raw);
    detections.push({
      id: `sens_${idCounter++}`,
      category: "bankAccount",
      rawText: raw,
      maskedText: maskSensitiveText(raw, "bankAccount"),
      start: startIndex,
      end: startIndex + raw.length,
      sourceContext: extractContext(text, startIndex, raw.length),
      visibility: APP_CONFIG.defaultVisibilityPolicy.bankAccount,
    });
  }

  // 4. Phone Numbers (strict validation to avoid date patterns like 2021-06-07 or version numbers)
  // Pattern A: Labeled phone context (e.g. "Tel: +1-800-555-0199", "Phone: (415) 555-2671")
  const labeledPhoneRegex = /(?:tel(?:ephone)?|phone|mobile|cell|ph\.?|fax)\s*[:=\-]?\s*(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b/gi;
  while ((match = labeledPhoneRegex.exec(text)) !== null) {
    const raw = match[0];
    const digitsOnly = raw.replace(/\D/g, "");
    if (digitsOnly.length >= 10 && digitsOnly.length <= 15) {
      if (!isOverlapping(detections, match.index, match.index + raw.length)) {
        detections.push({
          id: `sens_${idCounter++}`,
          category: "phoneNumber",
          rawText: raw,
          maskedText: maskSensitiveText(raw, "phoneNumber"),
          start: match.index,
          end: match.index + raw.length,
          sourceContext: extractContext(text, match.index, raw.length),
          visibility: APP_CONFIG.defaultVisibilityPolicy.phoneNumber,
        });
      }
    }
  }

  // Pattern B: Unambiguous standard phone numbers with parentheses and dashes e.g. (555) 019-2834 or +1-800-555-0199
  const standardPhoneRegex = /\b(?:\+1[-.\s])?\([2-9]\d{2}\)[-.\s][2-9]\d{2}[-.\s]\d{4}\b|\b\+(?:91|44|33|49|81|86)[-.\s]\d{4,5}[-.\s]\d{4,5}\b/g;
  while ((match = standardPhoneRegex.exec(text)) !== null) {
    const raw = match[0];
    // Exclude if it looks like a date (e.g. year-month-day)
    if (!/^\d{4}-\d{2}-\d{2}/.test(raw)) {
      if (!isOverlapping(detections, match.index, match.index + raw.length)) {
        detections.push({
          id: `sens_${idCounter++}`,
          category: "phoneNumber",
          rawText: raw,
          maskedText: maskSensitiveText(raw, "phoneNumber"),
          start: match.index,
          end: match.index + raw.length,
          sourceContext: extractContext(text, match.index, raw.length),
          visibility: APP_CONFIG.defaultVisibilityPolicy.phoneNumber,
        });
      }
    }
  }

  // 5. Personal Addresses (must be on a single line, never crossing paragraph/line boundaries)
  const addressRegex = /\b\d{1,5}[^\S\r\n]+[A-Za-z0-9#.,'\- ]{3,35}[^\S\r\n]+(?:Street|St\.?|Avenue|Ave\.?|Boulevard|Blvd\.?|Lane|Ln\.?|Court|Ct\.?|Apartment|Apt\.?|Suite|Ste\.?|Sector\s+\d+|Pincode\s+\d{6}|Zip\s+\d{5})\b/gi;
  while ((match = addressRegex.exec(text)) !== null) {
    const raw = match[0];
    // Disqualify if raw text contains newline or looks like general prose
    if (!raw.includes("\n") && !isOverlapping(detections, match.index, match.index + raw.length)) {
      detections.push({
        id: `sens_${idCounter++}`,
        category: "personalAddress",
        rawText: raw,
        maskedText: maskSensitiveText(raw, "personalAddress"),
        start: match.index,
        end: match.index + raw.length,
        sourceContext: extractContext(text, match.index, raw.length),
        visibility: APP_CONFIG.defaultVisibilityPolicy.personalAddress,
      });
    }
  }

  // 6. Passwords, API Keys, Tokens (e.g. sk-..., bearer tokens, private keys)
  const tokenRegex = /\b(?:sk-[a-zA-Z0-9_-]{20,}|Bearer\s+[a-zA-Z0-9_\-.~+/]+=*|AIza[0-9A-Za-z-_]{35}|ghp_[a-zA-Z0-9]{36}|password\s*[:=]\s*[^\s,;]+)\b/gi;
  while ((match = tokenRegex.exec(text)) !== null) {
    const raw = match[0];
    if (!isOverlapping(detections, match.index, match.index + raw.length)) {
      detections.push({
        id: `sens_${idCounter++}`,
        category: "passwordOrToken",
        rawText: raw,
        maskedText: maskSensitiveText(raw, "passwordOrToken"),
        start: match.index,
        end: match.index + raw.length,
        sourceContext: extractContext(text, match.index, raw.length),
        visibility: APP_CONFIG.defaultVisibilityPolicy.passwordOrToken,
      });
    }
  }

  // 7. Visible entities (Company names, Person names, Emails)
  // Emails (VISIBLE by default)
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  while ((match = emailRegex.exec(text)) !== null) {
    const raw = match[0];
    if (!isOverlapping(detections, match.index, match.index + raw.length)) {
      detections.push({
        id: `sens_${idCounter++}`,
        category: "emailAddress",
        rawText: raw,
        maskedText: raw, // Visible by default
        start: match.index,
        end: match.index + raw.length,
        sourceContext: extractContext(text, match.index, raw.length),
        visibility: APP_CONFIG.defaultVisibilityPolicy.emailAddress,
      });
    }
  }

  // Organization & Entity Names (VISIBLE by default)
  const orgRegex = /(?:issued\s+by|issuing\s+authority|organization|organisation|client|proposer|contractor|entity)\s*[:=\-]\s*([A-Z0-9][A-Za-z0-9\s,&.\-]{3,60})/gi;
  while ((match = orgRegex.exec(text)) !== null) {
    const raw = match[1].trim();
    if (raw.length > 3 && !isOverlapping(detections, match.index, match.index + match[0].length)) {
      detections.push({
        id: `sens_${idCounter++}`,
        category: "companyName",
        rawText: raw,
        maskedText: raw, // Visible by default
        start: match.index + match[0].indexOf(raw),
        end: match.index + match[0].indexOf(raw) + raw.length,
        sourceContext: extractContext(text, match.index, match[0].length),
        visibility: APP_CONFIG.defaultVisibilityPolicy.companyName,
      });
    }
  }

  // Sort detections by position
  detections.sort((a, b) => a.start - b.start);
  return detections;
}

function isOverlapping(detections: SensitiveDetection[], start: number, end: number): boolean {
  return detections.some(d => (start >= d.start && start < d.end) || (end > d.start && end <= d.end));
}

function extractContext(fullText: string, start: number, length: number): string {
  const windowSize = 35;
  const ctxStart = Math.max(0, start - windowSize);
  const ctxEnd = Math.min(fullText.length, start + length + windowSize);
  return (ctxStart > 0 ? "..." : "") + fullText.substring(ctxStart, ctxEnd).replace(/\s+/g, " ") + (ctxEnd < fullText.length ? "..." : "");
}

/**
 * Creates the sanitized redacted copy of the text for external AI consumption.
 * Items with visibility === 'HIDDEN' are strictly replaced with a placeholder token.
 */
export function buildRedactedTextCopy(
  originalText: string,
  detections: SensitiveDetection[]
): string {
  const hiddenDetections = detections
    .filter(d => d.visibility === "HIDDEN")
    .sort((a, b) => b.start - a.start); // replace back-to-front to preserve indexes

  let result = originalText;
  for (const item of hiddenDetections) {
    const token = getCategoryToken(item.category);
    result = result.slice(0, item.start) + token + result.slice(item.end);
  }
  return result;
}

function getCategoryToken(category: SensitiveCategory): string {
  switch (category) {
    case "phoneNumber":
      return "[REDACTED: PHONE_NUMBER]";
    case "personalAddress":
      return "[REDACTED: PERSONAL_ADDRESS]";
    case "governmentId":
      return "[REDACTED: GOV_ID]";
    case "bankAccount":
      return "[REDACTED: BANK_ACCOUNT]";
    case "paymentCard":
      return "[REDACTED: PAYMENT_CARD]";
    case "passwordOrToken":
      return "[REDACTED: SECRET_TOKEN]";
    default:
      return "[REDACTED: CONFIDENTIAL]";
  }
}
