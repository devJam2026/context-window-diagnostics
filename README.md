# Context Window Diagnostics

A production-style GenAI engineering dashboard for profiling, visualizing, and optimizing LLM context payloads before API execution.

It demonstrates:
- **Token Budgeting:** Math-driven allocation profiles that separate system limits from generation reserves.
- **Context Window Utilization:** High-density telemetry gauges representing prompt volume density ratios.
- **Payload Overflow Detection:** Defensive gateway blocks preventing network dispatch of out-of-bounds prompts.
- **FIFO and Sliding-Window Truncation:** Chronological and N-turn queue prunings to maintain sliding attention limits.
- **Priority-Based Retention:** Multi-tier context priority loops protecting behavioral guardrails while evicting low-rank nodes.
- **RAG Document Trimming:** Score-based pruning algorithms targeting external similarity vector inputs.
- **OpenAI-Powered Summarized Compaction:** Type-safe Pydantic JSON schemas that compress stale history turns by up to 90% with recursive self-healing correction loops.
- **Defensive LLM Gateway Design:** Centralized edge proxy intercepts protecting latency bounds, operational costs, and semantic retrieval accuracy.

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

## 🛠️ Repository Architecture & Subfolders

```
context-window-diagnostics/
├── apps/
│   ├── api/                          # FastAPI Backend
│   │   ├── main.py                   # App entry router
│   │   ├── schemas.py                # Pydantic schemas (Request, Response, Compaction)
│   │   ├── token_counter.py          # cl100k_base parser using SHA-256 caching
│   │   ├── budget_calculator.py      # Telemetry, Cost and Latency equations
│   │   ├── scenarios.py              # 5 prebuilt Edge-Case Payload Traps
│   │   ├── optimizers/               # FIFO, Sliding Window, Priority & RAG pruners
│   │   └── compaction/               # OpenAI response format structured compactors
│   └── web/                          # Next.js Frontend
│       ├── app/                      # Page coordinators & style globals.css
│       ├── components/               # High-density UI cards, sidebars and readers
│       ├── lib/                      # Zustand State store with offline fallbacks
│       └── types/                    # TypeScript interfaces
├── docs/                             # Developer Documentation Library
│   ├── architecture.md               # System Blueprint & Runbook
│   ├── architecture-decision-records.md # Formal Architectural Decision Log (ADRs)
│   ├── learning-guide.md             # Context Window Engineering Master Playbook
│   ├── requirements.md               # Detailed Requirement & CEO Business Case
│   ├── system-design-notes.md        # Deep-Dive Theoretical & Cognitive Mechanics
│   ├── token-budgeting.md            # Mathematical budgeting equations
│   └── trimming-strategies.md        # Trimming algorithms specification
└── .env                              # Central environment configuration variables
```

---

## 🚀 Execution & Quick Start Guide

### 1. Configure Environment Variables
Create a `.env` file under the project root (or inside `apps/api/`) utilizing the template:
```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_SUMMARY_MODEL=gpt-4o-mini
OPENAI_SUMMARY_TEMPERATURE=0
```
> [!NOTE]
> If no `OPENAI_API_KEY` is provided, the gateway automatically switches to a high-fidelity **simulated mock fallback mode**, allowing you to inspect the entire compaction interface immediately without billing!

### 2. Start the Backend API (FastAPI)
Navigate to `apps/api/`, set up your virtual environment, and execute:
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

## 📐 Mathematical Telemetry

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
