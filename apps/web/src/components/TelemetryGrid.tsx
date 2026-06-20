import React from 'react';
import { useGatewayStore } from '../lib/gatewayStore';
import { MODEL_PRESETS } from '../lib/modelPresets';
import { PRICING_CONSTANTS } from '../lib/pricingConstants';
import { 
  CircleDollarSign, 
  Gauge, 
  AlertTriangle,
  CheckCircle,
  ShieldX,
  Lightbulb
} from 'lucide-react';

export default function TelemetryGrid() {
  const { 
    telemetry, 
    modelPreset, 
    setModelPreset, 
    customContextLimit, 
    setCustomContextLimit,
    setReservedOutputTokens,
    safetyMarginPercent,
    setSafetyMarginPercent,
    payloadSections
  } = useGatewayStore();

  if (!telemetry) {
    return (
      <div className="p-12 glass-card rounded-3xl flex items-center justify-center text-slate-400 font-bold text-xs">
        No Telemetry Diagnostics available. Start typing in the Builder...
      </div>
    );
  }

  const {
    contextLimit,
    reservedOutputTokens: currentReserved,
    safetyMarginTokens,
    availableInputTokens,
    usedInputTokens,
    remainingTokens,
    overflowTokens,
    utilizationRatio,
    riskStatus,
    latencyRiskCategory
  } = telemetry;

  const utilPercentage = Math.round(utilizationRatio * 100);

  // Configure colors based on risk status
  let riskColor = 'text-emerald-600 bg-emerald-50 border-emerald-100';
  let riskBadge = 'Safe';
  let riskDesc = 'High safety margin. Normal request routing.';
  let RiskIcon = CheckCircle;

  if (riskStatus === 'warning') {
    riskColor = 'text-amber-600 bg-amber-50 border-amber-100';
    riskBadge = 'Warning';
    riskDesc = 'Context capacity boundary approaching. Attention degradation danger.';
    RiskIcon = AlertTriangle;
  } else if (riskStatus === 'critical') {
    riskColor = 'text-rose-500 bg-rose-50 border-rose-100 animate-pulse';
    riskBadge = 'Critical';
    riskDesc = 'Extreme context saturation. Critical "lost-in-the-middle" accuracy risk.';
    RiskIcon = AlertTriangle;
  } else if (riskStatus === 'overflow') {
    riskColor = 'text-red-600 bg-red-100 border-red-200';
    riskBadge = 'OVERFLOW';
    riskDesc = 'Strict payload limit exceeded! Gateway blocks completion request.';
    RiskIcon = ShieldX;
  }

  // Cost calculations based on pricing constants
  const rates = PRICING_CONSTANTS[modelPreset] || PRICING_CONSTANTS.gpt4o_mini;
  const inputCost = (usedInputTokens / 1_000_000) * rates.inputCostPer1M;
  const outputCost = (currentReserved / 1_000_000) * rates.outputCostPer1M;
  const totalCost = inputCost + outputCost;

  // Largest block identification
  const activeSections = payloadSections.filter(s => s.retained);
  const largestBlock = activeSections.length > 0 
    ? [...activeSections].sort((a, b) => b.tokenCount - a.tokenCount)[0]
    : null;

  // Circular gauge circle telemetry constants
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(utilPercentage, 100) / 100) * circumference;

  return (
    <div className="flex flex-col gap-6 w-full">
      
      {/* 🧭 Runtime Settings & Configuration Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Presets Card */}
        <div className="glass-card p-5 rounded-3xl flex flex-col gap-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Model preset</label>
          <select
            value={modelPreset}
            onChange={(e) => setModelPreset(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 cursor-pointer focus:outline-none focus:border-indigo-500"
          >
            {Object.keys(MODEL_PRESETS).map((key) => (
              <option key={key} value={key}>{MODEL_PRESETS[key].name}</option>
            ))}
          </select>
          <span className="text-[10px] text-slate-400 font-semibold leading-relaxed">
            {MODEL_PRESETS[modelPreset]?.description}
          </span>
          
          {modelPreset === 'custom' && (
            <div className="flex flex-col gap-1.5 mt-2">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                <span>Custom Limit:</span>
                <span>{customContextLimit.toLocaleString()} tokens</span>
              </div>
              <input
                type="number"
                value={customContextLimit}
                onChange={(e) => setCustomContextLimit(Math.max(500, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono custom-input"
              />
            </div>
          )}
        </div>

        {/* Reserved Output Budget */}
        <div className="glass-card p-5 rounded-3xl flex flex-col gap-3">
          <div className="flex justify-between items-center text-xs font-bold text-slate-600">
            <span>Reserved Output Budget:</span>
            <span className="font-extrabold text-indigo-600">{currentReserved} tokens</span>
          </div>
          <input
            type="range"
            min="200"
            max="8000"
            step="100"
            value={currentReserved}
            onChange={(e) => setReservedOutputTokens(parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <span className="text-[10px] text-slate-400 font-semibold leading-normal">
            Protects generation space from being starved by huge prompt payloads.
          </span>
        </div>

        {/* Safety Margin */}
        <div className="glass-card p-5 rounded-3xl flex flex-col gap-3">
          <div className="flex justify-between items-center text-xs font-bold text-slate-600">
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
          <span className="text-[10px] text-slate-400 font-semibold leading-normal">
            Safety reserve (in percentage) shielding against BPE token estimation shifts.
          </span>
        </div>

      </div>

      {/* ⚠️ Dynamic Risk Status Alert Header */}
      <div className={`p-4 rounded-2xl border flex flex-col gap-3 transition-all duration-255 ${riskColor}`}>
        <div className="flex items-center gap-4">
          <RiskIcon className="w-6 h-6 shrink-0" />
          <div className="grow">
            <div className="font-bold text-sm leading-none flex items-center gap-2">
              System Risk Status: <span className="uppercase font-black">{riskBadge}</span>
            </div>
            <span className="text-xs font-semibold mt-0.5 block">{riskDesc}</span>
          </div>
          {overflowTokens > 0 && (
            <div className="px-3.5 py-1.5 rounded-lg bg-red-650 text-white font-black text-xs">
              + {overflowTokens.toLocaleString()} Overflow Tokens
            </div>
          )}
        </div>

        {/* Fix suggestions block for warning/critical/overflow */}
        {riskStatus !== 'safe' && (
          <div className="mt-2 pt-3 border-t border-black/10 flex flex-col gap-2.5">
            <div className="text-xs font-extrabold uppercase flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-indigo-600 shrink-0" /> Recommended Context Safeguards:
            </div>
            
            {largestBlock && (
              <div className="p-2.5 rounded-xl bg-black/5 text-[10px] font-mono leading-normal">
                💡 <span className="font-black">Largest Active Component:</span> &quot;{largestBlock.title}&quot; ({largestBlock.tokenCount.toLocaleString()} tokens, type: <span className="uppercase">{largestBlock.type}</span>). Trim or compress this block first to gain max headroom.
              </div>
            )}

            <ul className="list-disc pl-4 text-[11px] font-semibold flex flex-col gap-1">
              <li>
                <span className="font-bold text-indigo-950">Trim Old History Turns:</span> Move to the Sandbox and run chronological <span className="underline">FIFO Truncation</span> or <span className="underline">Sliding Window</span> settings.
              </li>
              <li>
                <span className="font-bold text-indigo-950">Summarize History:</span> Switch to the Compaction tab to run <span className="underline">Structured Compaction</span>, turning raw conversation turns into a state memory block.
              </li>
              <li>
                <span className="font-bold text-indigo-950">Filter retrieved RAG chunks:</span> Exclude lower-priority documents in the Vector Docs dashboard to free context budget.
              </li>
              <li>
                <span className="font-bold text-indigo-950">Reduce Reserved Output Space:</span> Drop the output completion buffer if a shorter answer is expected.
              </li>
              <li>
                <span className="font-bold text-indigo-950">Switch to Larger Model:</span> Change preset selection to a higher token architecture limit (e.g. GPT-4.1 style).
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Grid of Key Diagnostics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Circular Utilization Dial */}
        <div className="glass-card p-6 rounded-3xl flex items-center gap-6 relative overflow-hidden grow col-span-1">
          <div className="relative shrink-0 flex items-center justify-center">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r={radius}
                className="stroke-slate-200 fill-none"
                strokeWidth="10"
              />
              <circle
                cx="64"
                cy="64"
                r={radius}
                className={`fill-none bar-transition ${
                  riskStatus === 'overflow' ? 'stroke-red-650' :
                  riskStatus === 'critical' ? 'stroke-rose-500' :
                  riskStatus === 'warning' ? 'stroke-amber-500' : 'stroke-indigo-600'
                }`}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="font-black text-2xl text-slate-800 leading-none">{utilPercentage}%</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Used</span>
            </div>
          </div>

          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Utilization Dial</span>
            <h3 className="font-black text-lg text-slate-800 tracking-tight mt-1 leading-none">
              {usedInputTokens.toLocaleString()} / {availableInputTokens.toLocaleString()}
            </h3>
            <span className="text-[11px] text-slate-400 font-semibold block mt-1.5">
              Active prompt tokens inside available budget.
            </span>
          </div>
        </div>

        {/* Card 2: Financial Cost Forecast */}
        <div className="glass-card p-6 rounded-3xl flex items-start gap-5">
          <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 border border-emerald-100">
            <CircleDollarSign className="w-5 h-5" />
          </div>
          <div className="grow">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estimated Cost (Demo)</span>
            <h3 className="font-black text-2xl text-emerald-600 tracking-tight mt-1 leading-none">
              ${totalCost.toFixed(5)} USD
            </h3>
            <div className="text-[10px] text-slate-400 font-semibold mt-2.5 flex flex-col gap-1">
              <span>Input Cost: ${inputCost.toFixed(5)}</span>
              <span>Output Cost: ${outputCost.toFixed(5)}</span>
              <span className="italic block mt-1 text-[9px] leading-tight">Approximate demonstration pricing.</span>
            </div>
          </div>
        </div>

        {/* Card 3: Network Latency Risk */}
        <div className="glass-card p-6 rounded-3xl flex items-start gap-5">
          <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 border border-amber-100">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Latency Risk</span>
            <h3 className={`font-black text-2xl uppercase tracking-tight mt-1 leading-none ${
              latencyRiskCategory === 'extreme' || latencyRiskCategory === 'high' ? 'text-rose-500' : 'text-amber-500'
            }`}>
              {latencyRiskCategory}
            </h3>
            <span className="text-[11px] text-slate-400 font-semibold block mt-1.5">
              Estimated model compilation processing pause durations.
            </span>
          </div>
        </div>

      </div>

      {/* Numerical breakdown row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Total Model Limit</span>
          <span className="font-black text-slate-800 text-sm">{contextLimit.toLocaleString()} tokens</span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Reserved Output</span>
          <span className="font-black text-slate-800 text-sm">{currentReserved.toLocaleString()} tokens</span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Safety Margin Padding</span>
          <span className="font-black text-slate-800 text-sm">{safetyMarginTokens.toLocaleString()} tokens</span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Headroom Remaining</span>
          <span className={`font-black text-sm ${remainingTokens > 0 ? 'text-indigo-600' : 'text-rose-500'}`}>
            {remainingTokens.toLocaleString()} tokens
          </span>
        </div>
      </div>
    </div>
  );
}
