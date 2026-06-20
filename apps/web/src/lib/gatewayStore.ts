import { create } from 'zustand';
import axios from 'axios';
import { 
  ContextSection, 
  TokenBudgetTelemetry, 
  OptimizationResult, 
  CompactionResult, 
  ScenarioRegistry
} from '../types';
import { 
  estimateTokens, 
  calculatePromptBudget, 
  calculateOverflowStatus, 
  calculateCostEstimate, 
  summarizeHistoryMock 
} from './contextCalculations';
import { SCENARIO_PRESETS } from './scenarioPresets';

interface BackendSection {
  id: string;
  type: string; // Pydantic type maps to string
  role?: "system" | "user" | "assistant" | "tool";
  title: string;
  content: string;
  token_count: number;
  priority: number;
  required: boolean;
  retained: boolean;
  created_at: string;
}

// Initial state sections mapping standard conversational setup
const DEFAULT_SECTIONS: ContextSection[] = [
  {
    id: "sec_sys_01",
    type: "system",
    title: "System Compliance Prompt",
    content: "You are a customer support agent. Help the customer find SKUs and process checkout records. Act professionally and empathetically at all times.",
    tokenCount: estimateTokens("You are a customer support agent. Help the customer find SKUs and process checkout records. Act professionally and empathetically at all times."),
    priority: 1,
    required: true,
    retained: true,
    createdAt: new Date(Date.now() - 60000 * 10).toISOString()
  },
  {
    id: "sec_dev_01",
    type: "developer_instruction",
    title: "Developer Instruction / App Guardrail",
    content: "Always check stock availability before confirming orders. Follow standard database check procedures.",
    tokenCount: estimateTokens("Always check stock availability before confirming orders. Follow standard database check procedures."),
    priority: 1,
    required: true,
    retained: true,
    createdAt: new Date(Date.now() - 60000 * 9).toISOString()
  },
  {
    id: "sec_hist_1",
    type: "history",
    role: "user",
    title: "Conversation Turn #1 (User)",
    content: "Hi there, I need to check out product code SKU-402 and shipping tracking clearances.",
    tokenCount: estimateTokens("Hi there, I need to check out product code SKU-402 and shipping tracking clearances."),
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
    tokenCount: estimateTokens("Checking system databases for product code SKU-402 inventory levels..."),
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
    tokenCount: estimateTokens("SKU-402 refers to clear-glass thermal panels. Shipping clearing timestamps range from 1 to 3 days for Tier-1 customer records."),
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
    tokenCount: estimateTokens('{"sku": "SKU-402", "quantity": 180, "location": "Warehouse-East-B", "restock": false}'),
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
    tokenCount: estimateTokens("Does the warehouse have enough stock for 10 units? Tell me now."),
    priority: 2,
    required: true,
    retained: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "sec_out_01",
    type: "output_format_instruction",
    title: "Output Format Instruction",
    content: "Format reply as professional user feedback detailing current stock status.",
    tokenCount: estimateTokens("Format reply as professional user feedback detailing current stock status."),
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
  customContextLimit: number;
  reservedOutputTokens: number;
  safetyMarginPercent: number;
  slidingWindowTurns: number;
  isBackendOffline: boolean;
  activeStrategy: string;
  
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
  setCustomContextLimit: (limit: number) => void;
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
  togglePayloadSectionRetained: (id: string) => void;
  resetPayload: () => void;
}

export const useGatewayStore = create<GatewayState>((set, get) => {

  const calculateLocalTelemetry = (sections: ContextSection[]): TokenBudgetTelemetry => {
    const { modelPreset, customContextLimit, reservedOutputTokens, safetyMarginPercent } = get();
    
    const budgetInfo = calculatePromptBudget(
      sections,
      modelPreset,
      reservedOutputTokens,
      safetyMarginPercent,
      customContextLimit
    );

    const risk = calculateOverflowStatus(budgetInfo.utilizationRatio, budgetInfo.overflowTokens);
    const cost = calculateCostEstimate(budgetInfo.usedInputTokens, reservedOutputTokens, modelPreset);
    
    let latency: "low" | "moderate" | "high" | "extreme" = "low";
    if (budgetInfo.usedInputTokens >= 10000) latency = "extreme";
    else if (budgetInfo.usedInputTokens >= 5000) latency = "high";
    else if (budgetInfo.usedInputTokens >= 2000) latency = "moderate";

    return {
      modelPreset,
      contextLimit: budgetInfo.contextLimit,
      reservedOutputTokens,
      safetyMarginTokens: budgetInfo.safetyMarginTokens,
      availableInputTokens: budgetInfo.availableInputTokens,
      usedInputTokens: budgetInfo.usedInputTokens,
      remainingTokens: budgetInfo.remainingTokens,
      overflowTokens: budgetInfo.overflowTokens,
      utilizationRatio: budgetInfo.utilizationRatio,
      riskStatus: risk,
      estimatedCostUSD: cost,
      latencyRiskCategory: latency
    };
  };

  return {
    // Config defaults
    apiBase: "http://localhost:8000",
    activeView: 'dashboard',
    modelPreset: "gpt4o_mini",
    customContextLimit: 32768,
    reservedOutputTokens: 1000,
    safetyMarginPercent: 10,
    slidingWindowTurns: 5,
    isBackendOffline: true, // Offline-first default
    activeStrategy: "fifo",
    
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
    setCustomContextLimit: (limit) => {
      set({ customContextLimit: limit });
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

    // Ingestion analysis logic
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
        
        const counts = response.data.sectionTokenCounts;
        const updated = payloadSections.map(s => ({
          ...s,
          tokenCount: counts[s.id] || estimateTokens(s.content)
        }));
        
        set({ 
          payloadSections: updated, 
          telemetry: response.data.metrics,
          isBackendOffline: false
        });
      } catch {
        // Fast fallback to offline client calculations
        const localTelemetry = calculateLocalTelemetry(payloadSections);
        const updated = payloadSections.map(s => ({
          ...s,
          tokenCount: estimateTokens(s.content)
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

    // Eviction logic
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
        
        const res: OptimizationResult = {
          strategyApplied: response.data.strategyApplied,
          beforeTokenCount: response.data.beforeTokenCount,
          afterTokenCount: response.data.afterTokenCount,
          savingsTokens: response.data.savingsTokens,
          riskStatusAfter: response.data.riskStatusAfter,
          retainedSections: response.data.retainedSections.map((s: BackendSection) => ({
            id: s.id,
            type: s.type as ContextSection["type"],
            role: s.role,
            title: s.title,
            content: s.content,
            tokenCount: s.token_count,
            priority: s.priority,
            required: s.required,
            retained: s.retained,
            createdAt: s.created_at
          })),
          removedSections: response.data.removedSections.map((s: BackendSection) => ({
            id: s.id,
            type: s.type as ContextSection["type"],
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
      } catch {
        // Fallback simulation of optimizer sandbox using client logic
        const telemetry = calculateLocalTelemetry(payloadSections);
        const limit = telemetry.availableInputTokens;
        
        const retained: ContextSection[] = [];
        const removed: ContextSection[] = [];
        let runningTokens = 0;
        
        // Retain System Prompt (Priority 1), Developer Instruction, Active User Input, Output Format Instruction
        payloadSections.forEach(s => {
          if (s.required) {
            retained.push({ ...s, retained: true });
            runningTokens += s.tokenCount;
          }
        });
        
        const evictables = payloadSections.filter(s => !s.required);
        
        if (strategy === "fifo") {
          const sorted = [...evictables].sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          sorted.forEach(s => {
            if (runningTokens + s.tokenCount <= limit) {
              retained.push({ ...s, retained: true });
              runningTokens += s.tokenCount;
            } else {
              removed.push({ ...s, retained: false });
            }
          });
        } else if (strategy === "sliding_window") {
          const history = evictables.filter(s => s.type === "history");
          const others = evictables.filter(s => s.type !== "history");
          
          const sortedHist = [...history].sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          const splitIdx = Math.max(0, sortedHist.length - slidingWindowTurns);
          
          sortedHist.slice(0, splitIdx).forEach(s => removed.push({ ...s, retained: false }));
          sortedHist.slice(splitIdx).forEach(s => retained.push({ ...s, retained: true }));
          others.forEach(s => retained.push({ ...s, retained: true }));
        } else if (strategy === "priority") {
          const sorted = [...evictables].sort((a,b) => b.priority - a.priority); // Low priority first
          sorted.forEach(s => {
            if (runningTokens + s.tokenCount <= limit) {
              retained.push({ ...s, retained: true });
              runningTokens += s.tokenCount;
            } else {
              removed.push({ ...s, retained: false });
            }
          });
        } else {
          // rag_trim
          const docs = evictables.filter(s => s.type === "retrieved_document");
          const others = evictables.filter(s => s.type !== "retrieved_document");
          
          const sortedDocs = [...docs].sort((a,b) => b.priority - a.priority); // Low relevance first
          sortedDocs.forEach(s => {
            if (runningTokens + s.tokenCount <= limit) {
              retained.push({ ...s, retained: true });
              runningTokens += s.tokenCount;
            } else {
              removed.push({ ...s, retained: false });
            }
          });
          others.forEach(s => retained.push({ ...s, retained: true }));
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

    // Compactor logic
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
        
        const summaryContent = (
            `[GATEWAY STATE MEMORY NODE - COMPACTED]\n` +
            `Summary: ${compactionRes.summary}\n` +
            `Retained Facts: ${compactionRes.retainedFacts.join(" | ")}\n` +
            `Open Actions: ${compactionRes.openTasks.join(" | ")}`
        );
        
        const summaryBlock: ContextSection = {
          id: `sec_sum_${Date.now()}`,
          type: "summary",
          title: "Gateway State Memory Summary",
          content: summaryContent,
          tokenCount: compactionRes.compactedTokens,
          priority: 3,
          required: false,
          retained: true,
          createdAt: new Date().toISOString()
        };
        
        const filtered = payloadSections.filter(s => s.type !== "history" || s.required);
        const updated = [summaryBlock, ...filtered];
        
        set({ 
          compactionResult: compactionRes,
          payloadSections: updated,
          isBackendOffline: false
        });
        
        get().executeAnalyzePayload();
      } catch {
        // High fidelity client compaction mock
        const mockResult = summarizeHistoryMock(history);
        
        const summaryContent = (
            `[GATEWAY STATE MEMORY NODE - COMPACTED]\n` +
            `Summary: ${mockResult.summary}\n` +
            `Retained Facts: ${mockResult.retainedFacts.join(" | ")}\n` +
            `Open Actions: ${mockResult.openTasks.join(" | ")}`
        );
        
        const summaryBlock: ContextSection = {
          id: `sec_sum_${Date.now()}`,
          type: "summary",
          title: "Gateway State Memory Summary",
          content: summaryContent,
          tokenCount: mockResult.compactedTokens,
          priority: 3,
          required: false,
          retained: true,
          createdAt: new Date().toISOString()
        };
        
        const filtered = payloadSections.filter(s => s.type !== "history" || s.required);
        const updated = [summaryBlock, ...filtered];
        
        set({
          compactionResult: {
            summary: mockResult.summary,
            retainedFacts: mockResult.retainedFacts,
            openTasks: mockResult.openTasks,
            droppedDetails: mockResult.droppedDetails,
            confidence: 0.95,
            originalTokens: history.reduce((acc, h) => acc + h.tokenCount, 0),
            compactedTokens: mockResult.compactedTokens,
            savingsTokens: mockResult.savings,
            validationStatus: "retry_success"
          },
          payloadSections: updated,
          isBackendOffline: true
        });
        
        get().executeAnalyzePayload();
      } finally {
        set({ isCompacting: false });
      }
    },

    // Fetch scenario presets
    fetchScenarios: async () => {
      set({ scenariosLoading: true });
      try {
        // Return local scenario presets list directly for offline-first compliance
        const registry: ScenarioRegistry = SCENARIO_PRESETS;
        set({ 
          scenarios: registry,
          isBackendOffline: true
        });
      } catch (err) {
        console.error(err);
      } finally {
        set({ scenariosLoading: false });
      }
    },

    // Payload editors
    addPayloadSection: (section) => {
      const { payloadSections } = get();
      const tc = estimateTokens(section.content);
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
            tokenCount: estimateTokens(content)
          };
        }
        return s;
      });
      
      set({ payloadSections: updated });
      get().executeAnalyzePayload();
    },

    togglePayloadSectionRetained: (id) => {
      const { payloadSections } = get();
      const updated = payloadSections.map(s => {
        if (s.id === id) {
          return {
            ...s,
            retained: !s.retained
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
        compactionResult: null,
        modelPreset: "gpt4o_mini"
      });
      get().executeAnalyzePayload();
    }
  };
});
