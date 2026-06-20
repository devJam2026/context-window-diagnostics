import { ContextSection } from '../types';
import { PRICING_CONSTANTS } from './pricingConstants';
import { MODEL_PRESETS } from './modelPresets';

/**
 * Heuristic token counting fallback based on standard character-to-token ratio.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4.2);
}

/**
 * Calculates the prompt budget, available input tokens, used tokens, and remaining tokens.
 */
export function calculatePromptBudget(
  sections: ContextSection[],
  modelPresetId: string,
  reservedOutputTokens: number,
  safetyMarginPercent: number,
  customLimit?: number
): {
  contextLimit: number;
  safetyMarginTokens: number;
  availableInputTokens: number;
  usedInputTokens: number;
  remainingTokens: number;
  overflowTokens: number;
  utilizationRatio: number;
} {
  const preset = MODEL_PRESETS[modelPresetId];
  const limit = (modelPresetId === 'custom' && customLimit) ? customLimit : (preset ? preset.contextLimit : 8192);
  const safetyMarginTokens = Math.ceil(limit * (safetyMarginPercent / 100));
  const availableInputTokens = Math.max(0, limit - reservedOutputTokens - safetyMarginTokens);

  let usedInputTokens = 0;
  sections.forEach((sec) => {
    if (sec.retained) {
      usedInputTokens += sec.tokenCount;
    }
  });

  const remainingTokens = Math.max(0, availableInputTokens - usedInputTokens);
  const overflowTokens = Math.max(0, usedInputTokens - availableInputTokens);
  const utilizationRatio = availableInputTokens > 0 ? parseFloat((usedInputTokens / availableInputTokens).toFixed(4)) : 0;

  return {
    contextLimit: limit,
    safetyMarginTokens,
    availableInputTokens,
    usedInputTokens,
    remainingTokens,
    overflowTokens,
    utilizationRatio,
  };
}

/**
 * Determines the risk status based on utilization ratio.
 */
export function calculateOverflowStatus(utilizationRatio: number, overflowTokens: number): 'safe' | 'warning' | 'critical' | 'overflow' {
  if (overflowTokens > 0 || utilizationRatio >= 1.0) {
    return 'overflow';
  } else if (utilizationRatio >= 0.9) {
    return 'critical';
  } else if (utilizationRatio >= 0.7) {
    return 'warning';
  }
  return 'safe';
}

/**
 * Estimates the cost based on input and output tokens.
 */
export function calculateCostEstimate(
  usedInputTokens: number,
  reservedOutputTokens: number,
  modelPresetId: string
): number {
  const rate = PRICING_CONSTANTS[modelPresetId] || PRICING_CONSTANTS.gpt4o_mini;
  const inputCost = (usedInputTokens / 1_000_000) * rate.inputCostPer1M;
  const outputCost = (reservedOutputTokens / 1_000_000) * rate.outputCostPer1M;
  return parseFloat((inputCost + outputCost).toFixed(6));
}

/**
 * Trims oldest chat messages deterministically.
 */
export function trimChatHistory(
  historySections: ContextSection[],
  retainedTurnsCount: number
): {
  retained: ContextSection[];
  removed: ContextSection[];
  savings: number;
} {
  // Sort history chronologically (oldest first)
  const sorted = [...historySections].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const splitIdx = Math.max(0, sorted.length - retainedTurnsCount);
  const removed = sorted.slice(0, splitIdx).map(s => ({ ...s, retained: false }));
  const retained = sorted.slice(splitIdx).map(s => ({ ...s, retained: true }));
  const savings = removed.reduce((acc, s) => acc + s.tokenCount, 0);

  return {
    retained,
    removed,
    savings,
  };
}

/**
 * Mocks the summarization of chat history turns.
 */
export function summarizeHistoryMock(
  historySections: ContextSection[]
): {
  summary: string;
  retainedFacts: string[];
  openTasks: string[];
  droppedDetails: string[];
  compactedTokens: number;
  savings: number;
} {
  const originalTokens = historySections.reduce((acc, s) => acc + s.tokenCount, 0);
  
  // Extract topics or facts based on user prompts in history sections
  const keywords: string[] = [];
  historySections.forEach(turn => {
    if (turn.content.toLowerCase().includes('sku')) {
      keywords.push('Cart SKU verification');
    }
    if (turn.content.toLowerCase().includes('passcode') || turn.content.toLowerCase().includes('code')) {
      keywords.push('Passcode extraction requested');
    }
  });

  const summary = historySections.length > 0 
    ? `User is interacting regarding support requests. History contains ${historySections.length} conversational turns discussing topics: ${keywords.length > 0 ? keywords.join(', ') : 'checkout options'}.`
    : 'No conversation history turns to summarize.';

  const retainedFacts = keywords.length > 0 ? keywords : ['Customer order status checks', 'Database lookups'];
  const openTasks = ['Awaiting final confirmation from active user inquiry.'];
  const droppedDetails = ['User greeting headers', 'Polite turn confirmations', 'Conversational filler text'];

  const summaryContent = `[COMPACTED STATE NODE]\nSummary: ${summary}\nRetained Facts: ${retainedFacts.join(' | ')}\nOpen Tasks: ${openTasks.join(' | ')}`;
  const compactedTokens = estimateTokens(summaryContent);
  const savings = Math.max(0, originalTokens - compactedTokens);

  return {
    summary,
    retainedFacts,
    openTasks,
    droppedDetails,
    compactedTokens,
    savings,
  };
}

/**
 * Calculates RAG context budget.
 */
export function calculateRagBudget(
  documents: ContextSection[]
): {
  totalDocsTokenCount: number;
  includedDocsTokenCount: number;
  excludedDocsTokenCount: number;
} {
  let totalDocsTokenCount = 0;
  let includedDocsTokenCount = 0;
  let excludedDocsTokenCount = 0;

  documents.forEach(doc => {
    totalDocsTokenCount += doc.tokenCount;
    if (doc.retained) {
      includedDocsTokenCount += doc.tokenCount;
    } else {
      excludedDocsTokenCount += doc.tokenCount;
    }
  });

  return {
    totalDocsTokenCount,
    includedDocsTokenCount,
    excludedDocsTokenCount,
  };
}
