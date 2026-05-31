from typing import List, Tuple
from schemas import ContextSectionSchema
from token_counter import count_tokens

# ==============================================================================
# EDUCATIONAL SYSTEM DESIGN NOTE: CHRONOLOGICAL FIFO TRUNCATION
# FIFO eviction is the simplest approach to state memory management. By treating the
# conversation thread as a chronological queue, we drop old history turns (index 0 upward)
# under budget saturation.
# Crucially, we MUST maintain absolute protection over core instructional guardrails
# (System Prompt required=true) and the active request (required=true) to prevent
# corrupting operational instructions or dropping the active transactional question.
# ==============================================================================

def optimize_fifo(
    sections: List[ContextSectionSchema],
    available_input_tokens: int
) -> Tuple[List[ContextSectionSchema], List[ContextSectionSchema]]:
    """
    Applies Fixed FIFO Truncation Policy.
    Iterates chronologically, dropping older conversational turns until the total payload
    fits safely within the Available Input Budget, or all optional history is evicted.
    
    Returns a tuple of (retained_sections, removed_sections).
    """
    # Create clones to avoid modifying the original list in-place
    retained_list: List[ContextSectionSchema] = []
    removed_list: List[ContextSectionSchema] = []
    
    # Calculate initial token lengths on-the-fly
    total_tokens = 0
    history_turns: List[ContextSectionSchema] = []
    
    for sec in sections:
        # Recompute tokens to ensure caching is fresh
        sec.token_count = count_tokens(sec.content)
        sec.retained = True
        
        # Categorize components
        if sec.type == "history" and not sec.required:
            history_turns.append(sec)
        else:
            retained_list.append(sec)
            total_tokens += sec.token_count
            
    # Sort history turns chronologically (oldest turns first)
    # Pydantic schema datetime defaults ensure correct order
    history_turns.sort(key=lambda s: s.created_at)
    
    # Evaluate history tokens
    history_tokens = sum(s.token_count for s in history_turns)
    total_tokens += history_tokens
    
    # If initial payload fits inside budget, keep all history
    if total_tokens <= available_input_tokens:
        retained_list.extend(history_turns)
        # Sort final output list to preserve original order
        retained_list.sort(key=lambda s: s.created_at)
        return retained_list, []
        
    # Otherwise, prune history turns step-by-step
    for turn in history_turns:
        if total_tokens > available_input_tokens:
            # Token limit violation remains active; evict this turn
            turn.retained = False
            removed_list.append(turn)
            total_tokens -= turn.token_count
        else:
            # Budget headroom restored; retain this and all subsequent turns
            turn.retained = True
            retained_list.append(turn)
            
    # Re-sort lists to preserve chronological context flow
    retained_list.sort(key=lambda s: s.created_at)
    removed_list.sort(key=lambda s: s.created_at)
    
    return retained_list, removed_list
