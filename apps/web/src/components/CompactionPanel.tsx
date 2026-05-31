import React, { useState } from 'react';
import { useGatewayStore } from '../lib/gatewayStore';
import { 
  Zap, 
  Terminal, 
  CheckCircle, 
  AlertTriangle,
  Lightbulb,
  FileCheck,
  TrendingDown,
  Sparkles,
  HelpCircle
} from 'lucide-react';

export default function CompactionPanel() {
  const {
    payloadSections,
    compactionResult,
    isCompacting,
    executeCompactPayload
  } = useGatewayStore();

  const [compressionGoal, setCompressionGoal] = useState("Reduce old history while preserving durable facts and unresolved tasks.");

  // Count raw chat turns targeted for compaction
  const history = payloadSections.filter(s => s.type === "history" && !s.required);
  const totalOriginalTokens = history.reduce((sum, s) => sum + s.tokenCount, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full shrink-0">
      
      {/* Column 1: Ingestion & Trigger */}
      <div className="lg:col-span-1 flex flex-col gap-6">
        <div className="glass-card p-6 rounded-3xl flex flex-col gap-6">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Compaction Control</span>
            <h3 className="font-black text-base text-slate-800 tracking-tight mt-0.5">
              OpenAI Compaction Terminal
            </h3>
          </div>

          {/* Ingestion stats */}
          <div className="flex flex-col gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-500">History Candidates:</span>
              <span className="font-black text-slate-800">{history.length} chat turns</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-500">Total Candidate Size:</span>
              <span className="font-black text-indigo-600">{totalOriginalTokens.toLocaleString()} tokens</span>
            </div>
          </div>

          {/* Compression goal directive */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Compression Goal Directive</label>
            <textarea
              value={compressionGoal}
              onChange={(e) => setCompressionGoal(e.target.value)}
              placeholder="Enter instructions for the compaction models..."
              className="w-full h-[120px] p-3 text-xs rounded-xl custom-input resize-none"
            />
          </div>

          {/* Real API disclaimer */}
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start gap-3 text-[11px] text-indigo-950 leading-relaxed font-semibold">
            <Lightbulb className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <span>
              <strong>OpenAI Integration Notice:</strong> When triggered, raw conversational strings are compiled and 
              dispatched to the secure FastAPI proxy model, extracting type-safe state schema blocks.
            </span>
          </div>

          {/* Trigger button */}
          <button
            onClick={() => executeCompactPayload(compressionGoal)}
            disabled={isCompacting || history.length === 0}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-100 transition-colors"
          >
            <Zap className="w-4 h-4" />
            {isCompacting ? 'Running Structured Compaction...' : 'Execute Summarized Compaction'}
          </button>
        </div>
      </div>

      {/* Column 2 & 3: Structured output display panels */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        {!compactionResult ? (
          <div className="glass-card p-12 rounded-3xl h-full flex flex-col items-center justify-center text-center gap-3">
            <Terminal className="w-12 h-12 text-slate-300" />
            <h4 className="font-black text-sm text-slate-600 leading-none">Compacted State Ready</h4>
            <p className="text-xs text-slate-400 font-semibold max-w-sm">
              Press "Execute" to run the structured compaction pipeline. The engine will compress historical chatter and return a structured type-safe memory node.
            </p>
          </div>
        ) : (
          <div className="glass-card p-6 rounded-3xl flex flex-col gap-6">
            
            {/* Compaction state details header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100/60">
              <div>
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">Compaction Complete</span>
                <h3 className="font-extrabold text-sm text-slate-800 mt-0.5 flex items-center gap-2">
                  Validation Status: 
                  <span className={`uppercase font-black text-xs px-2 py-0.5 rounded ${
                    compactionResult.validationStatus === 'valid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                    compactionResult.validationStatus === 'retry_success' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100 animate-pulse' :
                    'bg-red-50 text-red-600 border border-red-150'
                  }`}>
                    {compactionResult.validationStatus === 'valid' ? 'Strict Schema Valid' :
                     compactionResult.validationStatus === 'retry_success' ? 'Self-Healed Retry Successful' :
                     'Compaction Failed (Fallback Raw)'}
                  </span>
                </h3>
              </div>
              <div className="flex gap-4">
                <div className="text-right">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Original Size</span>
                  <span className="font-extrabold text-slate-600 text-xs">
                    {compactionResult.originalTokens.toLocaleString()} tokens
                  </span>
                </div>
                <div className="w-px bg-slate-200" />
                <div className="text-right">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Compacted Node</span>
                  <span className="font-extrabold text-indigo-600 text-xs font-mono">
                    {compactionResult.compactedTokens.toLocaleString()} tokens
                  </span>
                </div>
                <div className="w-px bg-slate-200" />
                <div className="text-right">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Savings footprint</span>
                  <span className="font-black text-emerald-600 text-xs">
                    - {compactionResult.savingsTokens.toLocaleString()} tokens ({Math.round((compactionResult.savingsTokens/compactionResult.originalTokens)*100)}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Main state card summary */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-2">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Extracted State summary</span>
              <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                {compactionResult.summary}
              </p>
            </div>

            {/* Split cards for facts, tasks, and dropped values */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Retained Facts */}
              <div className="flex flex-col gap-3">
                <div className="text-xs font-black text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Retained Facts
                </div>
                <div className="flex flex-col gap-1.5">
                  {compactionResult.retainedFacts.length === 0 ? (
                    <span className="text-[10px] text-slate-400 font-semibold italic">No facts extracted.</span>
                  ) : (
                    compactionResult.retainedFacts.map((fact, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-emerald-50/40 border border-emerald-100/50 text-[11px] font-bold text-emerald-900 leading-normal">
                        {fact}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Open Tasks */}
              <div className="flex flex-col gap-3">
                <div className="text-xs font-black text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                  <FileCheck className="w-3.5 h-3.5 text-indigo-600" /> Open Actions
                </div>
                <div className="flex flex-col gap-1.5">
                  {compactionResult.openTasks.length === 0 ? (
                    <span className="text-[10px] text-slate-400 font-semibold italic">No unresolved tasks found.</span>
                  ) : (
                    compactionResult.openTasks.map((task, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-indigo-50/40 border border-indigo-100/50 text-[11px] font-bold text-indigo-900 leading-normal">
                        {task}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Dropped Details */}
              <div className="flex flex-col gap-3">
                <div className="text-xs font-black text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                  <AlertTriangle className="w-3.5 h-3.5 text-slate-400" /> Pruned Details
                </div>
                <div className="flex flex-col gap-1.5">
                  {compactionResult.droppedDetails.length === 0 ? (
                    <span className="text-[10px] text-slate-400 font-semibold italic">No items dropped.</span>
                  ) : (
                    compactionResult.droppedDetails.map((detail, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-slate-100 border border-slate-200/50 text-[11px] font-bold text-slate-500 leading-normal">
                        {detail}
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Bottom confidence panel */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-100 text-xs">
              <span className="text-slate-400 font-bold">Model Confidence evaluation score:</span>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                  <div 
                    className="h-full bg-emerald-500 rounded-full" 
                    style={{ width: `${compactionResult.confidence * 100}%` }}
                  />
                </div>
                <span className="font-extrabold text-slate-800">{(compactionResult.confidence * 100).toFixed(0)}%</span>
              </div>
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
