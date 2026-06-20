/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { useGatewayStore } from '../lib/gatewayStore';
import { 
  ArrowRight, 
  HelpCircle, 
  Trash2, 
  Sparkles,
  Zap,
  Workflow,
  ListFilter,
  CheckCircle,
  FileCheck
} from 'lucide-react';

export default function OptimizationSandbox() {
  const {
    activeStrategy,
    slidingWindowTurns,
    setSlidingWindowTurns,
    optimizationResult,
    isOptimizing,
    executeOptimizePayload
  } = useGatewayStore();

  const strategies = [
    { id: 'fifo', name: 'FIFO Truncation', icon: Zap, desc: 'Prune oldest chat turns chronologically.' },
    { id: 'sliding_window', name: 'Sliding Window', icon: Workflow, desc: 'Retain exactly the latest N message turns.' },
    { id: 'priority', name: 'Priority Matrix', icon: ListFilter, desc: 'Evict optional nodes based on strategic significance hierarchy.' },
    { id: 'rag_trim', name: 'RAG Doc Trim', icon: FileCheck, desc: 'Drop low-rank vector chunks to fit context margins.' }
  ] as const;

  const getPriorityLabel = (p: number) => {
    if (p === 1) return 'System (1)';
    if (p === 2) return 'Active (2)';
    if (p === 3) return 'Summary (3)';
    if (p === 4) return 'Recent History (4)';
    if (p === 5) return 'High RAG (5)';
    if (p === 6) return 'Tool JSON (6)';
    if (p === 7) return 'Old History (7)';
    return 'Low RAG (8)';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full shrink-0">
      
      {/* Column 1: Strategy Selector & Config sliders */}
      <div className="lg:col-span-1 flex flex-col gap-6">
        <div className="glass-card p-6 rounded-3xl flex flex-col gap-6">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Eviction Policies</span>
            <h3 className="font-black text-base text-slate-800 tracking-tight mt-0.5">
              Algorithm configuration sandbox
            </h3>
          </div>

          {/* Strategy buttons */}
          <div className="flex flex-col gap-2">
            {strategies.map(strat => {
              const Icon = strat.icon;
              const isSelected = activeStrategy === strat.id || (!activeStrategy && strat.id === 'fifo');
              
              return (
                <button
                  key={strat.id}
                  onClick={() => useGatewayStore.setState({ activeStrategy: strat.id })}
                  className={`w-full flex items-start gap-4 p-3 rounded-2xl transition-all duration-150 text-left border cursor-pointer ${
                    isSelected 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-150' 
                      : 'bg-white hover:bg-slate-55 border-slate-200 text-slate-700 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${isSelected ? 'text-white' : 'text-indigo-600'}`} />
                  <div>
                    <span className="font-bold text-xs leading-none block">{strat.name}</span>
                    <span className={`text-[10px] font-medium leading-none block mt-1 ${
                      isSelected ? 'text-indigo-100' : 'text-slate-400'
                    }`}>
                      {strat.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Sliding Window parameter input */}
          {activeStrategy === 'sliding_window' && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-600">Sliding Window turns (N):</span>
                <span className="font-black text-indigo-600 px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded">
                  {slidingWindowTurns} turns
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="15"
                value={slidingWindowTurns}
                onChange={(e) => setSlidingWindowTurns(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          )}

          {/* Trigger button */}
          <button
            onClick={() => executeOptimizePayload(activeStrategy || 'fifo')}
            disabled={isOptimizing}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-100 transition-colors"
          >
            {isOptimizing ? 'Executing Algorithmic Pruning...' : 'Run Optimization Algorithm'}
          </button>
        </div>
      </div>

      {/* Column 2 & 3: Results Sandbox Comparisons */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        {!optimizationResult ? (
          <div className="glass-card p-12 rounded-3xl h-full flex flex-col items-center justify-center text-center gap-3">
            <HelpCircle className="w-12 h-12 text-slate-300" />
            <h4 className="font-black text-sm text-slate-600 leading-none">Simulation Results Ready</h4>
            <p className="text-xs text-slate-400 font-semibold max-w-sm">
              Configure parameters on the left and run the optimizer to visualize detailed token prunings, removed nodes, and budget headroom savings.
            </p>
          </div>
        ) : (
          <div className="glass-card p-6 rounded-3xl flex flex-col gap-6">
            {/* Headers and status card */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100/60">
              <div>
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">Pruning Complete</span>
                <h3 className="font-extrabold text-sm text-slate-800 mt-0.5 flex items-center gap-2">
                  Strategy Applied: <span className="uppercase font-black text-indigo-600">{optimizationResult.strategyApplied}</span>
                </h3>
              </div>
              <div className="flex gap-4">
                <div className="text-right">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Pruning Headroom</span>
                  <span className="font-black text-emerald-600 text-sm">
                    + {optimizationResult.savingsTokens.toLocaleString()} tokens saved
                  </span>
                </div>
                <div className="w-px bg-slate-200" />
                <div className="text-right">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Final Safety Status</span>
                  <span className={`font-black text-xs uppercase px-2 py-0.5 rounded ${
                    optimizationResult.riskStatusAfter === 'safe' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                  }`}>
                    {optimizationResult.riskStatusAfter}
                  </span>
                </div>
              </div>
            </div>

            {/* Before After comparison indicators */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Pre-Optimization Payload</span>
                <span className="font-black text-slate-700 text-base">{optimizationResult.beforeTokenCount.toLocaleString()} tokens</span>
              </div>
              <div className="p-4 rounded-xl bg-indigo-50/30 border border-indigo-100/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Post-Optimization Payload</span>
                  <span className="font-black text-indigo-900 text-base">{optimizationResult.afterTokenCount.toLocaleString()} tokens</span>
                </div>
                <ArrowRight className="w-5 h-5 text-indigo-500 animate-pulse" />
              </div>
            </div>

            {/* Split tables for Retained vs Removed items */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
              
              {/* Retained list */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-xs font-black text-slate-700">
                  <CheckCircle className="w-4 h-4 text-emerald-600" /> Surviving Components ({optimizationResult.retainedSections.length})
                </div>
                <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                  {optimizationResult.retainedSections.map(sec => (
                    <div key={sec.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-xs">
                      <div>
                        <div className="font-bold text-slate-700 truncate max-w-[150px]">{sec.title}</div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase">{getPriorityLabel(sec.priority)}</span>
                      </div>
                      <span className="font-extrabold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-100">{sec.tokenCount} tokens</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Evicted list */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-xs font-black text-slate-700">
                  <Trash2 className="w-4 h-4 text-rose-500" /> Evicted Components ({optimizationResult.removedSections.length})
                </div>
                <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                  {optimizationResult.removedSections.length === 0 ? (
                    <div className="text-center py-8 text-[11px] font-bold text-slate-400 italic bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                      No components evicted. Context budget is safe.
                    </div>
                  ) : (
                    optimizationResult.removedSections.map(sec => (
                      <div key={sec.id} className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl flex justify-between items-center text-xs text-rose-950">
                        <div>
                          <div className="font-bold truncate max-w-[150px]">{sec.title}</div>
                          <span className="text-[9px] text-rose-500 font-bold uppercase">{getPriorityLabel(sec.priority)}</span>
                        </div>
                        <span className="font-extrabold text-rose-600 bg-white px-2 py-0.5 rounded border border-rose-100/50">{sec.tokenCount} tokens</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

    </div>
  );
}
