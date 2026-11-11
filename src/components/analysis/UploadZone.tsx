/**
 * DOCULENS File Upload & Parsing Zone
 * Supports PDF, DOCX, XLSX, XLS, CSV, TXT, JPG, PNG, PPTX with drag & drop,
 * multi-file queuing, file validation, progress bars, and instant demo file loaders.
 */

import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileText,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Shield,
  FileCode,
  Image,
} from "lucide-react";
import { APP_CONFIG } from "../../config/appConfig";
import { DEMO_DOCUMENTS, DemoDocumentSpec } from "../../services/demoData";

interface UploadZoneProps {
  onFileSelected: (file: File) => void;
  onDemoSelected: (demoDoc: DemoDocumentSpec) => void;
  isProcessing: boolean;
  processingProgress?: number;
  processingStage?: string;
  externalError?: string | null;
  onClearExternalError?: () => void;
  onRetry?: () => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onFileSelected,
  onDemoSelected,
  isProcessing,
  processingProgress = 0,
  processingStage = "Initializing pipeline...",
  externalError = null,
  onClearExternalError,
  onRetry,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndHandleFile = (file: File) => {
    setErrorMessage(null);
    if (onClearExternalError) onClearExternalError();

    // Validate empty file
    if (file.size === 0) {
      setErrorMessage("Selected file is empty (0 bytes). Please upload a valid document.");
      return;
    }

    // Validate size (max 30MB)
    if (file.size > APP_CONFIG.maxUploadSizeBytes) {
      setErrorMessage(`File exceeds 30MB limit. File size: ${(file.size / (1024 * 1024)).toFixed(1)}MB`);
      return;
    }

    // Validate extension
    const nameLower = file.name.toLowerCase();
    const isSupported = APP_CONFIG.supportedExtensions.some(ext => nameLower.endsWith(ext));

    if (!isSupported) {
      setErrorMessage(
        `Unsupported format. Supported: ${APP_CONFIG.supportedExtensions.join(", ")}`
      );
      return;
    }

    onFileSelected(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndHandleFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndHandleFile(e.target.files[0]);
      e.target.value = "";
    }
  };

  const displayedError = errorMessage || externalError;

  return (
    <div className="space-y-6">
      {/* Drag & Drop Card */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center transition-all ${
          isDragging
            ? "border-[#E5C158] bg-[#E5C158]/5 scale-[1.01]"
            : "border-[#2B3142] bg-[#0E1017] hover:border-[#384863] hover:bg-[#121824]"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={APP_CONFIG.supportedExtensions.join(",")}
          onChange={handleInputChange}
          disabled={isProcessing}
        />

        {isProcessing ? (
          <div className="py-6 space-y-4 max-w-md mx-auto">
            <div className="flex items-center justify-between text-xs font-mono text-slate-300">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#E5C158] animate-ping" />
                {processingStage}
              </span>
              <span>{Math.round(processingProgress)}%</span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#1A2332]">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-[#E5C158] transition-all duration-300 ease-out"
                style={{ width: `${processingProgress}%` }}
              />
            </div>

            <p className="text-xs text-slate-400">
              Extracting text pages, checking formulas, indexing dates & running deterministic privacy scan...
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#17202E] border border-[#2B3B52] text-[#E5C158]">
              <UploadCloud className="h-8 w-8" />
            </div>

            <div>
              <h3 className="font-['Space_Grotesk'] text-lg font-bold text-white">
                Drag and drop your document here, or <span className="text-[#E5C158] underline">browse</span>
              </h3>
              <p className="mt-1 text-xs text-slate-400 max-w-lg mx-auto">
                PDF, DOCX, DOC, XLSX, XLS, CSV, ODS, PPTX, ODT, RTF, TXT, MD, HTML, JPG, PNG, WEBP, TIFF (up to 30 MB).
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] font-mono text-slate-500">
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3 text-emerald-400" />
                Deterministic Client-Side Privacy
              </span>
              <span>·</span>
              <span>Formula-Safe Multi-Sheet Parsing</span>
              <span>·</span>
              <span>Zero AI Required</span>
            </div>
          </div>
        )}
      </div>

      {/* Error alert */}
      {displayedError && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Document Processing Notice</p>
            <p className="mt-0.5 text-rose-400">{displayedError}</p>
          </div>
          <div className="flex items-center gap-2">
            {onRetry && externalError && (
              <button
                onClick={onRetry}
                className="px-2.5 py-1 rounded bg-rose-900/60 hover:bg-rose-800 text-white font-semibold transition-colors"
              >
                Retry
              </button>
            )}
            <button
              onClick={() => {
                setErrorMessage(null);
                if (onClearExternalError) onClearExternalError();
              }}
              className="text-rose-400 hover:text-white px-2 py-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Interactive Sample Documents Bar */}
      <div className="rounded-xl border border-[#252A38] bg-[#08090D] p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#E5C158]" />
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Or Try One of 5 Real Fictional Demo Documents (Instant Exploration)
            </h4>
          </div>
          <span className="text-[10px] font-mono uppercase text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
            DEMO DATA READY
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {DEMO_DOCUMENTS.map(demo => (
            <button
              key={demo.id}
              onClick={() => onDemoSelected(demo)}
              disabled={isProcessing}
              className="flex flex-col text-left p-3 rounded-lg border border-[#252A38] bg-[#12151E] hover:border-[#E5C158]/40 hover:bg-[#151D2A] transition-all group"
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-[10px] font-mono uppercase text-slate-400 group-hover:text-[#E5C158] transition-colors">
                  {demo.category.replace("_", " ")}
                </span>
                <ArrowRight className="h-3 w-3 text-slate-500 group-hover:text-[#E5C158] group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-xs font-semibold text-slate-200 line-clamp-2 group-hover:text-white">
                {demo.title}
              </p>
              <p className="text-[10px] text-slate-400 line-clamp-1 mt-1 font-mono">
                {demo.fileName}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
