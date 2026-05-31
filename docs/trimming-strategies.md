# ⚖️ Context Truncation & Eviction Strategies

> [!NOTE]
> This document outlines the modular algorithms used to prune overflowing payloads. For the formal engineering justifications and architectural decision records (ADRs), see the [Architecture Decision Records Log](./architecture-decision-records.md).

When the gateway detects a context budget overflow ($U > 100\%$) or warns about extreme saturation ($U \ge 90\%$), it triggers the **Optimization Engine**. Developers can simulate, iterate, and apply four modular eviction algorithms to prune payloads safely without losing critical operational integrity.

---

## Strategy 1: Fixed FIFO Truncation Policy
The **First-In, First-Out (FIFO)** strategy treats conversational history as a chronological queue. When budget bounds are breached, it systematically shifts out the oldest chat nodes.

```
[System Prompt] [Old User turn 1] [Old Asst turn 2] [Recent turn 3] [Active User Input]
                                      │
                         (Eviction sweep deletes turn 1)
                                      ▼
[System Prompt]                  [Old Asst turn 2] [Recent turn 3] [Active User Input]
```

### Algorithmic Rules:
1. Identify all optional sections containing conversation history (`history` type).
2. Sort them chronologically by their creation timestamp (`createdAt`).
3. Iterate and remove sections starting from the oldest, recalculating the total token count.
4. **Guardrail:** Stop evicting the moment the utilization falls within safe budget parameters ($U \le 100\%$).
5. **Absolute Exception:** Never evict any section where `required` is set to `true` (e.g. System Prompt, Active User Input).

---

## Strategy 2: Sliding Window Attention Trim
The **Sliding Window** strategy maintains a rigid, configuration-driven limit on conversation length. It ensures that the model only maintains attention on the immediate recent $N$ conversational turns.

```
Let N = 2 (Keep last 2 turns)

[System Prompt] [Turn 1 (stale)] [Turn 2 (stale)] [Turn 3 (keep)] [Turn 4 (keep)] [Active Input]
                                       │
                             (Applies N-turn window)
                                       ▼
[System Prompt]                  [Turn 3 (keep)] [Turn 4 (keep)] [Active Input]
```

### Algorithmic Rules:
1. Accept an operator-configured integer parameter $N$ representing the number of recent turns to retain.
2. Group conversational history into contiguous message turns.
3. Keep exactly the latest $N$ turns. All turns older than this boundary index are systematically dropped.
4. **Exception:** The System Prompt is never subject to window restrictions and remains permanently anchored at the head.

---

## Strategy 3: Priority-Based Retention Layout
The **Priority Retention** algorithm sorts and evicts payload components based on their strategic significance to execution. It operates on a strict **Priority Matrix Hierarchy (1 to 8)**, ensuring lower-value items are dropped first.

| Priority | Component Type | Retention Status | Eviction Rule |
| :---: | :--- | :--- | :--- |
| **1** | `system` (System Prompt) | **Absolute Protection** | **Required=true.** Operational guardrails can never be removed. |
| **2** | `active_user_input` | **Absolute Protection** | **Required=true.** The current transaction request must be evaluated. |
| **3** | `summary` (Compacted Block) | High Retention | Frosted memory block summarizing past state. Retained where possible. |
| **4** | `history` (Recent Turns) | High Retention | Preserves conversation continuity. Retained unless extreme load occurs. |
| **5** | High-Rank Documents | Normal Retention | Vector search chunks matching relevance scores (similarity $> 0.82$). |
| **6** | `tool_output` | Low-Normal Retention | API response data blocks. Dropped under high context pressure. |
| **7** | `history` (Older Turns) | Low Retention | Dropped chronologically if token depletion threatens availability. |
| **8** | Low-Rank Documents | Minimal Retention | Auxiliary retrieved fragments. Systematically dropped first. |

### Algorithmic Rules:
1. Sort all non-required sections (`required == false`) in descending order of their priority value (Priority 8 down to 3).
2. Dropping begins with the highest priority numbers first (Priority 8: Low-Rank Docs).
3. If the token count is still unsafe, prunes Priority 7 (Older History), moving down the queue.
4. Stop evicting the moment the budget is safe ($U \le 100\%$).

---

## Strategy 4: RAG Document Trim
The **RAG Document Trim** strategy specializes in vector database payloads. Rather than loading massive retrieved documentation pools blindly, it truncates the collection based on relevance rankings.

### Algorithmic Rules:
1. Target all sections typed as `retrieved_document`.
2. Inspect their metadata rank or similarity score.
3. Systematically prune the lowest-ranked chunks first (e.g. from rank $K$ down to rank 1).
4. Keep the highest-ranked documents, recalculating the footprint until the document collection fits safely within the input budget margin.
5. Displays detailed reports showing the number of documents trimmed and the corresponding token savings.
