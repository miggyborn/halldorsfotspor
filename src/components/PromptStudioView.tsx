import React, { useState } from 'react';
import { generateMasterAppBuilderPrompt, generateGameMasterSystemPrompt, PromptGeneratorOptions } from '../data/promptTemplates';
import { Copy, Check, Download, Sparkles, Terminal, BookOpen, Settings2 } from 'lucide-react';

export const PromptStudioView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'builder' | 'gamemaster'>('builder');
  const [isCopied, setIsCopied] = useState(false);

  // Configuration state for builder prompt
  const [options, setOptions] = useState<PromptGeneratorOptions>({
    includeSpeech: true,
    includeAudioSfx: true,
    includeLk20Matrix: true,
    includeTeacherExport: true,
    targetPlatform: 'react_vite_tailwind',
    targetAiModel: 'claude_3_7_sonnet',
    difficultyTuning: 'standard_9_10',
  });

  const builderPrompt = generateMasterAppBuilderPrompt(options);
  const gameMasterPrompt = generateGameMasterSystemPrompt();

  const currentPromptText = activeTab === 'builder' ? builderPrompt : gameMasterPrompt;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentPromptText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = activeTab === 'builder' ? 'Halldor_App_Builder_Prompt.md' : 'Halldor_KI_Spillveileder_Systemprompt.md';
    const blob = new Blob([currentPromptText], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-600 font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>KI-PROMPT ARKITEKTUR</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Slutt-prompt for å bygge appen
          </h2>
          <p className="text-sm text-slate-500 max-w-xl">
            Kopier den fullstendige spesifikasjonen og lim den direkte inn i en annen AI (Claude 3.7, ChatGPT o3-mini, Cursor eller AI Studio) for å bygge hele løsningen.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDownload}
            className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
            title="Last ned som Markdown-fil"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Last ned .md</span>
          </button>
          <button
            onClick={handleCopy}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors flex items-center gap-2 shadow-xs"
          >
            {isCopied ? <Check className="w-4 h-4 text-slate-950" /> : <Copy className="w-4 h-4 text-slate-950" />}
            <span>{isCopied ? 'Kopiert til utklippstavle!' : 'Kopier hele KI-prompten'}</span>
          </button>
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl max-w-md">
        <button
          onClick={() => setActiveTab('builder')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'builder' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Terminal className="w-3.5 h-3.5 text-amber-600" />
          <span>1. App-Byggerprompt (for AI-koding)</span>
        </button>
        <button
          onClick={() => setActiveTab('gamemaster')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'gamemaster' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-sky-600" />
          <span>2. Spillveileder Systemprompt (for ChatGPT)</span>
        </button>
      </div>

      {/* Builder Options Customizer (Only visible for Builder tab) */}
      {activeTab === 'builder' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wide">
            <Settings2 className="w-4 h-4 text-slate-500" />
            <span>Tilpass app-kravene i prompten</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* Tech Stack */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1.5">Teknologistakk</label>
              <select
                value={options.targetPlatform}
                onChange={(e) =>
                  setOptions({ ...options, targetPlatform: e.target.value as PromptGeneratorOptions['targetPlatform'] })
                }
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="react_vite_tailwind">React + Vite + TypeScript</option>
                <option value="nextjs_app_router">Next.js 15 (App Router)</option>
                <option value="standalone_html_js">Enkelfil HTML5/TS (LTI-klar)</option>
              </select>
            </div>

            {/* Target AI */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1.5">Optimalisert for AI-modell</label>
              <select
                value={options.targetAiModel}
                onChange={(e) =>
                  setOptions({ ...options, targetAiModel: e.target.value as PromptGeneratorOptions['targetAiModel'] })
                }
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="claude_3_7_sonnet">Anthropic Claude 3.7 Sonnet</option>
                <option value="chatgpt_o3_mini">OpenAI ChatGPT o3-mini / GPT-4o</option>
                <option value="cursor_ai">Cursor AI / Windsurf Composer</option>
                <option value="gemini_flash">Google Gemini 2.5 / AI Studio</option>
              </select>
            </div>

            {/* Speech API Toggle */}
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="font-medium text-slate-700">Tale & «OVER»-knapp</span>
              <input
                type="checkbox"
                checked={options.includeSpeech}
                onChange={(e) => setOptions({ ...options, includeSpeech: e.target.checked })}
                className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4 cursor-pointer"
              />
            </div>

            {/* Audio Synthesis Toggle */}
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="font-medium text-slate-700">Syntetisert radiosus (Web Audio)</span>
              <input
                type="checkbox"
                checked={options.includeAudioSfx}
                onChange={(e) => setOptions({ ...options, includeAudioSfx: e.target.checked })}
                className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Code / Prompt Terminal Display */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-md">
        <div className="bg-slate-900/90 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-slate-700"></span>
            <span className="w-3 h-3 rounded-full bg-slate-700"></span>
            <span className="w-3 h-3 rounded-full bg-slate-700"></span>
            <span className="text-xs font-mono text-slate-400 ml-2">
              {activeTab === 'builder' ? 'master_app_builder_prompt.md' : 'gamemaster_system_instructions.txt'}
            </span>
          </div>

          <button
            onClick={handleCopy}
            className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-amber-400 font-mono flex items-center gap-1.5 transition-colors"
          >
            {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{isCopied ? 'Kopiert!' : 'Kopier alt'}</span>
          </button>
        </div>

        <div className="p-6 max-h-[580px] overflow-y-auto font-mono text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap select-all">
          {currentPromptText}
        </div>
      </div>

      {/* Explanatory Guide Box */}
      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600">
        <div>
          <h4 className="font-bold text-slate-900 mb-1 text-sm">Hvorfor fungerer denne prompten?</h4>
          <p className="leading-relaxed">
            Den inneholder alle eksplisitte tilstander fra det 9-siders opplegget: 6 scener, den absolutte OVER-regelen, tillitsstigen fra 0 til 4, rolige dødsvalg, og læreplanmålene i LK20.
          </p>
        </div>
        <div>
          <h4 className="font-bold text-slate-900 mb-1 text-sm">Slik bruker du den</h4>
          <p className="leading-relaxed">
            Lim den inn som oppstartsinstruks i et nytt AI Studio-prosjekt, en Claude Code-terminal eller Cursor. AI-en vil generere alle komponenter, tilstandsmaskinen og designet i ett jafs.
          </p>
        </div>
        <div>
          <h4 className="font-bold text-slate-900 mb-1 text-sm">Skånsomhet og verdighet</h4>
          <p className="leading-relaxed">
            Prompten forbyr eksplisitt blod og grafisk vold i samsvar med Udir-retningslinjer for 9.–10. trinn, og fokuserer på folkeretten og menneskeverd.
          </p>
        </div>
      </div>
    </div>
  );
};
