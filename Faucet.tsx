import React, { useState } from 'react';
import { 
  Droplets, 
  Send, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { useAccount } from 'wagmi';
import { motion } from 'motion/react';

export const Faucet: React.FC = () => {
  const { isConnected, address } = useAccount();
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestStatus, setRequestStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const requestTokens = async () => {
    if (!address) return;
    setIsRequesting(true);
    setErrorMessage('');
    setRequestStatus('idle');

    try {
      const response = await fetch('/api/faucet/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong during distribution.');
      }

      setTxHash(data.txHash);
      setRequestStatus('success');
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error occurred. Try again.');
      setRequestStatus('error');
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="p-10 max-w-4xl mx-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-[32px] overflow-hidden shadow-2xl">
        <div className="p-12 relative overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-blue-600/10 blur-[100px] rounded-full" />
          
          <div className="relative">
            <div className="w-16 h-16 bg-blue-600/20 text-blue-400 rounded-3xl flex items-center justify-center mb-6 border border-blue-500/20">
              <Droplets size={32} />
            </div>
            <h2 className="text-4xl font-bold mb-4">GEN Faucet</h2>
            <p className="text-neutral-400 text-lg mb-10 max-w-xl">
              Get free testnet <span className="text-white font-bold">GEN tokens</span> to deploy and test your Intelligent Contracts on the GenLayer network.
            </p>

            {!isConnected ? (
              <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-4">
                <AlertCircle size={24} />
                <p className="font-semibold text-sm">Please connect your wallet to request tokens.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-black/40 border border-neutral-800">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-2">Target Address</label>
                  <p className="font-mono text-blue-400 break-all">{address}</p>
                </div>

                {(requestStatus === 'idle' || requestStatus === 'error') && (
                  <div>
                    {requestStatus === 'error' && (
                      <div className="p-4 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                        <AlertCircle size={16} />
                        <span>{errorMessage}</span>
                      </div>
                    )}
                    <button
                      onClick={requestTokens}
                      disabled={isRequesting}
                      className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-900/40 disabled:opacity-50"
                    >
                      {isRequesting ? (
                        <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      ) : (
                        <Send size={20} />
                      )}
                      {isRequesting ? 'Processing Request...' : 'Send 100 GEN'}
                    </button>
                  </div>
                )}

                {requestStatus === 'success' && (
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-center"
                  >
                    <CheckCircle2 size={48} className="mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">Tokens Dispatched!</h3>
                    <p className="text-sm opacity-80 mb-2">100 GEN tokens have been sent to your wallet on the GenLayer Testnet.</p>
                    {txHash && (
                      <p className="text-[11px] font-mono text-neutral-400 mb-6 break-all">
                        Tx Hash: <span className="text-emerald-500">{txHash}</span>
                      </p>
                    )}
                    <div className="flex gap-4 justify-center">
                      <a 
                        href={`https://explorer.testnet.genlayer.io/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 bg-emerald-500/20 rounded-lg hover:bg-emerald-500/30 transition-all text-emerald-400"
                      >
                        View on Explorer
                        <ExternalLink size={14} />
                      </a>
                      <button 
                        onClick={() => {
                          setRequestStatus('idle');
                          setTxHash(null);
                        }}
                        className="text-xs font-bold px-4 py-2 bg-neutral-800 rounded-lg hover:bg-neutral-700 text-neutral-400 transition-all"
                      >
                        Request Again
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-neutral-800/50 p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center text-neutral-400">
              <Clock size={20} />
            </div>
            <div>
              <h4 className="font-bold text-sm mb-1">Rate Protection</h4>
              <p className="text-xs text-neutral-500">Available once every 24 hours per unique address.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center text-neutral-400">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h4 className="font-bold text-sm mb-1">Network Limit</h4>
              <p className="text-xs text-neutral-500">Each request is capped at 100 GEN to ensure fair distribution.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
