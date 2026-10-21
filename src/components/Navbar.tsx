import React from 'react';

interface NavbarProps {
  activeTab: 'ideas' | 'simulator' | 'prompt' | 'guide';
  setActiveTab: (tab: 'ideas' | 'simulator' | 'prompt' | 'guide') => void;
  onQuickStart: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onQuickStart }) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand title, single line */}
        <div 
          onClick={() => setActiveTab('ideas')} 
          className="cursor-pointer text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-2"
        >
          <span className="w-2.5 h-2.5 bg-amber-500 rounded-xs"></span>
          <span>I Halldors fotspor</span>
        </div>

        {/* Zone 2: 4 nav links, single line */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => setActiveTab('ideas')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'ideas' ? 'text-amber-400 font-semibold' : 'hover:text-white text-slate-300'
            }`}
          >
            App-ideer & Konsepter
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'simulator' ? 'text-amber-400 font-semibold' : 'hover:text-white text-slate-300'
            }`}
          >
            Spill-Simulator (Live)
          </button>
          <button
            onClick={() => setActiveTab('prompt')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'prompt' ? 'text-amber-400 font-semibold' : 'hover:text-white text-slate-300'
            }`}
          >
            KI-Prompt Bygger
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'guide' ? 'text-amber-400 font-semibold' : 'hover:text-white text-slate-300'
            }`}
          >
            Lærer- & Fagveileder (LK20)
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onQuickStart}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 rounded-md hover:bg-amber-300 transition-colors whitespace-nowrap shrink-0 shadow-sm"
          >
            Kopier KI-Byggeprompt
          </button>
        </div>
      </div>
    </header>
  );
};
