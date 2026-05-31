export type ContextSectionType = 
  | "system" 
  | "history" 
  | "retrieved_document" 
  | "tool_output" 
  | "active_user_input" 
  | "summary";

export interface ContextSection {
  id: string;
  type: ContextSectionType;
  role?: "system" | "user" | "assistant" | "tool";
  title: string;
  content: string;
  tokenCount: number;
  priority: number; // Matrix range: 1 (Highest) to 8 (Lowest)
  required: boolean; // Protects immutable architectural guardrails
  retained: boolean; // Altered dynamically by eviction routines
  createdAt: string; // ISO 8601 high-precision timestamp
}

export interface TokenBudgetTelemetry {
  modelPreset: string;
  contextLimit: number;
  reservedOutputTokens: number;
  safetyMarginTokens: number;
  availableInputTokens: number;
  usedInputTokens: number;
  remainingTokens: number;
  overflowTokens: number;
  utilizationRatio: number;
  riskStatus: "safe" | "warning" | "critical" | "overflow";
  estimatedCostUSD: number;
  latencyRiskCategory: "low" | "moderate" | "high" | "extreme";
}

export interface OptimizationResult {
  strategyApplied: string;
  beforeTokenCount: number;
  afterTokenCount: number;
  savingsTokens: number;
  riskStatusAfter: "safe" | "warning" | "critical" | "overflow";
  retainedSections: ContextSection[];
  removedSections: ContextSection[];
}

export interface CompactionResult {
  summary: string;
  retainedFacts: string[];
  openTasks: string[];
  droppedDetails: string[];
  confidence: number;
  originalTokens: number;
  compactedTokens: number;
  savingsTokens: number;
  validationStatus: "valid" | "retry_success" | "failed";
}

export interface ScenarioPreset {
  title: string;
  description: string;
  failureMode: string;
  sections: ContextSection[];
}

export type ScenarioRegistry = Record<string, ScenarioPreset>;
