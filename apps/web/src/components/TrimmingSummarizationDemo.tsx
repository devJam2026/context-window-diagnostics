import React, { useState } from 'react';
import { useGatewayStore } from '../lib/gatewayStore';
import { trimChatHistory, summarizeHistoryMock } from '../lib/contextCalculations';
import { Trash2, CheckCircle, AlertTriangle } from 'lucide-react';

export default function TrimmingSummarizationDemo() {
  const { payloadSections } = useGatewayStore();
  const [retainedTurns, setRetainedTurns] = useState<number>(3);
  
  // Get history turns
  const history = payloadSections.filter(s => s.type === 'history' && !s.required);
  const totalOriginalHistoryTokens = history.reduce((acc, s) => acc + s.tokenCount, 0);

  // 1. Trimming calculations
  const trimResult = trimChatHistory(history, retainedTurns);

  // 2. Summarization calculations
  const summarizationResult = summarizeHistoryMock(history);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
      {/* SECTION 1: Chat History Trimming Demo */}
      <div className="glass-card p-6 rounded-3xl flex flex-col gap-6">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Trimming Strategy Demo</span>
          <h2 className="font-black text-lg text-slate-800 tracking-tight mt-0.5">
            Sliding window turn pruner
          </h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Simulates dynamic chronological message eviction. Removes older context blocks first.
          </p>
        </div>

        {/* Sliders */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-600">Simulated Turns to Retain (N):</span>
            <span className="font-black text-indigo-600 px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded">
              {retainedTurns} turns
            </span>
          </div>
          <input
            type="range"
            min="0"
            max={Math.max(5, history.length)}
            value={retainedTurns}
            onChange={(e) => setRetainedTurns(parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
        </div>

        {/* Savings indicators */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">Original History Size</span>
            <span className="font-black text-slate-700 text-sm">{totalOriginalHistoryTokens} tokens</span>
          </div>
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-xs flex flex-col justify-center">
            <span className="text-[10px] font-bold text-emerald-600 block uppercase">Estimated Token Savings</span>
            <span className="font-black text-emerald-700 text-sm">-{trimResult.savings} tokens</span>
          </div>
        </div>

        {/* Split lists */}
        <div className="grid grid-cols-2 gap-4 mt-2">
          {/* Retained */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-black text-slate-700 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Retained Turns ({trimResult.retained.length})
            </span>
            <div className="flex flex-col gap-1.5 max-h-[180px] overflow-y-auto pr-1">
              {trimResult.retained.length === 0 ? (
                <span className="text-[11px] text-slate-400 italic">No turns retained.</span>
              ) : (
                trimResult.retained.map(t => (
                  <div key={t.id} className="p-2.5 rounded-lg bg-emerald-50/20 border border-emerald-100/50 text-[10px] leading-normal font-semibold">
                    <span className="font-extrabold text-slate-800">{t.title}</span>
                    <p className="text-slate-500 mt-1 truncate">{t.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Removed */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-black text-slate-700 flex items-center gap-1">
              <Trash2 className="w-3.5 h-3.5 text-rose-500" /> Removed Turns ({trimResult.removed.length})
            </span>
            <div className="flex flex-col gap-1.5 max-h-[180px] overflow-y-auto pr-1">
              {trimResult.removed.length === 0 ? (
                <span className="text-[11px] text-slate-400 italic">No turns removed.</span>
              ) : (
                trimResult.removed.map(t => (
                  <div key={t.id} className="p-2.5 rounded-lg bg-rose-50/20 border border-rose-100/50 text-[10px] leading-normal font-semibold">
                    <span className="font-extrabold text-slate-800">{t.title}</span>
                    <p className="text-slate-500 mt-1 truncate">{t.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Summarization Strategy Demo */}
      <div className="glass-card p-6 rounded-3xl flex flex-col gap-6">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Summarization Strategy Demo</span>
          <h2 className="font-black text-lg text-slate-800 tracking-tight mt-0.5">
            Structured state compactor simulation
          </h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Replaces verbose chat dialogues with compressed, type-safe facts and tasks.
          </p>
        </div>

        {/* Comparison card */}
        <div className="flex flex-col gap-3.5">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-black text-slate-400 block uppercase">Simulated Summary Node Output</span>
            <p className="text-xs font-mono text-slate-700 leading-relaxed mt-2 p-2.5 bg-white rounded-lg border border-slate-100">
              {summarizationResult.summary}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-100 text-xs">
              <span className="text-[10px] font-bold text-indigo-600 block uppercase">Compacted Node Size</span>
              <span className="font-black text-indigo-900 text-sm">{summarizationResult.compactedTokens} tokens</span>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-xs">
              <span className="text-[10px] font-bold text-emerald-600 block uppercase">Estimated Token Savings</span>
              <span className="font-black text-emerald-700 text-sm">-{summarizationResult.savings} tokens</span>
            </div>
          </div>

          {/* Risk Alert */}
          <div className="p-4 bg-amber-50 border border-amber-100 text-amber-900 rounded-2xl flex gap-3 items-start text-[11px] leading-relaxed font-bold">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span>Risk Warning: Summarization degrades granular conversational detail.</span>
              <p className="text-[10px] text-amber-700 font-semibold mt-1 leading-normal">
                While saving tokens, the compactor strips dialogue context. This may remove subtle customer preferences, phrasing, or temporal hints not explicitly recorded as facts.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
