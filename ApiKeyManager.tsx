import React, { useState, useEffect } from 'react';
import { Key, Lock, Check, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';

interface ApiKeyManagerProps {
  service: string;
  label: string;
  placeholder?: string;
  description?: string;
}

export const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ 
  service, 
  label, 
  placeholder = "Enter API Key...",
  description = "Secrets are stored and encrypted on our decentralized vault clusters."
}) => {
  const [apiKey, setApiKey] = useState("");
  const [isMasked, setIsMasked] = useState(true);
  const [vaultStatus, setVaultStatus] = useState<{ exists: boolean; value: string }>({ exists: false, value: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fetchVaultStatus = async () => {
    try {
      const response = await fetch(`/api/vault/${service}`);
      if (response.ok) {
        const data = await response.json();
        setVaultStatus({ exists: data.exists, value: data.value });
      }
    } catch (e) {
      console.error("Vault query failure:", e);
    }
  };

  useEffect(() => {
    fetchVaultStatus();
  }, [service]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) {
      setMessage({ type: 'error', text: 'Secret value cannot be empty.' });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/vault/${service}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: apiKey }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: `Successfully stored and sealed secret for ${label}!` });
        setApiKey("");
        fetchVaultStatus();
      } else {
        throw new Error(data.error || 'Failed to save to Vault.');
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Vault connection issues.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div id={`vault-manager-${service}`} className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4 shadow-lg">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/10">
            <Lock size={20} />
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">{label}</h4>
            <p className="text-xs text-neutral-500">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {vaultStatus.exists ? (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold rounded-full uppercase tracking-wider">
              <ShieldCheck size={12} />
              Vault Sealed
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-bold rounded-full uppercase tracking-wider">
              <AlertCircle size={12} />
              No secret
            </span>
          )}
        </div>
      </div>

      {vaultStatus.exists && (
        <div className="p-3 bg-black/40 border border-neutral-800 rounded-xl flex justify-between items-center text-xs">
          <div className="flex items-center gap-2 font-mono">
            <span className="text-neutral-500">Active Secret:</span>
            <span className="text-blue-400">{vaultStatus.value}</span>
          </div>
          <button 
            type="button" 
            onClick={() => {
              setVaultStatus({ exists: false, value: "" }); // allow updating/re-saving
            }}
            className="text-[10px] font-bold text-neutral-400 hover:text-white uppercase tracking-wider"
          >
            Update Key
          </button>
        </div>
      )}

      {!vaultStatus.exists && (
        <form onSubmit={handleSave} className="space-y-3">
          <div className="relative">
            <input
              type={isMasked ? "password" : "text"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={placeholder}
              className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500/50 pr-10 font-mono placeholder:text-neutral-600"
            />
            <button
              type="button"
              onClick={() => setIsMasked(!isMasked)}
              className="absolute right-3 top-3.5 text-neutral-500 hover:text-white transition-colors"
            >
              {isMasked ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <Check size={16} />
            )}
            Save To Secure Vault
          </button>
        </form>
      )}

      {message && (
        <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
          message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
        }`}>
          {message.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
          <span>{message.text}</span>
        </div>
      )}
    </div>
  );
};
