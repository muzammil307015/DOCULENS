/**
 * DOCULENS Universal AI Document Intelligence Platform
 * Main Application Orchestrator
 */

import React, { useState, useEffect } from "react";
import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import { LandingPage } from "./components/landing/LandingPage";
import { DashboardHome } from "./components/dashboard/DashboardHome";
import { UploadZone } from "./components/analysis/UploadZone";
import { ScanningOverlay } from "./components/analysis/ScanningOverlay";
import { RedactionReviewModal } from "./components/analysis/RedactionReviewModal";
import { AnalysisStudio } from "./components/analysis/AnalysisStudio";
import { MultiDocComparison } from "./components/comparison/MultiDocComparison";
import { EvidenceVaultView } from "./components/vault/EvidenceVaultView";
import { DeadlinesView } from "./components/deadlines/DeadlinesView";
import { ChecklistsView } from "./components/checklists/ChecklistsView";
import { DocumentMemoryView } from "./components/memory/DocumentMemoryView";
import { AiSettingsView } from "./components/settings/AiSettingsView";
import { PrivacyCenterView } from "./components/settings/PrivacyCenterView";
import { MyDocumentsView } from "./components/documents/MyDocumentsView";
import { AccountModal } from "./components/modals/AccountModal";
import { VaultModal } from "./components/modals/VaultModal";
import { CinematicEntryGate } from "./components/entry/CinematicEntryGate";

import {
  DocumentMemoryItem,
  EvidenceDocument,
  FullDocumentAnalysis,
  ParsedDocumentData,
  UserProfile,
  VisibilityState,
} from "./types";
import { storage } from "./services/storageAdapter";
import { parseDocumentFile } from "./services/parsers/unifiedParser";
import { runDeterministicAnalysis } from "./services/deterministicEngine";
import { compareRequirementsAgainstVault } from "./services/comparisonEngine";
import { buildRedactedTextCopy } from "./services/privacyService";
import { AuthView } from "./components/auth/AuthView";
import { auth } from "./config/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { DEMO_DOCUMENTS, DemoDocumentSpec, SAMPLE_PROFILES } from "./services/demoData";
import { isVaultUnlocked } from "./services/byokVault";
import { X, ShieldAlert } from "lucide-react";

const ENTRY_SEEN_SESSION_KEY = "doculens_entry_seen_v2";

const VALID_DIRECT_VIEWS = new Set([
  "landing",
  "overview",
  "dashboard",
  "new_analysis",
  "my_documents",
  "compare",
  "profile",
  "vault",
  "settings",
  "settings_ai",
  "privacy_center",
  "deadlines",
  "checklists",
  "memory",
  "analyze",
  "signin",
  "signup",
  "login",
  "register",
]);

const PROTECTED_VIEWS = new Set([
  "overview",
  "dashboard",
  "new_analysis",
  "my_documents",
  "compare",
  "profile",
  "vault",
  "settings",
  "settings_ai",
  "privacy_center",
  "deadlines",
  "checklists",
  "memory",
  "analyze",
]);

function resolveInitialView(): string {
  if (typeof window === "undefined") return "landing";
  const rawHash = window.location.hash.replace(/^#\/?/, "").trim().toLowerCase();
  if (rawHash && VALID_DIRECT_VIEWS.has(rawHash)) {
    return rawHash;
  }
  return "landing";
}

function shouldShowInitialEntryGate(initialView: string): boolean {
  if (typeof window === "undefined") return false;
  // Direct navigation to an internal workspace route should never block the user
  if (initialView !== "landing") return false;
  try {
    return sessionStorage.getItem(ENTRY_SEEN_SESSION_KEY) !== "1";
  } catch {
    return true;
  }
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [isGuestMode, setIsGuestMode] = useState<boolean>(false);
  const [currentView, setCurrentViewState] = useState<string>(() => {
    const initial = resolveInitialView();
    if (PROTECTED_VIEWS.has(initial) && !auth.currentUser) {
      return "landing";
    }
    return initial;
  });
  const [isEntryGateOpen, setIsEntryGateOpen] = useState<boolean>(() =>
    shouldShowInitialEntryGate(resolveInitialView())
  );
  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);

  const [activeAnalysis, setActiveAnalysis] = useState<FullDocumentAnalysis | null>(null);
  const [activeParsedDoc, setActiveParsedDoc] = useState<ParsedDocumentData | null>(null);
  const [recentAnalyses, setRecentAnalyses] = useState<FullDocumentAnalysis[]>([]);
  const [savedParsedDocs, setSavedParsedDocs] = useState<ParsedDocumentData[]>([]);
  const [evidenceDocs, setEvidenceDocs] = useState<EvidenceDocument[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [memoryItems, setMemoryItems] = useState<DocumentMemoryItem[]>([]);

  // Processing & Modal States
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState("Initializing...");
  const [processingFileName, setProcessingFileName] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [lastAttemptedFile, setLastAttemptedFile] = useState<{
    source: File | { name: string; size: number; type: string; arrayBuffer: () => Promise<ArrayBuffer>; text?: () => Promise<string> };
    isDemo: boolean;
  } | null>(null);
  const [isRedactionModalOpen, setIsRedactionModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const [isDemoActive, setIsDemoActive] = useState(false);
  const [hasServerGemini, setHasServerGemini] = useState(false);

  const isAiConnected = hasServerGemini || isVaultUnlocked();

  // Navigate helper that protects dashboard/workspace routes from unauthenticated visitors
  const setCurrentView = (nextView: string) => {
    let target = nextView;
    if (PROTECTED_VIEWS.has(target) && !auth.currentUser && !isGuestMode) {
      target = "signin";
    }
    setCurrentViewState(target);
    if (typeof window !== "undefined") {
      const targetHash = target === "landing" ? "#landing" : `#${target}`;
      if (window.location.hash !== targetHash) {
        window.history.pushState({ view: target }, "", targetHash);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      let viewFromHash = resolveInitialView();
      if (PROTECTED_VIEWS.has(viewFromHash) && !auth.currentUser && !isGuestMode) {
        viewFromHash = "signin";
      }
      setCurrentViewState(viewFromHash);
      if (viewFromHash !== "landing") {
        setIsEntryGateOpen(false);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isGuestMode]);

  const handleCompleteEntryGate = (listenSelected: boolean) => {
    setAudioEnabled(listenSelected);
    setIsEntryGateOpen(false);
    try {
      sessionStorage.setItem(ENTRY_SEEN_SESSION_KEY, "1");
    } catch {
      // Ignore storage restriction
    }
  };

  const handleReplayEntryGate = () => {
    setCurrentView("landing");
    setIsEntryGateOpen(true);
  };

  // Helper to compute SHA-256 content hash
  const computeSha256 = async (buffer: ArrayBuffer): Promise<string> => {
    try {
      if (typeof crypto !== "undefined" && crypto.subtle) {
        const digest = await crypto.subtle.digest("SHA-256", buffer);
        const hashArray = Array.from(new Uint8Array(digest));
        return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
      }
    } catch {
      // Fallback
    }
    let hash = 0;
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i++) {
      hash = (hash << 5) - hash + bytes[i];
      hash |= 0;
    }
    return "hash_" + Math.abs(hash).toString(16);
  };

  // Reload user data strictly from current user's isolated Firestore collections
  const reloadUserData = React.useCallback(async () => {
    try {
      const analyses = await storage.getAnalyses();
      const parsedDocs = await storage.getParsedDocuments();
      const profile = await storage.getProfile();
      const evidence = await storage.getEvidenceDocuments();
      const memory = await storage.getMemoryItems();

      setRecentAnalyses(analyses);
      setSavedParsedDocs(parsedDocs);
      if (profile) setUserProfile(profile);
      setEvidenceDocs(evidence);
      setMemoryItems(memory);
    } catch (err) {
      console.warn("User data loading notice:", err);
    }
  }, []);

  // Listen to Firebase Auth state transitions
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async user => {
      setCurrentUser(user);
      if (user) {
        setIsGuestMode(false);
        await reloadUserData();
        setCurrentViewState(prev => {
          if (prev === "signin" || prev === "signup" || prev === "login" || prev === "register") {
            if (typeof window !== "undefined") {
              window.history.pushState({ view: "dashboard" }, "", "#dashboard");
            }
            return "dashboard";
          }
          return prev;
        });
      } else if (!isGuestMode) {
        setActiveAnalysis(null);
        setActiveParsedDoc(null);
        setRecentAnalyses([]);
        setSavedParsedDocs([]);
        setEvidenceDocs([]);
        setUserProfile(null);
        setMemoryItems([]);
      }
    });

    return () => unsubAuth();
  }, [isGuestMode, reloadUserData]);

  // Check backend server AI readiness
  useEffect(() => {
    async function checkHealth() {
      try {
        const healthRes = await fetch("/api/health");
        if (healthRes.ok) {
          const healthData = await healthRes.json();
          setHasServerGemini(Boolean(healthData.hasServerGemini || healthData.hasServerOpenRouter));
        }
      } catch {
        // Ignore offline health check failure
      }
    }
    checkHealth();
  }, []);

  // Helper to open an existing analysis and restore its full ParsedDocumentData
  const handleOpenSavedAnalysis = async (analysis: FullDocumentAnalysis) => {
    setActiveAnalysis(analysis);
    setIsDemoActive(Boolean(analysis.isDemo));
    const matchingDoc =
      savedParsedDocs.find(d => d.id === analysis.docId || (analysis.contentHash && d.contentHash === analysis.contentHash)) ||
      (await storage.getParsedDocuments()).find(d => d.id === analysis.docId || (analysis.contentHash && d.contentHash === analysis.contentHash)) ||
      null;
    setActiveParsedDoc(matchingDoc);
    setCurrentView("analyze");
  };

  // Process Document File (Real uploaded file or synthetic Demo document)
  const processDocument = async (
    fileSource: File | { name: string; size: number; type: string; arrayBuffer: () => Promise<ArrayBuffer>; text?: () => Promise<string> },
    isDemo = false
  ) => {
    const startMs = Date.now();
    setUploadError(null);
    setLastAttemptedFile({ source: fileSource, isDemo });
    setIsProcessing(true);
    setProcessingProgress(10);
    setProcessingStage("Validating file signature & calculating SHA-256 content hash...");
    setProcessingFileName(fileSource.name);
    setIsDemoActive(isDemo);

    try {
      const buffer = await fileSource.arrayBuffer();
      const contentHash = await computeSha256(buffer);
      const documentId = `doc_${contentHash.substring(0, 10)}_${Date.now()}`;

      // Step 1: Real parsing & deterministic privacy detection
      const parsed = await parseDocumentFile(fileSource, (stage, percent) => {
        setProcessingStage(stage);
        setProcessingProgress(percent);
      });

      // Attach strict file audit record
      parsed.id = documentId;
      parsed.contentHash = contentHash;
      parsed.originalFilename = fileSource.name;
      parsed.isDemo = isDemo;

      const usablePages = parsed.pages.filter(p => p.text.trim().length > 0).length;
      parsed.extractionAudit = {
        documentId,
        originalFilename: fileSource.name,
        contentHash,
        detectedFormat: parsed.detectedFormat,
        parserName: parsed.parserEngineUsed,
        parserVersion: "2.2.0",
        expectedPageCount: parsed.pages.length,
        successfullyParsedPages: parsed.pages.length,
        pagesWithUsableText: usablePages,
        blankPages: parsed.pages.length - usablePages,
        ocrPages: parsed.ocrApplied ? parsed.pages.length : 0,
        nativeTextPages: parsed.ocrApplied ? 0 : usablePages,
        totalWordCount: parsed.wordCount,
        tableCount: parsed.tableCount,
        worksheetCount: parsed.sheetCount,
        extractionQualityScore: parsed.extractionQualityScore,
        isScanned: Boolean(parsed.ocrApplied),
        extractionWarnings: parsed.extractionWarnings,
        extractionTimestamp: new Date().toISOString(),
        processingDurationMs: Math.max(50, Date.now() - startMs),
        extractionStatus:
          parsed.wordCount > 50
            ? "SUCCESS"
            : parsed.wordCount > 0
            ? "QUALITY_WARNING"
            : "PARTIAL",
      };

      setProcessingProgress(65);
      setProcessingStage("Scanning text for sensitive identifiers & Luhn payment cards...");
      setActiveParsedDoc(parsed);

      // Step 2: Deterministic Intelligence Extraction
      setProcessingProgress(80);
      setProcessingStage("Extracting requirements, financial criteria & calculating dates...");
      const rawAnalysis = runDeterministicAnalysis(parsed);

      rawAnalysis.docId = documentId;
      rawAnalysis.contentHash = contentHash;
      rawAnalysis.originalFilename = fileSource.name;
      rawAnalysis.isDemo = isDemo;
      rawAnalysis.extractionAudit = parsed.extractionAudit;

      // Step 3: Compare requirements against Evidence Vault & Profile
      const compResult = compareRequirementsAgainstVault(rawAnalysis, userProfile, evidenceDocs);
      const enrichedAnalysis: FullDocumentAnalysis = {
        ...rawAnalysis,
        requirements: compResult.requirementsWithStatus,
        readinessScore: compResult.hasSufficientEvidenceForScore
          ? {
              score: compResult.readinessScore,
              formulaExplanation: compResult.readinessFormula,
              foundCount: compResult.contributingRequirements.foundCount,
              totalMandatoryCount: rawAnalysis.requirements.filter(r => r.mandatory).length,
              missingCount: compResult.contributingRequirements.missingCount,
            }
          : rawAnalysis.readinessScore,
      };

      setProcessingProgress(100);
      setProcessingStage("Analysis complete.");

      setActiveAnalysis(enrichedAnalysis);
      await storage.saveAnalysis(enrichedAnalysis);
      await storage.saveParsedDocument(parsed);
      setRecentAnalyses(prev => [enrichedAnalysis, ...prev.filter(a => a.id !== enrichedAnalysis.id)]);
      setSavedParsedDocs(prev => [parsed, ...prev.filter(d => d.id !== parsed.id)]);

      // If sensitive detections found, present redaction inspector
      if (parsed.sensitiveDetections.length > 0) {
        setIsRedactionModalOpen(true);
      }

      setCurrentView("analyze");
    } catch (err: any) {
      console.error("Document pipeline failure:", err);
      setUploadError(err?.message || "Failed to process document. Please verify the file is not corrupted or password-protected.");
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  const handleRetryLastUpload = () => {
    if (lastAttemptedFile) {
      processDocument(lastAttemptedFile.source, lastAttemptedFile.isDemo);
    }
  };

  // Upload handler for user files
  const handleUserFileUpload = (file: File) => {
    processDocument(file, false);
  };

  // Demo file runner
  const handleSelectDemo = (demo: DemoDocumentSpec) => {
    const enc = new TextEncoder();
    const bytes = enc.encode(demo.rawText);

    const syntheticFile = {
      name: demo.fileName,
      size: bytes.byteLength,
      type: demo.fileName.endsWith(".pdf")
        ? "application/pdf"
        : demo.fileName.endsWith(".xlsx")
        ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        : demo.fileName.endsWith(".docx")
        ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        : "text/plain",
      arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
      text: async () => demo.rawText,
    };

    // If demo has an affiliated sample profile, load it into context for realistic Have vs Missing matching
    if (demo.category === "rfp_tender") {
      setUserProfile(SAMPLE_PROFILES.enterprise_vendor);
    } else if (demo.category === "scholarship") {
      setUserProfile(SAMPLE_PROFILES.student_scholar);
    } else if (demo.category === "job") {
      setUserProfile(SAMPLE_PROFILES.ai_engineer);
    }

    processDocument(syntheticFile, true);
  };

  // Update detection visibility in active parsed document
  const handleUpdateDetection = (id: string, newVisibility: VisibilityState) => {
    if (!activeParsedDoc) return;
    const updatedDetections = activeParsedDoc.sensitiveDetections.map(d =>
      d.id === id ? { ...d, visibility: newVisibility, userOverridden: true } : d
    );
    const newRedactedText = buildRedactedTextCopy(activeParsedDoc.fullText, updatedDetections);
    setActiveParsedDoc({
      ...activeParsedDoc,
      sensitiveDetections: updatedDetections,
      redactedText: newRedactedText,
    });
  };

  const canAccessWorkspace = Boolean(currentUser || isGuestMode);

  return (
    <div
      className={`min-h-screen flex flex-col font-['Plus_Jakarta_Sans',sans-serif] ${
        currentView === "landing" ? "bg-[#070707] text-[#F0EDE8]" : "bg-[#060608] text-[#F3F4F6]"
      }`}
    >
      {/* Phase One: Cinematic Entry Gate Overlay */}
      <CinematicEntryGate
        isOpen={isEntryGateOpen}
        onCompleteEntry={handleCompleteEntryGate}
        audioEnabled={audioEnabled}
        onChangeAudioPreference={setAudioEnabled}
      />

      {/* Top Demo Data Persistent Banner when viewing demo file */}
      {isDemoActive && currentView !== "landing" && (
        <div className="bg-amber-950/80 border-b border-amber-600/40 px-4 py-2 text-xs font-mono text-amber-200 flex items-center justify-between sticky top-0 z-50 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="font-bold bg-amber-500 text-black px-1.5 py-0.2 rounded text-[10px]">
              DEMO DATA
            </span>
            <span>
              Exploring sample fictional document. Runs real end-to-end deterministic & privacy pipeline.
            </span>
          </div>
          <button
            onClick={() => setIsDemoActive(false)}
            className="text-amber-400 hover:text-white p-0.5"
            title="Dismiss demo indicator"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Global Workspace Navbar (Hidden on the full-screen cinematic entry landing page, which has its own editorial header) */}
      {currentView !== "landing" && (
        <Navbar
          currentView={currentView}
          onNavigate={setCurrentView}
          onOpenVaultModal={() => setIsVaultModalOpen(true)}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          isAiConnected={isAiConnected}
        />
      )}

      {/* Main View Router */}
      <main className="flex-1">
        {/* 0. Cinematic Entry & Editorial Landing Page */}
        {currentView === "landing" && (
          <LandingPage
            onStartAnalysis={() => setCurrentView("new_analysis")}
            onExplorePlatform={() => setCurrentView("overview")}
            onOpenDashboard={() => setCurrentView("overview")}
            onSelectDemoDoc={handleSelectDemo}
            onNavigate={setCurrentView}
            onReplayIntro={handleReplayEntryGate}
            audioEnabled={audioEnabled}
            onToggleAudio={setAudioEnabled}
          />
        )}

        {/* Dedicated Sign In / Sign Up View */}
        {(currentView === "signin" || currentView === "signup" || currentView === "login" || currentView === "register") && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <AuthView
              initialMode={currentView === "signup" || currentView === "register" ? "signup" : "signin"}
              onSuccess={() => setCurrentView("dashboard")}
              onContinueAsGuest={() => {
                setIsGuestMode(true);
                setCurrentView("dashboard");
              }}
            />
          </div>
        )}

        {/* Protected View Gate for unauthenticated visitors without guest session */}
        {PROTECTED_VIEWS.has(currentView) && !currentUser && !isGuestMode && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
            <div className="max-w-md mx-auto p-4 rounded-xl bg-amber-950/40 border border-amber-600/40 text-amber-200 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0" />
                <span>Sign in or register to access this private workspace and saved work.</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsGuestMode(true);
                }}
                className="text-[11px] font-mono text-[#E5C158] hover:underline shrink-0 cursor-pointer"
              >
                Guest Mode →
              </button>
            </div>
            <AuthView
              initialMode="signin"
              onSuccess={() => setCurrentView("dashboard")}
              onContinueAsGuest={() => {
                setIsGuestMode(true);
              }}
            />
          </div>
        )}
        {canAccessWorkspace && (
          <>
            {/* 1. Overview (Dashboard cockpit with welcome banner, prominent upload dropzone, recent documents, upcoming deadlines, quick actions) */}
            {(currentView === "overview" || currentView === "dashboard") && (
              <DashboardHome
                onStartAnalysis={() => setCurrentView("new_analysis")}
                onOpenAnalysis={handleOpenSavedAnalysis}
                onSelectDemoDoc={handleSelectDemo}
                onNavigate={setCurrentView}
                recentAnalyses={recentAnalyses}
                profile={userProfile}
                vaultDocCount={evidenceDocs.length}
                isAiConnected={isAiConnected}
              />
            )}

            {/* 2. New Analysis (Clean upload workflow with category shortcuts) */}
            {currentView === "new_analysis" && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                <div className="p-6 rounded-2xl bg-[#0E1017] border border-[#252A38] text-center space-y-2">
                  <h2 className="font-['Space_Grotesk'] text-2xl font-bold text-white">
                    Ingest & Analyse New Document
                  </h2>
                  <p className="text-xs text-slate-400 max-w-lg mx-auto">
                    Upload any PDF, Word (DOCX/DOC), Spreadsheet (XLSX/CSV/ODS), Presentation (PPTX), OpenDocument (ODT), RTF, or Scanned Image. Deterministic privacy sanitization and source citation tracking enabled.
                  </p>
                </div>

                <UploadZone
                  onFileSelected={handleUserFileUpload}
                  onDemoSelected={handleSelectDemo}
                  isProcessing={isProcessing}
                  processingProgress={processingProgress}
                  processingStage={processingStage}
                  externalError={uploadError}
                  onClearExternalError={() => setUploadError(null)}
                  onRetry={lastAttemptedFile ? handleRetryLastUpload : undefined}
                />
              </div>
            )}

            {/* 3. My Documents (Dedicated document and reports repository) */}
            {currentView === "my_documents" && (
              <MyDocumentsView
                documents={recentAnalyses}
                onOpenDocument={handleOpenSavedAnalysis}
                onDeleteDocument={id => {
                  setRecentAnalyses(prev => prev.filter(a => a.id !== id));
                  storage.deleteAnalysis(id);
                  if (activeAnalysis?.id === id) {
                    setActiveAnalysis(null);
                  }
                }}
                onNavigateToUpload={() => setCurrentView("new_analysis")}
              />
            )}

            {/* 4. Compare (Multi-document comparison) */}
            {currentView === "compare" && (
              <MultiDocComparison
                availableAnalyses={recentAnalyses}
                onOpenAnalysis={handleOpenSavedAnalysis}
              />
            )}

            {/* 5. Profile (Evidence vault, credentials, and fact management) */}
            {(currentView === "profile" || currentView === "vault") && (
              <EvidenceVaultView
                profile={userProfile}
                onSaveProfile={prof => {
                  setUserProfile(prof);
                  storage.saveProfile(prof);
                }}
                evidenceDocs={evidenceDocs}
                onAddEvidenceDoc={doc => {
                  setEvidenceDocs(prev => [doc, ...prev]);
                  storage.saveEvidenceDocument(doc);
                }}
                onDeleteEvidenceDoc={id => {
                  setEvidenceDocs(prev => prev.filter(d => d.id !== id));
                  storage.deleteEvidenceDocument(id);
                }}
              />
            )}

            {/* 6. Settings (AI provider, BYOK vault with connection test button, and privacy controls) */}
            {(currentView === "settings" || currentView === "settings_ai") && (
              <AiSettingsView />
            )}

            {currentView === "privacy_center" && <PrivacyCenterView />}

            {currentView === "memory" && (
              <DocumentMemoryView
                memoryItems={memoryItems}
                onToggleReuse={(id: string) => {
                  setMemoryItems(prev =>
                    prev.map(m => (m.id === id ? { ...m, userApprovedForReuse: !m.userApprovedForReuse } : m))
                  );
                }}
                onDeleteItem={(id: string) => {
                  setMemoryItems(prev => prev.filter(m => m.id !== id));
                  storage.deleteMemoryItem(id);
                }}
                onClearAll={() => {
                  setMemoryItems([]);
                }}
              />
            )}

            {/* Active Analysis Studio View */}
            {currentView === "analyze" && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                {!activeAnalysis || isProcessing ? (
                  <div className="space-y-6">
                    <div className="p-6 rounded-2xl bg-[#0E1017] border border-[#252A38] text-center space-y-2">
                      <h2 className="font-['Space_Grotesk'] text-2xl font-bold text-white">
                        Analyse a Document
                      </h2>
                      <p className="text-xs text-slate-400 max-w-lg mx-auto">
                        Upload an RFP, scholarship circular, contract, job description, or spreadsheet.
                      </p>
                    </div>

                    <UploadZone
                      onFileSelected={handleUserFileUpload}
                      onDemoSelected={handleSelectDemo}
                      isProcessing={isProcessing}
                      processingProgress={processingProgress}
                      processingStage={processingStage}
                      externalError={uploadError}
                      onClearExternalError={() => setUploadError(null)}
                      onRetry={lastAttemptedFile ? handleRetryLastUpload : undefined}
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#0E1017] border border-[#252A38] text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">Current Document:</span>
                        <strong className="text-white font-mono">{activeAnalysis.title}</strong>
                      </div>
                      <button
                        onClick={() => {
                          setActiveAnalysis(null);
                          setCurrentView("new_analysis");
                        }}
                        className="px-3 py-1 rounded bg-[#1A1E2B] hover:bg-[#202B3D] text-slate-300 font-mono text-xs border border-slate-700"
                      >
                        + Upload New Document
                      </button>
                    </div>

                    <AnalysisStudio
                      analysis={activeAnalysis}
                      parsedDoc={
                        activeParsedDoc || {
                          id: activeAnalysis.docId,
                          fileName: activeAnalysis.title,
                          fileSizeBytes: 1024 * 100,
                          fileType: "application/pdf",
                          detectedFormat: "pdf",
                          uploadedAt: activeAnalysis.analyzedAt,
                          pages: [{ pageNumber: 1, text: activeAnalysis.executiveSummary }],
                          fullText: activeAnalysis.executiveSummary,
                          redactedText: activeAnalysis.executiveSummary,
                          sensitiveDetections: [],
                          detectedCategory: activeAnalysis.category,
                          extractedTitle: activeAnalysis.title,
                          wordCount: activeAnalysis.executiveSummary.split(/\s+/).length,
                          tableCount: 0,
                          sheetCount: 0,
                          extractionQualityScore: 98,
                          parserEngineUsed: "native-engine",
                          extractionWarnings: [],
                        }
                      }
                      profile={userProfile}
                      onUpdateAnalysis={updated => {
                        setActiveAnalysis(updated);
                        storage.saveAnalysis(updated);
                        setRecentAnalyses(prev => [updated, ...prev.filter(a => a.id !== updated.id)]);
                      }}
                      onNavigateToVault={() => setCurrentView("profile")}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Supplementary views if navigated directly */}
            {currentView === "deadlines" && (
              <DeadlinesView
                analyses={recentAnalyses}
                onOpenAnalysis={handleOpenSavedAnalysis}
              />
            )}

            {currentView === "checklists" && (
              <ChecklistsView
                analyses={recentAnalyses}
                profile={userProfile}
                onUpdateAnalysis={updated => {
                  setActiveAnalysis(updated);
                  storage.saveAnalysis(updated);
                  setRecentAnalyses(prev => [updated, ...prev.filter(a => a.id !== updated.id)]);
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Global Footer (Hidden on Landing Page, which renders Section 09 Editorial Footer) */}
      {currentView !== "landing" && <Footer onNavigate={setCurrentView} />}

      {/* Real-time Scanning Overlay */}
      {isProcessing && (
        <ScanningOverlay
          fileName={processingFileName}
          stage={processingStage}
          progress={processingProgress}
        />
      )}

      {/* Privacy Redaction Review Modal */}
      {activeParsedDoc && (
        <RedactionReviewModal
          isOpen={isRedactionModalOpen}
          onClose={() => setIsRedactionModalOpen(false)}
          detections={activeParsedDoc.sensitiveDetections}
          onUpdateDetection={handleUpdateDetection}
          onConfirmAndProceed={() => setIsRedactionModalOpen(false)}
        />
      )}

      {/* Account / Guest State Modal */}
      <AccountModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthStateChange={reloadUserData}
      />

      {/* Quick Vault Password Modal */}
      <VaultModal
        isOpen={isVaultModalOpen}
        onClose={() => setIsVaultModalOpen(false)}
        onNavigateToSettings={() => {
          setIsVaultModalOpen(false);
          setCurrentView("settings_ai");
        }}
      />
    </div>
  );
}
