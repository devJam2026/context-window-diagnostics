'use client';

import React, { useEffect } from 'react';
import { useGatewayStore } from '../lib/gatewayStore';
import Sidebar from '../components/Sidebar';
import TelemetryGrid from '../components/TelemetryGrid';
import ContextMemoryStack from '../components/ContextMemoryStack';
import PayloadBuilder from '../components/PayloadBuilder';
import OptimizationSandbox from '../components/OptimizationSandbox';
import CompactionPanel from '../components/CompactionPanel';
import ScenarioSelector from '../components/ScenarioSelector';
import DocsHub from '../components/DocsHub';
import { Settings, Sliders, Info, RotateCcw } from 'lucide-react';

export default function Page() {
  const [mounted, setMounted] = React.useState(false);
  
  const {
    activeView,
    modelPreset,
    setModelPreset,
    reservedOutputTokens,
    setReservedOutputTokens,
    safetyMarginPercent,
    setSafetyMarginPercent,
    executeAnalyzePayload,
    resetPayload,
    isAnalyzing
  } = useGatewayStore();

  // Run initial token analysis on mounting
  useEffect(() => {
    setMounted(true);
    executeAnalyzePayload();
  }, []);

  if (!mounted) {
    return (
      <div className="w-screen min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
            Loading Ingestion Diagnostics Proxy...
          </span>
        </div>
      </div>
    );
  }

  return (
    <main className="w-screen min-h-screen bg-slate-100 flex">
      {/* 🧭 Left Navigation Sidebar */}
      <Sidebar />

      {/* 🖥️ Main View Container */}
      <div className="flex-1 flex flex-col p-8 gap-6 overflow-y-auto h-screen">
        
        {/* Header toolbar */}
        <div className="flex justify-between items-center shrink-0">
          <div>
            <h1 className="font-black text-2xl text-slate-800 tracking-tight leading-none uppercase">
              {activeView === 'dashboard' && 'Live Ingestion Telemetry Profiler'}
              {activeView === 'sandbox' && 'Eviction Strategy Sandbox'}
              {activeView === 'compactor' && 'OpenAI Compaction Terminal'}
              {activeView === 'scenarios' && 'Diagnostic Stress Library'}
              {activeView === 'docs' && 'Gateway System Design Manual'}
            </h1>
            <span className="text-xs font-semibold text-slate-400 mt-1 block">
              {activeView === 'dashboard' && 'Ingest, tokenize, and profile prompt payloads before API network completion rounds.'}
              {activeView === 'sandbox' && 'Configure and test static chronological, sliding window, and priority-based prunings.'}
              {activeView === 'compactor' && 'Compress conversational chat history into structured state models via OpenAI.'}
              {activeView === 'scenarios' && 'Inject complex conversational traps to stress-test your prompt structures.'}
              {activeView === 'docs' && 'Detailed system engineering guides detailing context limits and budget calculations.'}
            </span>
          </div>

          {/* Global Reset Action */}
          <button
            onClick={resetPayload}
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" /> Reset Default Payload
          </button>
        </div>

        {/* View Router */}
        <div className="flex-1 flex flex-col gap-6">
          
          {/* VIEW 1: TELEMETRY PROFILER DASHBOARD (Mockup Layout) */}
          {activeView === 'dashboard' && (
            <div className="flex flex-col gap-6 grow">
              
              {/* Context Memory Stack Bar Visualizer */}
              <ContextMemoryStack />

              {/* Multi-column grid */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 w-full grow items-start">
                
                {/* Column 1: Configuration sliders (Panel A) */}
                <div className="xl:col-span-1 flex flex-col gap-6">
                  
                  {/* Panel A: Runtime Configuration */}
                  <div className="glass-card p-6 rounded-3xl flex flex-col gap-6">
                    <div className="flex items-center gap-2">
                      <Settings className="w-5 h-5 text-indigo-600" />
                      <h3 className="font-black text-base text-slate-800 tracking-tight leading-none">
                        Runtime Configuration
                      </h3>
                    </div>

                    {/* Presets dropdown selector */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Model Architecture Preset</label>
                      <select
                        value={modelPreset}
                        onChange={(e) => setModelPreset(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 cursor-pointer focus:outline-none focus:border-indigo-500"
                      >
                        <option value="small_context">Small Context (4,096 tokens)</option>
                        <option value="standard_context">Standard Context (8,192 tokens)</option>
                        <option value="large_context">Large Context (32,768 tokens)</option>
                        <option value="long_context">Long Context (128,000 tokens)</option>
                      </select>
                    </div>

                    {/* Reserved Output Slider */}
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                        <span>Reserved Output Budget:</span>
                        <span className="font-extrabold text-indigo-600">{reservedOutputTokens} tokens</span>
                      </div>
                      <input
                        type="range"
                        min="200"
                        max="4000"
                        step="100"
                        value={reservedOutputTokens}
                        onChange={(e) => setReservedOutputTokens(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                    </div>

                    {/* Safety Margin Percent Slider */}
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                        <span>Defensive Safety Margin:</span>
                        <span className="font-extrabold text-indigo-600">{safetyMarginPercent}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="25"
                        value={safetyMarginPercent}
                        onChange={(e) => setSafetyMarginPercent(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex gap-2.5 items-start text-[10px] text-slate-400 font-semibold leading-relaxed">
                      <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                      <span>
                        Adjust selectors to dynamically re-evaluate safe Available Input tokens and trigger risk status calculations.
                      </span>
                    </div>
                  </div>

                </div>

                {/* Column 2 & 3: Ingestion Payload Builders & Telemetry metrics (Panel B & C) */}
                <div className="xl:col-span-2 flex flex-col gap-6 h-full grow">
                  {/* Telemetry metrics dials & indicator cards (Panel C) */}
                  <TelemetryGrid />

                  {/* Multi-part input builder arrays tabs (Panel B) */}
                  <PayloadBuilder />
                </div>

              </div>

            </div>
          )}

          {/* VIEW 2: EVICTION SANDBOX */}
          {activeView === 'sandbox' && <OptimizationSandbox />}

          {/* VIEW 3: COMPACTION ENGINE */}
          {activeView === 'compactor' && <CompactionPanel />}

          {/* VIEW 4: SCENARIOS LIBRARY */}
          {activeView === 'scenarios' && <ScenarioSelector />}

          {/* VIEW 5: SYSTEM DESIGN MANUAL */}
          {activeView === 'docs' && <DocsHub />}

        </div>

      </div>
    </main>
  );
}
