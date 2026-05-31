# 🛠️ System Design Notes: Compaction & Lost-in-the-Middle

> [!NOTE]
> This document provides deep-dive analytical notes on the mathematical and cognitive mechanics of the gateway. For the formal engineering justifications and architectural decision records (ADRs), see the [Architecture Decision Records Log](./architecture-decision-records.md).

This document outlines the advanced, production-grade design patterns implemented in the Context Window Gateway: **OpenAI Structured Output Compaction**, **Self-Healing Fallbacks**, and **Lost-in-the-Middle Attention Profiling**.


---

## 1. Summarized Compaction Engine

Traditional context compression models rely on free-form text summarization. While this reduces token size, it introduces critical engineering failure modes:
* **Hallucination of key parameters:** Free-form models omit critical business details (e.g. SKUs, ticket numbers, order statuses).
* **Conversational Fluff:** Conversational intros (e.g., "Sure, I can summarize that for you...") clutter prompt memory blocks.
* **Layout Inconsistency:** Downstream parsers cannot rely on structured data formats if the schema varies dynamically.

To prevent this, the gateway implements a type-safe **Real Summarized Compaction Engine** powered by OpenAI's Structured Outputs (`response_format` referencing a strict Pydantic schema).

```
                      [Saturated Conversation History Nodes]
                                        │
                                        ▼
                  [Call OpenAI Endpoint: gpt-4o-mini + Schema]
                                        │
                                        ▼
                    [Parse into CompactionTargetSchema]
                                        │
                 (Did Validation Schema Parsing Succeed?)
                 ├─── (Yes) ───► Insert Compacted Block; Prune Raw turns
                 │
                 └─── (No) ────► Trigger Self-Healing Recursive Loop
                                       │
                                       ▼
                         [Stricter Diagnostics Retry]
                                       │
                         (Did Secondary Attempt Pass?)
                         ├─── (Yes) ───► Insert Block
                         │
                         └─── (No) ────► Degraded Fallback: Keep Raw history
```

### 1.1 Self-Healing Validation & Fallback Protocol
1. **Targeting:** Identify old conversational history turns eligible for compaction.
2. **First Attempt:** Dispatch inference to `gpt-4o-mini` enforcing `CompactionTargetSchema` response constraints.
3. **Pydantic Validation Check:**
   - If the returned JSON maps perfectly to `CompactionTargetSchema`, the gateway completes the transaction. It inserts the compaction block (Priority 3) and drops the raw history nodes.
4. **Self-Healing Retry Loop:** If parsing fails due to schema mismatch or model hallucination:
   - Capture the exception log string.
   - Dispatch **exactly one recursive retry**.
   - The retry prompt injects the raw text alongside the explicit error snippet, forcing the LLM to align.
5. **Safe Degraded Fallback:** If the retry fails, the gateway aborts compaction entirely, sets `validationStatus = "failed"`, and **preserves the raw conversation list intact**. This guarantees zero data loss in production.

---

## 2. The "Lost-in-the-Middle" Phenomenon

Large context windows (e.g., $128,000$ tokens) give engineers a false sense of security. Empirical research proves that LLM attention forms an **attentional U-curve**: models are highly capable of retrieving details placed at the absolute beginning (primacy effect) or the absolute end (recency effect) of prompt strings, but performance degrades heavily for details placed in the exact center.

```
Model Attention / Accuracy %
100% |  =============================                 =============================
     |                               \               /
     |                                \             /
     |                                 \           /
 50% |                                  \         /
     |                                   \       /
     |                                    ======= (Retrieval saturation zone)
  0% |─────────────────────────────────────────────────────────────────────────────
     [ Beginning of Context ]               [ Middle ]                 [ End of Context ]
```

### 2.1 Lost-in-the-Middle Demo Preset (Scenario 5)
To help engineers visualize this vulnerability, the gateway includes a **Lost-in-the-Middle Demonstration Scenario**:
* The dashboard injects an $8,192$ token chat history sequence.
* It places a critical transaction passcode (`VIP-RETAIL-2026`) at the exact geometric center ($50\%$ index depth) of the conversational text, surrounded by verbose conversational filler.
* When this payload is sent to an LLM, the model frequently struggles to retrieve the passcode due to attention saturation in the middle zone.
* The gateway demonstrates how applying **Summarized Compaction** or **FIFO Truncation** reduces the noise buffer, compressing the passcode's positional depth closer to the active recency window, which restores immediate retrieval accuracy.
