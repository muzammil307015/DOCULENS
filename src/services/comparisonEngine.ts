/**
 * DOCULENS Requirement Comparison & Readiness Engine
 *
 * Compares analyzed document requirements against User Profile and Evidence Vault facts.
 * Generates transparent readiness scores without false guarantees.
 * Supports multi-document intelligence and clause diffing.
 */

import {
  EvidenceDocument,
  FullDocumentAnalysis,
  RequirementItem,
  RequirementVerificationStatus,
  UserProfile,
} from "../types";

export interface ComparisonResult {
  requirementsWithStatus: (RequirementItem & {
    matchedFactTitle?: string;
    matchedSourceDoc?: string;
    comparisonReasoning?: string;
  })[];
  readinessScore: number;
  readinessFormula: string;
  contributingRequirements: {
    foundCount: number;
    missingCount: number;
    needsVerificationCount: number;
    conflictCount: number;
    totalCount: number;
  };
  hasSufficientEvidenceForScore: boolean;
  actionableGaps: string[];
}

export function compareRequirementsAgainstVault(
  analysis: FullDocumentAnalysis,
  profile: UserProfile | null,
  vaultDocs: EvidenceDocument[]
): ComparisonResult {
  const reqs = analysis.requirements;
  let foundCount = 0;
  let missingCount = 0;
  let needsVerificationCount = 0;
  let conflictCount = 0;
  const actionableGaps: string[] = [];

  // Flatten all extracted facts from user's vault documents
  const allFacts = vaultDocs.flatMap(d =>
    d.facts.map(f => ({
      ...f,
      parentDocName: d.fileName,
      parentDocVerified: d.verificationStatus,
    }))
  );

  const requirementsWithStatus = reqs.map(req => {
    const reqLower = req.name.toLowerCase() + " " + req.description.toLowerCase();

    // Check against profile credentials first (e.g. GST, Turnover, Registration)
    if (profile) {
      if (reqLower.includes("gst") && profile.gstNumber) {
        foundCount++;
        return {
          ...req,
          verificationStatus: "FOUND" as RequirementVerificationStatus,
          matchedEvidenceText: `GST Registration: ${profile.gstNumber}`,
          matchedFactTitle: "Profile GST Credential",
          comparisonReasoning: `Matched against user profile verified GST ID (${profile.gstNumber}). Evidence present, subject to statutory filing status.`,
        };
      }
      if (reqLower.includes("turnover") && profile.annualTurnover) {
        foundCount++;
        return {
          ...req,
          verificationStatus: "FOUND" as RequirementVerificationStatus,
          matchedEvidenceText: `Annual Turnover: ${profile.annualTurnover}`,
          matchedFactTitle: "Audited Financial Record",
          comparisonReasoning: `Matched profile turnover data (${profile.annualTurnover}).`,
        };
      }
      if (reqLower.includes("incorporation") || reqLower.includes("company registration")) {
        if (profile.companyRegistrationNumber) {
          foundCount++;
          return {
            ...req,
            verificationStatus: "FOUND" as RequirementVerificationStatus,
            matchedEvidenceText: `Registration No: ${profile.companyRegistrationNumber}`,
            matchedFactTitle: "Certificate of Incorporation",
            comparisonReasoning: `Matched corporate registration number from profile.`,
          };
        }
      }
      if (reqLower.includes("pan") && profile.panNumber) {
        foundCount++;
        return {
          ...req,
          verificationStatus: "FOUND" as RequirementVerificationStatus,
          matchedEvidenceText: `PAN Card: ${profile.panNumber}`,
          matchedFactTitle: "Profile Tax ID",
          comparisonReasoning: `Permanent Account Number available in saved profile.`,
        };
      }
    }

    // Check against vault documents and facts
    const matchedDoc = vaultDocs.find(vd => {
      const docName = vd.fileName.toLowerCase();
      const cat = vd.category.toLowerCase();
      return (
        (reqLower.includes("gst") && docName.includes("gst")) ||
        (reqLower.includes("incorporation") && (docName.includes("incorporation") || docName.includes("cert"))) ||
        (reqLower.includes("balance sheet") && (docName.includes("balance") || docName.includes("audit") || docName.includes("financial"))) ||
        (reqLower.includes("resume") || reqLower.includes("cv")) && (docName.includes("cv") || docName.includes("resume")) ||
        (reqLower.includes("marksheet") || reqLower.includes("degree")) && (docName.includes("degree") || docName.includes("transcript") || docName.includes("mark")) ||
        (reqLower.includes("passport") || reqLower.includes("identity") || reqLower.includes("id")) && (docName.includes("id") || docName.includes("passport")) ||
        (reqLower.includes("experience") && (docName.includes("experience") || docName.includes("letter")))
      );
    });

    if (matchedDoc) {
      foundCount++;
      return {
        ...req,
        verificationStatus: "FOUND" as RequirementVerificationStatus,
        matchedEvidenceId: matchedDoc.id,
        matchedEvidenceText: `Document on file: ${matchedDoc.fileName}`,
        matchedSourceDoc: matchedDoc.fileName,
        comparisonReasoning: `Matching evidence located in vault (${matchedDoc.fileName}). Marked as FOUND (indicates file existence in repository, not third-party verified).`,
      };
    }

    // If marked optional or special clause
    if (!req.mandatory) {
      return {
        ...req,
        verificationStatus: "NOT_APPLICABLE" as RequirementVerificationStatus,
        comparisonReasoning: "Optional preference item; does not strictly block submission eligibility.",
      };
    }

    // Default: missing evidence
    missingCount++;
    actionableGaps.push(req.name);
    return {
      ...req,
      verificationStatus: "MISSING_EVIDENCE" as RequirementVerificationStatus,
      comparisonReasoning: "No matching document or verified profile credential found in Evidence Vault.",
    };
  });

  const mandatoryTotal = reqs.filter(r => r.mandatory).length || 1;
  const hasSufficientEvidence = vaultDocs.length > 0 || (profile !== null && Object.keys(profile).length > 2);

  // Transparent readiness score calculation
  const score = Math.min(100, Math.round((foundCount / mandatoryTotal) * 100));
  const readinessFormula = `Readiness = (Mandatory Requirements Located: ${foundCount} / Total Mandatory: ${mandatoryTotal}) × 100% = ${score}%. NOTE: A score of 100% indicates all required documents are located in your vault; it does NOT guarantee acceptance, qualification, or selection by the issuing authority.`;

  return {
    requirementsWithStatus,
    readinessScore: hasSufficientEvidence ? score : 0,
    readinessFormula,
    contributingRequirements: {
      foundCount,
      missingCount,
      needsVerificationCount,
      conflictCount,
      totalCount: reqs.length,
    },
    hasSufficientEvidenceForScore: hasSufficientEvidence,
    actionableGaps,
  };
}

/**
 * Multi-Document Cross-Comparison
 * Compares two or three documents (e.g. two tender versions, or competing tenders)
 */
export function compareMultipleDocuments(analyses: FullDocumentAnalysis[]): {
  commonRequirements: string[];
  differingClauses: { clause: string; values: { docTitle: string; value: string }[] }[];
  deadlinesComparison: { docTitle: string; deadline: string; daysRemaining?: number }[];
  combinedChecklist: { title: string; sourceDocs: string[] }[];
} {
  if (analyses.length < 2) {
    return {
      commonRequirements: [],
      differingClauses: [],
      deadlinesComparison: [],
      combinedChecklist: [],
    };
  }

  // 1. Deadlines comparison
  const deadlinesComparison = analyses.map(a => {
    const mainDl = a.importantDates.find(d => d.type === "official_deadline");
    return {
      docTitle: a.title,
      deadline: mainDl ? mainDl.rawText : "No explicit deadline",
      daysRemaining: mainDl?.daysRemaining,
    };
  });

  // 2. Identify common requirements
  const firstReqs = analyses[0].requirements.map(r => r.name.toLowerCase());
  const commonRequirements = analyses[0].requirements
    .filter(r => {
      const lower = r.name.toLowerCase();
      return analyses.slice(1).every(other =>
        other.requirements.some(or => or.name.toLowerCase().includes(lower) || lower.includes(or.name.toLowerCase()))
      );
    })
    .map(r => r.name);

  // 3. Differing clauses (e.g. Financials, Turnover, Experience)
  const differingClauses = [
    {
      clause: "Primary Financial Allocation / Value",
      values: analyses.map(a => ({
        docTitle: a.title,
        value: a.financialInformation[0]?.amountText || "Not specified",
      })),
    },
    {
      clause: "Issuing Entity / Authority",
      values: analyses.map(a => ({
        docTitle: a.title,
        value: a.keyInfo.issuingOrganisation || "Unstated",
      })),
    },
    {
      clause: "Total Mandatory Document Count",
      values: analyses.map(a => ({
        docTitle: a.title,
        value: `${a.requirements.filter(r => r.mandatory).length} mandatory documents`,
      })),
    },
  ];

  // 4. Combined checklist across documents
  const combinedMap = new Map<string, string[]>();
  for (const a of analyses) {
    for (const item of a.actionPlan) {
      const existing = combinedMap.get(item.title) || [];
      existing.push(a.title);
      combinedMap.set(item.title, existing);
    }
  }

  const combinedChecklist = Array.from(combinedMap.entries()).map(([title, sourceDocs]) => ({
    title,
    sourceDocs,
  }));

  return {
    commonRequirements,
    differingClauses,
    deadlinesComparison,
    combinedChecklist,
  };
}
