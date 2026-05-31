# 📋 Enterprise Context Window & Payload Diagnostics Gateway

The **Enterprise Context Gateway** is a production-style pre-LLM defensive middleware and diagnostics application. It treats the LLM context window as a **finite, high-cost runtime memory buffer**, profiling, optimizing, and compressing complex multi-part payloads *before* they make expensive cloud API roundtrips.

Built with a gorgeous, high-density **Cool-Slate & Frosted Glassmorphism Theme** (completely avoiding generic pure black designs), the platform functions as an educational sandbox where developers can simulate context window limits, test eviction strategies, and execute OpenAI Structured Output compaction routines.

---

## 🎨 Visual System Layout

The application integrates an **Enterprise Left Navigation Sidebar** to easily toggle between active engineering environments:

```
┌───────────┬──────────────────────────────────────────────────────────────┐
│  SIDEBAR  │        CONTEXT WINDOW PROFILER & DIAGNOSTICS GATEWAY         │
│  NAVBAR   ├──────────────────────────────────────────────────────────────┤
│           │  PANEL A: CONFIGURATION           PANEL C: TELEMETRY         │
│  • Profile│  • Presets / Margin Sliders       • Circular Telemetry Dials │
│  • Sandbox│                                   • Context Memory Stack Bar │
│  • Compact├──────────────────────────────────────────────────────────────┤
│  • Library│  PANEL B: PAYLOAD BUILDER         PANEL D: SANDBOX CONTROLS  │
│  • Docs   │  • System, History Tabs           • Eviction & Compaction    │
│           │  • Scenario Library Injectors     • Before vs After Logs     │
└───────────┴──────────────────────────────────────────────────────────────┘
```

---

## 🎓 Learning Curriculum & System Design Concepts

Through this project, developers master:
1. **Context Window Limits:** Understanding the physical token constraints of model architectures.
2. **Token Budgeting:** How input prompts and output generations share the same finite context limit.
3. **Payload Engineering:** Composing prompt payloads into granular, priority-sorted arrays.
4. **Defensive Ingestion Middleware:** Intercepting and blocking overflowing API calls before cloud dispatch.
5. **Algorithmic Truncations:** FIFO, sliding window, and Priority Matrix eviction models.
6. **Self-Healing Compaction:** Structured summarization via OpenAI with validation parsing retries.
7. **Attention Attentional Valleys:** Lost-in-the-Middle positioning visualizers.
8. **SHA-256 Count Caching:** Tokenizing static segments in sub-15ms.

---

## 📐 Core Core Architectural Formulas

### 1. Available Input Budget Formula ($A_{\text{input}}$)
The safe maximum token size permitted for prompt ingestion:

$$A_{\text{input}} = C_{\text{max}} - T_{\text{reserved}} - \lceil C_{\text{max}} \times M_{\text{safety}} \rceil$$

* $C_{\text{max}}$: Absolute capacity of selected model preset (4K, 8K, 32K, 128K).
* $T_{\text{reserved}}$: Space reserved exclusively for model output completion.
* $M_{\text{safety}}$: Safety padding percent protecting against BPE discrepancies (defaults to $10\%$).

### 2. Context Budget Utilization Ratio ($U$)
$$\text{Utilization } (U) = \frac{T_{\text{used}}}{A_{\text{input}}}$$

* **Safe:** $0\% \le U < 70\%$
* **Warning:** $70\% \le U < 90\%$ (minor latency danger)
* **Critical:** $90\% \le U \le 100\%$ (extreme lost-in-the-middle zone)
* **Overflow:** $U > 100\%$ (blocked by gateway)

---

## 🛠️ Repository Architecture & Subfolders

```
context-window-diagnostics/
├── apps/
│   ├── api/                          # FastAPI Backend
│   │   ├── main.py                   # App entry router
│   │   ├── schemas.py                # Pydantic schemas (Request, Response, Compaction)
│   │   ├── token_counter.py          # cl100k_base parser using SHA-256 caching
│   │   ├── budget_calculator.py      # Telemetry, Cost and Latency equations
│   │   ├── optimizers/               # FIFO, Sliding Window, Priority & RAG pruners
│   │   └── compaction/               # OpenAI response format structured compactors
│   └── web/                          # Next.js Frontend
│       ├── app/                      # Page coordinators & style globals.css
│       ├── components/               # High-density UI cards, sidebars and readers
│       ├── lib/                      # Zustand State store with offline fallbacks
│       └── types/                    # TypeScript interfaces
├── docs/                             # Full developer documentation library
│   ├── architecture.md
│   ├── token-budgeting.md
│   ├── trimming-strategies.md
│   └── system-design-notes.md
└── .env.example                      # Root configuration environment variables
```

---

## 🚀 Execution & Quick Start Guide

### 1. Configure Environment Variables
Create a `.env` file under `apps/api/.env` (or project root) utilizing the template:
```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_SUMMARY_MODEL=gpt-4o-mini
OPENAI_SUMMARY_TEMPERATURE=0
```
> **Note:** If no `OPENAI_API_KEY` is provided, the gateway automatically switches to a high-fidelity **simulated mock fallback mode**, allowing you to inspect the entire compaction interface immediately without billing!

### 2. Start the Backend API (FastAPI)
Navigate to `apps/api/`, set up your environment, and execute:
```bash
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Start the Frontend (Next.js)
Navigate to `apps/web/` and execute:
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser!

---

## 💼 System Design Interview Defense Pitch

When a system architect evaluates your context engineering capabilities, state:
> *"I treat the LLM context window as a highly constrained system memory buffer. In high-scale architectures, I never dispatch loose, unmonitored strings directly to a third-party API. Instead, I implement a dedicated ingestion token diagnostics proxy.
>
> Using C++ optimized BPE token counters with SHA-256 content caching, my gateway evaluates safe Available Input Budgets in under 15ms. If utilization crosses safety margins, the gateway applies automated context eviction policies—such as priority matrix prunings, sliding window cuts, or type-safe OpenAI Structured Output compactions—to keep payloads within budget boundaries. This mitigates out-of-memory crashes, bounds latency roundtrips, preserves semantic retrieval accuracy, and prevents cloud spending inflation."*
