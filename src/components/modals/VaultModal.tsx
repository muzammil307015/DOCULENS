/**
 * DOCULENS Vault Modal
 * Allows quick unlocking or reviewing of encrypted BYOK API key from the top navbar.
 */

import React, { useState } from "react";
import { X, Lock, Unlock, Key, Trash2 } from "lucide-react";
import {
  deleteVaultKey,
  getEncryptedVaultRecord,
  isVaultUnlocked,
  unlockVault,
  lockVault,
} from "../../services/byokVault";

interface VaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToSettings: () => void;
}

export const VaultModal: React.FC<VaultModalProps> = ({
  isOpen,
  onClose,
  onNavigateToSettings,
}) => {
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(isVaultUnlocked());
  const record = getEncryptedVaultRecord();

  if (!isOpen) return null;

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await unlockVault(password);
      setUnlocked(true);
      setPassword("");
    } catch (err: any) {
      setErrorMsg(err?.message || "Incorrect password.");
    }
  };

  const handleLock = () => {
    lockVault();
    setUnlocked(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-sm rounded-2xl bg-[#0F141C] border border-[#2B3142] p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#252A38] pb-3">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-[#E5C158]" />
            <h3 className="font-['Space_Grotesk'] text-sm font-bold text-white">
              Encrypted Key Vault
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        {record ? (
          unlocked ? (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 space-y-1">
                <span className="text-[10px] font-mono text-emerald-400 block uppercase">
                  Vault Status: Unlocked
                </span>
                <span className="text-xs font-mono text-white font-bold">{record.maskedKey}</span>
              </div>
              <p className="text-xs text-slate-400">
                Key is active for this session. It will auto-lock after 10 minutes of inactivity.
              </p>
              <button
                onClick={handleLock}
                className="w-full py-2 rounded-lg bg-[#1A1E2B] text-slate-200 text-xs font-mono hover:bg-[#202E42]"
              >
                Lock Vault Now
              </button>
            </div>
          ) : (
            <form onSubmit={handleUnlock} className="space-y-3">
              <div className="p-2.5 rounded-lg bg-[#141822] border border-[#1E2838] flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Encrypted Key:</span>
                <span className="text-slate-200">{record.maskedKey}</span>
              </div>

              {errorMsg && (
                <div className="p-2 rounded bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs font-mono">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="text-xs text-slate-400 block mb-1">Enter Master Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Master password"
                  className="w-full rounded-lg bg-[#161A25] border border-[#2B3142] p-2 text-xs text-white"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-[#E5C158] text-black font-semibold text-xs hover:bg-[#F3E3AD]"
              >
                Unlock
              </button>
            </form>
          )
        ) : (
          <div className="space-y-3 text-center py-2">
            <p className="text-xs text-slate-400">
              No API key is currently saved in this browser's encrypted vault.
            </p>
            <button
              onClick={() => {
                onClose();
                onNavigateToSettings();
              }}
              className="w-full py-2 rounded-lg bg-[#1A1E2B] text-[#E5C158] text-xs font-semibold hover:bg-[#202E42]"
            >
              Configure in AI Settings
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
