import React, { useState } from 'react';
import { BookOpen, Sliders, Workflow, Terminal, Radio } from 'lucide-react';

export default function DocsHub() {
  const [activeDoc, setActiveDoc] = useState<'architecture' | 'budgeting' | 'strategies' | 'notes'>('architecture');

  const docTabs = [
    { id: 'architecture', label: '1. Gateway Architecture', icon: Radio, desc: 'Gateway proxy and risk states' },
    { id: 'budgeting', label: '2. Budget Mathematics', icon: Sliders, desc: 'Available budget formulas' },
    { id: 'strategies', label: '3. Eviction Strategies', icon: Workflow, desc: 'FIFO, sliding and priority algorithms' },
    { id: 'notes', label: '4. Compaction & Traps', icon: Terminal, desc: 'Self-healing OpenAI compaction' }
  ] as const;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 w-full shrink-0 h-full grow">
      
      {/* Sidebar selection */}
      <div className="lg:col-span-1 flex flex-col gap-3">
        <div className="glass-card p-4 rounded-3xl flex flex-col gap-4">
          <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-wider">
            <BookOpen className="w-4 h-4 text-indigo-600" /> Education Core
          </div>
          <div className="flex flex-col gap-1.5">
            {docTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeDoc === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveDoc(tab.id)}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all duration-150 text-left border cursor-pointer ${
                    isActive 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isActive ? 'text-white' : 'text-indigo-600'}`} />
                  <div>
                    <span className="font-bold text-xs leading-none block">{tab.label}</span>
                    <span className={`text-[9px] font-medium leading-none block mt-1 ${
                      isActive ? 'text-indigo-100' : 'text-slate-400'
                    }`}>
                      {tab.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main viewer card */}
      <div className="lg:col-span-3">
        <div className="glass-card p-8 rounded-3xl min-h-[500px] overflow-y-auto max-h-[70vh] prose prose-slate max-w-none">
          
          {/* DOC 1: ARCHITECTURE */}
          {activeDoc === 'architecture' && (
            <div className="flex flex-col gap-6 text-xs leading-relaxed text-slate-600">
              <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                <Radio className="w-7 h-7 text-indigo-600" /> Ingestion Proxy System Architecture
              </h1>
              <p className="font-semibold text-slate-500 text-sm">
                In enterprise AI pipelines, the LLM context window must be managed as a <strong>finite, high-cost runtime memory buffer</strong>.
                Treating it as an unmonitored text dumping ground triggers non-deterministic OOM crashes, latencies, and high cloud costs.
              </p>
              
              <hr className="border-slate-200" />
              
              <h2 className="text-base font-extrabold text-slate-800">1. Gateway request Life-Cycle</h2>
              <p className="font-medium">
                The Context Gateway acts as a pre-LLM middleware interceptor. It isolates prompt components, calculates 
                exact token allocations in <strong>under 15ms</strong> via tiktoken, and flags budget thresholds. If usage 
                breaches safety limits, it blocks execution and launches the compaction sandbox.
              </p>

              <h2 className="text-base font-extrabold text-slate-800">2. Multi-Part Ingestion Layout</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-400">
                      <th className="p-3">Component Type</th>
                      <th className="p-3">Eviction Eligibility</th>
                      <th className="p-3">Importance Priority</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold">
                    <tr>
                      <td className="p-3 text-indigo-600">system</td>
                      <td className="p-3 text-slate-400">IMMUTABLE (Never evicted)</td>
                      <td className="p-3">Priority 1 (Highest)</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-teal-600">active_user_input</td>
                      <td className="p-3 text-slate-400">IMMUTABLE (Never evicted)</td>
                      <td className="p-3">Priority 2</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-amber-500">summary</td>
                      <td className="p-3">Retained memory block</td>
                      <td className="p-3">Priority 3</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-emerald-600">retrieved_document</td>
                      <td className="p-3 text-slate-500">Evicted by relevance rank</td>
                      <td className="p-3">Priority 5 & 8</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-slate-600">history (Older)</td>
                      <td className="p-3 text-slate-500">Evicted chronologically</td>
                      <td className="p-3">Priority 7 (Lowest)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h2 className="text-base font-extrabold text-slate-800">3. Operational Risk Thresholds</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-900 font-bold">
                  <div className="text-xs uppercase font-black">Safe</div>
                  <span className="text-[10px] text-emerald-600 mt-1 block">U &lt; 70% | Normal request routing</span>
                </div>
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 text-amber-900 font-bold">
                  <div className="text-xs uppercase font-black">Warning</div>
                  <span className="text-[10px] text-amber-600 mt-1 block">70% &le; U &lt; 90% | Buffer saturation approaching</span>
                </div>
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-900 font-bold">
                  <div className="text-xs uppercase font-black">Critical</div>
                  <span className="text-[10px] text-rose-600 mt-1 block">90% &le; U &le; 100% | High "lost-in-the-middle" risk</span>
                </div>
                <div className="p-4 rounded-xl bg-red-100 border border-red-200 text-red-950 font-bold">
                  <div className="text-xs uppercase font-black">Overflow</div>
                  <span className="text-[10px] text-red-600 mt-1 block">U &gt; 100% | Request blocked by middleware</span>
                </div>
              </div>
            </div>
          )}

          {/* DOC 2: TELEMETRY MATH */}
          {activeDoc === 'budgeting' && (
            <div className="flex flex-col gap-6 text-xs leading-relaxed text-slate-600">
              <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                <Sliders className="w-7 h-7 text-indigo-600" /> Token Budgeting & Telemetry Mathematics
              </h1>
              <p className="font-semibold text-slate-500 text-sm">
                Enterprise AI profiles token limits as concrete budget thresholds. This guide outlines the exact formulas 
                that drive the diagnostics middleware.
              </p>
              
              <hr className="border-slate-200" />

              <h2 className="text-base font-extrabold text-slate-800">1. Available Input Budget Formula (A_input)</h2>
              <p className="font-medium">
                The strict <strong>Available Input Budget</strong> represents the precise maximum token allocation permitted 
                for incoming prompt payload data:
              </p>
              <pre className="p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] text-indigo-950 font-extrabold">
                Available Input Budget (A_input) = Context Limit - Reserved Output - safety_margin_tokens
                
                safety_margin_tokens = ceil(Context Limit * safety_margin_percent / 100)
              </pre>

              <h2 className="text-base font-extrabold text-slate-800">2. Context Budget Utilization Ratio (U)</h2>
              <p className="font-medium">
                The utilization ratio represents prompt density against safe safe safety limits:
              </p>
              <pre className="p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] text-indigo-950 font-extrabold">
                U = T_used / A_input
                
                T_used = system_tokens + history_tokens + document_tokens + tool_tokens + input_tokens + summary_tokens
              </pre>

              <h2 className="text-base font-extrabold text-slate-800">3. Financial Pricing & Latency Estimators</h2>
              <p className="font-medium">
                The gateway forecasts transaction costs and compilation pauses to keep cloud spending bounded:
              </p>
              <pre className="p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] text-emerald-800 font-extrabold">
                Estimated Cost (USD) = (T_used * $0.15 / 1,000,000) + (T_reserved * $0.60 / 1,000,000)
                
                *Based on standard industrial gpt-4o-mini rates.
              </pre>
            </div>
          )}

          {/* DOC 3: EVICTION STRATEGIES */}
          {activeDoc === 'strategies' && (
            <div className="flex flex-col gap-6 text-xs leading-relaxed text-slate-600">
              <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                <Workflow className="w-7 h-7 text-indigo-600" /> Context Truncation & Eviction Policies
              </h1>
              <p className="font-semibold text-slate-500 text-sm">
                When payloads breach limits, the gateway applies four automated context reduction routines to prune 
                non-required segments while maintaining behavioral directives.
              </p>
              
              <hr className="border-slate-200" />

              <h2 className="text-base font-extrabold text-slate-800">Strategy 1: Fixed FIFO Truncation Policy</h2>
              <p className="font-medium">
                FIFO evicts oldest conversational history chronologically until context is safe. 
                System Prompt and Active User Input are marked required=true, ensuring they are absolutely protected.
              </p>

              <h2 className="text-base font-extrabold text-slate-800">Strategy 2: Sliding Window Attention Trim</h2>
              <p className="font-medium">
                Enforces a rigid turn-bound window constraint, retaining only the most recent N conversational user/assistant 
                pairs, sliding stale blocks out of focus to avoid sudden saturation.
              </p>

              <h2 className="text-base font-extrabold text-slate-800">Strategy 3: Priority-Based Retention Matrix</h2>
              <p className="font-medium">
                Sorts and prunes optional elements starting with Priority 8 (Low-Rank RAG Documents) and moving up 
                to Priority 3 (Compacted summaries), protecting core behavioral rules at all times.
              </p>

              <h2 className="text-base font-extrabold text-slate-800">Strategy 4: RAG Document relevance rank trim</h2>
              <p className="font-medium">
                Target vector retrieved documents. Selectively drops lowest-ranked documentation chunks while keeping 
                highest relevance search assets, retaining information coverage under heavy context loads.
              </p>
            </div>
          )}

          {/* DOC 4: COMPACTION & TRAPS */}
          {activeDoc === 'notes' && (
            <div className="flex flex-col gap-6 text-xs leading-relaxed text-slate-600">
              <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                <Terminal className="w-7 h-7 text-indigo-600" /> Advanced Compaction & Lost-in-the-Middle
              </h1>
              <p className="font-semibold text-slate-500 text-sm">
                The gateway integrates OpenAI Structured Outputs compaction loops, self-healing retries, and positional U-curve diagnostics.
              </p>
              
              <hr className="border-slate-200" />

              <h2 className="text-base font-extrabold text-slate-800">1. Summarized Compaction Engine</h2>
              <p className="font-medium">
                Instead of loose text summaries, the compactor enforces structured formats via OpenAI response schemas.
                This isolates retained facts, open actions, and dropped noise into Pydantic target structures.
              </p>

              <h2 className="text-base font-extrabold text-slate-800">2. Self-Healing Validation & Fallbacks</h2>
              <p className="font-medium">
                If JSON schema validations fail:
                1. Capture the exact Pydantic parsing exception logs.
                2. Dispatch exactly one recursive retry containing raw data and the validation error.
                3. If retry fails, trigger the degraded fallback, preserving raw chat turns to guarantee zero data loss.
              </p>

              <h2 className="text-base font-extrabold text-slate-800">3. Lost-in-the-Middle Attentional Valley</h2>
              <p className="font-medium">
                Research proves that LLMs retrieve details positioned at absolute prompt boundaries ( primacy & recency effects) 
                substantially better than elements located in the center. 
                The Lost-in-the-Middle demo preset highlights this vulnerability, educating developers on why compacting 
                verbose inputs preserves downstream model retrieval accuracy.
              </p>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
