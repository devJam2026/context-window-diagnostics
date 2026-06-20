# Context Window Dashboard & Diagnostics Gateway

A production-grade educational and operational dashboard for profiling, packing, and optimizing LLM prompt payloads before cloud API execution. 

This project maps directly to **DevJam AI Engineer Foundation Module P2**:
* **Module 1:** LLM Foundation
* **Project 2:** Context Window Dashboard
* **Concept:** Context Engineering

---

## 🏗️ Design Philosophy: Offline-First Resiliency

The Context Window Dashboard is built with an **offline-first** architecture. All token counts, mathematical allocations, cost forecasting, history prunings, and compaction steps execute instantly inside the browser utilizing client-side state models (Zustand) and pure deterministic helper functions. 

If the optional **FastAPI Backend Edge Proxy** is running, it enhances or validates results using high-performance sub-word tokenization and real OpenAI compaction models. If the backend is unavailable, the application degrades gracefully to local heuristic modes without crashing, enabling zero-setup local deployment.

---

## 🚀 Key Features

1. **Context Input Playground:**
   - Write or paste system prompt, developer instructions/guardrails, conversation history, retrieved documents (RAG), user prompt query, and output format instructions.

2. **Token Budget Dashboard:**
   - Visualize available input token budget vs. reserved output budget and safety margin padding.
   - Support model presets: GPT-4o mini style (128k context), GPT-4.1 style (1M context), Claude style placeholder (200k context), and Custom Context size inputs.

3. **Prompt Packing Visualizer:**
   - Explains the exact assembly order of final prompts: System Prompt $\rightarrow$ Developer Instruction $\rightarrow$ Conversation History $\rightarrow$ Retrieved Documents $\rightarrow$ User Query $\rightarrow$ Output Format Instruction.
   - Shows token count and percentage of total context size consumed by each block.

4. **Context Overflow Handling:**
   - Highlights largest prompt block with a warning.
   - Recommends actionable suggestions to trim old messages, summarize history, reduce retrieved chunks, reserve fewer output tokens, or use larger context models.

5. **Chat History Trimming Demo:**
   - Simulate sliding-window turn count prunings and compare original vs. trimmed turns with exact token savings.

6. **Summarization Strategy Demo:**
   - Simulated structured summarization panel extracting summaries, facts, open actions, and token savings.

7. **RAG Context Budget Demo:**
   - Interactive inclusion/exclusion toggles for retrieved document cards showing similarity scores and sizes.

8. **Approximate Cost Estimator:**
   - Real-time costing based on configurable demonstration input-output token rates.

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
│  • Guides │  • Scenario Library Injectors     • Before vs After Logs     │
└───────────┴──────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack & Structure

* **Frontend:** Next.js 16 (React 19, TypeScript strict), Zustand State Store, Lucide Icons, TailwindCSS v4.
* **Backend (Optional):** FastAPI, Tiktoken, Python 3.

---

## 🏁 Execution & Quick Start Guide

### 1. Start the Frontend (Next.js)
Navigate to `apps/web/` and execute:
```bash
npm install
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser!

### 2. Start the Backend API (Optional FastAPI)
Navigate to `apps/api/`, configure your `.env` variables, and execute:
```bash
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

---

## 📐 Mathematical Telemetry Formulas

### 1. Available Input Budget Formula ($A_{\text{input}}$)
The safe maximum token size permitted for prompt ingestion:

$$A_{\text{input}} = C_{\text{max}} - T_{\text{reserved}} - \lceil C_{\text{max}} \times M_{\text{safety}} \rceil$$

* $C_{\text{max}}$: Absolute capacity of selected model preset (128k, 1M, Custom).
* $T_{\text{reserved}}$: Space reserved exclusively for model output completion.
* $M_{\text{safety}}$: Safety margin padding percent (defaults to $10\%$).

---

## 💬 How to Explain Context Engineering in Interviews

1. **Context Window Limitations:** Emphasize that context windows are shared input/output buffers. Saturation chokes generation space, leading to truncation.
2. **Lost-in-the-Middle Phenomenon:** Detail how transformer models suffer from accuracy valleys in the geometric center of prompts. Compaction pulls critical parameters closer to the active recency window.
3. **Structured outputs vs. Free-form summaries:** Structured output schemas guarantee that variables (like SKUs, user codes, and tasks) are preserved exactly without hallucinations.
4. **Latency vs. Cost Trade-offs:** Sending massive prompts raises TTFT latency and cloud costs. Edge gateways optimize latency bounds by evicting low-rank nodes.

---

## 🔮 Future Improvements
* WebAssembly (WASM) Tiktoken compilation to enable BPE-exact local tokenization offline.
* Multi-model pricing configurations matching exact cloud provider pricing sheets.
