/**
 * DOCULENS Comprehensive Settings View
 *
 * Combines:
 * 1. AI Provider & Model Configuration (Gemini 3.8 Flash, OpenRouter catalogue)
 * 2. Encrypted Client-Side BYOK Vault (AES-GCM PBKDF2)
 * 3. Interactive Connection Test (POST /api/ai/test-connection)
 * 4. Privacy & Redaction Policy Controls
 * 5. Primary Docling Engine & Native Pipeline Health Status
 */

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Lock,
  Unlock,
  Key,
  Shield,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Trash2,
  Cpu,
  Eye,
  EyeOff,
  Activity,
  Check,
  Server,
  FileCheck,
  Sliders,
  ExternalLink,
} from "lucide-react";
import { AIModelCatalogueItem } from "../../types";
import {
  deleteVaultKey,
  encryptAndSaveKey,
  getEncryptedVaultRecord,
  isVaultUnlocked,
  unlockVault,
  lockVault,
  getActiveSessionKey,
} from "../../services/byokVault";
import { fetchOpenRouterModels, DEFAULT_FREE_MODELS } from "../../services/aiProvider";

export const AiSettingsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"ai" | "vault" | "privacy" | "engine">("ai");
  const [models, setModels] = useState<AIModelCatalogueItem[]>(DEFAULT_FREE_MODELS);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [freeOnlyFilter, setFreeOnlyFilter] = useState(true);
  const [selectedModelId, setSelectedModelId] = useState<string>("gemini-3.8-flash");
  const [autoFailover, setAutoFailover] = useState(true);

  // Connection testing state
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<{
    status: string;
    provider?: string;
    model?: string;
    latencyMs?: number;
    message?: string;
    error?: string;
  } | null>(null);

  // Vault state
  const [vaultRecord, setVaultRecord] = useState(getEncryptedVaultRecord());
  const [isUnlocked, setIsUnlocked] = useState(isVaultUnlocked());
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [vaultPassword, setVaultPassword] = useState("");
  const [unlockPassword, setUnlockPassword] = useState("");
  const [vaultMessage, setVaultMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Privacy redaction settings
  const [redactPii, setRedactPii] = useState(true);
  const [redactFinancialCards, setRedactFinancialCards] = useState(true);
  const [redactEmails, setRedactEmails] = useState(true);
  const [redactPhoneNumbers, setRedactPhoneNumbers] = useState(true);

  useEffect(() => {
    loadLiveModels();
  }, []);

  const loadLiveModels = async () => {
    setIsLoadingModels(true);
    try {
      const res = await fetch("/api/ai/models");
      if (res.ok) {
        const data = await res.json();
        if (data.models && data.models.length > 0) {
          setModels(data.models);
          return;
        }
      }
      const fetched = await fetchOpenRouterModels();
      setModels(fetched);
    } catch {
      setModels(DEFAULT_FREE_MODELS);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionTestResult(null);

    try {
      const sessionKey = getActiveSessionKey();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (sessionKey?.key) {
        headers["X-BYOK-Key"] = sessionKey.key;
      }

      const res = await fetch("/api/ai/test-connection", {
        method: "POST",
        headers,
      });

      const data = await res.json();
      if (res.ok) {
        setConnectionTestResult(data);
      } else {
        setConnectionTestResult({
          status: "error",
          error: data.error || `HTTP ${res.status}: Connection test failed`,
        });
      }
    } catch (err: any) {
      setConnectionTestResult({
        status: "error",
        error: err?.message || "Failed to reach server endpoint",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setVaultMessage(null);
    if (!apiKeyInput.trim()) {
      setVaultMessage({ text: "Please enter a valid Google Gemini or OpenRouter API key.", isError: true });
      return;
    }
    if (!vaultPassword || vaultPassword.length < 6) {
      setVaultMessage({ text: "Vault master password must be at least 6 characters.", isError: true });
      return;
    }

    setIsSavingKey(true);
    try {
      const isGeminiKey = apiKeyInput.trim().startsWith("AIza");
      const provider = isGeminiKey ? "gemini" : "openrouter";
      const record = await encryptAndSaveKey(apiKeyInput.trim(), vaultPassword, provider);
      setVaultRecord(record);
      setIsUnlocked(true);
      setApiKeyInput("");
      setVaultPassword("");
      setVaultMessage({
        text: `Key encrypted with AES-GCM + PBKDF2 (100k rounds) for ${provider.toUpperCase()}. Master password never stored.`,
        isError: false,
      });
    } catch (err: any) {
      setVaultMessage({ text: err?.message || "Encryption failed.", isError: true });
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleUnlockVault = async (e: React.FormEvent) => {
    e.preventDefault();
    setVaultMessage(null);
    if (!unlockPassword) return;

    setIsUnlocking(true);
    try {
      await unlockVault(unlockPassword);
      setIsUnlocked(true);
      setUnlockPassword("");
      setVaultMessage({ text: "Vault unlocked for active session. Auto-locks after 10m inactivity.", isError: false });
    } catch (err: any) {
      setVaultMessage({ text: err?.message || "Incorrect password.", isError: true });
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleDeleteVault = () => {
    if (confirm("Are you sure you want to permanently delete your encrypted API key from this browser?")) {
      deleteVaultKey();
      setVaultRecord(null);
      setIsUnlocked(false);
      setVaultMessage({ text: "Encrypted vault record deleted completely.", isError: false });
    }
  };

  const filteredModels = models.filter(m => (freeOnlyFilter ? m.isFree : true));

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Settings Header */}
      <div className="p-6 rounded-2xl bg-[#0E1017] border border-[#252A38] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-[#E5C158]" />
            <h2 className="font-['Space_Grotesk'] text-2xl font-bold text-white tracking-tight">
              Platform Settings & Engine Intelligence
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure AI models, manage your client-side encrypted key vault, run connection health checks, and configure privacy policies.
          </p>
        </div>

        {/* Global Connection Test Quick Trigger */}
        <button
          onClick={handleTestConnection}
          disabled={isTestingConnection}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#1A1E2B] hover:bg-[#202E42] text-slate-200 border border-[#2B3B52] transition-colors flex items-center gap-2 disabled:opacity-50 self-start sm:self-auto"
        >
          {isTestingConnection ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#E5C158]" />
          ) : (
            <Activity className="h-3.5 w-3.5 text-[#E5C158]" />
          )}
          <span>{isTestingConnection ? "Testing..." : "Test AI Connection"}</span>
        </button>
      </div>

      {/* Connection Test Status Output */}
      {connectionTestResult && (
        <div
          className={`p-4 rounded-xl border text-xs font-mono flex items-start justify-between gap-3 ${
            connectionTestResult.status === "connected"
              ? "bg-emerald-950/40 border-emerald-800/50 text-emerald-300"
              : "bg-rose-950/40 border-rose-800/50 text-rose-300"
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold uppercase tracking-wider">
                {connectionTestResult.status === "connected" ? "✓ CONNECTION VERIFIED" : "✗ CONNECTION FAILED"}
              </span>
              {connectionTestResult.latencyMs && (
                <span className="text-[10px] bg-black/40 px-1.5 py-0.5 rounded">
                  Latency: {connectionTestResult.latencyMs}ms
                </span>
              )}
            </div>
            <p>
              {connectionTestResult.message ||
                connectionTestResult.error ||
                `Provider: ${connectionTestResult.provider} · Model: ${connectionTestResult.model}`}
            </p>
          </div>
          <button
            onClick={() => setConnectionTestResult(null)}
            className="text-slate-400 hover:text-white text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#252A38] pb-1">
        {[
          { id: "ai", label: "AI Provider & BYOK", icon: Sparkles },
          { id: "privacy", label: "Privacy & Redaction", icon: Shield },
          { id: "engine", label: "Docling Ingestion Engine", icon: Server },
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? "bg-[#E5C158]/15 text-[#E5C158] border border-[#E5C158]/40 font-semibold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-[#121824]"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: AI Provider & Encrypted Vault */}
      {activeTab === "ai" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: BYOK Encrypted Vault */}
          <div className="p-6 rounded-2xl bg-[#0E1017] border border-[#252A38] space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-[#E5C158]" />
                <h3 className="font-['Space_Grotesk'] text-sm font-bold text-white">
                  Client-Side Web Crypto Key Vault
                </h3>
              </div>
              {vaultRecord && (
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    isUnlocked
                      ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/50"
                      : "bg-slate-800 text-slate-400 border-slate-700"
                  }`}
                >
                  {isUnlocked ? "UNLOCKED (SESSION ACTIVE)" : "LOCKED"}
                </span>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/30 text-xs text-amber-200/90 flex items-start gap-2.5">
              <Shield className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-300">Dual Provider Support</p>
                <p className="text-[11px] text-amber-200/80 mt-0.5">
                  Accepts Google Gemini keys (<code className="text-[#E5C158]">AIza...</code>) and OpenRouter keys (<code className="text-[#E5C158]">sk-...</code>). Encrypted locally with AES-GCM 256-bit + PBKDF2 (100,000 rounds).
                </p>
              </div>
            </div>

            {vaultMessage && (
              <div
                className={`p-3 rounded-lg text-xs font-mono ${
                  vaultMessage.isError
                    ? "bg-rose-950/40 border border-rose-800/50 text-rose-300"
                    : "bg-emerald-950/40 border border-emerald-800/50 text-emerald-300"
                }`}
              >
                {vaultMessage.text}
              </div>
            )}

            {/* Locked Vault Form */}
            {vaultRecord && !isUnlocked && (
              <form onSubmit={handleUnlockVault} className="space-y-3">
                <div className="p-3 rounded-xl bg-[#141822] border border-[#1E2838] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 block">STORED KEY</span>
                    <span className="text-xs font-mono text-slate-200">{vaultRecord.maskedKey}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDeleteVault}
                    className="text-xs text-rose-400 hover:text-rose-300 font-mono"
                  >
                    Delete Key
                  </button>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">
                    Enter Vault Password to Unlock
                  </label>
                  <input
                    type="password"
                    value={unlockPassword}
                    onChange={e => setUnlockPassword(e.target.value)}
                    placeholder="Master password used during encryption"
                    className="w-full rounded-lg bg-[#161A25] border border-[#2B3142] p-2.5 text-xs text-white placeholder-slate-500 focus:border-[#E5C158] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isUnlocking || !unlockPassword}
                  className="w-full py-2.5 rounded-lg bg-[#E5C158] text-black font-semibold text-xs hover:bg-[#F3E3AD] disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Unlock className="h-3.5 w-3.5" />
                  <span>{isUnlocking ? "Decrypting..." : "Unlock Vault"}</span>
                </button>
              </form>
            )}

            {/* Unlocked Vault */}
            {vaultRecord && isUnlocked && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/40 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-emerald-400 block">ACTIVE SESSION KEY</span>
                    <span className="text-xs font-mono text-slate-200 font-bold">{vaultRecord.maskedKey}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        lockVault();
                        setIsUnlocked(false);
                      }}
                      className="px-2.5 py-1 rounded bg-[#1A1E2B] text-slate-300 hover:text-white border border-slate-700 text-xs font-mono"
                    >
                      Lock Now
                    </button>
                    <button
                      onClick={handleDeleteVault}
                      className="p-1 text-slate-500 hover:text-rose-400"
                      title="Delete key"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">
                  Key active in browser memory for HTTPS calls. Zero plaintext saved to disk.
                </p>
              </div>
            )}

            {/* Setup New Key Form */}
            {!vaultRecord && (
              <form onSubmit={handleSaveApiKey} className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">
                    Gemini Key (<code className="text-[#E5C158]">AIza...</code>) or OpenRouter Key (<code className="text-[#E5C158]">sk-...</code>)
                  </label>
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={e => setApiKeyInput(e.target.value)}
                    placeholder="Paste your API key here"
                    className="w-full rounded-lg bg-[#161A25] border border-[#2B3142] p-2.5 text-xs text-white placeholder-slate-500 focus:border-[#E5C158] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">
                    Master Vault Password (min 6 characters)
                  </label>
                  <input
                    type="password"
                    value={vaultPassword}
                    onChange={e => setVaultPassword(e.target.value)}
                    placeholder="Password required to decrypt this key"
                    className="w-full rounded-lg bg-[#161A25] border border-[#2B3142] p-2.5 text-xs text-white placeholder-slate-500 focus:border-[#E5C158] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSavingKey}
                  className="w-full py-2.5 rounded-lg bg-[#E5C158] text-black font-semibold text-xs hover:bg-[#F3E3AD] disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>{isSavingKey ? "Encrypting with AES-GCM..." : "Encrypt & Store Key"}</span>
                </button>
              </form>
            )}
          </div>

          {/* Right: Model Catalogue & Active Model */}
          <div className="p-6 rounded-2xl bg-[#0E1017] border border-[#252A38] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-[#E5C158]" />
                <h3 className="font-['Space_Grotesk'] text-sm font-bold text-white">
                  Active AI Model & Catalogue
                </h3>
              </div>
              <button
                onClick={loadLiveModels}
                disabled={isLoadingModels}
                className="p-1 rounded text-slate-400 hover:text-white"
                title="Refresh model list"
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingModels ? "animate-spin" : ""}`} />
              </button>
            </div>

            {/* Gemini 3.8 Flash Highlight Card */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-[#141E2C] to-[#0E1520] border border-[#E5C158]/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-[#E5C158]">
                  PRIMARY MODEL: gemini-3.8-flash
                </span>
                <span className="text-[10px] font-mono uppercase bg-[#E5C158]/20 text-[#E5C158] px-2 py-0.5 rounded">
                  Recommended
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Google's latest production multimodal flash model. Ultra-fast, highly accurate document reasoning with large context window.
              </p>
            </div>

            {/* Model List */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {filteredModels.map(m => {
                const isSelected = selectedModelId === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedModelId(m.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all space-y-1.5 ${
                      isSelected
                        ? "bg-[#141E2C] border-[#E5C158]/50"
                        : "bg-[#12151E] border-[#252A38] hover:border-[#2C3B52]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-white font-mono truncate">{m.name}</span>
                      {m.isFree ? (
                        <span className="text-[10px] font-mono uppercase bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 px-1.5 py-0.2 rounded shrink-0">
                          100% Free
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-400">
                          ${m.promptPricePerMillion}/M
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{m.description || m.id}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Privacy & Redaction */}
      {activeTab === "privacy" && (
        <div className="p-6 rounded-2xl bg-[#0E1017] border border-[#252A38] space-y-5">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-400" />
            <h3 className="font-['Space_Grotesk'] text-lg font-bold text-white">
              Deterministic Privacy & Redaction Architecture
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            DOCULENS sanitizes sensitive identifiers locally in browser memory before any text is sent to AI models or external APIs.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <label className="p-4 rounded-xl bg-[#111722] border border-[#1E2838] flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-xs font-semibold text-white block">Aadhaar & SSN Identifiers</span>
                <span className="text-[11px] text-slate-400">Regex + Verhoeff/Luhn checksum masking</span>
              </div>
              <input
                type="checkbox"
                checked={redactPii}
                onChange={e => setRedactPii(e.target.checked)}
                className="h-4 w-4 accent-[#E5C158]"
              />
            </label>

            <label className="p-4 rounded-xl bg-[#111722] border border-[#1E2838] flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-xs font-semibold text-white block">Payment Card Numbers</span>
                <span className="text-[11px] text-slate-400">Luhn formula verification & auto-redaction</span>
              </div>
              <input
                type="checkbox"
                checked={redactFinancialCards}
                onChange={e => setRedactFinancialCards(e.target.checked)}
                className="h-4 w-4 accent-[#E5C158]"
              />
            </label>

            <label className="p-4 rounded-xl bg-[#111722] border border-[#1E2838] flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-xs font-semibold text-white block">Email Addresses</span>
                <span className="text-[11px] text-slate-400">Replaced with [REDACTED_EMAIL_X]</span>
              </div>
              <input
                type="checkbox"
                checked={redactEmails}
                onChange={e => setRedactEmails(e.target.checked)}
                className="h-4 w-4 accent-[#E5C158]"
              />
            </label>

            <label className="p-4 rounded-xl bg-[#111722] border border-[#1E2838] flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-xs font-semibold text-white block">Telephone Numbers</span>
                <span className="text-[11px] text-slate-400">Replaced with [REDACTED_PHONE_X]</span>
              </div>
              <input
                type="checkbox"
                checked={redactPhoneNumbers}
                onChange={e => setRedactPhoneNumbers(e.target.checked)}
                className="h-4 w-4 accent-[#E5C158]"
              />
            </label>
          </div>
        </div>
      )}

      {/* Tab 3: Docling Ingestion Engine */}
      {activeTab === "engine" && (
        <div className="p-6 rounded-2xl bg-[#0E1017] border border-[#252A38] space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-[#E5C158]" />
              <h3 className="font-['Space_Grotesk'] text-lg font-bold text-white">
                Primary Extraction Engine: Docling Microservice
              </h3>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-[#1A1E2B] text-[#E5C158] border border-[#E5C158]/30">
              Universal Document Pipeline
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            DOCULENS integrates the open-source <a href="https://github.com/docling-project/docling" target="_blank" rel="noreferrer" className="text-[#E5C158] underline">Docling project</a> as its primary document conversion engine, supplemented by native parsers (PDF.js, mammoth.js, SheetJS, and Tesseract.js OCR).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-[#111722] border border-[#1E2838] space-y-1.5">
              <span className="text-[11px] font-mono text-[#E5C158] uppercase block">Docling Architecture</span>
              <p className="text-xs text-slate-300">
                Containerized FastAPI microservice in <code className="text-slate-200">services/docling_service</code> exposing <code className="text-slate-200">/v1/convert</code>.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#111722] border border-[#1E2838] space-y-1.5">
              <span className="text-[11px] font-mono text-emerald-400 uppercase block">Native Fallback</span>
              <p className="text-xs text-slate-300">
                Pure TypeScript/WASM engine guarantees 100% extraction uptime for PDF, DOCX, XLSX, CSV, PPTX, RTF, and Images.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#111722] border border-[#1E2838] space-y-1.5">
              <span className="text-[11px] font-mono text-sky-400 uppercase block">Real-Time OCR</span>
              <p className="text-xs text-slate-300">
                Tesseract.js OCR automatically scans non-text scanned PDFs and graphic image formats (PNG, JPG, WEBP, TIFF).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
