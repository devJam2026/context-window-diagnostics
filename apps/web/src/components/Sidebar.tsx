import React from 'react';
import { useGatewayStore } from '../lib/gatewayStore';
import { 
  Sliders, 
  Terminal, 
  BookOpen, 
  FolderGit, 
  Radio, 
  Cpu, 
  CircleAlert, 
  CloudLightning,
  Workflow
} from 'lucide-react';

export default function Sidebar() {
  const { activeView, setActiveView, isBackendOffline } = useGatewayStore();

  const menuItems = [
    { id: 'dashboard', label: 'Telemetry Profiler', icon: Sliders, description: 'Live token telemetry visualizer' },
    { id: 'sandbox', label: 'Truncation Sandbox', icon: Workflow, description: 'Simulate eviction algorithms' },
    { id: 'compactor', label: 'Compaction Terminal', icon: Terminal, description: 'Real OpenAI summarized memory' },
    { id: 'scenarios', label: 'Stress Presets', icon: FolderGit, description: 'Prebuilt diagnostic traps' },
    { id: 'docs', label: 'System Design Docs', icon: BookOpen, description: 'Interactive learning manual' }
  ] as const;

  return (
    <aside className="w-72 h-screen flex flex-col justify-between p-6 glass-sidebar sticky top-0 shrink-0">
      <div className="flex flex-col gap-8">
        {/* Gateway Brand Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-200">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-800 tracking-tight leading-none">
              Context Gateway
            </h1>
            <span className="text-xs font-semibold text-slate-400">
              Payload Diagnostics & Profiler
            </span>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex flex-col gap-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-start gap-4 p-3 rounded-xl transition-all duration-150 text-left ${
                  isActive
                    ? 'bg-indigo-50 border-l-4 border-indigo-600 text-indigo-900 shadow-sm shadow-indigo-50'
                    : 'text-slate-500 hover:bg-slate-100/60 hover:text-slate-800 border-l-4 border-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 mt-0.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <div>
                  <div className="font-bold text-sm leading-none">{item.label}</div>
                  <span className="text-[11px] text-slate-400 font-medium">{item.description}</span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Connectivity & Telemetry Node status */}
      <div className="flex flex-col gap-3 pt-6 border-t border-slate-100">
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-3">
            <Cpu className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-600">Diagnostics Engine</span>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
        </div>

        {isBackendOffline ? (
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-100 text-amber-900">
            <CloudLightning className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-bounce" />
            <div>
              <div className="text-xs font-bold leading-tight">Local Sandbox Mode</div>
              <span className="text-[10px] text-amber-600 font-medium leading-none">
                FastAPI offline. Running local telemetry heuristics.
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-950">
            <CircleAlert className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold leading-tight">Proxy Gateway Connected</div>
              <span className="text-[10px] text-indigo-600 font-medium leading-none">
                Sub-15ms cached counts matching upstream active APIs.
              </span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
