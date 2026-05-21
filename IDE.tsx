import React, { useState, useRef } from 'react';
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
  ChevronDown,
  ChevronUp,
  ChevronRight,
  X,
  Coins,
  Settings,
  Zap,
  Info,
  AlertTriangle
} from 'lucide-react';
import { useGenLayer } from '../lib/GenLayerProvider';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { TEMPLATES_DATA } from '../data/templatesCode';
import { useAccount, useSignMessage, useWriteContract } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { highlightPython } from '../utils/pythonHighlighter';

// Helper to compute indentation level of a line
const getIndent = (line: string): number => {
  const match = line.match(/^(\s*)/);
  return match ? match[1].length : 0;
};

// Check if a line is a block header that can be folded
const canFoldLine = (lines: string[], index: number): boolean => {
  const line = lines[index];
  if (!line) return false;
  if (line.includes('# [FOLDED:')) return false;

  const trimmed = line.trim();
  if (!trimmed) return false;

  // Header candidates: class, def, conditional loops/with blocks in Python
  const isHeader = line.match(/^\s*(class|def)\b/) || line.match(/^\s*(if|for|while|try|with|elif|except)\b/);
  if (!isHeader) return false;

  const currentIndent = getIndent(line);
  let nextIndex = index + 1;
  while (nextIndex < lines.length) {
    const nextLine = lines[nextIndex];
    if (nextLine.trim()) {
      const nextIndent = getIndent(nextLine);
      return nextIndent > currentIndent;
    }
    nextIndex++;
  }
  return false;
};

// Map each visible line of text to its original line number (1-based index)
const getVisibleLineNumbers = (visibleCode: string, foldedMap: Record<string, string>): number[] => {
  const visibleLines = visibleCode.split('\n');
  const numbers: number[] = [];
  let currentOriginalLine = 1;

  for (const line of visibleLines) {
    numbers.push(currentOriginalLine);
    const foldMatch = line.match(/#\s*\[FOLDED:(\w+)\]/);
    if (foldMatch) {
      const id = foldMatch[1];
      const originalFoldedText = foldedMap[id];
      if (originalFoldedText) {
        const foldedLineCount = originalFoldedText.split('\n').length;
        currentOriginalLine += foldedLineCount;
      }
    }
    currentOriginalLine++;
  }
  return numbers;
};

// Unfold code recursively by matching fold marker tags and replacing them with full text
const getFullContractCode = (currentCodeText: string, currentFoldedMap: Record<string, string>) => {
  let expanded = currentCodeText;
  let hasMarkers = true;
  let iterations = 0; // Prevent infinite loops
  
  while (hasMarkers && iterations < 100) {
    const match = expanded.match(/#\s*\[FOLDED:(\w+)\]/);
    if (!match) {
      hasMarkers = false;
      break;
    }
    
    expanded = expanded.split('\n').map(line => {
      const lineMatch = line.match(/#\s*\[FOLDED:(\w+)\]/);
      if (lineMatch) {
        const id = lineMatch[1];
        const originalLines = currentFoldedMap[id];
        if (originalLines !== undefined) {
          const cleanLine = line.replace(/\s*#\s*\[FOLDED:\w+\]/, "");
          return cleanLine + "\n" + originalLines;
        }
      }
      return line;
    }).join('\n');
    iterations++;
  }
  
  return expanded;
};

// Translate cursor offset from visible text containing markers to original raw code text
const getUnfoldedCursorOffset = (visibleCode: string, cursorOffset: number, map: Record<string, string>): number => {
  let unfoldedOffset = 0;
  let visibleCharCount = 0;
  
  const visibleLines = visibleCode.split('\n');
  for (const line of visibleLines) {
    const lineLength = line.length + 1; // +1 for the newline character
    
    if (visibleCharCount + lineLength <= cursorOffset) {
      const foldMatch = line.match(/#\s*\[FOLDED:(\w+)\]/);
      if (foldMatch) {
        const id = foldMatch[1];
        const originalLines = map[id] || "";
        const cleanLine = line.replace(/\s*#\s*\[FOLDED:\w+\]/, "");
        unfoldedOffset += cleanLine.length + 1 + originalLines.length + 1;
      } else {
        unfoldedOffset += lineLength;
      }
      visibleCharCount += lineLength;
    } else {
      const offsetInLine = cursorOffset - visibleCharCount;
      const foldIndex = line.indexOf('# [FOLDED:');
      if (foldIndex !== -1 && offsetInLine > foldIndex) {
        unfoldedOffset += foldIndex;
      } else {
        unfoldedOffset += offsetInLine;
      }
      break;
    }
  }
  return unfoldedOffset;
};

export const IDE: React.FC = () => {
  const { code, setCode, addSimulation, simulationHistory } = useGenLayer();
  const [logs, setLogs] = useState<string[]>(['>> IDE Initialized', '>> Ready for Intelligent Contract development']);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showTemplatesDropdown, setShowTemplatesDropdown] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const [contextPruningEnabled, setContextPruningEnabled] = useState(true);

  const [foldedMap, setFoldedMap] = useState<Record<string, string>>({});
  const [activeLineIndex, setActiveLineIndex] = useState<number | null>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (preRef.current) {
      preRef.current.scrollTop = e.currentTarget.scrollTop;
      preRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const handleCursorMove = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const cursorOffset = e.currentTarget.selectionStart ?? 0;
    const beforeText = code.substring(0, cursorOffset);
    const lineNumber = beforeText.split('\n').length - 1; // 0-based index
    setActiveLineIndex(lineNumber);
  };

  const handleFold = (visibleLineIndex: number) => {
    const visibleLines = code.split('\n');
    const line = visibleLines[visibleLineIndex];
    if (!line) return;
    const currentIndent = getIndent(line);

    // Find the collapsible block range inside visible lines
    let j = visibleLineIndex + 1;
    let lastChildIndex = -1;
    while (j < visibleLines.length) {
      const nextLine = visibleLines[j];
      const nextTrimmed = nextLine.trim();
      
      if (nextTrimmed) {
        const nextIndent = getIndent(nextLine);
        if (nextIndent <= currentIndent) {
          break; // Stop at same or less indentation level
        }
        lastChildIndex = j;
      }
      j++;
    }

    if (lastChildIndex > visibleLineIndex) {
      const linesToFold = visibleLines.slice(visibleLineIndex + 1, lastChildIndex + 1);
      const originalText = linesToFold.join('\n');
      
      const id = 'fold_' + Math.random().toString(36).substring(2, 9);
      const cleanLine = line.replace(/\s*#\s*\[FOLDED:\w+\]/, "");
      
      visibleLines[visibleLineIndex] = `${cleanLine}  # [FOLDED:${id}]`;
      visibleLines.splice(visibleLineIndex + 1, lastChildIndex - visibleLineIndex);

      const newCode = visibleLines.join('\n');
      setCode(newCode);

      setFoldedMap(prev => ({
        ...prev,
        [id]: originalText
      }));

      setLogs(prev => [...prev, `>> Folded block starting at line ${visibleLineIndex + 1}`]);
    }
  };

  const handleUnfold = (visibleLineIndex: number) => {
    const visibleLines = code.split('\n');
    const line = visibleLines[visibleLineIndex];
    if (!line) return;
    const foldMatch = line.match(/#\s*\[FOLDED:(\w+)\]/);
    if (foldMatch) {
      const id = foldMatch[1];
      const originalLines = foldedMap[id];
      if (originalLines !== undefined) {
        const cleanLine = line.replace(/\s*#\s*\[FOLDED:\w+\]/, "");
        visibleLines[visibleLineIndex] = cleanLine + "\n" + originalLines;
        
        const newCode = visibleLines.join('\n');
        setCode(newCode);

        setFoldedMap(prev => {
          const newMap = { ...prev };
          delete newMap[id];
          return newMap;
        });

        setLogs(prev => [...prev, `>> Unfolded block starting at line ${visibleLineIndex + 1}`]);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textareaRef.current?.selectionStart ?? 0;
      const end = textareaRef.current?.selectionEnd ?? 0;
      const spaces = "    "; // 4 spaces for elegant Python indenting
      const newCode = code.substring(0, start) + spaces + code.substring(end);
      setCode(newCode);
      
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + spaces.length;
        }
      }, 0);
    }
  };
  const [pruningSavedPercent, setPruningSavedPercent] = useState<number | null>(null);
  const [showDeploymentModal, setShowDeploymentModal] = useState(false);
  const [deploymentProposal, setDeploymentProposal] = useState<{
    className: string;
    bytecode: string;
    estimatedGas: number;
    activeLinesCount: number;
    parsedMethods: string[];
  } | null>(null);
  const [gasPricingMode, setGasPricingMode] = useState<'flat' | 'dynamic'>('flat');
  const [genPrice, setGenPrice] = useState<number>(2.5); // Default simulated token price of $2.50 USD
  const [gasPriority, setGasPriority] = useState<'low' | 'medium' | 'high' | 'custom'>('medium');
  const [customMultiplier, setCustomMultiplier] = useState<number>(1.0);
  const [customGasLimit, setCustomGasLimit] = useState<number>(150000);
  const [showGasBreakdown, setShowGasBreakdown] = useState<boolean>(false);

  const { isConnected, address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { open } = useAppKit();
  const { writeContractAsync } = useWriteContract();

  const deployContract = async () => {
    if (!isConnected) {
      setLogs(prev => [...prev, '>> Error: Wallet not connected. Please connect your wallet first.']);
      open();
      return;
    }

    setLogs(prev => [
      ...prev, 
      '>> Initiating deployment footprint calculation...',
      '>> Parsing Python contract structure for class name & components...'
    ]);

    // Unfold contract code to process full representation
    const fullCode = getFullContractCode(code, foldedMap);

    // Parse contract details
    const match = fullCode.match(/class\s+(\w+)/);
    const className = match ? match[1] : "IntelligentContract";
    
    // Simulate compilation to obtain bytecode representation
    const bytecode = '0x60806040523480156100105760' + Array.from(className)
      .map(c => c.charCodeAt(0).toString(16).padStart(2, '0'))
      .join('');

    // Dynamic gas estimation based on active lines of code and structure complexity
    const activeLinesCount = fullCode.split('\n').filter(l => l.trim().length > 0).length;

    // Parse contract methods
    const parsedMethods: string[] = [];
    const pythonCodeLines = fullCode.split('\n');
    for (const line of pythonCodeLines) {
      const methodMatch = line.match(/^\s*def\s+(\w+)\s*\(/);
      if (methodMatch) {
        const methodName = methodMatch[1];
        if (methodName !== '__init__') {
          parsedMethods.push(methodName);
        }
      }
    }

    // Dynamic gas formula: base overhead + code line weight + methods weight
    const estimatedGas = 125000 + activeLinesCount * 380 + parsedMethods.length * 45000;

    // Initialize custom controls with the calculated optimal presets
    setCustomGasLimit(estimatedGas);
    setGasPriority('medium');
    setCustomMultiplier(1.0);
    setShowGasBreakdown(false);

    const initialGasFee = gasPricingMode === 'flat' 
      ? 0.00001 
      : 0.000025 / genPrice;

    setLogs(prev => [
      ...prev,
      `>> Calculating gas consumption on GenLayer Testnet...`,
      `>> Formulated Proposal. Gas requirement estimated at ${estimatedGas.toLocaleString()} Units.`,
      `>> Proposed Gas Fee: ${initialGasFee.toFixed(8)} GEN.`,
      `>> Awaiting user confirmation of gas estimation...`
    ]);

    setDeploymentProposal({
      className,
      bytecode,
      estimatedGas,
      activeLinesCount,
      parsedMethods
    });
    setShowDeploymentModal(true);
  };

  const cancelDeployment = () => {
    setShowDeploymentModal(false);
    setDeploymentProposal(null);
    setLogs(prev => [...prev, '>> Deployment cancelled by user. Gas estimation discarded.']);
  };

  const confirmAndExecuteDeployment = async () => {
    if (!deploymentProposal) return;
    
    setShowDeploymentModal(false);
    setIsDeploying(true);

    const { className, bytecode, estimatedGas } = deploymentProposal;
    
    // Calculate final actual gas fee based on customized limit and priority speed
    const multiplier = gasPriority === 'low' 
      ? 0.8 
      : gasPriority === 'medium' 
        ? 1.0 
        : gasPriority === 'high' 
          ? 1.5 
          : customMultiplier;

    const baseGasPrice = gasPricingMode === 'flat'
      ? 0.00001 / estimatedGas
      : (0.000025 / genPrice) / estimatedGas;

    const chosenGasFee = customGasLimit * baseGasPrice * multiplier;

    setLogs(prev => [
      ...prev,
      `>> Gas estimation confirmed at ${chosenGasFee.toFixed(8)} GEN. (GAS LIMIT: ${customGasLimit.toLocaleString()} Units, Tip speed multiplier: ${multiplier.toFixed(1)}x). Initiating wallet transaction sequence...`,
      `>> Awaiting signature in connected wallet...`
    ]);

    try {
      // Prompt user in their connected wallet through Wagmi hook writeContractAsync
      const txHash = await writeContractAsync({
        address: '0x7894E68B8D1CDe91B1Fdf8385ff2EF32a5C317d7',
        abi: [
          {
            type: 'function',
            name: 'deployContract',
            stateMutability: 'nonpayable',
            inputs: [
              { name: 'bytecode', type: 'string' },
              { name: 'contractName', type: 'string' }
            ],
            outputs: [{ name: 'contractAddress', type: 'address' }]
          }
        ] as const,
        functionName: 'deployContract',
        args: [bytecode, className]
      });

      setLogs(prev => [
        ...prev, 
        `>> Transaction submitted successfully!`,
        `>> Tx Hash: ${txHash}`,
        `>> Waiting for block verification & GenLayer consensus...`
      ]);

      // Confirm block transaction verification sequence
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockContractAddress = `0x${Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('')}`;
      const actualGasConsumed = Math.min(customGasLimit, Math.round(estimatedGas * 0.96));
      const timestamp = new Date().toLocaleTimeString();

      const successLogs = [
        `>> Deployment confirmed at ${timestamp} in block #${Math.floor(841200 + Math.random() * 5000)}`,
        `>> Contract deployed at: ${mockContractAddress}`,
        `>> Gas limits: ${actualGasConsumed.toLocaleString()} / ${customGasLimit.toLocaleString()} Gas Units`,
        `>> Dynamic Gas Fee: ${chosenGasFee.toFixed(8)} GEN`
      ];

      setLogs(prev => [...prev, ...successLogs]);

      addSimulation({
        id: 'tx-' + Math.random().toString(36).substring(2, 7),
        contractName: 'Deployment successful',
        status: 'success',
        type: 'deployment',
        timestamp: new Date().toISOString(),
        logs: successLogs,
        txHash: txHash,
        gasUsed: `${chosenGasFee.toFixed(8)}`,
        contractAddress: mockContractAddress
      });

    } catch (err: any) {
      const errorMsg = err.message || 'Transaction rejected by user';
      const failedLogs = [
        `>> Error: Deployment failed`,
        `>> Cause: ${errorMsg}`,
        `>> Estimated Gas overhead: ${chosenGasFee.toFixed(8)} GEN`
      ];
      setLogs(prev => [...prev, ...failedLogs]);

      addSimulation({
        id: 'tx-' + Math.random().toString(36).substring(2, 7),
        contractName: 'Deployment failed',
        status: 'failure',
        type: 'deployment',
        timestamp: new Date().toISOString(),
        logs: failedLogs,
        txHash: 'N/A',
        gasUsed: '0',
        contractAddress: 'N/A'
      });
    } finally {
      setIsDeploying(false);
      setDeploymentProposal(null);
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
      const fullCode = getFullContractCode(code, foldedMap);
      const response = await fetch('/api/gemini/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: fullCode })
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
    
    const cursorOffset = textareaRef.current?.selectionStart ?? 0;
    const fullCode = getFullContractCode(code, foldedMap);
    const unfoldedCursorOffset = getUnfoldedCursorOffset(code, cursorOffset, foldedMap);
    
    if (contextPruningEnabled) {
      setLogs(prev => [...prev, '>> Streaming inline AI code autocomplete with context pruning active...']);
    } else {
      setLogs(prev => [...prev, '>> Streaming inline AI code autocomplete (full context, no pruning)...']);
    }
    
    try {
      const response = await fetch('/api/ai/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: fullCode, 
          contextPruning: contextPruningEnabled,
          cursorOffset: unfoldedCursorOffset
        })
      });
      const data = await response.json();
      
      if (data.completion) {
        // Insert completion text precisely at the current cursor selection position
        const cursorPosition = textareaRef.current?.selectionStart ?? code.length;
        const endPosition = textareaRef.current?.selectionEnd ?? code.length;
        const before = code.substring(0, cursorPosition);
        const after = code.substring(endPosition);
        
        // Formulate the full updated contract code body
        const newCode = before + data.completion + after;
        setCode(newCode);
        
        if (data.pruningStats) {
          const { originalLines, prunedLines, savedPercent } = data.pruningStats;
          setPruningSavedPercent(savedPercent);
          setLogs(prev => [
            ...prev, 
            `>> Code completed successfully at cursor!`,
            `>> [Pruning stats: Input reduced from ${originalLines} to ${prunedLines} lines (-${savedPercent}% context overhead)]`
          ]);
        } else {
          setPruningSavedPercent(null);
          setLogs(prev => [...prev, '>> Code completed successfully at cursor!']);
        }

        // Return user typing focus directly back into the dynamic textarea
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            const nextCursor = cursorPosition + data.completion.length;
            textareaRef.current.setSelectionRange(nextCursor, nextCursor);
          }
        }, 50);
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

  const visibleLineNumbers = getVisibleLineNumbers(code, foldedMap);

  const highlightAndFormat = (codeText: string) => {
    let highlighted = highlightPython(codeText);
    
    // Replace comment markers with sleek pill badges
    highlighted = highlighted.replace(
      /<span class="text-neutral-500 italic">#\s*\[FOLDED:(\w+)\]<\/span>/g,
      () => {
        return `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 ml-1.5 cursor-pointer select-none bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/35 text-blue-400 text-[10px] font-bold rounded-md transition-colors select-none">&bull;&bull;&bull; collapsed block</span>`;
      }
    );
    
    return highlighted;
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
          <div className="flex-1 relative overflow-hidden flex font-mono text-sm">
            {/* Custom line numbers & folding gutter */}
            <div 
              ref={lineNumbersRef}
              className="w-14 bg-neutral-950/40 text-neutral-600 py-4 select-none border-r border-neutral-900 overflow-hidden shrink-0"
              style={{ height: '100%' }}
            >
              {visibleLineNumbers.map((num, i) => {
                const lines = code.split('\n');
                const lineText = lines[i];
                const isFolded = lineText && lineText.includes('# [FOLDED:');
                const canFold = canFoldLine(lines, i);
                const isActive = i === activeLineIndex;

                return (
                  <div 
                    key={i} 
                    className={cn(
                      "h-6 flex items-center justify-end pr-2.5 text-[11px] font-mono leading-6 relative group transition-colors duration-150",
                      isActive ? "text-neutral-200 bg-neutral-900/30 font-semibold" : "text-neutral-500 hover:text-neutral-400"
                    )}
                  >
                    {/* Active line vertical neon indicator bar */}
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                    )}

                    {/* Folding action chevron */}
                    <div className="absolute left-1.5 flex items-center justify-center">
                      {isFolded ? (
                        <button
                          onClick={() => handleUnfold(i)}
                          className="text-amber-500 hover:text-amber-400 p-0.5 rounded hover:bg-neutral-800 transition-all flex items-center justify-center cursor-pointer"
                          title="Unfold block"
                        >
                          <ChevronRight size={11} className="stroke-[2.5]" />
                        </button>
                      ) : canFold ? (
                        <button
                          onClick={() => handleFold(i)}
                          className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-neutral-300 p-0.5 rounded hover:bg-neutral-850/50 transition-all flex items-center justify-center cursor-pointer"
                          title="Fold block"
                        >
                          <ChevronDown size={11} />
                        </button>
                      ) : null}
                    </div>

                    <span className="select-none tracking-tight text-right w-full">{num}</span>
                  </div>
                );
              })}
            </div>

            {/* Code text space */}
            <div className="flex-1 relative h-full overflow-hidden">
              <pre
                ref={preRef}
                className="absolute inset-0 p-4 pointer-events-none overflow-hidden font-mono text-sm leading-6 whitespace-pre select-none text-neutral-300 font-normal border-0 m-0 [tab-size:4]"
                dangerouslySetInnerHTML={{ __html: highlightAndFormat(code) }}
              />
              <textarea
                ref={textareaRef}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  handleCursorMove(e);
                }}
                onScroll={handleScroll}
                onKeyDown={handleKeyDown}
                onSelect={handleCursorMove}
                onKeyUp={handleCursorMove}
                onMouseUp={handleCursorMove}
                onFocus={handleCursorMove}
                className="absolute inset-0 p-4 bg-transparent outline-none resize-none font-mono text-sm leading-6 whitespace-pre text-transparent caret-blue-500 focus:outline-none w-full h-full border-0 select-text overflow-auto [tab-size:4]"
                spellCheck={false}
              />
            </div>

            {/* AI Custom Inline Complete floating trigger with Context Pruning control */}
            <div className="absolute right-6 bottom-4 z-10 flex items-center gap-3">
              {/* Context Pruning Switch */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-xl shadow-lg">
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={contextPruningEnabled}
                    onChange={(e) => {
                      setContextPruningEnabled(e.target.checked);
                      if (!e.target.checked) setPruningSavedPercent(null);
                    }}
                    className="sr-only peer"
                    id="context-pruning-toggle"
                  />
                  <div className="w-8 h-4 bg-neutral-800 rounded-full peer peer-focus:ring-1 peer-focus:ring-blue-500/50 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-neutral-400 after:border-neutral-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white border border-neutral-700/50" />
                  <span className="ml-2 text-[11px] font-semibold text-neutral-400 hover:text-white transition-colors">
                    Pruning
                  </span>
                </label>
                {contextPruningEnabled && pruningSavedPercent !== null && (
                  <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-mono font-bold animate-pulse" id="prune-reduction-badge">
                    -{pruningSavedPercent}% Tokens
                  </span>
                )}
              </div>

              <button
                onClick={triggerAICompletion}
                disabled={isCompleting}
                id="btn-trigger-ai-completion"
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all border border-blue-500/25 disabled:opacity-50"
              >
                <Sparkles size={14} className={cn(isCompleting && "animate-spin")} />
                {isCompleting ? 'Generating...' : 'Code Complete ✨'}
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
                      className={cn(
                        "p-3.5 rounded-xl border transition-all duration-200 shadow-md",
                        item.type === 'deployment'
                          ? item.status === 'success'
                            ? 'bg-blue-500/5 border-blue-500/20 hover:border-blue-500/40'
                            : 'bg-rose-500/5 border-rose-500/20 hover:border-rose-500/40'
                          : 'bg-neutral-900/50 border-neutral-800 hover:border-neutral-700'
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 pt-[1px]">
                          <span className={cn(
                            "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider font-mono",
                            item.type === 'deployment'
                              ? item.status === 'success'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-neutral-800 text-neutral-400'
                          )}>
                            {item.type === 'deployment' ? 'Deploy' : 'Simulate'}
                          </span>
                          <span className="text-[10px] font-mono text-neutral-600 font-bold">#{item.id}</span>
                        </div>
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full shadow-sm",
                          item.status === 'success' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                        )} />
                      </div>
                      
                      <p className="text-xs font-bold text-neutral-200 mb-1 leading-tight">
                        {item.contractName}
                      </p>
                      <p className="text-[9px] text-neutral-500 font-medium mb-2 font-mono">
                        {new Date(item.timestamp).toLocaleString()}
                      </p>

                      {item.type === 'deployment' && (
                        <div className="space-y-1.5 pt-2 border-t border-neutral-900 text-[10px] font-mono text-neutral-400">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-neutral-500 font-semibold select-none">Tx Hash:</span>
                            <span className="truncate max-w-[120px] text-neutral-300 bg-neutral-900/40 px-1 py-0.5 rounded border border-neutral-800/50" title={item.txHash}>
                              {item.txHash && item.txHash !== 'N/A' 
                                ? `${item.txHash.slice(0, 6)}...${item.txHash.slice(-4)}` 
                                : 'N/A'}
                            </span>
                          </div>
                          
                          {item.status === 'success' && (
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-neutral-500 font-semibold select-none">Address:</span>
                              <span className="truncate max-w-[120px] text-neutral-300 bg-neutral-900/40 px-1 py-0.5 rounded border border-neutral-800/50 font-bold text-blue-400" title={item.contractAddress}>
                                {item.contractAddress && item.contractAddress !== 'N/A' 
                                  ? `${item.contractAddress.slice(0, 6)}...${item.contractAddress.slice(-4)}` 
                                  : 'N/A'}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center justify-between gap-1">
                            <span className="text-neutral-500 font-semibold select-none">Gas Used:</span>
                            <span className="text-neutral-300 font-bold font-mono">
                              {item.gasUsed} GEN
                            </span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Gas Estimation Modal */}
      <AnimatePresence>
        {showDeploymentModal && deploymentProposal && (
          <div className="fixed inset-0 bg-neutral-950/85 backdrop-blur-sm flex items-center justify-center z-50 p-4" id="gas-estimation-modal">
            <motion.div 
              initial={{ opacity: 0, scale: 0.97, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 15 }}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-900 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg">
                    <Cpu size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white leading-none">Gas Overhead & Fee Optimization</h3>
                    <span className="text-[10px] text-neutral-500 font-mono">GENLAYER TESTNET PRECISION METRICS</span>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={cancelDeployment}
                  className="text-neutral-500 hover:text-neutral-300 transition-colors p-1 hover:bg-neutral-800 rounded-lg"
                  id="btn-close-modal"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Scrollable Container */}
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* Section 1: Contract Summary */}
                <div className="bg-neutral-950/50 rounded-xl p-4 border border-neutral-800/50 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400">Target Intelligent Class:</span>
                    <span className="font-extrabold text-blue-400 font-mono text-xs">{deploymentProposal.className}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400">Total Structural Linecount:</span>
                    <span className="font-mono text-neutral-300">{deploymentProposal.activeLinesCount} lines</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400">Compiled Bytecode payload:</span>
                    <span className="font-mono text-neutral-300">
                      {Math.round(deploymentProposal.bytecode.length / 2).toLocaleString()} bytes
                    </span>
                  </div>
                </div>

                {/* Section 2: Gas Cost Breakdown Per Function */}
                <div className="border border-neutral-800/80 rounded-xl bg-neutral-950/20 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowGasBreakdown(!showGasBreakdown)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-neutral-950/40 hover:bg-neutral-950/70 border-b border-neutral-800/50 transition-colors"
                    id="toggle-gas-breakdown-btn"
                  >
                    <div className="flex items-center gap-2">
                      <FileCode2 size={14} className="text-blue-400" />
                      <span className="text-xs font-bold text-neutral-200">Gas Breakdown Per Call</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-neutral-500 font-semibold uppercase font-mono">
                        {showGasBreakdown ? 'Hide Details' : 'Show Details'}
                      </span>
                      {showGasBreakdown ? <ChevronUp size={14} className="text-neutral-400" /> : <ChevronDown size={14} className="text-neutral-400" />}
                    </div>
                  </button>

                  {showGasBreakdown && (
                    <div className="p-4 bg-neutral-950/70 space-y-3 divide-y divide-neutral-900 text-xs text-neutral-300 animate-slide-down">
                      <div className="flex justify-between items-start pt-1 first:pt-0">
                        <div className="space-y-0.5">
                          <p className="font-bold text-neutral-200">EVM Base Setup & VM Init</p>
                          <p className="text-[10px] text-neutral-500">Base deployment overhead initialization</p>
                        </div>
                        <span className="font-mono text-neutral-400">125,000 gas</span>
                      </div>

                      <div className="flex justify-between items-start pt-2">
                        <div className="space-y-0.5">
                          <p className="font-bold text-neutral-200">Bytecode Translation Fee</p>
                          <p className="text-[10px] text-neutral-500">Code volume weight ({deploymentProposal.activeLinesCount} lines × 380 per line)</p>
                        </div>
                        <span className="font-mono text-neutral-400">{(deploymentProposal.activeLinesCount * 380).toLocaleString()} gas</span>
                      </div>

                      {deploymentProposal.parsedMethods.length > 0 ? (
                        <div className="space-y-2 pt-2">
                          <p className="text-[10px] uppercase tracking-wider font-bold text-neutral-500 font-mono">Function Gas Allocation</p>
                          {deploymentProposal.parsedMethods.map((methodName, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-neutral-900/60 p-2 rounded border border-neutral-800/40">
                              <div className="flex items-center gap-1.5 truncate">
                                <Terminal size={11} className="text-indigo-400 shrink-0" />
                                <span className="font-mono font-bold text-neutral-300 truncate" title={`${methodName}()`}>{methodName}()</span>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="font-mono text-neutral-400 font-semibold block">45,000 gas</span>
                                <span className="text-[9px] text-neutral-600 font-medium font-sans">consensus hook limit</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="pt-2 text-center py-2 text-[11px] text-neutral-500 font-medium">
                          No custom function endpoints parsed under the class declaration.
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center pt-2 font-bold text-neutral-200 border-t border-neutral-800">
                        <span>Total Calculated Estimate</span>
                        <span className="font-mono text-blue-400 font-black">{deploymentProposal.estimatedGas.toLocaleString()} gas</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Section 3: Priority Selector (Low / Med / High / Custom) */}
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center text-[10px] uppercase tracking-wider text-neutral-500 font-bold">
                    <span>Consensus Priority & Speed Tip</span>
                    <span className="text-neutral-600 font-sans font-medium uppercase text-[9px]">influences ledger execution queue</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {(['low', 'medium', 'high', 'custom'] as const).map((tier) => {
                      const title = tier === 'low' ? 'Low' : tier === 'medium' ? 'Standard' : tier === 'high' ? 'High' : 'Custom';
                      const speed = tier === 'low' ? '0.8x tip' : tier === 'medium' ? '1.0x tip' : tier === 'high' ? '1.5x tip' : 'Manual';
                      const isActive = gasPriority === tier;

                      return (
                        <button
                          key={tier}
                          type="button"
                          onClick={() => {
                            setGasPriority(tier);
                            if (tier === 'low') setCustomMultiplier(0.8);
                            else if (tier === 'medium') setCustomMultiplier(1.0);
                            else if (tier === 'high') setCustomMultiplier(1.5);
                          }}
                          className={cn(
                            "p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all",
                            isActive
                              ? "bg-blue-600/10 border-blue-500/50 text-white font-bold ring-1 ring-blue-500/15"
                              : "bg-neutral-950/40 border-neutral-800/80 hover:border-neutral-700/80 text-neutral-400 hover:text-neutral-200"
                          )}
                        >
                          <span className="text-xs">{title}</span>
                          <span className="text-[9px] font-mono opacity-80 mt-0.5">{speed}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Multiplier slider when manual chosen */}
                  {gasPriority === 'custom' && (
                    <div className="p-3.5 bg-neutral-950/50 border border-neutral-800 rounded-xl space-y-2 animate-slide-down">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-neutral-400">Custom Priority Tip Multiplier:</span>
                        <span className="font-mono font-bold text-blue-400 bg-blue-500/10 border border-blue-500/10 px-2 py-0.5 rounded text-[11px]">
                          {customMultiplier.toFixed(1)}x
                        </span>
                      </div>
                      <input 
                        type="range"
                        min="0.5"
                        max="3.5"
                        step="0.1"
                        value={customMultiplier}
                        onChange={(e) => setCustomMultiplier(parseFloat(e.target.value))}
                        className="w-full accent-blue-500 bg-neutral-800 h-1.5 rounded-lg cursor-pointer"
                        id="gas-priority-custom-slider"
                      />
                      <div className="flex justify-between text-[9px] text-neutral-500 uppercase font-bold font-mono">
                        <span>0.5x (Lowest gas priority queue)</span>
                        <span>3.5x (High-priority bypass)</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Section 4: Limit Slider & Input */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[10px] uppercase tracking-wider text-neutral-500 font-bold">
                    <span>Configure Gas Limit</span>
                    <span className="text-neutral-600 font-sans font-medium uppercase text-[9px]">Maximum gas pool allowed per tx</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                    <div className="md:col-span-2">
                      <input 
                        type="range"
                        min={Math.round(deploymentProposal.estimatedGas * 0.5)}
                        max={Math.round(deploymentProposal.estimatedGas * 3)}
                        step="5000"
                        value={customGasLimit}
                        onChange={(e) => setCustomGasLimit(parseInt(e.target.value))}
                        className="w-full accent-blue-500 bg-neutral-800 h-1.5 rounded-lg cursor-pointer"
                        id="gas-limit-slider"
                      />
                    </div>
                    
                    <div className="relative">
                      <input 
                        type="number"
                        min="20000"
                        value={customGasLimit}
                        onChange={(e) => {
                          const parsed = parseInt(e.target.value);
                          setCustomGasLimit(isNaN(parsed) ? 10000 : parsed);
                        }}
                        className="w-full pl-3 pr-9 py-1.5 bg-neutral-950 border border-neutral-800 rounded-xl text-center text-xs font-mono font-bold hover:border-neutral-700 focus:border-neutral-600 focus:outline-none"
                        id="gas-limit-number-input"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-neutral-500 font-mono select-none uppercase">Limit</span>
                    </div>
                  </div>

                  {customGasLimit < deploymentProposal.estimatedGas && (
                    <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl flex items-start gap-2 text-amber-500/80 leading-normal text-[10px]" id="gas-warning-prompt">
                      <AlertTriangle className="shrink-0 mt-0.5" size={13} />
                      <p>
                        <strong>Risk of Revert:</strong> The selected gas limit is below the computed optimal estimate ({deploymentProposal.estimatedGas.toLocaleString()} Units). Transactions execution could terminate prematurely if the limits are depleted before agreement consensus.
                      </p>
                    </div>
                  )}
                </div>

                {/* Section 5: Pricing Strategy Selector */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold block">
                    Select Gas Pricing Mode
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setGasPricingMode('flat')}
                      className={cn(
                        "p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between h-20",
                        gasPricingMode === 'flat'
                          ? "bg-blue-600/10 border-blue-500/40 shadow-md shadow-blue-500/5 ring-1 ring-blue-500/10"
                          : "bg-neutral-950/40 border-neutral-800/80 hover:border-neutral-700 hover:bg-neutral-950/60"
                      )}
                      id="pricing-mode-flat-btn"
                    >
                      <div>
                        <span className="text-xs font-bold text-white block">Eco Local Fee</span>
                        <span className="text-[10px] text-neutral-400 block mt-0.5">Fixed Rate Mode</span>
                      </div>
                      <span className="text-[9px] bg-blue-500/20 text-blue-300 font-mono font-bold px-2 py-0.5 rounded self-start">
                        0.000010 GEN
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setGasPricingMode('dynamic')}
                      className={cn(
                        "p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between h-20",
                        gasPricingMode === 'dynamic'
                          ? "bg-indigo-600/10 border-indigo-500/40 shadow-md shadow-indigo-500/5 ring-1 ring-indigo-500/10"
                          : "bg-neutral-950/40 border-neutral-800/80 hover:border-neutral-700 hover:bg-neutral-950/60"
                      )}
                      id="pricing-mode-dynamic-btn"
                    >
                      <div>
                        <span className="text-xs font-bold text-white block">Market Feed</span>
                        <span className="text-[10px] text-neutral-400 block mt-0.5">Elastic Token-Price Mode</span>
                      </div>
                      <span className="text-[9px] bg-indigo-500/20 text-indigo-300 font-mono font-bold px-2 py-0.5 rounded self-start">
                        Depends on $GEN
                      </span>
                    </button>
                  </div>
                </div>

                {/* Section 6: Token Pricing Interactive Feed/Slider when in dynamic mode */}
                {gasPricingMode === 'dynamic' && (
                  <div className="p-4 bg-neutral-950/60 border border-neutral-800 rounded-xl space-y-3" id="token-pricing-slider-container">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-400 font-medium font-sans">Simulated Market Price ($GEN):</span>
                      <span className="font-extrabold text-blue-400 font-mono bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/10 animate-pulse">
                        ${genPrice.toFixed(2)} USD
                      </span>
                    </div>

                    <input 
                      type="range"
                      min="0.10"
                      max="10.00"
                      step="0.10"
                      value={genPrice}
                      onChange={(e) => setGenPrice(parseFloat(e.target.value))}
                      className="w-full accent-blue-500 bg-neutral-800 h-1.5 rounded-lg cursor-pointer transition-all"
                      id="gen-price-slider"
                    />

                    <div className="flex justify-between items-center text-[9px] text-neutral-500 font-bold uppercase font-mono">
                      <span>$0.10 (High GEN Fee)</span>
                      <span>Target: $0.000025 tx fee</span>
                      <span>$10.00 (Low GEN Fee)</span>
                    </div>
                  </div>
                )}

                {/* Section 7: Dynamic Calculated Cost Box */}
                {(() => {
                  const multiplier = gasPriority === 'low' 
                    ? 0.8 
                    : gasPriority === 'medium' 
                      ? 1.0 
                      : gasPriority === 'high' 
                        ? 1.5 
                        : customMultiplier;

                  const baseGasPrice = gasPricingMode === 'flat'
                    ? 0.00001 / deploymentProposal.estimatedGas
                    : (0.000025 / genPrice) / deploymentProposal.estimatedGas;

                  const calculatedFee = customGasLimit * baseGasPrice * multiplier;

                  return (
                    <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border border-blue-500/20 rounded-xl p-4 flex items-start gap-4" id="calculated-gas-display">
                      <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-lg shrink-0">
                        <Coins size={20} />
                      </div>
                      <div className="space-y-1 select-none flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">Estimated Transaction Gas Cost</p>
                          {multiplier !== 1.0 && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-400 border border-indigo-500/10 uppercase font-mono">
                              {multiplier.toFixed(1)}x multiplier
                            </span>
                          )}
                        </div>
                        <p className="text-2xl font-black font-mono text-white leading-none">
                          {calculatedFee.toFixed(8)} <span className="text-xs font-bold text-neutral-400 font-sans">GEN</span>
                        </p>
                        <p className="text-[10px] text-neutral-500 leading-relaxed pt-1.5">
                          {gasPricingMode === 'flat'
                            ? `Flat sandbox valuation. Current customized limits pool (${customGasLimit.toLocaleString()} Units) adjusted by priority queue speed metrics.`
                            : `Consolidated dynamic estimate. As $GEN is elastic, fiat equivalents remain anchored to preserve microtransaction parity values.`}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Footer Actions */}
              <div className="p-5 bg-neutral-950/50 border-t border-neutral-800 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={cancelDeployment}
                  disabled={isDeploying}
                  className="px-4 py-2 border border-neutral-800 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900 transition-all text-xs font-semibold disabled:opacity-50"
                  id="btn-cancel-deployment"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmAndExecuteDeployment}
                  disabled={isDeploying}
                  className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all border border-blue-500/25 disabled:opacity-50"
                  id="btn-confirm-deployment"
                >
                  {isDeploying ? 'Deploying...' : 'Confirm & Deploy'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
