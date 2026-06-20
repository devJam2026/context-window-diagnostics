/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import { BookOpen, CheckSquare, Square, Info, ShieldCheck, HeartPulse, Sparkles, MessageCircle } from 'lucide-react';

export default function InterviewGuide() {
  const [activeTab, setActiveTab] = useState<'interview' | 'checklist'>('interview');
  
  // Local checklist items state to make it interactive
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({
    reserve: true,
    history: true,
    rag: false,
    log: true,
    monitor: false,
    summarize: false,
    test: false,
    format: true
  });

  const toggleCheck = (id: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const interviewQAs = [
    {
      q: "What is a Context Window and why does it matter?",
      a: "A context window is the finite shared memory limit (measured in sub-word tokens) that an LLM can process in a single invocation. It covers the combined size of system prompts, developer instructions, conversation history, database facts, tool outputs, and the generated response. Managing this limit prevents abrupt model crashes (OOM errors) and ensures consistent completion quality."
    },
    {
      q: "Why is Token Budgeting critical in LLM Gateways?",
      a: "Input tokens and output completion tokens share the same memory buffer. Without proper budgeting (e.g. setting aside reserved output tokens and a safety margin), an incoming prompt can saturate the context window, leaving zero space for the model to generate its response, leading to incomplete answers or api failures."
    },
    {
      q: "How does chronological Trimming work?",
      a: "Trimming uses eviction heuristics (such as FIFO or Sliding Window) to drop older conversational turns once a payload approaches the available input budget. It is computationally simple but risks evicting crucial context or behavioral guardrails unless system prompts and core instructions are marked as required/immutable."
    },
    {
      q: "How does Summarization help and what are its trade-offs?",
      a: "Summarization compresses verbose chat histories into a structured state memory node, saving up to 90% in tokens. However, the trade-off is potential loss of granular detail (e.g. subtle preference phrasing) and minor API latency/cost to generate the summary."
    },
    {
      q: "How does RAG Context cause prompt overflows?",
      a: "Vector search databases retrieve multiple document chunks to solve user queries. If documents are dense or loaded without rank-based threshold filters, they can easily choke the prompt. Restricting RAG inputs using relevance thresholds is essential to preserve the conversational budget."
    },
    {
      q: "What is the trade-off between Context Size, Latency, and Cost?",
      a: "Larger context limits (like 128k or 1M) allow more data, but raise pricing linearly. Furthermore, processing larger prompts significantly increases Time-to-First-Token (TTFT) latency, while exposing the model to the 'Lost-in-the-Middle' effect, where factual recall drops in the center of long inputs."
    }
  ];

  const checklistCards = [
    {
      id: "reserve",
      title: "Reserve Output Tokens",
      desc: "Always reserve sufficient response budget (e.g. 1000 tokens) so that the LLM response is never truncated mid-sentence."
    },
    {
      id: "history",
      title: "Never Send Unlimited History",
      desc: "Implement a sliding turn limit or structured compaction threshold. Letting chat logs grow indefinitely is a production anti-pattern."
    },
    {
      id: "rag",
      title: "Rank Retrieved Chunks",
      desc: "Sort vector search outputs by similarity score and enforce a strict token cutoff. Drop lower relevance documents to fit margins."
    },
    {
      id: "log",
      title: "Log Prompt Size",
      desc: "Record local token estimations and provider-reported BPE counts for auditing, anomaly detection, and analytics dashboards."
    },
    {
      id: "monitor",
      title: "Monitor Overflow Rate",
      desc: "Alert engineering teams if user queries are hitting the safety margin frequently, which points to bloated instructions."
    },
    {
      id: "summarize",
      title: "Summarize Old Context Carefully",
      desc: "Use strict type-safe JSON schemas (Structured Outputs) for compaction to avoid losing key details like SKU numbers or transaction IDs."
    },
    {
      id: "test",
      title: "Test Long Conversations",
      desc: "Simulate multi-turn support scenarios to detect attentional degradation or formatting decays in the middle of prompts."
    },
    {
      id: "format",
      title: "Keep Prompt Format Deterministic",
      desc: "Assemble prompt blocks in a rigid sequence (System -> Guardrails -> History -> Docs -> User -> Format) for predictable LLM outputs."
    }
  ];

  return (
    <div className="glass-card p-6 rounded-3xl w-full flex flex-col gap-6">
      {/* Tab controls */}
      <div className="flex gap-2 p-1 rounded-2xl bg-slate-100 border border-slate-200 self-start">
        <button
          onClick={() => setActiveTab('interview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'interview' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" /> Interview Talking Points
        </button>
        <button
          onClick={() => setActiveTab('checklist')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'checklist' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckSquare className="w-4 h-4" /> Production Checklist
        </button>
      </div>

      {/* T1: Interview Section */}
      {activeTab === 'interview' && (
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="font-black text-lg text-slate-800 tracking-tight">
              How to Explain Context Engineering in Interviews
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              Use these core concepts and talking points to demonstrate expertise in LLM memory systems during technical rounds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {interviewQAs.map((item, idx) => (
              <div key={idx} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col gap-2">
                <h3 className="font-black text-xs text-slate-700 uppercase tracking-wide flex gap-2">
                  <span className="text-indigo-600 font-black">Q{idx + 1}:</span> {item.q}
                </h3>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* T2: Production Checklist */}
      {activeTab === 'checklist' && (
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="font-black text-lg text-slate-800 tracking-tight">
              Production Gateway Context Checklist
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              Follow these industry guidelines to implement defensive and cost-effective context boundaries in production LLM gateways.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {checklistCards.map((card) => {
              const isChecked = checkedItems[card.id];
              return (
                <div 
                  key={card.id}
                  onClick={() => toggleCheck(card.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col gap-3 justify-between ${
                    isChecked 
                      ? 'bg-indigo-50/30 border-indigo-250 shadow-sm' 
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex flex-col gap-1.5">
                    <span className="font-extrabold text-xs text-slate-800 flex items-center gap-2">
                      {isChecked ? (
                        <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                      ) : (
                        <HeartPulse className="w-4 h-4 text-slate-300 shrink-0" />
                      )}
                      {card.title}
                    </span>
                    <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                      {card.desc}
                    </p>
                  </div>
                  
                  <span className={`text-[9px] font-black uppercase mt-1 self-start px-2 py-0.5 rounded ${
                    isChecked ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {isChecked ? 'Configured' : 'Todo'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
