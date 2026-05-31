from typing import List, Tuple
from schemas import ContextSectionSchema
from token_counter import count_tokens

# ==============================================================================
# EDUCATIONAL SYSTEM DESIGN NOTE: SLIDING WINDOWS
# High-scale production agents utilize sliding windows to bound input size. Rather than
# calculating tokens dynamically on every turn, we enforce a rigid turn boundary constraint.
# E.g. retain exactly the last 5 turns. This preserves immediate conversation context
# continuity while systematically letting older state items slide out of focus, avoiding
# sudden context capacity crashes.
# ==============================================================================

def optimize_sliding_window(
    sections: List[ContextSectionSchema],
    turns_to_keep: int
) -> Tuple[List[ContextSectionSchema], List[ContextSectionSchema]]:
    """
    Enforces a rigid Sliding Window Attention Trim.
    Retains exactly the most recent N conversational history turns, evicting anything older.
    Required sections (like System Prompt and Active User Input) are always preserved.
    
    Returns a tuple of (retained_sections, removed_sections).
    """
    retained_list: List[ContextSectionSchema] = []
    removed_list: List[ContextSectionSchema] = []
    
    history_turns: List[ContextSectionSchema] = []
    
    # 1. Separate optional history from structural guardrails
    for sec in sections:
        sec.token_count = count_tokens(sec.content)
        sec.retained = True
        
        if sec.type == "history" and not sec.required:
            history_turns.append(sec)
        else:
            retained_list.append(sec)
            
    # 2. Sort history turns by chronological timestamp (oldest first)
    history_turns.sort(key=lambda s: s.created_at)
    
    # 3. Establish the sliding window boundary
    # If the total history turns are less than N, retain all
    if len(history_turns) <= turns_to_keep:
        retained_list.extend(history_turns)
    else:
        # Determine the sliding threshold index
        split_idx = len(history_turns) - turns_to_keep
        
        # Evict older turns
        for sec in history_turns[:split_idx]:
            sec.retained = False
            removed_list.append(sec)
            
        # Retain recent turns
        for sec in history_turns[split_idx:]:
            sec.retained = True
            retained_list.append(sec)
            
    # Re-sort lists to preserve chronological context flow
    retained_list.sort(key=lambda s: s.created_at)
    removed_list.sort(key=lambda s: s.created_at)
    
    return retained_list, removed_list
