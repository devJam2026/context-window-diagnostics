/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-unused-vars */
import React, { useEffect } from 'react';
import { useGatewayStore } from '../lib/gatewayStore';
import { 
  Zap, 
  Workflow, 
  Settings, 
  Cpu, 
  CircleAlert, 
  Download,
  AlertOctagon
} from 'lucide-react';

export default function ScenarioSelector() {
  const {
    scenarios,
    scenariosLoading,
    fetchScenarios,
    setPayloadSections
  } = useGatewayStore();

  // Load scenarios from API gateway on mounting, only if not already cached in Zustand
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (Object.keys(scenarios).length === 0) {
      fetchScenarios();
    }
  }, []);

  const handleLoadScenario = (key: string) => {
    const sc = scenarios[key];
    if (!sc) return;
    
    // Set sections and trigger re-analysis automatically
    setPayloadSections(sc.sections);
    alert(`Successfully loaded: ${sc.title}.\nNavigating to Live Telemetry Profiler...`);
    useGatewayStore.setState({ activeView: 'dashboard' });
  };

  const getPresetIcon = (key: string) => {
    if (key.includes('exploder')) return Settings;
    if (key.includes('drift')) return Zap;
    if (key.includes('overflow')) return Workflow;
    if (key.includes('explosion')) return Cpu;
    return CircleAlert;
  };

  const getPresetColor = (key: string) => {
    if (key.includes('exploder')) return 'bg-indigo-50 text-indigo-600 border-indigo-100';
    if (key.includes('drift')) return 'bg-amber-50 text-amber-600 border-amber-100';
    if (key.includes('overflow')) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    if (key.includes('explosion')) return 'bg-cyan-50 text-cyan-600 border-cyan-100';
    return 'bg-rose-50 text-rose-600 border-rose-100';
  };

  return (
    <div className="glass-card p-6 rounded-3xl w-full flex flex-col gap-6 grow">
      <div>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Enterprise Test Library</span>
        <h2 className="font-black text-lg text-slate-800 tracking-tight mt-0.5">
          Prebuilt conversational and data failure stress traps
        </h2>
      </div>

      {scenariosLoading ? (
        <div className="p-12 text-center text-xs font-bold text-slate-400 italic">
          Loading scenario stress presets from Gateway API...
        </div>
      ) : Object.keys(scenarios).length === 0 ? (
        <div className="p-12 text-center text-xs font-bold text-slate-400 italic">
          No scenarios available. Check gateway server connection.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.keys(scenarios).map(key => {
            const preset = scenarios[key];
            const Icon = getPresetIcon(key);
            const colorClass = getPresetColor(key);
            
            return (
              <div 
                key={key} 
                className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-md hover:border-indigo-100 transition-all duration-200 flex flex-col justify-between gap-5 group"
              >
                <div className="flex gap-4 items-start">
                  <div className={`p-3 rounded-xl border shrink-0 ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-800 leading-tight">
                      {preset.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-2 font-medium leading-normal">
                      {preset.description}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-rose-50/40 rounded-xl border border-rose-100/50 flex items-start gap-2.5 text-[10px] text-rose-950 font-bold leading-normal">
                  <AlertOctagon className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                  <span>
                    Expected Failure Mode: <span className="text-rose-700 font-extrabold">{preset.failureMode}</span>
                  </span>
                </div>

                <button
                  onClick={() => handleLoadScenario(key)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-indigo-600 hover:text-white border border-slate-200 text-slate-600 hover:border-indigo-600 rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-sm group-hover:bg-indigo-50 group-hover:text-indigo-700 group-hover:border-indigo-100 group-hover:hover:bg-indigo-600 group-hover:hover:text-white transition-all"
                >
                  <Download className="w-3.5 h-3.5" /> Load Stress Preset
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
