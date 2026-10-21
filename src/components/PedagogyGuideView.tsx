import React, { useState } from 'react';
import { SCENES, TRUST_LADDER_STEPS, HISTORICAL_FACTS, COMPETENCE_GOALS } from '../data/gameContent';
import { BookOpen, ShieldAlert, CheckCircle, Clock, FileText, ChevronDown, ChevronUp } from 'lucide-react';

export const PedagogyGuideView: React.FC = () => {
  const [expandedSceneId, setExpandedSceneId] = useState<number | null>(1);

  const toggleScene = (id: number) => {
    setExpandedSceneId(expandedSceneId === id ? null : id);
  };

  return (
    <div className="space-y-10 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="space-y-2">
        <div className="text-xs font-mono text-amber-600 font-semibold uppercase tracking-wider">
          Pedagogisk Veileder · 9.–10. trinn historie
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          I Halldors fotspor – Fullstendig Spillveileder & LK20-Matrise
        </h2>
        <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
          Strukturert referanse basert på det offisielle 9-siders opplegget. Gir læreren og spillmotoren detaljert innsikt i historiske rammer, regler, vurderingskriterier og kilder.
        </p>
      </div>

      {/* Chapter 1 & 2: OVER Rule & Pacing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <span className="w-2 h-2 rounded-xs bg-amber-500"></span>
            <span>1. OVER-regelen: Hvem snakker når?</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Spillet fungerer som en radiosamtale. Elevene snakker sammen og bestemmer seg. Når de er ferdige, sier eller skriver de <strong>OVER</strong>. Da, og bare da, har KI-en lov til å svare.
          </p>
          <ul className="text-xs text-slate-600 space-y-2">
            <li className="flex items-start gap-2">
              <span className="font-bold text-slate-800">• Uten OVER:</span>
              <span>Ikke bland deg inn. Svar bare «Lytter.» (ett ord) eller vent.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-slate-800">• Med OVER:</span>
              <span>Fortell hva som skjer, 2–5 setninger (maks 60 ord). Avslutt med: «Hva gjør Halldor?»</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-slate-800">• Uenighet:</span>
              <span>«Jeg hørte to forslag. Hvilket velger dere? Si OVER når dere er klare.»</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-slate-800">• Innblanding:</span>
              <span>Kun ved passivitet over 4–5 meldinger eller urealistiske påfunn (magi, fly).</span>
            </li>
          </ul>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Clock className="w-4 h-4 text-sky-500" />
            <span>2. Tid og tempo: 10–15 minutter</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Spillet er tidsstyrt for å simulere leirens stramme tidsdisiplin og passe inn i en standard skoletime.
          </p>
          <div className="space-y-2 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-lg flex items-center justify-between">
              <span className="font-semibold text-slate-800">Start (ca. 1 min)</span>
              <span className="text-slate-500">Forklar OVER-regelen, spør om navn</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg flex items-center justify-between">
              <span className="font-semibold text-slate-800">Scene 1–5 (ca. 1–1,5 min hver)</span>
              <span className="text-slate-500">Kort fortelling, ett valg, kort svar (5 valg)</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg flex items-center justify-between">
              <span className="font-semibold text-slate-800">Scene 6 (ca. 2,5 min)</span>
              <span className="text-slate-500">Natten og utgangen: To raske valg</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg flex items-center justify-between">
              <span className="font-semibold text-slate-800">Slutt (ca. 2–3 min)</span>
              <span className="text-slate-500">Ut av rollen, oppsummering av LK20</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chapter 3 & 4: Win/Lose & Trust Ladder */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            <span>3. Slik vinner og taper elevene: Dødsvalg & Tillitsstigen</span>
          </div>
          <p className="text-xs text-slate-600">
            Elevene vinner ved å komme seg ut av tunnelen «Harry» og til skogkanten i Scene 6. De taper på to måter:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Method A: Death choices */}
          <div className="p-4 rounded-xl bg-red-50/60 border border-red-200 text-xs space-y-3">
            <div className="font-bold text-red-900 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span>A. Dødsvalg (Spillet slutter umiddelbart)</span>
            </div>
            <p className="text-slate-700 leading-relaxed">
              Hvis elevene gjør handlinger som i 1943–44 ville ført til at vaktene skjøt (krysser varselstråden, bruker våpen mot væpnet vakt, reiser seg og løper i åpent snødekke ved vakttårnet).
            </p>
            <div className="p-3 bg-white rounded-lg border border-red-200 text-slate-800 italic">
              «Vakten roper. Så blir alt stille. Spillet er slutt.»
            </div>
            <p className="text-slate-600">
              Aldri grafisk eller med detaljer om blod. Skift rolig til ut-av-rollen, forklar hvorfor og gi mulighet for omstart.
            </p>
          </div>

          {/* Method B: 4-step ladder */}
          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 text-xs space-y-3">
            <div className="font-bold text-amber-900 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>B. Trinn 4: Ingen mat, for svak, taper</span>
            </div>
            <p className="text-slate-700 leading-relaxed">
              Maten fra tyskerne var knapp. Fangene overlevde på Røde Kors-pakkene. Mister Halldor tilliten i brakken, mister han maten og blir for svak til å krype i tunnelen.
            </p>
            <div className="space-y-1.5 font-mono text-[11px]">
              {Object.values(TRUST_LADDER_STEPS).map((s) => (
                <div key={s.level} className="flex items-center justify-between p-1.5 bg-white rounded border border-amber-100">
                  <span className="font-bold text-slate-900">Trinn {s.level}: {s.title}</span>
                  <span className="text-slate-500 text-[10px]">{s.danger ? 'FARLIG' : 'Rolig'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chapter 5: Complete Scene Scripts */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">5. De seks scenene med fasit</h3>
            <p className="text-xs text-slate-500">Klikk på en scene for å se fast fortelling, valg, hint og konsekvenser</p>
          </div>
        </div>

        <div className="space-y-3">
          {SCENES.map((sc) => {
            const isExpanded = expandedSceneId === sc.id;
            return (
              <div key={sc.id} className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleScene(sc.id)}
                  className="w-full p-4 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center">
                      {sc.id}
                    </span>
                    <div>
                      <div className="text-sm font-bold text-slate-900">{sc.title}</div>
                      <div className="text-xs text-slate-500">{sc.dateOrPeriod}</div>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </button>

                {isExpanded && (
                  <div className="p-5 border-t border-slate-200 space-y-4 text-xs bg-white">
                    <div>
                      <span className="font-bold text-slate-800 block mb-1">Fast fortelling (leses nesten ordrett):</span>
                      <p className="text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed italic">
                        «{sc.description}»
                      </p>
                    </div>

                    <div>
                      <span className="font-bold text-slate-800 block mb-1">Spørsmål og hint:</span>
                      <p className="text-slate-700 font-medium">
                        {sc.question} <span className="text-amber-700 font-normal">Hint: «{sc.hint}»</span>
                      </p>
                    </div>

                    <div>
                      <span className="font-bold text-slate-800 block mb-2">Valgalternativer og konsekvenser:</span>
                      <div className="space-y-2">
                        {sc.options.map((opt) => (
                          <div
                            key={opt.id}
                            className={`p-2.5 rounded-lg border flex items-start justify-between gap-3 ${
                              opt.isWise
                                ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                                : opt.isDeath
                                ? 'bg-red-50/50 border-red-200 text-red-950'
                                : 'bg-amber-50/50 border-amber-200 text-amber-950'
                            }`}
                          >
                            <div>
                              <span className="font-bold mr-1.5">{opt.id})</span>
                              <span>{opt.text}</span>
                              <div className="text-[11px] text-slate-600 mt-1 italic">
                                Respons: {opt.feedbackText}
                              </div>
                            </div>
                            <span className="shrink-0 font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-white border">
                              {opt.isWise ? 'Klokt' : opt.isDeath ? 'DØDSVALG' : 'Dumt'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Chapter 6: Real History */}
      <div className="bg-stone-900 text-stone-200 p-6 sm:p-8 rounded-2xl border border-stone-800 space-y-6">
        <div className="space-y-1">
          <div className="text-xs font-mono text-amber-400">HISTORISK SANNHET (IKKE DIKTET)</div>
          <h3 className="text-2xl font-bold text-white tracking-tight">Hva som skjedde i virkeligheten</h3>
          <p className="text-xs text-stone-300">
            Dette er de historiske faktaene læreren og KI-en skal presentere i ut-av-rollen debriefen etter spillet:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-stone-300 leading-relaxed">
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm">Om Halldor Espelid</h4>
            <p>
              Født 6. oktober 1920 på Askøy ved Bergen. Gikk lange turer på Hardangervidda som tenåring. Høsten 1940 rømte han fra det okkuperte Norge med skøyta «Traust» over Nordsjøen til Storbritannia.
            </p>
            <p>
              Utdannet som jagerflyger i Canada («Little Norway»). Fløy Supermarine Spitfire i den norske 331-skvadronen. Skutt ned over Frankrike 27. august 1942, bare 21 år gammel. Overført til Stalag Luft III i april 1943 med fangenummer 643.
            </p>
            <p>
              Nære venner i leiren: Nils Jørgen Fuglesang (fra Florø), Jens Müller og Per Bergsland.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm">Leiren, Flukten og Henrettelsen</h4>
            <p>
              Stalag Luft III lå nær Sagan (nå Żagań i Polen). Offiserer ble beskyttet av Genèvekonvensjonen fra 1929 og fikk Røde Kors-pakker. Rømning ble sett på som en militær plikt ledet av Roger Bushell («Big X»).
            </p>
            <p>
              Tunnelen «Harry» ble brukt natten til 25. mars 1944. 76 menn kom ut. Halldor og Nils Fuglesang ble tatt nær Flensburg etter få dager. Etter direkte ordre fra Adolf Hitler ble 50 av de 76 offiserene henrettet av Gestapo. Halldor døde 29. mars 1944, 23 år gammel – en krigsforbrytelse.
            </p>
            <p>
              Søsteren Ingrid Espelid Hovig ble senere Norges mest kjente fjernsynskokk. Broren Mons Espelid ble stortingsrepresentant.
            </p>
          </div>
        </div>
      </div>

      {/* Chapter 8: LK20 Competence Matrix */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div>
          <h3 className="text-xl font-bold text-slate-900">8. LK20 Læreplanmål (Samfunnsfag & Norsk)</h3>
          <p className="text-xs text-slate-500">
            Nivåer angis med ord, ikke karakter: «godt synlig», «delvis synlig» eller «ikke vist ennå».
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {COMPETENCE_GOALS.map((goal) => (
            <div key={goal.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">{goal.title}</span>
                <span className="text-[10px] font-mono text-slate-500">{goal.curriculumCode}</span>
              </div>
              <p className="text-slate-600 leading-relaxed">{goal.description}</p>
              <div className="pt-2 border-t border-slate-200/60 text-slate-700">
                <span className="font-semibold text-slate-800">Se etter: </span>
                <span>{goal.lookFor}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
