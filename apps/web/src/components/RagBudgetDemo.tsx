import React from 'react';
import { useGatewayStore } from '../lib/gatewayStore';
import { calculateRagBudget } from '../lib/contextCalculations';
import { FileText, Eye, EyeOff } from 'lucide-react';

export default function RagBudgetDemo() {
  const { payloadSections, togglePayloadSectionRetained } = useGatewayStore();

  const documents = payloadSections.filter(s => s.type === 'retrieved_document');
  const budget = calculateRagBudget(documents);

  if (documents.length === 0) {
    return (
      <div className="glass-card p-8 rounded-3xl text-center text-xs font-bold text-slate-400 italic">
        No retrieved RAG documents in the active payload. Load a stress preset (e.g. RAG Heavy Query) to test document budget toggles.
      </div>
    );
  }

  return (
    <div className="glass-card p-6 rounded-3xl w-full flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">RAG Context Budget Demo</span>
          <h2 className="font-black text-lg text-slate-800 tracking-tight mt-0.5">
            Vector document relevance grid
          </h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Toggle retrieved reference database chunks to observe the impact on your input token capacity.
          </p>
        </div>
        
        <div className="flex gap-4 text-xs font-bold bg-slate-50 border border-slate-200 p-3 rounded-xl">
          <div className="text-left">
            <span className="text-[10px] text-slate-400 uppercase block">Included RAG Chunks</span>
            <span className="font-black text-emerald-600">{budget.includedDocsTokenCount.toLocaleString()} tokens</span>
          </div>
          <div className="w-px bg-slate-200" />
          <div className="text-left">
            <span className="text-[10px] text-slate-400 uppercase block">Excluded RAG Chunks</span>
            <span className="font-black text-slate-500">{budget.excludedDocsTokenCount.toLocaleString()} tokens</span>
          </div>
        </div>
      </div>

      {/* Grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc) => {
          // Parse similarity score if title has it, or generate mock one
          const match = doc.title.match(/0\.\d+/);
          const score = match ? parseFloat(match[0]) : 0.85;
          const isHighRelevance = score >= 0.82;

          return (
            <div 
              key={doc.id} 
              className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-4 ${
                doc.retained 
                  ? 'bg-emerald-50/20 border-emerald-250 shadow-sm' 
                  : 'bg-slate-50/40 border-slate-200 opacity-60'
              }`}
            >
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center gap-2">
                  <div className="flex items-center gap-2">
                    <FileText className={`w-4 h-4 shrink-0 ${doc.retained ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span className="font-extrabold text-xs text-slate-700 truncate max-w-[130px]">
                      {doc.title}
                    </span>
                  </div>
                  
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                    isHighRelevance 
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                      : 'bg-amber-50 text-amber-600 border border-amber-100'
                  }`}>
                    Score: {score.toFixed(2)}
                  </span>
                </div>

                <p className="text-xs text-slate-500 font-semibold leading-relaxed line-clamp-3">
                  {doc.content}
                </p>
              </div>

              <div className="flex justify-between items-center pt-2.5 border-t border-slate-100">
                <span className="text-[10px] text-indigo-600 font-black font-mono">
                  {doc.tokenCount} tokens
                </span>

                <button
                  onClick={() => togglePayloadSectionRetained(doc.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black border transition cursor-pointer ${
                    doc.retained 
                      ? 'bg-white hover:bg-slate-50 border-emerald-200 text-emerald-700' 
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-350 text-slate-600'
                  }`}
                >
                  {doc.retained ? (
                    <>
                      <Eye className="w-3.5 h-3.5" /> Exclude Chunk
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5" /> Include Chunk
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
