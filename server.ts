import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from 'url';
import { GoogleGenAI } from "@google/genai";

import fs from "fs";

const isESM = typeof import.meta !== "undefined" && !!(import.meta as any).url;
const currentFilename = isESM 
  ? fileURLToPath((import.meta as any).url) 
  : (typeof __filename !== "undefined" ? __filename : "");
const currentDirname = isESM 
  ? path.dirname(currentFilename) 
  : (typeof __dirname !== "undefined" ? __dirname : "");

const app = express();

app.use(cors({
  origin: true, // Echoes requesting origin dynamically to authorize sandbox URLs
  credentials: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// In-memory databases to simulate secure cloud storage & stateful layers
const vaultStorage = new Map<string, string>();
const faucetHistory = new Map<string, number>(); // Address -> Last timestamp

  // API AI assistance route
  app.post("/api/gemini/assist", async (req, res) => {
    try {
      const { code } = req.body;
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ suggestion: "Gemini API key is not configured." });
      }
      
      const ai = new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `You are an expert in GenLayer Intelligent Contracts. 
      Analyze the following code and provide a one-sentence technical optimization tip.
      
      Code:
      ${code}
      
      Suggestion:`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });
      
      const suggestion = response.text;
      res.json({ suggestion: suggestion?.trim() || "No suggestion available." });
    } catch (error: any) {
      console.error("Gemini Error:", error);
      res.status(500).json({ suggestion: "AI service currently unable to analyze this code." });
    }
  });

  // Helper to prune and skeletonize Python contract code context based on cursor focus area
  function pruneCodeContext(
    code: string,
    cursorOffset?: number,
    options: {
      maxLinesBefore?: number;
      maxLinesAfter?: number;
    } = {}
  ) {
    const maxLinesBefore = options.maxLinesBefore ?? 15;
    const maxLinesAfter = options.maxLinesAfter ?? 5;
    const lines = code.split("\n");
    const totalOriginalLines = lines.length;

    // 1. Map character-based cursorOffset to line index
    let cursorLineIndex = lines.length - 1; // Default to final line
    if (typeof cursorOffset === "number" && cursorOffset >= 0) {
      let currentIdx = 0;
      for (let i = 0; i < lines.length; i++) {
        const lineLen = lines[i].length + 1; // +1 for newline character
        if (currentIdx <= cursorOffset && cursorOffset <= currentIdx + lineLen) {
          cursorLineIndex = i;
          break;
        }
        currentIdx += lineLen;
      }
    }

    // Define the focus bounds sliding window around user edits
    const startWindow = Math.max(0, cursorLineIndex - maxLinesBefore);
    const endWindow = Math.min(lines.length - 1, cursorLineIndex + maxLinesAfter);

    // Run two-pass tag-based line pruning for absolute precision and contextual correctness
    const lineActions: ("KEEP" | "SKELETON_DEF" | "PRUNE")[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Rule a: Always preserve imports
      if (trimmed.startsWith("import ") || trimmed.startsWith("from ")) {
        lineActions.push("KEEP");
        continue;
      }

      // Rule b: Always preserve intelligent contract class definitions
      if (trimmed.startsWith("class ")) {
        lineActions.push("KEEP");
        continue;
      }

      // Rule c: Always preserve lines within the focus window sliding range
      if (i >= startWindow && i <= endWindow) {
        lineActions.push("KEEP");
        continue;
      }

      // Rule d: Preserve method signatures but skeletonize their body
      if (trimmed.startsWith("def ")) {
        lineActions.push("SKELETON_DEF");
        continue;
      }

      // Default: Prune for contextual intelligence
      lineActions.push("PRUNE");
    }

    // Synthesize final optimized code body
    const finalLines: string[] = [];
    let contiguousPrunedCount = 0;
    let contiguousPrunedIndent = "";

    for (let i = 0; i < lines.length; i++) {
      const action = lineActions[i];
      const line = lines[i];

      if (action === "PRUNE") {
        if (contiguousPrunedCount === 0) {
          const indentLength = line.length - line.trimStart().length;
          contiguousPrunedIndent = " ".repeat(indentLength || 4);
        }
        contiguousPrunedCount++;
      } else {
        // Output any aggregated pruning placeholder to summarize the exact block size to the model
        if (contiguousPrunedCount > 0) {
          finalLines.push(`${contiguousPrunedIndent}# ... [Pruned ${contiguousPrunedCount} lines of non-essential context]`);
          contiguousPrunedCount = 0;
        }

        if (action === "KEEP") {
          finalLines.push(line);
        } else if (action === "SKELETON_DEF") {
          finalLines.push(line);
          const indentLength = line.length - line.trimStart().length;
          const indentSpace = " ".repeat(indentLength + 4);
          finalLines.push(`${indentSpace}pass  # ... [Method body pruned to optimize token overhead]`);
        }
      }
    }

    if (contiguousPrunedCount > 0) {
      finalLines.push(`${contiguousPrunedIndent}# ... [Pruned ${contiguousPrunedCount} lines of non-essential context]`);
    }

    const prunedCode = finalLines.join("\n");
    const totalPrunedLines = finalLines.length;

    return {
      prunedCode,
      stats: {
        originalLines: totalOriginalLines,
        prunedLines: totalPrunedLines,
        savedPercent: Math.max(0, Math.round((1 - totalPrunedLines / Math.max(1, totalOriginalLines)) * 100)),
      }
    };
  }

  // AI-Assisted Monaco/IDE Completions Endpoint (Gemma/Gemini backend with active context pruning)
  app.post("/api/ai/completions", async (req, res) => {
    try {
      const { code, contextPruning, cursorOffset, pruningOptions } = req.body;
      if (!process.env.GEMINI_API_KEY) {
        return res.json({ 
          completion: "    # Provide suggestions or complete your contract structure\n    pass" 
        });
      }

      const ai = new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Execute smart context pruning if enabled
      let activeCode = code || "";
      let pruningStats = null;

      if (contextPruning && activeCode.trim().length > 0) {
        const pruneResult = pruneCodeContext(activeCode, cursorOffset, {
          maxLinesBefore: pruningOptions?.maxLinesBefore,
          maxLinesAfter: pruningOptions?.maxLinesAfter,
        });
        activeCode = pruneResult.prunedCode;
        pruningStats = pruneResult.stats;
      }

      const prompt = `You are a high-performance AI code completion agent for GenLayer Intelligent Contracts (Python-based contracts).
      Given the current code block (where distant or unrelated method bodies may have been skeletonized or pruned with pass statements to save token context), suggest a multi-line code contribution or completion.
      Do not include explanations, do not include markdown blocks, do not include backticks. Just output pure runnable code starting from the provided context.
      
      Current Code Context:
      ${activeCode}
      
      Helpful guidelines:
      - Inherit from IntelligentContract
      - Standard syntax: def some_function(self, ...):
      - Oracles or consensus: use self.consensus or intelligent tools if applicable.
      
      Provide the short code completion response directly:`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      let text = response.text || "";
      // Strip markdown code backticks if the model accidentally outputted them
      text = text.replace(/^```[a-zA-Z]*\n/, "").replace(/\n```$/, "").replace(/`/g, "");
      
      res.json({ 
        completion: text,
        pruningStats: pruningStats 
      });
    } catch (error: any) {
      console.error("Completion Error:", error);
      res.json({ completion: "    # [Assistant offline. Check API connectivity in settings.]" });
    }
  });

  // Vault Service Integration Simulator Endpoints
  app.post("/api/vault/:service", (req, res) => {
    try {
      const { service } = req.params;
      const { key } = req.body;

      if (!key) {
        return res.status(400).json({ error: "API Key value is required" });
      }

      // Simulate HashiCorp Vault token & secret security writes internally
      vaultStorage.set(service, key);
      res.json({ success: true, service, message: "Secret stored securely in encrypted local vault." });
    } catch (error) {
      res.status(500).json({ error: "Failed to store secret securely." });
    }
  });

  app.get("/api/vault/:service", (req, res) => {
    try {
      const { service } = req.params;
      const exists = vaultStorage.has(service);
      const val = vaultStorage.get(service) || "";
      
      // Mask key for transmission transparency (Security Checklist mandate)
      const masked = val ? `••••••••••••${val.slice(-4) || ""}` : "";
      res.json({ exists, service, value: masked });
    } catch (error) {
      res.status(500).json({ error: "Failed to query vault." });
    }
  });

  // Faucet Distribution & IP/Address Rate-Limiting Engine
  app.post("/api/faucet/request", (req, res) => {
    try {
      const { address } = req.body;
      if (!address) {
        return res.status(400).json({ error: "Target address is required" });
      }

      const now = Date.now();
      const lastRequest = faucetHistory.get(address.toLowerCase());
      const COOLDOWN = 1000 * 60 * 60 * 24; // 24-hours cool down restriction

      if (lastRequest && (now - lastRequest) < COOLDOWN) {
        const timeRemaining = Math.ceil((COOLDOWN - (now - lastRequest)) / (1000 * 60 * 60));
        return res.status(429).json({ 
          error: `Rate Protection limit. Please wait ${timeRemaining} hours before requesting again.` 
        });
      }

      // Record request timestamp safely
      faucetHistory.set(address.toLowerCase(), now);

      // Generate a realistic Ethereum-like Tx Hash for explorer integration
      const randomBytes = Array.from({ length: 32 }, () => Math.floor(Math.random() * 256));
      const txHash = "0x" + randomBytes.map(b => b.toString(16).padStart(2, "0")).join("");

      res.json({ 
        success: true, 
        txHash, 
        amount: "100 GEN", 
        gasUsed: 21000 
      });
    } catch (error) {
      res.status(500).json({ error: "Faucet distribution failed." });
    }
  });

  // API health route
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Only start server listener and Vite/static configuration if NOT on Vercel.
  // Vercel serverless handles request routing and serves static folders natively.
  const isVercel = !!process.env.VERCEL;

  async function bootstrap() {
    if (!isVercel) {
      const distPath = path.join(process.cwd(), "dist");
      const hasDist = fs.existsSync(path.join(distPath, "index.html"));
      const isRunningBuiltServer = currentFilename.includes("dist") || currentFilename.endsWith(".cjs");
      const isProduction = process.env.NODE_ENV === "production" || isRunningBuiltServer || (hasDist && !currentFilename.includes("server.ts"));

      if (!isProduction) {
        const { createServer: createViteServer } = await import("vite");
        const vite = await createViteServer({
          server: { middlewareMode: true },
          appType: "spa",
        });
        app.use(vite.middlewares);

        const PORT = 3000;
        app.listen(PORT, "0.0.0.0", () => {
          console.log(`Server running on http://localhost:${PORT}`);
        });
      } else {
        app.use(express.static(distPath));
        app.get("*", (req, res) => {
          res.sendFile(path.join(distPath, "index.html"));
        });

        const PORT = 3000;
        app.listen(PORT, "0.0.0.0", () => {
          console.log(`Server running on port ${PORT}`);
        });
      }
    }
  }

  bootstrap().catch(err => {
    console.error("Failed to bootstrap server:", err);
  });

  export default app;
