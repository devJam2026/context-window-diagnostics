from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from schemas import (
    AnalyzeRequestSchema,
    AnalyzeResponseSchema,
    OptimizeRequestSchema,
    OptimizeResponseSchema,
    CompactionRequestSchema,
    CompactionResponseSchema
)
from token_counter import count_tokens
from budget_calculator import calculate_telemetry
from optimizers import (
    optimize_fifo,
    optimize_sliding_window,
    optimize_priority,
    optimize_rag_trim
)
from compaction import run_structured_compaction
from scenarios import get_scenarios

# ==============================================================================
# EDUCATIONAL SYSTEM DESIGN NOTE: THE PRE-LLM MIDDLEWARE ROUTER
# This FastAPI application serves as the defensive edge proxy gateway. All LLM-bound prompts
# pass through here for inspection, counting, evaluation against budget formulas,
# and compaction. This guarantees absolute compliance and protects upstream systems.
# ==============================================================================

app = FastAPI(
    title="Enterprise Context Window & Payload Diagnostics Gateway",
    description="Pre-LLM edge profiler and self-healing context compaction proxy.",
    version="1.0.0"
)

# Enable CORS middleware to allow seamless Next.js frontend communication (standard port 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Broad origin support for sandboxed local environments
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    """Simple API health check endpoint verifying proxy routing state."""
    return {"status": "healthy", "service": "diagnostics-gateway", "version": "1.0.0"}

@app.post("/api/context/analyze", response_model=AnalyzeResponseSchema)
def analyze_context(payload: AnalyzeRequestSchema):
    """
    Ingests prompt payloads, parses sections on-the-fly, computes section token counts,
    and returns comprehensive budget telemetry diagnostics.
    """
    try:
        # 1. Re-compute tokens on-the-fly for every section to guarantee absolute freshness
        section_token_counts = {}
        for sec in payload.payloadSections:
            sec.token_count = count_tokens(sec.content)
            section_token_counts[sec.id] = sec.token_count
            
        # 2. Run mathematical calculations for safe budgets and risk thresholds
        telemetry = calculate_telemetry(
            payload_sections=payload.payloadSections,
            model_preset=payload.modelPreset,
            reserved_output_tokens=payload.reservedOutputTokens,
            safety_margin_percent=payload.safetyMarginPercent
        )
        
        return AnalyzeResponseSchema(
            sectionTokenCounts=section_token_counts,
            metrics=telemetry
        )
    except Exception as err:
        logger_err = f"Failed to analyze context payload: {str(err)}"
        raise HTTPException(status_code=500, detail=logger_err)

@app.post("/api/context/optimize", response_model=OptimizeResponseSchema)
def optimize_context(payload: OptimizeRequestSchema):
    """
    Applies the selected optimization eviction strategy across the multi-part request payload,
    re-evaluating metrics before and after the transaction to display exact token savings.
    """
    try:
        # Calculate available safe input budget
        telemetry_before = calculate_telemetry(
            payload_sections=payload.payloadSections,
            model_preset=payload.modelPreset,
            reserved_output_tokens=payload.reservedOutputTokens,
            safety_margin_percent=payload.safetyMarginPercent
        )
        available_input_tokens = telemetry_before.availableInputTokens
        before_token_count = telemetry_before.usedInputTokens
        
        strategy = payload.strategy.lower()
        retained = []
        removed = []
        
        # 1. Route to designated eviction algorithm
        if strategy == "fifo":
            retained, removed = optimize_fifo(payload.payloadSections, available_input_tokens)
        elif strategy == "sliding_window":
            turns = payload.slidingWindowTurns or 5
            retained, removed = optimize_sliding_window(payload.payloadSections, turns)
        elif strategy == "priority":
            retained, removed = optimize_priority(payload.payloadSections, available_input_tokens)
        elif strategy == "rag_trim":
            retained, removed = optimize_rag_trim(payload.payloadSections, available_input_tokens)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported eviction strategy: {payload.strategy}")
            
        # 2. Re-compute telemetry for surviving sections
        telemetry_after = calculate_telemetry(
            payload_sections=retained,
            model_preset=payload.modelPreset,
            reserved_output_tokens=payload.reservedOutputTokens,
            safety_margin_percent=payload.safetyMarginPercent
        )
        
        after_token_count = telemetry_after.usedInputTokens
        savings_tokens = before_token_count - after_token_count
        
        return OptimizeResponseSchema(
            strategyApplied=payload.strategy,
            beforeTokenCount=before_token_count,
            afterTokenCount=after_token_count,
            savingsTokens=max(0, savings_tokens),
            riskStatusAfter=telemetry_after.riskStatus,
            retainedSections=retained,
            removedSections=removed
        )
    except HTTPException as http_err:
        raise http_err
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Context optimization failed: {str(err)}")

@app.post("/api/context/compact", response_model=CompactionResponseSchema)
def compact_context(payload: CompactionRequestSchema):
    """
    Compresses conversation history blocks into structured state summaries using
    OpenAI Structured Outputs. Integrates self-healing validation retry fallbacks.
    """
    try:
        if not payload.historySections:
            raise HTTPException(status_code=400, detail="Compaction requires a non-empty conversational history array.")
            
        # Execute Structured Output OpenAI compactor
        comp_dict, original, compacted, val_status = run_structured_compaction(
            history_sections=payload.historySections,
            compression_goal=payload.compressionGoal
        )
        
        savings = original - compacted
        
        return CompactionResponseSchema(
            summary=comp_dict.get("summary", ""),
            retainedFacts=comp_dict.get("retainedFacts", []),
            openTasks=comp_dict.get("openTasks", []),
            droppedDetails=comp_dict.get("droppedDetails", []),
            confidence=comp_dict.get("confidence", 0.0),
            originalTokens=original,
            compactedTokens=compacted,
            savingsTokens=max(0, savings),
            validationStatus=val_status
        )
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Compaction routine aborted: {str(err)}")

@app.get("/api/scenarios")
def list_scenarios():
    """Exposes pre-configured conversational and data traps targeted for diagnostics testing."""
    try:
        return get_scenarios()
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Failed to fetch scenario presets: {str(err)}")
