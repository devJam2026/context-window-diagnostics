from typing import List, Tuple
from schemas import ContextSectionSchema
from token_counter import count_tokens

# ==============================================================================
# EDUCATIONAL SYSTEM DESIGN NOTE: THE PRIORITY MATRIX RETENTION ENGINE
# In sophisticated AI pipelines, context depletion threatens availability. Rather than
# blindly dropping all conversational history, we apply an absolute importance matrix.
# Elements with required=true (System Prompt and active user input) are absolutely protected.
# Optional components are sorted by priority score (1 to 8). Evictions target the lowest
# value items first (Priority 8: Low-Rank RAG documents), then Priority 7 (older chat history),
# and so forth, protecting high-value summary blocks (Priority 3) and recent threads (Priority 4).
# ==============================================================================

def optimize_priority(
    sections: List[ContextSectionSchema],
    available_input_tokens: int
) -> Tuple[List[ContextSectionSchema], List[ContextSectionSchema]]:
    """
    Applies Priority-Based Retention Layout.
    Sorts optional sections by their designated importance score (1 to 8) and evicts
    lowest priority blocks first until the active prompt fits within budget parameters.
    
    Returns a tuple of (retained_sections, removed_sections).
    """
    retained_list: List[ContextSectionSchema] = []
    removed_list: List[ContextSectionSchema] = []
    
    immutable_sections: List[ContextSectionSchema] = []
    evictable_sections: List[ContextSectionSchema] = []
    
    total_tokens = 0
    
    # 1. Separate immutable elements from the evictable pool
    for sec in sections:
        sec.token_count = count_tokens(sec.content)
        sec.retained = True
        
        if sec.required:
            immutable_sections.append(sec)
            total_tokens += sec.token_count
        else:
            evictable_sections.append(sec)
            
    # 2. Sort the evictable sections by priority value descending (Priority 8 down to 3)
    # The higher the numeric priority value, the lower the actual importance, meaning it is evicted FIRST.
    # E.g. Priority 8 (Low-Rank RAG Chunk) is less critical than Priority 3 (Summary block).
    evictable_sections.sort(key=lambda s: s.priority, reverse=True)
    
    # Calculate token summation of all evictable items
    evictable_tokens = sum(s.token_count for s in evictable_sections)
    total_tokens += evictable_tokens
    
    # If total matches target budget, retain everything
    if total_tokens <= available_input_tokens:
        retained_list.extend(immutable_sections)
        retained_list.extend(evictable_sections)
        retained_list.sort(key=lambda s: s.created_at)
        return retained_list, []
        
    # Otherwise, execute priority-based prunings
    for sec in evictable_sections:
        if total_tokens > available_input_tokens:
            # Saturated payload remains; evict this low-priority item
            sec.retained = False
            removed_list.append(sec)
            total_tokens -= sec.token_count
        else:
            # Headroom is safe; retain this and all subsequent items
            sec.retained = True
            retained_list.append(sec)
            
    # Compile absolute final collections
    retained_list.extend(immutable_sections)
    
    # Sort lists to preserve chronological context flow
    retained_list.sort(key=lambda s: s.created_at)
    removed_list.sort(key=lambda s: s.created_at)
    
    return retained_list, removed_list
