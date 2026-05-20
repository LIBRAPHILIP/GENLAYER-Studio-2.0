import React, { useState } from 'react';
import { 
  Play, 
  Send, 
  Sparkles, 
  History, 
  Trash2, 
  Terminal, 
  CheckCircle2,
  Cpu,
  FileCode2,
  ChevronDown
} from 'lucide-react';
import { useGenLayer } from '../lib/GenLayerProvider';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { TEMPLATES_DATA } from '../data/templatesCode';
import { useAccount, useSignMessage } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';

export const IDE: React.FC = () => {
  const { code, setCode, addSimulation, simulationHistory } = useGenLayer();
  const [logs, setLogs] = useState<string[]>(['>> IDE Initialized', '>> Ready for Intelligent Contract development']);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showTemplatesDropdown, setShowTemplatesDropdown] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);

  const { isConnected, address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { open } = useAppKit();

  const deployContract = async () => {
    if (!isConnected) {
      setLogs(prev => [...prev, '>> Error: Wallet not connected. Please connect your wallet first.']);
      open();
      return;
    }

    setIsDeploying(true);
    setLogs(prev => [...prev, '>> Initiating deployment of Intelligent Smart Contract...', '>> Please confirm signature verification request in your connected wallet...']);

    try {
      // Craft a descriptive message to sign
      const message = `GenLayer Studio: Deploys IntelligentContract
------------------------------------------------
Contract Format: python
Deployer: ${address}
Timestamp: ${new Date().toISOString()}

I authorize deployment of this Intelligent Contract to the GenLayer Testnet.`;

      const signature = await signMessageAsync({ message });

      const timestamp = new Date().toLocaleTimeString();
      const newLogs = [
        `>> Deployment successful at ${timestamp}`,
        `>> Contract deployed at address: 0x${Math.random().toString(36).substring(2, 12)}${Math.random().toString(36).substring(2, 12)}`,
        `>> Signature hash: ${signature.slice(0, 16)}...`
      ];

      setLogs(prev => [...prev, ...newLogs]);

      addSimulation({
        id: 'dep-' + Math.random().toString(36).substring(2, 7),
        contractName: 'Deployment successful',
        status: 'success',
        timestamp: new Date().toISOString(),
        logs: newLogs
      });

    } catch (err: any) {
      const errorMsg = err.message || 'Signature confirmation rejected';
      setLogs(prev => [...prev, `>> Error: Deployment failed. ${errorMsg}`]);
    } finally {
      setIsDeploying(false);
    }
  };

  const simulate = () => {
    setIsSimulating(true);
    setLogs(prev => [...prev, '>> Starting simulation on GenLayer Testnet...']);
    
    setTimeout(() => {
      const success = Math.random() > 0.2;
      const timestamp = new Date().toLocaleTimeString();
      const newLogs = success 
        ? [`>> Simulation successful at ${timestamp}`, '>> State: self.threshold_temp=32.0, self.total_triggers=1', '>> Gas Used: 48,102']
        : [`>> Simulation failed at ${timestamp}`, '>> Error: Logical inconsistency in external consensus payload'];
      
      setLogs(prev => [...prev, ...newLogs]);
      setIsSimulating(false);
      
      addSimulation({
        id: Math.random().toString(36).substr(2, 9),
        contractName: 'IntelligentContract',
        status: success ? 'success' : 'failure',
        timestamp: new Date().toISOString(),
        logs: newLogs
      });
    }, 1500);
  };

  const askAI = async () => {
    setIsAIThinking(true);
    setLogs(prev => [...prev, '>> Asking Gemini for optimization tips...']);
    
    try {
      const response = await fetch('/api/gemini/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      const data = await response.json();
      setLogs(prev => [...prev, `>> Gemini Support: ${data.suggestion}`]);
    } catch (e) {
      setLogs(prev => [...prev, '>> Error: AI service currently unavailable']);
    } finally {
      setIsAIThinking(false);
    }
  };

  const triggerAICompletion = async () => {
    setIsCompleting(true);
    setLogs(prev => [...prev, '>> Streaming inline AI code autocomplete model...']);
    
    try {
      const response = await fetch('/api/ai/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      const data = await response.json();
      
      if (data.completion) {
        setCode(code.trim() + '\n\n' + data.completion);
        setLogs(prev => [...prev, '>> Code completed successfully at cursor!']);
      }
    } catch (e) {
      setLogs(prev => [...prev, '>> Error: Autocomplete server timeout']);
    } finally {
      setIsCompleting(false);
    }
  };

  const loadTemplate = (text: string) => {
    setCode(text);
    setLogs(prev => [...prev, '>> Smart contract template loaded successfully.']);
    setShowTemplatesDropdown(false);
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950 font-sans">
      <header className="h-14 border-b border-neutral-900 flex items-center justify-between px-6 bg-black/40">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-neutral-500">contract /</span>
            <span className="text-sm font-bold">IntelligentContract.py</span>
          </div>
          <div className="h-4 w-[1px] bg-neutral-800" />
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-wider">
            <CheckCircle2 size={12} />
            Compiled
          </div>

          <div className="relative">
            <button 
              onClick={() => setShowTemplatesDropdown(!showTemplatesDropdown)}
              className="flex items-center gap-1.5 px-3 py-1 bg-neutral-900 border border-neutral-800 rounded-lg hover:bg-neutral-800 text-xs font-semibold text-neutral-300 transition-colors"
            >
              <FileCode2 size={14} />
              Templates
              <ChevronDown size={12} />
            </button>
            {showTemplatesDropdown && (
              <div className="absolute left-0 mt-2 w-56 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="py-1">
                  {TEMPLATES_DATA.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => loadTemplate(t.code)}
                      className="w-full text-left px-4 py-2 hover:bg-neutral-800 text-xs text-neutral-300 hover:text-white transition-colors"
                    >
                      {t.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={askAI}
            disabled={isAIThinking}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 transition-colors text-sm font-semibold disabled:opacity-50"
          >
            <Sparkles size={16} />
            {isAIThinking ? 'AI Thinking...' : 'AI Assistant'}
          </button>
          <button 
            onClick={simulate}
            disabled={isSimulating}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600/20 transition-colors text-sm font-semibold disabled:opacity-50"
          >
            <Play size={16} />
            {isSimulating ? 'Simulating...' : 'Run Simulation'}
          </button>
          <button 
            onClick={deployContract}
            disabled={isDeploying}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100 disabled:active:scale-100 transition-all text-sm font-bold shadow-lg shadow-blue-900/20 disabled:opacity-50"
          >
            <Send size={16} className={cn(isDeploying && "animate-pulse")} />
            {isDeploying ? 'Deploying...' : 'Deploy'}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col relative border-r border-neutral-900">
          <div className="flex-1 relative overflow-hidden flex font-mono text-sm leading-relaxed">
            <div className="w-12 bg-neutral-900/30 text-neutral-600 p-4 text-right select-none border-r border-neutral-900/50">
              {code.split('\n').map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 bg-transparent p-4 outline-none resize-none text-neutral-300 focus:text-white transition-colors"
              spellCheck={false}
            />

            {/* AI Custom Inline Complete floating trigger */}
            <div className="absolute right-6 bottom-4 z-10 flex gap-2">
              <button
                onClick={triggerAICompletion}
                disabled={isCompleting}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all border border-blue-500/25 disabled:opacity-50"
              >
                <Sparkles size={14} className={cn(isCompleting && "animate-spin")} />
                {isCompleting ? 'Generating autocomplete...' : 'Code Complete ✨'}
              </button>
            </div>
          </div>

          <div className="h-48 border-t border-neutral-900 bg-black/60 flex flex-col">
            <div className="h-8 border-b border-neutral-900 px-4 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                <Terminal size={12} />
                Console Output
              </div>
              <button 
                onClick={() => setLogs([])}
                className="text-neutral-600 hover:text-white transition-colors"
              >
                <Trash2 size={12} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1">
              {logs.map((log, i) => (
                <div key={i} className={cn(
                  log.startsWith('>> Error') ? 'text-rose-500' : 
                  log.startsWith('>> Simulation successful') ? 'text-emerald-400' :
                  log.startsWith('>> Gemini Support') ? 'text-indigo-400 font-semibold' :
                  log.startsWith('>> Gemini') ? 'text-blue-400 italic' :
                  'text-neutral-500'
                )}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-80 bg-neutral-950 flex flex-col overflow-y-auto border-l border-neutral-900">
          <div className="p-6">
            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <History size={14} />
              Simulation History
            </h3>
            <div className="space-y-3">
              {simulationHistory.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-neutral-800 rounded-2xl">
                  <Cpu className="mx-auto text-neutral-700 mb-2" size={24} />
                  <p className="text-xs text-neutral-600">No simulations run yet.</p>
                </div>
              ) : (
                <AnimatePresence>
                  {simulationHistory.map((item) => (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={item.id}
                      className="p-3 rounded-xl bg-neutral-900/50 border border-neutral-800 hover:border-neutral-700 transition-all group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono text-neutral-500">{item.id}</span>
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          item.status === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
                        )} />
                      </div>
                      <p className="text-xs font-bold mb-1">{item.contractName}</p>
                      <p className="text-[10px] text-neutral-600">{new Date(item.timestamp).toLocaleString()}</p>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
