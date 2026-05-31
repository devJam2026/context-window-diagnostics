import math
from typing import List, Dict, Any
from schemas import TokenBudgetTelemetry, ContextSectionSchema
from token_counter import count_tokens

# ==============================================================================
# SYSTEM CONFIGURATION PRESETS
# Registry of absolute capacities permitted by popular model architectures.
# ==============================================================================
MODEL_PRESETS: Dict[str, int] = {
    "small_context": 4096,     # e.g., GPT-3.5 Legacy / Llama-2 standard
    "standard_context": 8192,  # e.g., GPT-4 standard / Llama-3 8B baseline
    "large_context": 32768,    # e.g., Mistral-Medium / GPT-4 Turbo presets
    "long_context": 128000,    # e.g., GPT-4o / Claude 3 Sonnet scale
}

def calculate_telemetry(
    payload_sections: List[ContextSectionSchema],
    model_preset: str,
    reserved_output_tokens: int,
    safety_margin_percent: int
) -> TokenBudgetTelemetry:
    """
    Computes all token budget diagnostics and financial/latency forecasts for the prompt payload.
    Ensures mathematical alignment with strict corporate budgeting formulas.
    """
    # 1. Look up total architectural capacity (C_max)
    context_limit = MODEL_PRESETS.get(model_preset, 8192)
    
    # 2. Compute safety margin tokens based on defensive padding percentage (M_safety)
    safety_margin_ratio = safety_margin_percent / 100.0
    safety_margin_tokens = math.ceil(context_limit * safety_margin_ratio)
    
    # 3. Available Input Budget Formula (A_input)
    # A_input = C_max - T_reserved - ceil(C_max * M_safety)
    available_input_tokens = context_limit - reserved_output_tokens - safety_margin_tokens
    # Guard against invalid negative allocations
    available_input_tokens = max(0, available_input_tokens)
    
    # 4. Sum up current active prompt section footprints (T_used)
    # Re-calculate token counts on-the-fly to guarantee absolute freshness
    used_input_tokens = 0
    for sec in payload_sections:
        if sec.retained:
            sec.token_count = count_tokens(sec.content)
            used_input_tokens += sec.token_count
            
    # 5. Remaining Budget (T_remaining) & Overflow size (T_overflow)
    remaining_tokens = max(0, available_input_tokens - used_input_tokens)
    overflow_tokens = max(0, used_input_tokens - available_input_tokens)
    
    # 6. Context Budget Utilization Ratio (U)
    # U = T_used / A_input
    if available_input_tokens > 0:
        utilization_ratio = round(used_input_tokens / available_input_tokens, 3)
    else:
        utilization_ratio = 1.0 if used_input_tokens > 0 else 0.0
        
    # 7. Evaluate Operational Risk Thresholds
    # Mapping U % into distinct system states
    if utilization_ratio >= 1.0 or overflow_tokens > 0:
        risk_status = "overflow"
    elif utilization_ratio >= 0.90:
        risk_status = "critical"
    elif utilization_ratio >= 0.70:
        risk_status = "warning"
    else:
        risk_status = "safe"
        
    # 8. Financial Cost Estimation
    # Model assumptions matching standard gpt-4o-mini rates:
    # Input pricing: $0.15 per 1M tokens ($0.00000015 per token)
    # Output pricing: $0.60 per 1M tokens ($0.00000060 per token)
    input_cost = used_input_tokens * 0.00000015
    output_cost = reserved_output_tokens * 0.00000060
    estimated_cost_usd = round(input_cost + output_cost, 6)
    
    # 9. Latency Risk Category Projections
    # Large payloads inflate model compilation times and network roundtrips.
    if used_input_tokens < 2000:
        latency_category = "low"
    elif used_input_tokens < 5000:
        latency_category = "moderate"
    elif used_input_tokens < 10000:
        latency_category = "high"
    else:
        latency_category = "extreme"
        
    return TokenBudgetTelemetry(
        modelPreset=model_preset,
        contextLimit=context_limit,
        reservedOutputTokens=reserved_output_tokens,
        safetyMarginTokens=safety_margin_tokens,
        availableInputTokens=available_input_tokens,
        usedInputTokens=used_input_tokens,
        remainingTokens=remaining_tokens,
        overflowTokens=overflow_tokens,
        utilizationRatio=utilization_ratio,
        riskStatus=risk_status,
        estimatedCostUSD=estimated_cost_usd,
        latencyRiskCategory=latency_category
    )
