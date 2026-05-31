from typing import List, Tuple
from schemas import ContextSectionSchema
from token_counter import count_tokens

# ==============================================================================
# EDUCATIONAL SYSTEM DESIGN NOTE: RAG COMPRESSION & BUDGETS
# RAG applications frequently flood prompt space with dozens of retrieved paragraphs.
# Instead of loading everything blindly, a smart gateway isolated RAG segments.
# By checking relevance metadata, we drop lower-relevance search chunks first (Priority 8)
# while keeping high-relevance chunks (Priority 5) intact. This retains search coverage
# without causing context window overflow.
# ==============================================================================

def optimize_rag_trim(
    sections: List[ContextSectionSchema],
    available_input_tokens: int
) -> Tuple[List[ContextSectionSchema], List[ContextSectionSchema]]:
    """
    Applies RAG Document relevance rank trim.
    Isolates retrieved documents and evicts lowest-ranking chunks (Priority 8) first
    until the remaining RAG footprint fits cleanly inside the available input budget.
    
    Returns a tuple of (retained_sections, removed_sections).
    """
    retained_list: List[ContextSectionSchema] = []
    removed_list: List[ContextSectionSchema] = []
    
    non_rag_sections: List[ContextSectionSchema] = []
    rag_documents: List[ContextSectionSchema] = []
    
    total_tokens = 0
    
    # 1. Isolate RAG documents from structural elements
    for sec in sections:
        sec.token_count = count_tokens(sec.content)
        sec.retained = True
        
        if sec.type == "retrieved_document" and not sec.required:
            rag_documents.append(sec)
        else:
            non_rag_sections.append(sec)
            total_tokens += sec.token_count
            
    # 2. Sort RAG documents by priority score descending
    # Priority 8 blocks represent Low-Rank/Low-Relevance documents, which we evict FIRST.
    # Priority 5 blocks represent High-Rank/High-Relevance chunks, which we protect where possible.
    rag_documents.sort(key=lambda s: s.priority, reverse=True)
    
    # Calculate starting token size
    rag_tokens = sum(s.token_count for s in rag_documents)
    total_tokens += rag_tokens
    
    # If starting size is safe, keep all documents
    if total_tokens <= available_input_tokens:
        retained_list.extend(non_rag_sections)
        retained_list.extend(rag_documents)
        retained_list.sort(key=lambda s: s.created_at)
        return retained_list, []
        
    # Execute RAG document relevance trimming
    for doc in rag_documents:
        if total_tokens > available_input_tokens:
            # Token budget is violated; prune this low-rank chunk
            doc.retained = False
            removed_list.append(doc)
            total_tokens -= doc.token_count
        else:
            # Headroom restored; retain high relevance chunks
            doc.retained = True
            retained_list.append(doc)
            
    # Assemble final lists
    retained_list.extend(non_rag_sections)
    
    # Sort lists to preserve chronological context flow
    retained_list.sort(key=lambda s: s.created_at)
    removed_list.sort(key=lambda s: s.created_at)
    
    return retained_list, removed_list
