import React, { useState } from 'react';
import { useGatewayStore } from '../lib/gatewayStore';
import { ContextSection } from '../types';

export default function ContextMemoryStack() {
  const { payloadSections, telemetry } = useGatewayStore();
  const [hoveredSection, setHoveredSection] = useState<ContextSection | null>(null);
  const [hoveredFreeSpace, setHoveredFreeSpace] = useState<boolean>(false);
  const [hoveredOverflow, setHoveredOverflow] = useState<boolean>(false);

  if (!telemetry) return null;

  const {
    availableInputTokens,
    usedInputTokens,
    remainingTokens,
    overflowTokens
  } = telemetry;

  // Filter retained sections
  const activeSections = payloadSections.filter(s => s.retained);

  // Group sections by color categories
  const getSectionColor = (type: string) => {
    switch (type) {
      case 'system': return 'bg-indigo-600';
      case 'developer_instruction': return 'bg-purple-600';
      case 'history': return 'bg-gray-600';
      case 'retrieved_document': return 'bg-emerald-500';
      case 'tool_output': return 'bg-cyan-500';
      case 'active_user_input': return 'bg-teal-600';
      case 'summary': return 'bg-amber-500';
      case 'output_format_instruction': return 'bg-amber-600';
      default: return 'bg-slate-400';
    }
  };

  const getSectionTextColor = (type: string) => {
    switch (type) {
      case 'system': return 'text-indigo-600 bg-indigo-50 border-indigo-100';
      case 'developer_instruction': return 'text-purple-600 bg-purple-50 border-purple-100';
      case 'history': return 'text-slate-600 bg-slate-50 border-slate-100';
      case 'retrieved_document': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'tool_output': return 'text-cyan-600 bg-cyan-50 border-cyan-100';
      case 'active_user_input': return 'text-teal-600 bg-teal-50 border-teal-100';
      case 'summary': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'output_format_instruction': return 'text-amber-750 bg-amber-50 border-amber-100';
      default: return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  // Determine scaling basis
  const totalScaleBasis = overflowTokens > 0 ? usedInputTokens : availableInputTokens;

  return (
    <div className="glass-card p-6 rounded-3xl w-full flex flex-col gap-5 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Visual Memory Stack Bar</span>
          <h2 className="font-black text-base text-slate-800 tracking-tight mt-0.5">
            Prompt buffer composition layout map
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase text-slate-500">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span> System</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span> Guardrails</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-600"></span> History</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Chunks</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span> User Query</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span> Format</span>
        </div>
      </div>

      {/* Segmented Stack Bar */}
      <div className="w-full h-11 bg-slate-200/80 rounded-2xl flex overflow-hidden border border-slate-300/40 relative shadow-inner p-1">
        {activeSections.map((sec) => {
          const widthPercent = totalScaleBasis > 0 ? (sec.tokenCount / totalScaleBasis) * 100 : 0;
          if (widthPercent === 0) return null;
          return (
            <div
              key={sec.id}
              onMouseEnter={() => setHoveredSection(sec)}
              onMouseLeave={() => setHoveredSection(null)}
              className={`h-full ${getSectionColor(sec.type)} bar-transition relative cursor-pointer hover:brightness-110 hover:scale-[1.01] hover:z-10`}
              style={{ width: `${widthPercent}%` }}
            />
          );
        })}

        {/* Free Space segment */}
        {overflowTokens === 0 && remainingTokens > 0 && (
          <div
            onMouseEnter={() => setHoveredFreeSpace(true)}
            onMouseLeave={() => setHoveredFreeSpace(false)}
            className="h-full bg-slate-300/60 bar-transition relative cursor-pointer hover:bg-slate-300/80 grow"
            style={{ width: `${(remainingTokens / totalScaleBasis) * 100}%` }}
          />
        )}

        {/* Overflow segment (Glowing Crimson stripe at tail) */}
        {overflowTokens > 0 && (
          <div
            onMouseEnter={() => setHoveredOverflow(true)}
            onMouseLeave={() => setHoveredOverflow(false)}
            className="h-full bg-red-500/90 bar-transition relative cursor-pointer hover:bg-red-500 animate-pulse"
            style={{ width: `${(overflowTokens / totalScaleBasis) * 100}%` }}
          />
        )}
      </div>

      {/* 🔮 Dynamic popover tooltip details */}
      <div className="h-10 flex items-center justify-center">
        {hoveredSection ? (
          <div className={`px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-3 transition-all duration-150 shadow-sm ${getSectionTextColor(hoveredSection.type)}`}>
            <span>Component: <span className="uppercase font-black">{hoveredSection.title}</span></span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            <span>Type: <span className="uppercase">{hoveredSection.type.replace('_', ' ')}</span></span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            <span className="font-extrabold">{hoveredSection.tokenCount.toLocaleString()} tokens</span>
          </div>
        ) : hoveredFreeSpace ? (
          <div className="px-4 py-2 rounded-xl border text-xs font-bold text-indigo-600 bg-indigo-50/50 border-indigo-100 flex items-center gap-2 shadow-sm">
            <span>Free buffer headspace:</span>
            <span className="font-black">{remainingTokens.toLocaleString()} input tokens remaining before saturation.</span>
          </div>
        ) : hoveredOverflow ? (
          <div className="px-4 py-2 rounded-xl border text-xs font-bold text-red-600 bg-red-50 border-red-100 flex items-center gap-2 shadow-sm animate-bounce">
            <span>Hard Overflow Violation:</span>
            <span className="font-black">{overflowTokens.toLocaleString()} tokens exceeding available input budget!</span>
          </div>
        ) : (
          <span className="text-xs text-slate-400 font-semibold italic">
            Hover over stacked bar sections to inspect detailed prompt buffer token measurements.
          </span>
        )}
      </div>
    </div>
  );
}
