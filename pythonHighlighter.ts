/**
 * A ultra-high-performance and dependency-free Python syntax highlighter 
 * designed specifically for GenLayer Intelligent Python Contracts.
 */
export const highlightPython = (code: string): string => {
  if (!code) return "";

  // 1. Escape HTML special characters to prevent rendering vulnerability or syntax breaks
  const escaped = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 2. Core Python syntax tokenization pattern
  // Positional Capture Groups:
  // p1: Comments (# ...)
  // p2: Triple-quoted string blocks ("""...""" or '''...''')
  // p3: Single or double quoted normal strings ("..." or '...')
  // p4: Decorators (@...)
  // p5: Key Python keywords (class, def, return, if, else, etc.)
  // p6: Special framework and primitive builtins (self, True, False, IntelligentContract, etc.)
  // p7: Named functions and methods declarations (functionName followed by '(')
  // p8: String patterns or numerical values (integers, floats)
  const pythonRegex = /(#.*?$)|(""\"[\s\S]*?"""|'''[\s\S]*?''')|("[^"\\\r\n]*(?:\\.[^"\\\r\n]*)*"|'[^'\\\r\n]*(?:\\.[^'\\\r\n]*)*')|(@[a-zA-Z0-9_.]+)|(\b(?:class|def|return|import|from|as|pass|if|else|elif|for|in|while|and|or|not|is|try|except|raise|with|assert|yield|lambda|global|nonlocal|del)\b)|(\b(?:self|True|False|None|super|IntelligentContract|int|str|bool|list|dict|any|float|address|Storage|Parameter|Ledger|tuple|set|len|print|range|isinstance|getattr|setattr|hasattr)\b)|(\b[a-zA-Z_][a-zA-Z0-9_]*(?=\s*\((?!address)))|(\b\d+(?:\.\d+)?\b)/gm;

  return escaped.replace(pythonRegex, (match, p1, p2, p3, p4, p5, p6, p7, p8) => {
    // Return formatted HTML elements backed by high-contrast Tailwind styling colors
    if (p1 !== undefined) {
      return `<span class="text-neutral-500 italic">${match}</span>`;
    }
    if (p2 !== undefined || p3 !== undefined) {
      return `<span class="text-amber-400 font-medium">${match}</span>`;
    }
    if (p4 !== undefined) {
      return `<span class="text-teal-400 font-semibold">${match}</span>`;
    }
    if (p5 !== undefined) {
      return `<span class="text-indigo-400 font-bold">${match}</span>`;
    }
    if (p6 !== undefined) {
      return `<span class="text-sky-400 font-medium font-semibold">${match}</span>`;
    }
    if (p7 !== undefined) {
      return `<span class="text-emerald-400 font-bold">${match}</span>`;
    }
    if (p8 !== undefined) {
      return `<span class="text-amber-500 font-mono">${match}</span>`;
    }
    return match;
  });
};
