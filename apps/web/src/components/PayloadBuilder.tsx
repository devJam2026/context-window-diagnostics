/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps, @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useGatewayStore } from '../lib/gatewayStore';
import { 
  Plus, 
  Trash2, 
  User, 
  Bot, 
  FileText, 
  Settings, 
  Sparkles,
  Braces,
  MessageSquare,
  ShieldAlert,
  TextCursorInput
} from 'lucide-react';
import { estimateTokens } from '../lib/contextCalculations';

export default function PayloadBuilder() {
  const {
    payloadSections,
    addPayloadSection,
    removePayloadSection,
    updatePayloadSectionContent,
    executeAnalyzePayload
  } = useGatewayStore();

  const [activeTab, setActiveTab] = useState<'system' | 'developer' | 'history' | 'rag' | 'user' | 'output'>('system');

  // Find individual section nodes
  const systemPrompt = payloadSections.find(s => s.type === 'system');
  const devInstruction = payloadSections.find(s => s.type === 'developer_instruction');
  const activeInput = payloadSections.find(s => s.type === 'active_user_input');
  const outputInstruction = payloadSections.find(s => s.type === 'output_format_instruction');

  const historyTurns = payloadSections.filter(s => s.type === 'history' && !s.required);
  const ragDocs = payloadSections.filter(s => s.type === 'retrieved_document');

  // Local state for debounced text areas
  const [localSysText, setLocalSysText] = useState(systemPrompt?.content || '');
  const [localDevText, setLocalDevText] = useState(devInstruction?.content || '');
  const [localUserText, setLocalUserText] = useState(activeInput?.content || '');
  const [localOutText, setLocalOutText] = useState(outputInstruction?.content || '');

  // Track system text edits
  useEffect(() => {
    if (!systemPrompt) return;
    const timer = setTimeout(() => {
      if (localSysText !== systemPrompt.content) {
        updatePayloadSectionContent(systemPrompt.id, localSysText);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localSysText]);

  // Track developer instructions edits
  useEffect(() => {
    if (!devInstruction) return;
    const timer = setTimeout(() => {
      if (localDevText !== devInstruction.content) {
        updatePayloadSectionContent(devInstruction.id, localDevText);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localDevText]);

  // Track user text edits
  useEffect(() => {
    if (!activeInput) return;
    const timer = setTimeout(() => {
      if (localUserText !== activeInput.content) {
        updatePayloadSectionContent(activeInput.id, localUserText);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localUserText]);

  // Track output instruction edits
  useEffect(() => {
    if (!outputInstruction) return;
    const timer = setTimeout(() => {
      if (localOutText !== outputInstruction.content) {
        updatePayloadSectionContent(outputInstruction.id, localOutText);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localOutText]);

  // Sync state if loading scenarios
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (systemPrompt && systemPrompt.content !== localSysText) {
      setLocalSysText(systemPrompt.content);
    }
    if (devInstruction && devInstruction.content !== localDevText) {
      setLocalDevText(devInstruction.content);
    }
    if (activeInput && activeInput.content !== localUserText) {
      setLocalUserText(activeInput.content);
    }
    if (outputInstruction && outputInstruction.content !== localOutText) {
      setLocalOutText(outputInstruction.content);
    }
  }, [payloadSections]);

  // Chat simulator new turn states
  const [newTurnRole, setNewTurnRole] = useState<'user' | 'assistant'>('user');
  const [newTurnContent, setNewTurnContent] = useState('');

  const handleAddChatTurn = () => {
    if (!newTurnContent.trim()) return;
    
    const turnIndex = historyTurns.length + 1;
    addPayloadSection({
      id: `sec_hist_${Date.now()}`,
      type: 'history',
      role: newTurnRole,
      title: `Conversation Turn #${turnIndex} (${newTurnRole === 'user' ? 'User' : 'Assistant'})`,
      content: newTurnContent,
      priority: 7, // Default priority for chat history turns
      required: false
    });
    
    setNewTurnContent('');
  };

  // RAG document adding states
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocContent, setNewDocContent] = useState('');
  const [newDocPriority, setNewDocPriority] = useState<number>(5); // Priority 5: High relevance default

  const handleAddDocument = () => {
    if (!newDocContent.trim()) return;
    
    const docIndex = ragDocs.length + 1;
    addPayloadSection({
      id: `sec_doc_${Date.now()}`,
      type: 'retrieved_document',
      title: newDocTitle.trim() || `Retrieved Chunk #${docIndex}`,
      content: newDocContent,
      priority: newDocPriority,
      required: false
    });

    setNewDocTitle('');
    setNewDocContent('');
    setNewDocPriority(5);
  };

  return (
    <div className="glass-card p-6 rounded-3xl w-full flex flex-col gap-6 h-full grow">
      <div>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Payload Builder Canvas</span>
        <h2 className="font-black text-lg text-slate-800 tracking-tight mt-0.5">
          Ingestion array composer and turns simulator
        </h2>
      </div>

      {/* Tab controls */}
      <div className="grid grid-cols-2 md:flex md:flex-wrap gap-1.5 p-1.5 rounded-2xl bg-slate-100 border border-slate-200">
        <button
          onClick={() => setActiveTab('system')}
          className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl font-bold text-[11px] transition-all duration-150 grow ${
            activeTab === 'system' ? 'bg-white text-indigo-900 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Settings className="w-3.5 h-3.5" /> System Prompt
        </button>
        <button
          onClick={() => setActiveTab('developer')}
          className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl font-bold text-[11px] transition-all duration-150 grow ${
            activeTab === 'developer' ? 'bg-white text-indigo-900 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" /> Guardrails
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl font-bold text-[11px] transition-all duration-150 grow ${
            activeTab === 'history' ? 'bg-white text-indigo-900 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" /> Chat Turns ({historyTurns.length})
        </button>
        <button
          onClick={() => setActiveTab('rag')}
          className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl font-bold text-[11px] transition-all duration-150 grow ${
            activeTab === 'rag' ? 'bg-white text-indigo-900 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" /> Vector Docs ({ragDocs.length})
        </button>
        <button
          onClick={() => setActiveTab('user')}
          className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl font-bold text-[11px] transition-all duration-150 grow ${
            activeTab === 'user' ? 'bg-white text-indigo-900 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" /> User Query
        </button>
        <button
          onClick={() => setActiveTab('output')}
          className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl font-bold text-[11px] transition-all duration-150 grow ${
            activeTab === 'output' ? 'bg-white text-indigo-900 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <TextCursorInput className="w-3.5 h-3.5" /> Format Rules
        </button>
      </div>

      {/* Tab content area */}
      <div className="flex-1 flex flex-col min-h-[380px] justify-between">
        
        {/* T1: SYSTEM PROMPT EDIT */}
        {activeTab === 'system' && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center bg-indigo-50 border border-indigo-100 p-4 rounded-2xl text-indigo-900">
              <span className="text-xs font-semibold leading-tight block">
                The **System Compliance Prompt** establishes absolute behavioral constraints. It is marked 
                `required: true` and is **100% immune from deletion or eviction** during budget crashes.
              </span>
            </div>
            <textarea
              value={localSysText}
              onChange={(e) => setLocalSysText(e.target.value)}
              placeholder="Paste system behavior rules..."
              className="w-full h-[280px] p-4 text-xs font-mono rounded-2xl custom-input resize-none"
            />
          </div>
        )}

        {/* T2: DEVELOPER INSTRUCTION / GUARDRAIL EDIT */}
        {activeTab === 'developer' && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center bg-purple-50 border border-purple-100 p-4 rounded-2xl text-purple-900">
              <span className="text-xs font-semibold leading-tight block">
                The **Developer Instruction / App Guardrail** enforces security controls, compliance mandates, and prompt injection prevention. Marked `required: true`.
              </span>
            </div>
            <textarea
              value={localDevText}
              onChange={(e) => setLocalDevText(e.target.value)}
              placeholder="Paste developer security instructions or guardrails..."
              className="w-full h-[280px] p-4 text-xs font-mono rounded-2xl custom-input resize-none"
            />
          </div>
        )}

        {/* T3: CONVERSATION TURN SIMULATOR */}
        {activeTab === 'history' && (
          <div className="flex flex-col gap-4 grow">
            {/* Scrollable list of chat turns */}
            <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
              {historyTurns.length === 0 ? (
                <div className="text-center py-8 text-xs font-bold text-slate-400 italic">
                  No simulated history turns yet. Add user/assistant turns below to model context growth.
                </div>
              ) : (
                historyTurns.map((turn) => (
                  <div key={turn.id} className="flex gap-3 items-start p-3 bg-slate-50 border border-slate-200 rounded-2xl relative group">
                    <div className={`p-2 rounded-xl text-white ${turn.role === 'user' ? 'bg-indigo-600' : 'bg-gray-600'}`}>
                      {turn.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                    </div>
                    <div className="grow">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-700 leading-none">{turn.title}</span>
                        <span className="text-[10px] text-indigo-600 font-extrabold pr-6">{turn.tokenCount} tokens</span>
                      </div>
                      <p className="text-xs text-slate-500 font-semibold mt-1.5 leading-relaxed">{turn.content}</p>
                    </div>
                    <button
                      onClick={() => removePayloadSection(turn.id)}
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Ingestion console to add a chat turn */}
            <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-600">Simulate Message Role:</span>
                <div className="flex gap-1 bg-white p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setNewTurnRole('user')}
                    className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                      newTurnRole === 'user' ? 'bg-indigo-600 text-white' : 'text-slate-500'
                    }`}
                  >
                    User
                  </button>
                  <button
                    onClick={() => setNewTurnRole('assistant')}
                    className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                      newTurnRole === 'assistant' ? 'bg-gray-600 text-white' : 'text-slate-500'
                    }`}
                  >
                    Assistant
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTurnContent}
                  onChange={(e) => setNewTurnContent(e.target.value)}
                  placeholder={`Type ${newTurnRole} response dialogue block...`}
                  className="grow px-4 py-2.5 text-xs rounded-xl custom-input"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddChatTurn()}
                />
                <button
                  onClick={handleAddChatTurn}
                  className="px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Turn
                </button>
              </div>
            </div>
          </div>
        )}

        {/* T4: VECTOR SEARCH DOCUMENT INGEST */}
        {activeTab === 'rag' && (
          <div className="flex flex-col gap-4 grow">
            {/* Scrollable list of docs */}
            <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-1">
              {ragDocs.length === 0 ? (
                <div className="text-center py-8 text-xs font-bold text-slate-400 italic">
                  No simulated vector document chunks loaded yet.
                </div>
              ) : (
                ragDocs.map((doc) => (
                  <div key={doc.id} className="flex gap-3 items-start p-3 bg-slate-50 border border-slate-200 rounded-2xl relative group">
                    <div className="p-2 rounded-xl bg-emerald-500 text-white">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div className="grow">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-700 leading-none">{doc.title}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100">
                            Priority: {doc.priority === 5 ? 'High (5)' : 'Low (8)'}
                          </span>
                          <span className="text-[10px] text-indigo-600 font-extrabold pr-6">{doc.tokenCount} tokens</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 font-semibold mt-1.5 leading-relaxed">{doc.content}</p>
                    </div>
                    <button
                      onClick={() => removePayloadSection(doc.id)}
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Ingestion builder for new doc */}
            <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  placeholder="Document Title (e.g. vector segment #1)"
                  className="px-4 py-2.5 text-xs rounded-xl custom-input"
                />
                <div className="flex items-center justify-between px-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-black text-slate-500 uppercase">Document Rank:</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setNewDocPriority(5)}
                      className={`px-3 py-1 rounded-lg text-[9px] font-black transition-all cursor-pointer ${
                        newDocPriority === 5 ? 'bg-emerald-500 text-white' : 'text-slate-500'
                      }`}
                    >
                      High (Similarity &gt; 0.82)
                    </button>
                    <button
                      onClick={() => setNewDocPriority(8)}
                      className={`px-3 py-1 rounded-lg text-[9px] font-black transition-all cursor-pointer ${
                        newDocPriority === 8 ? 'bg-slate-400 text-white' : 'text-slate-500'
                      }`}
                    >
                      Low (Similarity &lt; 0.82)
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newDocContent}
                  onChange={(e) => setNewDocContent(e.target.value)}
                  placeholder="Paste retrieved RAG knowledge text fragment..."
                  className="grow px-4 py-2.5 text-xs rounded-xl custom-input"
                />
                <button
                  onClick={handleAddDocument}
                  className="px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4" /> Ingest
                </button>
              </div>
            </div>
          </div>
        )}

        {/* T5: ACTIVE IMMEDIATE USER INPUT */}
        {activeTab === 'user' && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center bg-teal-50 border border-teal-100 p-4 rounded-2xl text-teal-900">
              <span className="text-xs font-semibold leading-tight block">
                The **User Query (Active Input)** represents the incoming prompt question. This segment is marked `required: true` and is **100% immune from prunings**.
              </span>
            </div>
            <textarea
              value={localUserText}
              onChange={(e) => setLocalUserText(e.target.value)}
              placeholder="Type immediate transactional question to process..."
              className="w-full h-[280px] p-4 text-xs font-mono rounded-2xl custom-input resize-none"
            />
          </div>
        )}

        {/* T6: OUTPUT FORMAT INSTRUCTION */}
        {activeTab === 'output' && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center bg-amber-50 border border-amber-105 p-4 rounded-2xl text-amber-900">
              <span className="text-xs font-semibold leading-tight block">
                The **Output Format Instruction** dictates the structure of the LLM completion (e.g. strict schemas, markdown parameters, or expected JSON types). Marked `required: true`.
              </span>
            </div>
            <textarea
              value={localOutText}
              onChange={(e) => setLocalOutText(e.target.value)}
              placeholder="Specify structural schema or format instructions (e.g. Return JSON object only)..."
              className="w-full h-[280px] p-4 text-xs font-mono rounded-2xl custom-input resize-none"
            />
          </div>
        )}

      </div>
    </div>
  );
}
