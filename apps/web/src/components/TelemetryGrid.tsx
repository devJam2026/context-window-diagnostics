import React from 'react';
import { useGatewayStore } from '../lib/gatewayStore';
import { 
  TrendingUp, 
  CircleDollarSign, 
  Gauge, 
  Lock, 
  AlertTriangle,
  CheckCircle,
  ShieldX
} from 'lucide-react';

export default function TelemetryGrid() {
  const { telemetry, isAnalyzing } = useGatewayStore();

  if (!telemetry) {
    return (
      <div className="p-12 glass-card rounded-3xl flex items-center justify-center text-slate-400 font-bold text-sm">
        No Telemetry Diagnostics available. Start typing in the Builder...
      </div>
    );
  }

  const {
    contextLimit,
    reservedOutputTokens,
    safetyMarginTokens,
    availableInputTokens,
    usedInputTokens,
    remainingTokens,
    overflowTokens,
    utilizationRatio,
    riskStatus,
    estimatedCostUSD,
    latencyRiskCategory
  } = telemetry;

  // Convert utilization ratio to clear percentage
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

  // Circular gauge circle telemetry constants
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(utilPercentage, 100) / 100) * circumference;

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* ⚠️ Dynamic Risk Status Alert Header */}
      <div className={`p-4 rounded-2xl border flex items-center gap-4 transition-all duration-200 ${riskColor}`}>
        <RiskIcon className="w-6 h-6 shrink-0" />
        <div className="grow">
          <div className="font-bold text-sm leading-none flex items-center gap-2">
            System Risk Status: <span className="uppercase font-black">{riskBadge}</span>
          </div>
          <span className="text-xs font-semibold mt-0.5 block">{riskDesc}</span>
        </div>
        {overflowTokens > 0 && (
          <div className="px-3.5 py-1.5 rounded-lg bg-red-600 text-white font-black text-xs">
            + {overflowTokens.toLocaleString()} Overflow Tokens
          </div>
        )}
      </div>

      {/* Grid of Key Diagnostics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Circular Utilization Dial */}
        <div className="glass-card p-6 rounded-3xl flex items-center gap-6 relative overflow-hidden grow col-span-1">
          {/* Circular SVG gauge visual */}
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
                  riskStatus === 'overflow' ? 'stroke-red-600' :
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
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cost Projection</span>
            <h3 className="font-black text-2xl text-emerald-600 tracking-tight mt-1 leading-none">
              ${estimatedCostUSD.toFixed(5)} USD
            </h3>
            <span className="text-[11px] text-slate-400 font-semibold block mt-1.5">
              Estimated pipeline pricing based on standard input-output rates.
            </span>
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
              Reflects estimated model compilation network roundtrip processing pause durations.
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
          <span className="font-black text-slate-800 text-sm">{reservedOutputTokens.toLocaleString()} tokens</span>
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
