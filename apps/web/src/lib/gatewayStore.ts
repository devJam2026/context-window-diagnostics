import { create } from 'zustand';
import axios from 'axios';
import { 
  ContextSection, 
  TokenBudgetTelemetry, 
  OptimizationResult, 
  CompactionResult, 
  ScenarioPreset,
  ScenarioRegistry
} from '../types';

// Registry of default capacities matching backend parameters
const MODEL_LIMITS: Record<string, number> = {
  small_context: 4096,
  standard_context: 8192,
  large_context: 32768,
  long_context: 128000
};

// Initial state sections mapping standard conversational setup
const DEFAULT_SECTIONS: ContextSection[] = [
  {
    id: "sec_sys_01",
    type: "system",
    role: "system",
    title: "System Compliance Prompt",
    content: "You are a customer support agent. Help the customer find SKUs and process checkout records. Act professionally and empathetically at all times.",
    tokenCount: 22,
    priority: 1,
    required: true,
    retained: true,
    createdAt: new Date(Date.now() - 60000 * 10).toISOString()
  },
  {
    id: "sec_hist_1",
    type: "history",
    role: "user",
    title: "Conversation Turn #1 (User)",
    content: "Hi there, I need to check out product code SKU-402 and shipping tracking clearances.",
    tokenCount: 16,
    priority: 7,
    required: false,
    retained: true,
    createdAt: new Date(Date.now() - 60000 * 8).toISOString()
  },
  {
    id: "sec_hist_2",
    type: "history",
    role: "assistant",
    title: "Conversation Turn #1 (Assistant)",
    content: "Checking system databases for product code SKU-402 inventory levels...",
    tokenCount: 13,
    priority: 7,
    required: false,
    retained: true,
    createdAt: new Date(Date.now() - 60000 * 7).toISOString()
  },
  {
    id: "sec_doc_1",
    type: "retrieved_document",
    title: "Knowledge Chunk (Similarity: 0.89)",
    content: "SKU-402 refers to clear-glass thermal panels. Shipping clearing timestamps range from 1 to 3 days for Tier-1 customer records.",
    tokenCount: 24,
    priority: 5,
    required: false,
    retained: true,
    createdAt: new Date(Date.now() - 60000 * 6).toISOString()
  },
  {
    id: "sec_tool_1",
    type: "tool_output",
    title: "Raw API JSON Query Output",
    content: '{"sku": "SKU-402", "quantity": 180, "location": "Warehouse-East-B", "restock": false}',
    tokenCount: 20,
    priority: 6,
    required: false,
    retained: true,
    createdAt: new Date(Date.now() - 60000 * 5).toISOString()
  },
  {
    id: "sec_usr_01",
    type: "active_user_input",
    role: "user",
    title: "Active Immediate Request",
    content: "Does the warehouse have enough stock for 10 units? Tell me now.",
    tokenCount: 14,
    priority: 2,
    required: true,
    retained: true,
    createdAt: new Date().toISOString()
  }
];

interface GatewayState {
  // Config state
  apiBase: string;
  activeView: 'dashboard' | 'sandbox' | 'compactor' | 'scenarios' | 'docs';
  modelPreset: string;
  reservedOutputTokens: number;
  safetyMarginPercent: number;
  slidingWindowTurns: number;
  isBackendOffline: boolean;
  
  // Payload state
  payloadSections: ContextSection[];
  telemetry: TokenBudgetTelemetry | null;
  optimizationResult: OptimizationResult | null;
  compactionResult: CompactionResult | null;
  scenarios: ScenarioRegistry;
  
  // Loading flags
  isAnalyzing: boolean;
  isOptimizing: boolean;
  isCompacting: boolean;
  scenariosLoading: boolean;

  // Actions
  setActiveView: (view: 'dashboard' | 'sandbox' | 'compactor' | 'scenarios' | 'docs') => void;
  setModelPreset: (preset: string) => void;
  setReservedOutputTokens: (tokens: number) => void;
  setSafetyMarginPercent: (percent: number) => void;
  setSlidingWindowTurns: (turns: number) => void;
  setPayloadSections: (sections: ContextSection[]) => void;
  
  // Core APIs
  executeAnalyzePayload: () => Promise<void>;
  executeOptimizePayload: (strategy: string) => Promise<void>;
  executeCompactPayload: (compressionGoal?: string) => Promise<void>;
  fetchScenarios: () => Promise<void>;
  
  // Section Editors
  addPayloadSection: (section: Omit<ContextSection, 'tokenCount' | 'retained' | 'createdAt'>) => void;
  removePayloadSection: (id: string) => void;
  updatePayloadSectionContent: (id: string, content: string) => void;
  resetPayload: () => void;
}

export const useGatewayStore = create<GatewayState>((set, get) => {
  // Heuristic token counting fallback
  const estimateTokensLocally = (text: string): number => {
    if (!text) return 0;
    return Math.ceil(text.length / 4.2); // Typical standard character-to-token ratio
  };

  // Local budget calculations for offline resilience
  const calculateLocalTelemetry = (sections: ContextSection[]): TokenBudgetTelemetry => {
    const { modelPreset, reservedOutputTokens, safetyMarginPercent } = get();
    const limit = MODEL_LIMITS[modelPreset] || 8192;
    const safetyMarginTokens = Math.ceil(limit * (safetyMarginPercent / 100));
    const availableInput = Math.max(0, limit - reservedOutputTokens - safetyMarginTokens);
    
    let usedInput = 0;
    sections.forEach(sec => {
      if (sec.retained) {
        usedInput += estimateTokensLocally(sec.content);
      }
    });

    const remaining = Math.max(0, availableInput - usedInput);
    const overflow = Math.max(0, usedInput - availableInput);
    const ratio = availableInput > 0 ? parseFloat((usedInput / availableInput).toFixed(3)) : 0.0;
    
    let risk: "safe" | "warning" | "critical" | "overflow" = "safe";
    if (ratio >= 1.0 || overflow > 0) risk = "overflow";
    else if (ratio >= 0.90) risk = "critical";
    else if (ratio >= 0.70) risk = "warning";

    const cost = parseFloat(((usedInput * 0.00000015) + (reservedOutputTokens * 0.00000060)).toFixed(6));
    
    let latency: "low" | "moderate" | "high" | "extreme" = "low";
    if (usedInput >= 10000) latency = "extreme";
    else if (usedInput >= 5000) latency = "high";
    else if (usedInput >= 2000) latency = "moderate";

    return {
      modelPreset,
      contextLimit: limit,
      reservedOutputTokens,
      safetyMarginTokens,
      availableInputTokens: availableInput,
      usedInputTokens: usedInput,
      remainingTokens: remaining,
      overflowTokens: overflow,
      utilizationRatio: ratio,
      riskStatus: risk,
      estimatedCostUSD: cost,
      latencyRiskCategory: latency
    };
  };

  return {
    // Config defaults
    apiBase: "http://localhost:8000",
    activeView: 'dashboard',
    modelPreset: "standard_context",
    reservedOutputTokens: 1000,
    safetyMarginPercent: 10,
    slidingWindowTurns: 5,
    isBackendOffline: false,
    
    // Payload lists
    payloadSections: DEFAULT_SECTIONS,
    telemetry: null,
    optimizationResult: null,
    compactionResult: null,
    scenarios: {},
    
    // UI Loaders
    isAnalyzing: false,
    isOptimizing: false,
    isCompacting: false,
    scenariosLoading: false,

    // Config Setters
    setActiveView: (view) => set({ activeView: view }),
    setModelPreset: (preset) => {
      set({ modelPreset: preset });
      get().executeAnalyzePayload();
    },
    setReservedOutputTokens: (tokens) => {
      set({ reservedOutputTokens: tokens });
      get().executeAnalyzePayload();
    },
    setSafetyMarginPercent: (percent) => {
      set({ safetyMarginPercent: percent });
      get().executeAnalyzePayload();
    },
    setSlidingWindowTurns: (turns) => set({ slidingWindowTurns: turns }),
    setPayloadSections: (sections) => {
      set({ payloadSections: sections });
      get().executeAnalyzePayload();
    },

    // 🔍 Analysis API Command
    executeAnalyzePayload: async () => {
      const { apiBase, payloadSections, modelPreset, reservedOutputTokens, safetyMarginPercent } = get();
      set({ isAnalyzing: true });
      
      try {
        const response = await axios.post(`${apiBase}/api/context/analyze`, {
          modelPreset,
          reservedOutputTokens,
          safetyMarginPercent,
          payloadSections: payloadSections.map(s => ({
            id: s.id,
            type: s.type,
            role: s.role,
            title: s.title,
            content: s.content,
            token_count: s.tokenCount,
            priority: s.priority,
            required: s.required,
            retained: s.retained,
            created_at: s.createdAt
          }))
        });
        
        // Map backend response token counts back to local section records
        const counts = response.data.sectionTokenCounts;
        const updated = payloadSections.map(s => ({
          ...s,
          tokenCount: counts[s.id] || estimateTokensLocally(s.content)
        }));
        
        set({ 
          payloadSections: updated, 
          telemetry: response.data.metrics,
          isBackendOffline: false
        });
      } catch (err) {
        logger_fallback: console.warn("FastAPI backend offline. Triggering High-Fidelity Client-side counting.");
        
        // Execute robust local calculations on connection failure
        const localTelemetry = calculateLocalTelemetry(payloadSections);
        const updated = payloadSections.map(s => ({
          ...s,
          tokenCount: estimateTokensLocally(s.content)
        }));
        
        set({ 
          payloadSections: updated,
          telemetry: localTelemetry,
          isBackendOffline: true
        });
      } finally {
        set({ isAnalyzing: false });
      }
    },

    // ⚖️ Eviction API Command
    executeOptimizePayload: async (strategy) => {
      const { apiBase, payloadSections, modelPreset, reservedOutputTokens, safetyMarginPercent, slidingWindowTurns } = get();
      set({ isOptimizing: true });
      
      try {
        const response = await axios.post(`${apiBase}/api/context/optimize`, {
          strategy,
          modelPreset,
          reservedOutputTokens,
          safetyMarginPercent,
          payloadSections: payloadSections.map(s => ({
            id: s.id,
            type: s.type,
            role: s.role,
            title: s.title,
            content: s.content,
            token_count: s.tokenCount,
            priority: s.priority,
            required: s.required,
            retained: s.retained,
            created_at: s.createdAt
          })),
          slidingWindowTurns
        });
        
        // Map backend schema optimized arrays back to client structures
        const res: OptimizationResult = {
          strategyApplied: response.data.strategyApplied,
          beforeTokenCount: response.data.beforeTokenCount,
          afterTokenCount: response.data.afterTokenCount,
          savingsTokens: response.data.savingsTokens,
          riskStatusAfter: response.data.riskStatusAfter,
          retainedSections: response.data.retainedSections.map((s: any) => ({
            id: s.id,
            type: s.type,
            role: s.role,
            title: s.title,
            content: s.content,
            tokenCount: s.token_count,
            priority: s.priority,
            required: s.required,
            retained: s.retained,
            createdAt: s.created_at
          })),
          removedSections: response.data.removedSections.map((s: any) => ({
            id: s.id,
            type: s.type,
            role: s.role,
            title: s.title,
            content: s.content,
            tokenCount: s.token_count,
            priority: s.priority,
            required: s.required,
            retained: s.retained,
            createdAt: s.created_at
          }))
        };
        
        set({ 
          optimizationResult: res,
          isBackendOffline: false
        });
      } catch (err) {
        console.warn("Backend offline. Simulating optimization algorithm sandbox.");
        
        // OFFLINE HIGH-FIDELITY SIMULATION OF OPTIMIZATION RULES
        const telemetry = calculateLocalTelemetry(payloadSections);
        const limit = telemetry.availableInputTokens;
        
        const retained: ContextSection[] = [];
        const removed: ContextSection[] = [];
        let runningTokens = 0;
        
        // Load System Prompt (Priority 1) and Active User Input (Priority 2)
        payloadSections.forEach(s => {
          const tc = estimateTokensLocally(s.content);
          if (s.required) {
            const cloned = { ...s, tokenCount: tc, retained: true };
            retained.push(cloned);
            runningTokens += tc;
          }
        });
        
        // Handle modular algorithms offline
        const evictables = payloadSections.filter(s => !s.required);
        
        if (strategy === "fifo") {
          // FIFO chronological turn drop
          const sorted = [...evictables].sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          sorted.forEach(s => {
            const tc = estimateTokensLocally(s.content);
            if (runningTokens + tc <= limit) {
              retained.push({ ...s, tokenCount: tc, retained: true });
              runningTokens += tc;
            } else {
              removed.push({ ...s, tokenCount: tc, retained: false });
            }
          });
        } else if (strategy === "sliding_window") {
          // Sliding window of N recent turns
          const history = evictables.filter(s => s.type === "history");
          const others = evictables.filter(s => s.type !== "history");
          
          const sortedHist = [...history].sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          const splitIdx = Math.max(0, sortedHist.length - slidingWindowTurns);
          
          sortedHist.slice(0, splitIdx).forEach(s => removed.push({ ...s, tokenCount: estimateTokensLocally(s.content), retained: false }));
          sortedHist.slice(splitIdx).forEach(s => retained.push({ ...s, tokenCount: estimateTokensLocally(s.content), retained: true }));
          others.forEach(s => retained.push({ ...s, tokenCount: estimateTokensLocally(s.content), retained: true }));
        } else if (strategy === "priority") {
          // Priority Matrix Hierarchy (Priority 8 down to 3)
          const sorted = [...evictables].sort((a,b) => b.priority - a.priority); // High number (low importance) first
          sorted.forEach(s => {
            const tc = estimateTokensLocally(s.content);
            if (runningTokens + tc <= limit) {
              retained.push({ ...s, tokenCount: tc, retained: true });
              runningTokens += tc;
            } else {
              removed.push({ ...s, tokenCount: tc, retained: false });
            }
          });
        } else {
          // RAG doc trimming
          const docs = evictables.filter(s => s.type === "retrieved_document");
          const others = evictables.filter(s => s.type !== "retrieved_document");
          
          const sortedDocs = [...docs].sort((a,b) => b.priority - a.priority); // Low relevance first
          sortedDocs.forEach(s => {
            const tc = estimateTokensLocally(s.content);
            if (runningTokens + tc <= limit) {
              retained.push({ ...s, tokenCount: tc, retained: true });
              runningTokens += tc;
            } else {
              removed.push({ ...s, tokenCount: tc, retained: false });
            }
          });
          others.forEach(s => retained.push({ ...s, tokenCount: estimateTokensLocally(s.content), retained: true }));
        }

        const totalBefore = telemetry.usedInputTokens;
        const totalAfter = retained.reduce((a,b) => a + b.tokenCount, 0);

        set({
          optimizationResult: {
            strategyApplied: strategy,
            beforeTokenCount: totalBefore,
            afterTokenCount: totalAfter,
            savingsTokens: Math.max(0, totalBefore - totalAfter),
            riskStatusAfter: totalAfter <= limit ? "safe" : "warning",
            retainedSections: retained.sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
            removedSections: removed.sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          },
          isBackendOffline: true
        });
      } finally {
        set({ isOptimizing: false });
      }
    },

    // ⚙️ Compaction API Command
    executeCompactPayload: async (goal) => {
      const { apiBase, payloadSections } = get();
      set({ isCompacting: true });
      
      const history = payloadSections.filter(s => s.type === "history" && !s.required);
      if (history.length === 0) {
        set({ isCompacting: false });
        alert("Selectable conversation history is empty. Compaction aborted.");
        return;
      }
      
      try {
        const response = await axios.post(`${apiBase}/api/context/compact`, {
          sessionId: "active_session",
          historySections: history.map(s => ({
            id: s.id,
            type: s.type,
            role: s.role,
            title: s.title,
            content: s.content,
            token_count: s.tokenCount,
            priority: s.priority,
            required: s.required,
            retained: s.retained,
            created_at: s.createdAt
          })),
          compressionGoal: goal || "Reduce old history while preserving durable facts and unresolved tasks."
        });
        
        const compactionRes: CompactionResult = response.data;
        
        // Construct the new summary section block inside prompt payload
        const summaryContent = (
            `[GATEWAY STATE MEMORY NODE - COMPACTED]\n` +
            `Summary: ${compactionRes.summary}\n` +
            `Retained Facts: ${compactionRes.retainedFacts.join(" | ")}\n` +
            `Open Actions: ${compactionRes.openTasks.join(" | ")}`
        );
        
        const summaryBlock: ContextSection = {
          id: `sec_sum_${Date.now()}`,
          type: "summary",
          title: "Gateway State Memory summary",
          content: summaryContent,
          tokenCount: compactionRes.compactedTokens,
          priority: 3,
          required: false,
          retained: true,
          createdAt: new Date().toISOString()
        };
        
        // Strip out the raw historical turns and inject our summary block
        const filtered = payloadSections.filter(s => s.type !== "history" || s.required);
        const updated = [summaryBlock, ...filtered];
        
        set({ 
          compactionResult: compactionRes,
          payloadSections: updated,
          isBackendOffline: false
        });
        
        get().executeAnalyzePayload();
      } catch (err) {
        console.warn("Backend offline. Running simulated compaction.");
        
        // Execute Offline High-Fidelity Compaction Mock
        const rawHistoryText = history.map(h => h.content).join("\n");
        const original = history.reduce((sum, h) => sum + estimateTokensLocally(h.content), 0);
        
        const simSummary = (
            "Customer requested cart checkout status details for inventory SKU-402 " +
            "and requested delivery clearances. Warehouse restock queues were checked."
        );
        const simFacts = ["Target SKU: SKU-402", "Restock Status: False"];
        const simTasks = ["Log order invoice clearances with shipping tracking replica."];
        
        const mockRes: CompactionResult = {
          summary: simSummary,
          retainedFacts: simFacts,
          openTasks: simTasks,
          droppedDetails: ["Customer greeting strings", "Repeated support pleasantries"],
          confidence: 0.95,
          originalTokens: original,
          compactedTokens: Math.ceil(simSummary.length / 4.2),
          savingsTokens: Math.max(0, original - Math.ceil(simSummary.length / 4.2)),
          validationStatus: "retry_success"
        };
        
        const summaryContent = (
            `[GATEWAY STATE MEMORY NODE - COMPACTED]\n` +
            `Summary: ${mockRes.summary}\n` +
            `Retained Facts: ${mockRes.retainedFacts.join(" | ")}\n` +
            `Open Actions: ${mockRes.openTasks.join(" | ")}`
        );
        
        const summaryBlock: ContextSection = {
          id: `sec_sum_${Date.now()}`,
          type: "summary",
          title: "Gateway State Memory summary",
          content: summaryContent,
          tokenCount: mockRes.compactedTokens,
          priority: 3,
          required: false,
          retained: true,
          createdAt: new Date().toISOString()
        };
        
        const filtered = payloadSections.filter(s => s.type !== "history" || s.required);
        const updated = [summaryBlock, ...filtered];
        
        set({
          compactionResult: mockRes,
          payloadSections: updated,
          isBackendOffline: true
        });
        
        get().executeAnalyzePayload();
      } finally {
        set({ isCompacting: false });
      }
    },

    // 🎒 Scenario Presets API Command
    fetchScenarios: async () => {
      const { apiBase } = get();
      set({ scenariosLoading: true });
      
      try {
        const response = await axios.get(`${apiBase}/api/scenarios`);
        
        // Map backend context section camel_cases back to client types
        const registry: ScenarioRegistry = {};
        Object.keys(response.data).forEach(key => {
          const item = response.data[key];
          registry[key] = {
            title: item.title,
            description: item.description,
            failureMode: item.failureMode,
            sections: item.sections.map((s: any) => ({
              id: s.id,
              type: s.type,
              role: s.role,
              title: s.title,
              content: s.content,
              tokenCount: s.token_count,
              priority: s.priority,
              required: s.required,
              retained: s.retained,
              createdAt: s.created_at
            }))
          };
        });
        
        set({ 
          scenarios: registry,
          isBackendOffline: false
        });
      } catch (err) {
        console.warn("Backend offline. Loading local mock scenarios.");
        
        // OFFLINE HIGH-FIDELITY SCENARIOS PRESET FALLBACK
        // Load simple mock scenarios mirroring scenarios.py
        const registry: ScenarioRegistry = {
          system_prompt_exploder: {
            title: "System Prompt Exploder (Trap 1)",
            description: "Injects a massive corporate directive prompt (approx. 4,500 tokens) to demonstrate how over-bloated static instructions consume available conversational headroom.",
            failureMode: "Primacy exhaustion. Normal dialogue is choked due to zero free input token capacity.",
            sections: [
              {
                id: "sec_sys_exploder",
                type: "system",
                title: "Bloated Behavioral System prompt",
                content: "ENTERPRISE PROTOCOL DIRECTIONS:\n" + "This is a super verbose system instruction to test prompt constraints. ".repeat(300),
                tokenCount: 4500,
                priority: 1,
                required: true,
                retained: true,
                createdAt: new Date().toISOString()
              },
              {
                id: "sec_usr_input",
                type: "active_user_input",
                title: "Active query",
                content: "Hello, check stock shipping details for SKU-402.",
                tokenCount: 12,
                priority: 2,
                required: true,
                retained: true,
                createdAt: new Date().toISOString()
              }
            ]
          },
          lost_in_the_middle: {
            title: "Lost-in-the-Middle Demo (Trap 5)",
            description: "Places a critical password ('VIP-RETAIL-2026') at the absolute geometric center of a long conversation, surrounded by standard text noise.",
            failureMode: "Semantic retrieval degradation in the attention saturation valley of long contexts.",
            sections: [
              {
                id: "sec_sys_05",
                type: "system",
                title: "Compliance Extractor instructions",
                content: "You are a secure extractor. Retrieve the verification passcode from conversation history.",
                tokenCount: 20,
                priority: 1,
                required: true,
                retained: true,
                createdAt: new Date().toISOString()
              },
              // Surround prefix turns
              {
                id: "sec_lost_prefix",
                type: "history",
                title: "Filler turn",
                content: "This is filler context discussions about sales pipelines, server latency schedules, and shipping indices. The secret passcode is not in this message.",
                tokenCount: 1500,
                priority: 7,
                required: false,
                retained: true,
                createdAt: new Date(Date.now() - 5000).toISOString()
              },
              // Secret turn in center
              {
                id: "sec_lost_secret",
                type: "history",
                title: "Middle message block",
                content: "IMPORTANT TRANSACTION CLEARANCE CODE: The activation override passcode is: VIP-RETAIL-2026. Keep this secret.",
                tokenCount: 200,
                priority: 7,
                required: false,
                retained: true,
                createdAt: new Date(Date.now() - 4000).toISOString()
              },
              // Suffix turns
              {
                id: "sec_lost_suffix",
                type: "history",
                title: "Filler turn suffix",
                content: "This is additional standard discussion about database logs, product design reviews, customer service desk timings. The code is not here.",
                tokenCount: 1500,
                priority: 7,
                required: false,
                retained: true,
                createdAt: new Date(Date.now() - 3000).toISOString()
              },
              {
                id: "sec_usr_05",
                type: "active_user_input",
                title: "Active query",
                content: "What is the override clearance passcode? Search strictly inside history.",
                tokenCount: 15,
                priority: 2,
                required: true,
                retained: true,
                createdAt: new Date().toISOString()
              }
            ]
          }
        };
        
        set({ 
          scenarios: registry,
          isBackendOffline: true
        });
      } finally {
        set({ scenariosLoading: false });
      }
    },

    // Payload operations
    addPayloadSection: (section) => {
      const { payloadSections } = get();
      const tc = estimateTokensLocally(section.content);
      const newSec: ContextSection = {
        ...section,
        tokenCount: tc,
        retained: true,
        createdAt: new Date().toISOString()
      };
      
      set({ payloadSections: [...payloadSections, newSec] });
      get().executeAnalyzePayload();
    },

    removePayloadSection: (id) => {
      const { payloadSections } = get();
      const updated = payloadSections.filter(s => s.id !== id);
      set({ payloadSections: updated });
      get().executeAnalyzePayload();
    },

    updatePayloadSectionContent: (id, content) => {
      const { payloadSections } = get();
      const updated = payloadSections.map(s => {
        if (s.id === id) {
          return {
            ...s,
            content,
            tokenCount: estimateTokensLocally(content)
          };
        }
        return s;
      });
      
      set({ payloadSections: updated });
      get().executeAnalyzePayload();
    },

    resetPayload: () => {
      set({ 
        payloadSections: DEFAULT_SECTIONS,
        optimizationResult: null,
        compactionResult: null
      });
      get().executeAnalyzePayload();
    }
  };
});
