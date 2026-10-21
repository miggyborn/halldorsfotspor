import React, { useState } from 'react';
import { APP_IDEAS } from '../data/appIdeas';
import { Radio, Map, BarChart2, BookOpen, ArrowRight, ShieldCheck, Clock, Users, Sparkles, Check } from 'lucide-react';

interface AppIdeasViewProps {
  onSelectPrompt: (templateKey: string) => void;
  onLaunchSimulator: () => void;
}

export const AppIdeasView: React.FC<AppIdeasViewProps> = ({ onSelectPrompt, onLaunchSimulator }) => {
  const [selectedIdeaId, setSelectedIdeaId] = useState<string>(APP_IDEAS[0].id);
  const activeIdea = APP_IDEAS.find((i) => i.id === selectedIdeaId) || APP_IDEAS[0];

  const getIdeaIcon = (id: string) => {
    switch (id) {
      case 'walkie_talkie_roleplay':
        return <Radio className="w-5 h-5 text-amber-500" />;
      case 'kartlab_kildejakt':
        return <Map className="w-5 h-5 text-sky-500" />;
      case 'laerer_cockpit':
        return <BarChart2 className="w-5 h-5 text-emerald-500" />;
      case 'askoy_minnereise':
        return <BookOpen className="w-5 h-5 text-indigo-500" />;
      default:
        return <Radio className="w-5 h-5 text-amber-500" />;
    }
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 text-slate-100">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
          {/* Left Column: Context & Editorial */}
          <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between z-10">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
                <span>HISTORIE & SAMFUNNSFAG 9.–10. TRINN</span>
                <span aria-hidden="true">·</span>
                <span>LK20 LÆREPLAN</span>
                <span aria-hidden="true">·</span>
                <span>ASKØY & STALAG LUFT III</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
                Fra spillveileder til ferdig KI-applikasjon
              </h1>
              <p className="text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed">
                Basert på det pedagogiske opplegget om <strong className="text-white">Halldor Espelid</strong> (22 år, Spitfire-flyger fra Askøy i Stalag Luft III). Her er fire gjennomarbeidede app-arkitekturer, en kjørbar simulator og en komplett KI-byggeprompt for en annen AI.
              </p>
            </div>

            <div className="pt-6 border-t border-slate-800 flex flex-wrap items-center gap-4">
              <button
                onClick={onLaunchSimulator}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors shadow-sm flex items-center gap-2"
              >
                <span>Prøv spillet i simulatoren</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onSelectPrompt('builder_walkie_talkie')}
                className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Generer KI-byggeprompt</span>
              </button>
            </div>
          </div>

          {/* Right Column: Hero Visual Asset */}
          <div className="lg:col-span-5 relative min-h-[300px] lg:min-h-full">
            <img
              src="/src/assets/images/stalag_luft_camp_winter_1792403213761.jpg"
              alt="Stalag Luft III fangeleir i vintersnø med vakttårn og varselstråd"
              className="absolute inset-0 w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-slate-900 via-slate-900/40 to-transparent"></div>
            
            <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-slate-950/80 backdrop-blur-sm border border-slate-800/80 text-xs text-slate-300">
              <div className="font-semibold text-slate-100 flex items-center gap-2 mb-1">
                <span>Stalag Luft III (1943–1944)</span>
                <span className="text-slate-500">·</span>
                <span className="text-amber-400">Żagań, Polen</span>
              </div>
              <p className="line-clamp-2 text-slate-400">
                To høye piggtrådgjerder, lav varselstråd, mikrofoner i bakken og 76 offiserer som rømte gjennom tunnelen «Harry».
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Idea Navigation Tabs */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Fire app-konsepter for klasserommet</h2>
            <p className="text-sm text-slate-500">Velg et konsept for å utforske arkitektur, spillmekanikk og teknisk oppbygning</p>
          </div>
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg overflow-x-auto">
            {APP_IDEAS.map((idea) => {
              const isActive = idea.id === selectedIdeaId;
              return (
                <button
                  key={idea.id}
                  onClick={() => setSelectedIdeaId(idea.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors flex items-center gap-2 ${
                    isActive ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {getIdeaIcon(idea.id)}
                  <span>{idea.title.split(':')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Idea Deep Dive Box */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Header of Active Idea */}
          <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/50">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                  <span>{activeIdea.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeIdea.targetAudience}</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900">{activeIdea.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{activeIdea.description}</p>
              </div>

              <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
                <button
                  onClick={() => onSelectPrompt(activeIdea.promptTemplateKey)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Kopier KI-prompt for denne</span>
                </button>
                {activeIdea.id === 'walkie_talkie_roleplay' && (
                  <button
                    onClick={onLaunchSimulator}
                    className="px-4 py-2 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <Radio className="w-3.5 h-3.5 text-amber-500" />
                    <span>Start simulering nå</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Grid of Details */}
          <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Core Mechanics */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Radio className="w-4 h-4 text-amber-500" />
                <span>Kjernemekanikk & Flyt</span>
              </div>
              <ul className="space-y-2.5">
                {activeIdea.coreMechanics.map((mech, i) => (
                  <li key={i} className="text-xs text-slate-600 flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-amber-50 text-amber-700 font-mono text-[11px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{mech}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pedagogical Benefits & LK20 */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Pedagogisk Utbytte (LK20)</span>
              </div>
              <ul className="space-y-2.5">
                {activeIdea.pedagogicalBenefits.map((benefit, i) => (
                  <li key={i} className="text-xs text-slate-600 flex items-start gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3" />
                    </div>
                    <span className="leading-relaxed">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tech Stack & Challenges */}
            <div className="lg:col-span-4 space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Clock className="w-4 h-4 text-sky-500" />
                  <span>Teknologistakk</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {activeIdea.techStack.map((tech, i) => (
                    <span key={i} className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 rounded-md">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Users className="w-4 h-4 text-indigo-500" />
                  <span>Utfordringer & Løsning</span>
                </div>
                {activeIdea.challengesAndMitigations.map((item, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-lg text-xs space-y-1 border border-slate-100">
                    <div className="font-semibold text-slate-800">Utfordring: {item.challenge}</div>
                    <div className="text-slate-600">Løsning: {item.solution}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Grid */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Oversikt og sammenligning</h2>
          <p className="text-sm text-slate-500">Hvilken app-idé passer best for dine elevers behov og klasseromsramme?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {APP_IDEAS.map((idea) => {
            const isSelected = idea.id === selectedIdeaId;
            return (
              <div
                key={idea.id}
                onClick={() => setSelectedIdeaId(idea.id)}
                className={`cursor-pointer p-5 rounded-xl border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-amber-50/40 border-amber-300 shadow-sm ring-1 ring-amber-300'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-lg bg-slate-100">{getIdeaIcon(idea.id)}</span>
                    <span className="text-[11px] font-mono text-slate-500">{idea.category.split('&')[0]}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{idea.title}</h4>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{idea.tagline}</p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">{idea.targetAudience.split('(')[0]}</span>
                  <span className="font-semibold text-amber-700 flex items-center gap-1">
                    <span>Utforsk</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Askøy & Historical Context Card */}
      <section className="p-6 sm:p-8 rounded-2xl bg-stone-900 border border-stone-800 text-stone-200">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-8 space-y-3">
            <div className="text-xs font-mono text-amber-400">LOKALHISTORISK FORANKRING</div>
            <h3 className="text-2xl font-bold text-white tracking-tight">Hvem var Halldor Espelid?</h3>
            <p className="text-sm text-stone-300 leading-relaxed">
              Halldor ble født på <strong>Askøy ved Bergen i 1920</strong>. Han rømte fra det okkuperte Norge med skøyta «Traust» over Nordsjøen, utdannet seg til Spitfire-jagerflyger i Canada og ble skutt ned over Frankrike som 21-åring. Hans søster Ingrid Espelid Hovig ble senere en av Norges mest folkekjære skikkelser. Halldor ble drept av Gestapo etter flukten fra Stalag Luft III – en historisk krigsforbrytelse.
            </p>
          </div>
          <div className="md:col-span-4 flex justify-center">
            <div className="relative w-36 h-36 rounded-xl overflow-hidden border-2 border-stone-700 shadow-md">
              <img
                src="/src/assets/images/halldor_norwegian_aviator_1792403215001.jpg"
                alt="Halldor Espelid, Spitfire-pilot"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
