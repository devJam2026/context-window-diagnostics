/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
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
import PromptVisualizer from '../components/PromptVisualizer';
import TrimmingSummarizationDemo from '../components/TrimmingSummarizationDemo';
import RagBudgetDemo from '../components/RagBudgetDemo';
import InterviewGuide from '../components/InterviewGuide';
import { RotateCcw } from 'lucide-react';

export default function Page() {
  const [mounted, setMounted] = React.useState(false);
  
  const {
    activeView,
    executeAnalyzePayload,
    resetPayload
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
              {activeView === 'dashboard' && 'Context Window & Ingestion Telemetry'}
              {activeView === 'sandbox' && 'Eviction Strategy Sandbox'}
              {activeView === 'compactor' && 'Structured Compaction Terminal'}
              {activeView === 'scenarios' && 'Diagnostic Stress Library'}
              {activeView === 'docs' && 'Gateway System Design Manual'}
            </h1>
            <span className="text-xs font-semibold text-slate-400 mt-1 block">
              {activeView === 'dashboard' && 'Ingest, tokenize, and profile prompt payloads before API network completions.'}
              {activeView === 'sandbox' && 'Configure and test chronological, sliding window, and priority-based prunings.'}
              {activeView === 'compactor' && 'Compress conversational chat history into structured state models.'}
              {activeView === 'scenarios' && 'Inject complex conversational traps to stress-test your prompt structures.'}
              {activeView === 'docs' && 'Detailed system engineering guides explaining context limits and budget calculations.'}
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
          
          {/* VIEW 1: TELEMETRY PROFILER DASHBOARD */}
          {activeView === 'dashboard' && (
            <div className="flex flex-col gap-6 grow">
              
              {/* Context Memory Stack Bar Visualizer */}
              <ContextMemoryStack />

              {/* Multi-column grid */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 w-full items-start">
                
                {/* Column 1 & 2: Ingestion Payload Builders & Telemetry metrics */}
                <div className="xl:col-span-2 flex flex-col gap-6">
                  {/* Telemetry metrics dials & indicator cards */}
                  <TelemetryGrid />

                  {/* Multi-part input builder arrays tabs */}
                  <PayloadBuilder />
                </div>

                {/* Column 3: Prompt Packing Visualizer */}
                <div className="xl:col-span-1">
                  <PromptVisualizer />
                </div>

              </div>

              {/* RAG Context Budget Demo */}
              <RagBudgetDemo />

              {/* Trimming & Summarization Strategy Demo */}
              <TrimmingSummarizationDemo />

              {/* Interview Q&A Section */}
              <InterviewGuide />

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
