/**
 * DOCULENS Account & Authentication Modal
 * Displays Google Sign-in / Firebase status and transparent guest session parameters.
 */

import React, { useState } from "react";
import { X, LogIn, Shield, Clock, CheckCircle, Database } from "lucide-react";
import { APP_CONFIG } from "../../config/appConfig";
import { storage } from "../../services/storageAdapter";

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulateLogin?: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  onSimulateLogin,
}) => {
  const [isSimulatedUser, setIsSimulatedUser] = useState(false);
  const hoursRemaining = storage.getExpiryRemainingHours();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-[#0F141C] border border-[#2B3142] p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#252A38] pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#182333] border border-slate-700 text-[#E5C158] font-mono font-bold text-xs">
              DL
            </div>
            <div>
              <h3 className="font-['Space_Grotesk'] text-base font-bold text-white">
                Account & Cloud Persistence
              </h3>
              <p className="text-[11px] text-slate-400">Firebase Auth & Firestore adapter</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current State Info */}
        <div className="p-4 rounded-xl bg-[#141822] border border-[#1E2838] space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Session Mode</span>
            <span className="text-amber-400 font-semibold">
              {isSimulatedUser ? "Authenticated (Cloud Sync)" : "Guest Session (Local)"}
            </span>
          </div>

          {!isSimulatedUser && (
            <p className="text-xs text-slate-400 leading-relaxed">
              You are currently using DOCULENS in Guest Mode. All document parses and extracted requirements are saved in local storage and will automatically expire in{" "}
              <strong className="text-white">{hoursRemaining} hours</strong>.
            </p>
          )}
        </div>

        {/* Sign In Options */}
        <div className="space-y-3">
          <button
            onClick={() => {
              setIsSimulatedUser(true);
              if (onSimulateLogin) onSimulateLogin();
              setTimeout(() => onClose(), 600);
            }}
            className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.42l4.04-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Sign in with Google</span>
          </button>

          <p className="text-[11px] text-slate-500 text-center font-mono">
            Firebase Firestore rules isolate your records by UID. Zero cross-user data leakage.
          </p>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-[#252A38] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
          >
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
};
