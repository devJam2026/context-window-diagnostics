import React from 'react';
import { useGatewayStore } from '../lib/gatewayStore';
import { ArrowDown, HelpCircle } from 'lucide-react';

export default function PromptVisualizer() {
  const { payloadSections, telemetry } = useGatewayStore();

  if (!telemetry) {
    return (
      <div className="p-12 glass-card rounded-3xl flex flex-col items-center justify-center text-slate-400 font-bold text-xs gap-2">
        <HelpCircle className="w-8 h-8" />
        No telemetry loaded. Start using presets or entering prompts.
      </div>
    );
  }

  const limit = telemetry.contextLimit;

  // Filter sections by roles/types to match the prompt assembly sequence:
  // 1. System Prompt
  // 2. Developer Instruction / App Guardrail
  // 3. Conversation History
  // 4. Retrieved Documents
  // 5. User Query
  // 6. Output Format Instruction
  const sysSection = payloadSections.find(s => s.type === 'system' && s.retained);
  const devSec = payloadSections.find(s => s.type === 'developer_instruction' && s.retained);
  const historySecs = payloadSections.filter(s => s.type === 'history' && s.retained);
  const ragSecs = payloadSections.filter(s => s.type === 'retrieved_document' && s.retained);
  const querySec = payloadSections.find(s => s.type === 'active_user_input' && s.retained);
  const outputSec = payloadSections.find(s => s.type === 'output_format_instruction' && s.retained);

  const historyTokens = historySecs.reduce((acc, s) => acc + s.tokenCount, 0);
  const ragTokens = ragSecs.reduce((acc, s) => acc + s.tokenCount, 0);

  const assemblySequence = [
    {
      title: "System Prompt",
      desc: "Establishes standard behavior & persona constraints.",
      tokenCount: sysSection ? sysSection.tokenCount : 0,
      color: "border-indigo-500 bg-indigo-50/40 text-indigo-900",
      pillColor: "bg-indigo-600",
      content: sysSection?.content
    },
    {
      title: "Developer Instruction / App Guardrail",
      desc: "Enforces compliance guardrails and API safety standards.",
      tokenCount: devSec ? devSec.tokenCount : 0,
      color: "border-purple-500 bg-purple-50/40 text-purple-900",
      pillColor: "bg-purple-600",
      content: devSec?.content
    },
    {
      title: "Conversation History",
      desc: "Maintains ongoing dialogue state turns.",
      tokenCount: historyTokens,
      color: "border-gray-500 bg-gray-50/40 text-slate-800",
      pillColor: "bg-gray-600",
      content: historySecs.map(h => `[${h.title}]: ${h.content}`).join('\n') || undefined
    },
    {
      title: "Retrieved Documents / RAG Context",
      desc: "External reference database context chunks.",
      tokenCount: ragTokens,
      color: "border-emerald-500 bg-emerald-50/40 text-emerald-900",
      pillColor: "bg-emerald-600",
      content: ragSecs.map(r => `[${r.title}]: ${r.content}`).join('\n') || undefined
    },
    {
      title: "User Query (Active Input)",
      desc: "The active request seeking an answer.",
      tokenCount: querySec ? querySec.tokenCount : 0,
      color: "border-teal-500 bg-teal-50/40 text-teal-900",
      pillColor: "bg-teal-600",
      content: querySec?.content
    },
    {
      title: "Output Format Instruction",
      desc: "Guides the final completion structure and schema constraints.",
      tokenCount: outputSec ? outputSec.tokenCount : 0,
      color: "border-amber-500 bg-amber-50/40 text-amber-900",
      pillColor: "bg-amber-500",
      content: outputSec?.content
    }
  ];

  return (
    <div className="glass-card p-6 rounded-3xl w-full flex flex-col gap-6">
      <div>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Prompt Packing Visualizer</span>
        <h2 className="font-black text-lg text-slate-800 tracking-tight mt-0.5">
          Structured assembly pipeline stack
        </h2>
        <p className="text-xs text-slate-400 font-semibold mt-1">
          Visual representation of how various blocks are packed sequentially to form the final prompt payload dispatched to the LLM.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {assemblySequence.map((block, idx) => {
          const pct = limit > 0 ? ((block.tokenCount / limit) * 100).toFixed(2) : '0.00';
          return (
            <React.Fragment key={idx}>
              {idx > 0 && (
                <div className="flex justify-center my-0.5">
                  <ArrowDown className="w-4 h-4 text-indigo-400 animate-bounce" />
                </div>
              )}
              <div className={`p-4 rounded-2xl border-l-4 border ${block.color} flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:translate-x-1`}>
                <div className="grow">
                  <div className="flex items-center gap-2.5">
                    <span className={`text-[10px] font-black text-white px-2 py-0.5 rounded ${block.pillColor}`}>
                      Step {idx + 1}
                    </span>
                    <h3 className="font-extrabold text-sm">{block.title}</h3>
                  </div>
                  <p className="text-[11px] font-medium opacity-80 mt-1">{block.desc}</p>
                  
                  {block.content && (
                    <div className="mt-2.5 p-2 bg-white/60 rounded-xl text-[11px] font-mono whitespace-pre-wrap max-h-16 overflow-y-auto border border-black/5 leading-relaxed">
                      {block.content}
                    </div>
                  )}
                </div>
                
                <div className="text-right shrink-0 flex flex-col">
                  <span className="font-black text-sm">{block.tokenCount.toLocaleString()} tokens</span>
                  <span className="text-[10px] font-black opacity-60 uppercase">{pct}% of context limit</span>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
