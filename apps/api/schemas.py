from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime

# ==============================================================================
# EDUCATIONAL SYSTEM DESIGN NOTE: STRUCTURAL SECTION VALIDATION
# In enterprise prompt gateways, we do not treat prompts as loose string variables.
# Instead, prompts are constructed as structured Arrays of ContextSections. This Pydantic
# schema guarantees type safety and tracks metadata (priority, required flags, and timestamp)
# enabling granular, deterministic eviction policies.
# ==============================================================================

class ContextSectionSchema(BaseModel):
    id: str = Field(..., description="Unique structural ID for the section block (e.g. sec_sys_01)")
    type: str = Field(..., description="Component type: system, history, retrieved_document, tool_output, active_user_input, summary")
    role: Optional[str] = Field(None, description="Inference chat role: system, user, assistant, tool")
    title: str = Field(..., description="Descriptive human-readable title of the component")
    content: str = Field(..., description="Raw text string payload to be tokenized and compiled")
    token_count: int = Field(0, description="Cached token length computed by the tiktoken parser")
    priority: int = Field(..., description="Dynamic priority value from 1 (Highest / Immutable) to 8 (Lowest / Evictable first)")
    required: bool = Field(False, description="Guardrail flag; required=true protects critical system context from eviction")
    retained: bool = Field(True, description="Retention flag set dynamically by backend optimization sandboxes")
    created_at: datetime = Field(default_factory=datetime.now, description="ISO-8601 creation timestamp for chronological operations")

# ==============================================================================
# EDUCATIONAL SYSTEM DESIGN NOTE: COMPACTION STRUCTURED OUTPUTS SCHEMA
# When conversation histories saturate, standard summarizers generate generic conversational fluff.
# By combining Pydantic with OpenAI's strict response_format, we force the LLM to output
# a strict JSON object mapping exactly to the schema below. This guarantees downstream reliability,
# isolates core parameters (facts, SKUs, and open tasks), and strips low-value dialogue blocks.
# ==============================================================================

class CompactionTargetSchema(BaseModel):
    summary: str = Field(
        ..., 
        description="A dense, unsentimental distillation of the historical user goals and transactions."
    )
    retainedFacts: List[str] = Field(
        ..., 
        description="Durable, high-value enterprise parameters extracted from history (e.g., SKUs, IDs, passcodes)."
    )
    openTasks: List[str] = Field(
        ..., 
        description="Unresolved structural actions requested by the user that require subsequent execution."
    )
    droppedDetails: List[str] = Field(
        ..., 
        description="Low-value, highly verbose, or conversational chat items omitted for budget control."
    )
    confidence: float = Field(
        ..., 
        description="The mathematical accuracy self-evaluation score of the compression step, from 0.00 to 1.00."
    )

# ==============================================================================
# API GATEWAY CONTRACT SCHEMA DEFINITIONS
# ==============================================================================

class TokenBudgetTelemetry(BaseModel):
    modelPreset: str
    contextLimit: int
    reservedOutputTokens: int
    safetyMarginTokens: int
    availableInputTokens: int
    usedInputTokens: int
    remainingTokens: int
    overflowTokens: int
    utilizationRatio: float
    riskStatus: str  # safe, warning, critical, overflow
    estimatedCostUSD: float
    latencyRiskCategory: str  # low, moderate, high, extreme

class AnalyzeRequestSchema(BaseModel):
    modelPreset: str = Field("standard_context", description="Model capacity profile identifier")
    reservedOutputTokens: int = Field(1000, description="Tokens reserved for output generation")
    safetyMarginPercent: int = Field(10, description="Defensive token padding buffer percentage")
    payloadSections: List[ContextSectionSchema] = Field(..., description="Array of prompt components to analyze")

class AnalyzeResponseSchema(BaseModel):
    sectionTokenCounts: Dict[str, int] = Field(..., description="Map of Section IDs to their computed token size")
    metrics: TokenBudgetTelemetry = Field(..., description="High-density diagnostic metrics summary")

class OptimizeRequestSchema(BaseModel):
    strategy: str = Field(..., description="Eviction algorithm: fifo, sliding_window, priority, rag_trim")
    modelPreset: str = Field("standard_context", description="Model context profile identifier")
    reservedOutputTokens: int = Field(1000, description="Tokens reserved for output generation")
    safetyMarginPercent: int = Field(10, description="Defensive token padding buffer percentage")
    payloadSections: List[ContextSectionSchema] = Field(..., description="Array of prompt components to optimize")
    slidingWindowTurns: Optional[int] = Field(5, description="N recent conversation turns to retain for sliding window trim")

class OptimizeResponseSchema(BaseModel):
    strategyApplied: str = Field(..., description="Algorithmic strategy executed")
    beforeTokenCount: int = Field(..., description="Pre-optimization prompt size")
    afterTokenCount: int = Field(..., description="Post-optimization prompt size")
    savingsTokens: int = Field(..., description="Tokens pruned from prompt payload")
    riskStatusAfter: str = Field(..., description="New safety category status (e.g. safe)")
    retainedSections: List[ContextSectionSchema] = Field(..., description="Surviving payload components")
    removedSections: List[ContextSectionSchema] = Field(..., description="Evicted payload components")

class CompactionRequestSchema(BaseModel):
    sessionId: str = Field(..., description="Session identifier for state mapping")
    historySections: List[ContextSectionSchema] = Field(..., description="Raw message history turns targeted for compaction")
    compressionGoal: Optional[str] = Field("Reduce old history while preserving durable facts and unresolved tasks.", description="Inference context target")

class CompactionResponseSchema(BaseModel):
    summary: str
    retainedFacts: List[str]
    openTasks: List[str]
    droppedDetails: List[str]
    confidence: float
    originalTokens: int
    compactedTokens: int
    savingsTokens: int
    validationStatus: str  # valid, retry_success, failed
