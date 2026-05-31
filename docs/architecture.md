# 🏗️ Context Gateway System Architecture

In high-scale enterprise AI applications, the LLM context window must be managed as a **finite, high-cost runtime memory buffer**. Blindly throwing unmonitored strings at downstream API completions results in:
* **OutOfMemory (OOM) API Crashes:** Exceeding context limits causes immediate request failures.
* **Accuracy Degradation:** Verbose, unoptimized context triggers "lost-in-the-middle" attention saturation.
* **Inflation of Operating Costs:** Every token processed contributes directly to your upstream cloud bill.
* **Response Latency Spikes:** Prompt compilation and generation durations scale with overall payload size.

To defend against these failure modes, this project introduces a **pre-LLM diagnostics and optimization gateway**.

---

## 🔄 Gateway Request Life-Cycle

The gateway sits at the edge of your service network, intercepting request payloads before they are serialized and transmitted to model endpoints (such as OpenAI or Anthropic).

```
   [Active User Request]
             │
             ▼
┌─────────────────────────┐
│     Ingestion Node      │ ──► Parse incoming payload into structured sections
└─────────────────────────┘
             │
             ▼
┌─────────────────────────┐
│   Fast Tiktoken Parse   │ ──► Count tokens in <15ms using SHA-256 caching
└─────────────────────────┘
             │
             ▼
┌─────────────────────────┐
│   Telemetry Profiler    │ ──► Calculate U % and evaluate Risk Status
└─────────────────────────┘
             │
      (Crosses Threshold U >= 70%?)
      ├─────► [Yes] ─────► ┌───────────────────────────┐
      │                    │  Defensive Sandbox Panel  │
      │                    │  - Apply FIFO / Window    │
      │                    │  - Apply Priority Matrix  │
      │                    │  - Run Summarized compact │
      │                    └─────────────┬─────────────┘
      │                                  │
      │                                  ▼
      │                     [Optimized Prompt Result]
      │                                  │
      └─────► [No] ──────────────────────┼──► Route Safely to Upstream LLM API
                                         │
                                         ▼
                               [Low-Latency Completion]
```

---

## 🏷️ Multi-Part Payload Builder Composition

Prompt engineering is not enough; production AI requires **payload engineering**. Payloads are modeled as structural arrays composed of specialized component nodes:

| Component Type | Role & Retention Rules | Default Priority |
| :--- | :--- | :---: |
| `system` | Core behavioral instructions and guardrails. **Immutable; never evicted.** | **1** |
| `active_user_input` | The immediate transaction request that the LLM must execute. **Never evicted.** | **2** |
| `summary` | Condensed memory blocks capturing historical conversational facts. | **3** |
| `history` (Recent) | Immediate past turns (assistant/user) representing active context. | **4** |
| `retrieved_document` | High-relevance knowledge chunks fetched from vector DB retrieval. | **5** |
| `tool_output` | API response JSONs or execution logs injected back into prompt. | **6** |
| `history` (Older) | Stale conversation history eligible for compaction or truncation. | **7** |
| `retrieved_document` | Low-relevance vector documents; systematically trimmed first. | **8** |

---

## 📊 Operational Risk Thresholds & Middleware Actions

The telemetry engine continuously evaluates the context budget utilization ratio ($U$). Based on this ratio, the gateway assigns a risk state and triggers corresponding operational guardrails:

```
[  0% ] ======================= Safe (Normal Routing) ==================== [ 70% ]
[ 70% ] ============= Warning (Minor Latency Warning) ============ [ 90% ]
[ 90% ] ==== Critical (High Saturation & "Lost-in-the-Middle" Risk) === [ 100% ]
[100%+ ] == Overflow (API Gateway BLOCKS request execution) ============= [ Overflow ]
```

### 1. `Safe` ($0\% \le U < 70\%$)
* **Meaning:** High safety margin. Low risk of latency or accuracy degradation.
* **Gateway Action:** Pass payload to LLM endpoint directly.

### 2. `Warning` ($70\% \le U < 90\%$)
* **Meaning:** Context limits are approaching. Minor latency inflation might be observed.
* **Gateway Action:** Log telemetry event, flag orange warning indicators in administrative console.

### 3. `Critical` ($90\% \le U \le 100\%$)
* **Meaning:** Saturated memory space. High probability that central elements suffer retrieval attenuation (Lost-in-the-Middle).
* **Gateway Action:** Highlight neon crimson banners. Proactively recommend **Summarized Compaction** or **Priority-based Pruning** to compress buffer space.

### 4. `Overflow` ($U > 100\%$)
* **Meaning:** Inbound prompt exceeds safe available budget. Request will fail upstream.
* **Gateway Action:** **Hard Block.** Intercept request and prevent network dispatch. Force optimization routine until $U \le 100\%$.
