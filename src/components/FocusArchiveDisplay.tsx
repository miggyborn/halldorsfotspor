import React, { useState } from 'react';
import { HISTORICAL_ARCHIVE_ITEMS, ArchiveItem } from '../data/historicalArchive';
import {
  Map,
  FileText,
  Compass,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  Shield,
  Clock,
  Radio,
  Eye,
} from 'lucide-react';

interface FocusArchiveDisplayProps {
  currentScene: number;
  isLoading: boolean;
  statusText?: string;
  className?: string;
}

export const FocusArchiveDisplay: React.FC<FocusArchiveDisplayProps> = ({
  currentScene,
  isLoading,
  statusText = 'Fortelleren vurderer elevenes valg...',
  className = '',
}) => {
  const [selectedSceneForModal, setSelectedSceneForModal] = useState<number | null>(null);
  const [activeTabScene, setActiveTabScene] = useState<number>(currentScene);

  // Sync tab with scene unless manually browsing
  const item: ArchiveItem =
    HISTORICAL_ARCHIVE_ITEMS[selectedSceneForModal ?? activeTabScene] ||
    HISTORICAL_ARCHIVE_ITEMS[currentScene] ||
    HISTORICAL_ARCHIVE_ITEMS[1];

  const handleOpenDetail = (sceneId: number) => {
    setSelectedSceneForModal(sceneId);
  };

  const handleCloseDetail = () => {
    setSelectedSceneForModal(null);
  };

  const handlePrevItem = () => {
    const cur = selectedSceneForModal ?? activeTabScene;
    const prev = cur <= 1 ? 6 : cur - 1;
    if (selectedSceneForModal !== null) setSelectedSceneForModal(prev);
    else setActiveTabScene(prev);
  };

  const handleNextItem = () => {
    const cur = selectedSceneForModal ?? activeTabScene;
    const next = cur >= 6 ? 1 : cur + 1;
    if (selectedSceneForModal !== null) setSelectedSceneForModal(next);
    else setActiveTabScene(next);
  };

  return (
    <>
      {/* Automatic Focus Card (rendered during AI generation or docked between turns) */}
      <div
        className={`w-full rounded-2xl border transition-all duration-300 overflow-hidden ${
          isLoading
            ? 'bg-zinc-900 border-amber-500/50 shadow-xl shadow-amber-950/20 ring-1 ring-amber-500/30'
            : 'bg-zinc-900/80 border-zinc-800/80 hover:border-zinc-700/80'
        } ${className}`}
      >
        {/* Top Header / Classification Strip */}
        <div className="flex items-center justify-between px-3.5 py-2 border-b border-zinc-800/80 bg-zinc-950/50 text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isLoading ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'
              }`}
            />
            <span className="font-mono text-[11px] text-amber-300 font-medium tracking-wide">
              {isLoading ? 'LEIRARKIV • FOKUSVISNING' : 'LEIRARKIV • STALAG LUFT III'}
            </span>
            <span className="text-zinc-600 hidden sm:inline">|</span>
            <span className="text-[11px] text-zinc-400 font-mono hidden sm:inline">
              {item.dateOrCode}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleOpenDetail(item.sceneId)}
              className="px-2 py-1 text-[11px] font-medium text-zinc-300 hover:text-amber-300 bg-zinc-800/60 hover:bg-zinc-800 rounded-md transition-colors cursor-pointer flex items-center gap-1"
              title="Forstørr kart og dokument"
            >
              <Maximize2 className="w-3 h-3" />
              <span className="hidden sm:inline">Forstørr</span>
            </button>
          </div>
        </div>

        {/* Content Body: SVG Map/Drawing + Authentic Narrative Context */}
        <div className="p-3 sm:p-4 grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
          {/* Visual SVG Blueprint Illustration */}
          <div className="md:col-span-5 bg-zinc-950 rounded-xl p-3 border border-zinc-800/90 flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="w-full h-32 sm:h-36 flex items-center justify-center">
              <ArchiveSvgIllustration type={item.svgType} isPulsing={isLoading} />
            </div>

            <div className="w-full pt-2 flex items-center justify-between text-[10px] font-mono text-zinc-500 border-t border-zinc-900 mt-2">
              <span className="text-amber-400/90">{item.badgeLabel}</span>
              <span>1943–1944</span>
            </div>
          </div>

          {/* Text context & facts that capture students' focus */}
          <div className="md:col-span-7 space-y-2">
            <div>
              <h4 className="text-sm sm:text-base font-semibold text-zinc-100 flex items-center gap-1.5">
                <span>{item.title}</span>
              </h4>
              <p className="text-xs text-zinc-400 font-mono">{item.subtitle}</p>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed line-clamp-2 sm:line-clamp-none">
              {item.description}
            </p>

            {/* Historical Fact Highlight Box */}
            <div className="bg-amber-950/20 border-l-2 border-amber-400 p-2 sm:p-2.5 rounded-r-lg text-xs text-amber-200/90 space-y-0.5">
              <span className="font-semibold text-amber-300 block text-[11px]">
                Visste du dette?
              </span>
              <p className="text-[11px] leading-relaxed text-zinc-300">{item.historicalFact}</p>
            </div>

            {/* Live Progress Bar when waiting for AI answer */}
            {isLoading && (
              <div className="pt-1 space-y-1.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-[11px] text-amber-300 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                    <span>{statusText}</span>
                  </span>
                  <span className="text-zinc-500 font-mono text-[10px]">Studér kartet over</span>
                </div>
                <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden border border-zinc-800">
                  <div className="bg-amber-400 h-full rounded-full animate-pulse w-3/4 transition-all duration-500" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom browse strip between turns */}
        {!isLoading && (
          <div className="px-3.5 py-1.5 bg-zinc-950/40 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
            <span className="text-[11px] text-zinc-500 font-mono">
              Autentisk leirkilde: {item.badgeLabel}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevItem}
                className="p-1 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                title="Forrige kildemateriale"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleNextItem}
                className="p-1 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                title="Neste kildemateriale"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Enlarged Modal for Detailed Investigation */}
      {selectedSceneForModal !== null && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-zinc-900 border border-zinc-700/80 rounded-2xl max-w-2xl w-full p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono text-amber-400 tracking-wider">
                  {item.dateOrCode}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-zinc-100">{item.title}</h3>
                <p className="text-xs text-zinc-400">{item.subtitle}</p>
              </div>

              <button
                type="button"
                onClick={handleCloseDetail}
                className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Large SVG Blueprint Canvas */}
            <div className="w-full bg-zinc-950 rounded-xl p-4 sm:p-6 border border-zinc-800 flex items-center justify-center min-h-[220px]">
              <div className="w-full max-w-lg">
                <ArchiveSvgIllustration type={item.svgType} isPulsing={false} isLarge={true} />
              </div>
            </div>

            {/* Context & LK20 relevance */}
            <div className="space-y-2 text-xs sm:text-sm text-zinc-300">
              <p className="leading-relaxed">{item.description}</p>

              <div className="bg-amber-950/30 border border-amber-800/40 p-3 rounded-xl text-amber-200 space-y-1">
                <span className="font-semibold text-amber-300 block text-xs">
                  Historisk sammenheng:
                </span>
                <p className="text-xs leading-relaxed text-zinc-300">{item.historicalFact}</p>
              </div>
            </div>

            {/* Navigation within modal */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 1, label: 'Leirkart' },
                  { id: 2, label: 'Pass/Dokument' },
                  { id: 3, label: 'Røde Kors' },
                  { id: 4, label: 'Brakke 104' },
                  { id: 5, label: 'Radio' },
                  { id: 6, label: 'Tunnel Harry' },
                ].map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => setSelectedSceneForModal(doc.id)}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium cursor-pointer transition-colors ${
                      item.sceneId === doc.id
                        ? 'bg-amber-400 text-zinc-950 font-bold'
                        : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {doc.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleCloseDetail}
                className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg font-medium cursor-pointer"
              >
                Lukk visning
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// SVG Visual Renderer for authentic architectural / map sketches
interface ArchiveSvgProps {
  type: ArchiveItem['svgType'];
  isPulsing?: boolean;
  isLarge?: boolean;
}

const ArchiveSvgIllustration: React.FC<ArchiveSvgProps> = ({
  type,
  isPulsing = false,
  isLarge = false,
}) => {
  const heightClass = isLarge ? 'h-48 sm:h-56' : 'h-28 sm:h-32';

  if (type === 'wire_map') {
    return (
      <svg
        viewBox="0 0 320 160"
        className={`w-full ${heightClass} text-amber-400/90 font-mono`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background Grid */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#27272a" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="320" height="160" fill="url(#grid)" />

        {/* Outer Fence */}
        <line x1="20" y1="20" x2="300" y2="20" stroke="#71717a" strokeWidth="2" strokeDasharray="4 2" />
        <line x1="20" y1="32" x2="300" y2="32" stroke="#71717a" strokeWidth="2" strokeDasharray="4 2" />
        <text x="160" y="15" textAnchor="middle" fill="#71717a" fontSize="8">DOBBELT PIGGTRÅDGJERDE (3 METER HØYT)</text>

        {/* Warning Wire Zone (Dead Zone) */}
        <rect x="20" y="32" width="280" height="24" fill="#ef4444" fillOpacity="0.08" />
        <line x1="20" y1="56" x2="300" y2="56" stroke="#f59e0b" strokeWidth="2" />
        <text x="160" y="50" textAnchor="middle" fill="#f59e0b" fontSize="9" fontWeight="bold">
          HVIT VARSELTRÅD (15 CM OVER BAKKEN)
        </text>

        {/* Watchtower at Corner */}
        <rect x="250" y="10" width="30" height="30" fill="#18181b" stroke="#f59e0b" strokeWidth="1.5" />
        <line x1="265" y1="10" x2="265" y2="40" stroke="#f59e0b" strokeWidth="1" />
        <circle cx="265" cy="25" r="3" fill={isPulsing ? '#ef4444' : '#f59e0b'} className={isPulsing ? 'animate-ping' : ''} />
        <text x="265" y="47" textAnchor="middle" fill="#a1a1aa" fontSize="7">VAKTTÅRN</text>

        {/* Searchlight Beam */}
        <polygon points="265,25 210,80 140,80" fill="#fbbf24" fillOpacity={isPulsing ? 0.25 : 0.12} />

        {/* Barrack Zone */}
        <rect x="40" y="80" width="80" height="40" fill="#18181b" stroke="#71717a" strokeWidth="1.5" />
        <text x="80" y="103" textAnchor="middle" fill="#e4e4e7" fontSize="8" fontWeight="bold">BRAKKE 104</text>
        <rect x="150" y="80" width="80" height="40" fill="#18181b" stroke="#3f3f46" strokeWidth="1" />
        <text x="190" y="103" textAnchor="middle" fill="#71717a" fontSize="8">BRAKKE 105</text>

        {/* North Indicator */}
        <circle cx="35" cy="135" r="10" stroke="#71717a" strokeWidth="1" />
        <line x1="35" y1="142" x2="35" y2="128" stroke="#f59e0b" strokeWidth="1.5" />
        <text x="35" y="125" textAnchor="middle" fill="#f59e0b" fontSize="7">N</text>
      </svg>
    );
  }

  if (type === 'committee_doc') {
    return (
      <svg
        viewBox="0 0 320 160"
        className={`w-full ${heightClass} text-zinc-300 font-mono`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="30" y="10" width="260" height="140" fill="#18181b" stroke="#71717a" strokeWidth="1.5" />
        <rect x="35" y="15" width="250" height="130" fill="#09090b" stroke="#3f3f46" strokeWidth="0.5" strokeDasharray="3 3" />

        <text x="160" y="32" textAnchor="middle" fill="#f59e0b" fontSize="10" fontWeight="bold" letterSpacing="2">
          DEUTSCHES REICH • VORLÄUFIGER AUSWEIS
        </text>
        <line x1="50" y1="38" x2="270" y2="38" stroke="#3f3f46" strokeWidth="1" />

        {/* Photo Box Placeholder */}
        <rect x="50" y="48" width="45" height="55" fill="#27272a" stroke="#71717a" strokeWidth="1" />
        <circle cx="72" cy="70" r="12" fill="#3f3f46" />
        <path d="M 58 95 Q 72 82 86 95" fill="#3f3f46" />
        <text x="72" y="112" textAnchor="middle" fill="#71717a" fontSize="7">H. ESPELID</text>

        {/* Fake Text Lines */}
        <text x="105" y="58" fill="#d4d4d8" fontSize="8">Navn: Halldor Espelid (sivil arbeider)</text>
        <text x="105" y="70" fill="#a1a1aa" fontSize="7">Yrke: Elektriker / Reisende montør</text>
        <text x="105" y="82" fill="#a1a1aa" fontSize="7">Reise: Sagan → Breslau → Stettin</text>
        <text x="105" y="94" fill="#a1a1aa" fontSize="7">Gyldig til: 31. März 1944</text>

        {/* Rubber Stamp Mockup */}
        <circle cx="235" cy="85" r="22" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 2" fill="#ef4444" fillOpacity="0.08" />
        <text x="235" y="82" textAnchor="middle" fill="#ef4444" fontSize="6" fontWeight="bold">KOMMANDANTUR</text>
        <text x="235" y="90" textAnchor="middle" fill="#ef4444" fontSize="7" fontWeight="bold">SAGAN</text>
        <text x="235" y="98" textAnchor="middle" fill="#ef4444" fontSize="5">GEPRÜFT</text>
      </svg>
    );
  }

  if (type === 'red_cross_manifest') {
    return (
      <svg
        viewBox="0 0 320 160"
        className={`w-full ${heightClass} text-zinc-300 font-mono`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="25" y="12" width="270" height="136" fill="#18181b" stroke="#71717a" strokeWidth="1.5" />

        {/* Red Cross Emblem */}
        <rect x="42" y="24" width="8" height="24" fill="#ef4444" />
        <rect x="34" y="32" width="24" height="8" fill="#ef4444" />
        <text x="70" y="38" fill="#fafafa" fontSize="11" fontWeight="bold">COMITÉ INTERNATIONAL GENÈVE</text>
        <text x="70" y="48" fill="#a1a1aa" fontSize="8">Pakkeseddel & Fordelingsprotokoll (1943)</text>

        <line x1="35" y1="56" x2="285" y2="56" stroke="#3f3f46" strokeWidth="1" />

        {/* Package Tins Layout */}
        <rect x="40" y="66" width="45" height="35" fill="#27272a" stroke="#f59e0b" strokeWidth="1" />
        <text x="62" y="82" textAnchor="middle" fill="#f59e0b" fontSize="7" fontWeight="bold">KLIM MILK</text>
        <text x="62" y="92" textAnchor="middle" fill="#71717a" fontSize="6">Tørrmelk</text>

        <rect x="95" y="66" width="45" height="35" fill="#27272a" stroke="#10b981" strokeWidth="1" />
        <text x="117" y="82" textAnchor="middle" fill="#10b981" fontSize="7" fontWeight="bold">D-BAR</text>
        <text x="117" y="92" textAnchor="middle" fill="#71717a" fontSize="6">Sjokolade</text>

        <rect x="150" y="66" width="45" height="35" fill="#27272a" stroke="#38bdf8" strokeWidth="1" />
        <text x="172" y="82" textAnchor="middle" fill="#38bdf8" fontSize="7" fontWeight="bold">SPAM / BEEF</text>
        <text x="172" y="92" textAnchor="middle" fill="#71717a" fontSize="6">Hermetikk</text>

        <rect x="205" y="66" width="75" height="55" fill="#09090b" stroke="#71717a" strokeWidth="1" strokeDasharray="2 2" />
        <text x="242" y="80" textAnchor="middle" fill="#f59e0b" fontSize="7" fontWeight="bold">FLUKTLAGER</text>
        <text x="242" y="92" textAnchor="middle" fill="#a1a1aa" fontSize="6">30% til X-komiteen</text>
        <text x="242" y="102" textAnchor="middle" fill="#71717a" fontSize="6">for nødproviant</text>

        <text x="40" y="125" fill="#e4e4e7" fontSize="8">
          Regel: Alt legges på fellesbordet. Ingen beholder mat for seg selv.
        </text>
      </svg>
    );
  }

  if (type === 'barrack_cross_section') {
    return (
      <svg
        viewBox="0 0 320 160"
        className={`w-full ${heightClass} text-zinc-300 font-mono`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Ground Surface */}
        <line x1="10" y1="65" x2="310" y2="65" stroke="#71717a" strokeWidth="2" />
        <text x="280" y="60" textAnchor="end" fill="#71717a" fontSize="7">BAKKENIVÅ</text>

        {/* Brick Piers (Pillars under barrack to prevent digging) */}
        <rect x="40" y="45" width="12" height="20" fill="#b45309" stroke="#78350f" />
        <rect x="110" y="45" width="12" height="20" fill="#b45309" stroke="#78350f" />
        <rect x="180" y="45" width="12" height="20" fill="#b45309" stroke="#78350f" />
        <rect x="250" y="45" width="12" height="20" fill="#b45309" stroke="#78350f" />
        <text x="145" y="58" textAnchor="middle" fill="#a1a1aa" fontSize="6">ÅPENT ROM UNDER BRAKKEN (60 CM)</text>

        {/* Barrack 104 Floor & Room */}
        <rect x="30" y="20" width="240" height="25" fill="#18181b" stroke="#a1a1aa" strokeWidth="1.5" />
        <text x="65" y="36" fill="#e4e4e7" fontSize="8" fontWeight="bold">BRAKKE 104 (ROM 23)</text>

        {/* Cast Iron Stove over Shaft */}
        <rect x="185" y="22" width="22" height="20" fill="#3f3f46" stroke="#f59e0b" strokeWidth="1.5" />
        <text x="196" y="15" textAnchor="middle" fill="#f59e0b" fontSize="7" fontWeight="bold">OVN PÅ SKINNER</text>

        {/* Vertical Shaft Trapdoor */}
        <line x1="185" y1="45" x2="207" y2="45" stroke="#ef4444" strokeWidth="2" strokeDasharray="2 1" />

        {/* Vertical 30ft Shaft down through sand */}
        <rect x="187" y="45" width="18" height="90" fill="#09090b" stroke="#f59e0b" strokeWidth="1.5" />
        <line x1="187" y1="65" x2="205" y2="65" stroke="#52525b" strokeWidth="1" />
        <line x1="187" y1="85" x2="205" y2="85" stroke="#52525b" strokeWidth="1" />
        <line x1="187" y1="105" x2="205" y2="105" stroke="#52525b" strokeWidth="1" />
        <line x1="187" y1="125" x2="205" y2="125" stroke="#52525b" strokeWidth="1" />
        <text x="215" y="95" fill="#f59e0b" fontSize="7">9 METER NED</text>

        {/* Start of Horizontal Tunnel */}
        <rect x="10" y="130" width="177" height="18" fill="#09090b" stroke="#f59e0b" strokeWidth="1.5" />
        <text x="100" y="142" textAnchor="middle" fill="#fbbf24" fontSize="8" fontWeight="bold">
          TUNNEL «HARRY» MOT SKOGEN →
        </text>
      </svg>
    );
  }

  if (type === 'radio_schematic') {
    return (
      <svg
        viewBox="0 0 320 160"
        className={`w-full ${heightClass} text-zinc-300 font-mono`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="25" y="12" width="270" height="136" fill="#18181b" stroke="#71717a" strokeWidth="1.5" />

        <text x="160" y="32" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="bold" letterSpacing="1">
          KORTBØLGEMOTTAKER • BBC LONDON 1500 KHZ
        </text>

        {/* Accordion Hidden Chamber */}
        <rect x="40" y="45" width="95" height="85" fill="#09090b" stroke="#38bdf8" strokeWidth="1.5" />
        <path d="M 40 45 L 60 55 L 70 45 L 80 55 L 90 45 L 100 55 L 110 45 L 120 55 L 135 45" stroke="#52525b" strokeWidth="1.5" />
        <text x="87" y="80" textAnchor="middle" fill="#e4e4e7" fontSize="8" fontWeight="bold">TREKKSPILL</text>
        <text x="87" y="92" textAnchor="middle" fill="#71717a" fontSize="7">Hult kammer</text>

        {/* Radio Tuning Circuit inside */}
        <circle cx="87" cy="110" r="10" stroke="#38bdf8" strokeWidth="1" />
        <line x1="87" y1="110" x2="93" y2="105" stroke="#38bdf8" strokeWidth="1.5" />

        {/* Antenna wire & Headphone */}
        <line x1="135" y1="85" x2="175" y2="85" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 2" />
        <circle cx="185" cy="85" r="8" stroke="#f59e0b" strokeWidth="1.5" />
        <text x="185" y="88" textAnchor="middle" fill="#f59e0b" fontSize="6">ØRE</text>

        {/* Radio Wave Pulses */}
        <path d="M 210 65 Q 225 85 210 105" stroke="#38bdf8" strokeWidth="1.5" fill="none" />
        <path d="M 220 55 Q 240 85 220 115" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="2 2" fill="none" />

        <text x="215" y="135" fill="#a1a1aa" fontSize="7">Kildekritikk:</text>
        <text x="215" y="143" fill="#10b981" fontSize="7" fontWeight="bold">Radio = Sannhet</text>
      </svg>
    );
  }

  // tunnel_blueprint default
  return (
    <svg
      viewBox="0 0 320 160"
      className={`w-full ${heightClass} text-zinc-300 font-mono`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Ground Surface */}
      <line x1="10" y1="35" x2="310" y2="35" stroke="#71717a" strokeWidth="2" />
      <text x="35" y="28" fill="#71717a" fontSize="7">LEIRBAKKE (SNØ)</text>
      <text x="280" y="28" textAnchor="end" fill="#10b981" fontSize="7">SKOGEN (MÅL)</text>

      {/* Pine Trees at End */}
      <polygon points="270,35 280,10 290,35" fill="#14532d" />
      <polygon points="290,35 300,12 310,35" fill="#14532d" />

      {/* Shaft Down */}
      <rect x="25" y="35" width="20" height="90" fill="#09090b" stroke="#f59e0b" strokeWidth="1.5" />
      <text x="35" y="80" textAnchor="middle" fill="#f59e0b" fontSize="7" transform="rotate(-90 35 80)">BRAKKE 104</text>

      {/* Long Horizontal Tunnel Harry */}
      <rect x="45" y="115" width="205" height="16" fill="#09090b" stroke="#f59e0b" strokeWidth="1.5" />

      {/* Wooden Trolley Tracks inside */}
      <line x1="45" y1="128" x2="250" y2="128" stroke="#71717a" strokeWidth="1" strokeDasharray="4 3" />
      <text x="140" y="126" textAnchor="middle" fill="#fbbf24" fontSize="8" fontWeight="bold">
        TUNNEL «HARRY» (102 METER)
      </text>

      {/* Shaft Up (30m too short!) */}
      <rect x="235" y="35" width="15" height="80" fill="#09090b" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 2" />
      <text x="242" y="75" textAnchor="middle" fill="#ef4444" fontSize="6" transform="rotate(90 242 75)">UTGANG I SNØ</text>

      {/* Watchtower Searchlight hitting exit */}
      <polygon points="180,10 230,35 255,35" fill="#fbbf24" fillOpacity={isPulsing ? 0.35 : 0.15} />
      <circle cx="242" cy="35" r="4" fill="#ef4444" />
      <text x="242" y="24" textAnchor="middle" fill="#ef4444" fontSize="6" fontWeight="bold">30 METER FOR KORT!</text>
    </svg>
  );
};
