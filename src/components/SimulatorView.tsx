import React, { useState, useEffect, useRef } from 'react';
import { SCENES, TRUST_LADDER_STEPS, HISTORICAL_FACTS, COMPETENCE_GOALS } from '../data/gameContent';
import { TrustLadderLevel, ChoiceOption } from '../types/game';
import { playRadioClick, playRadioSquelch, playRogerBeep, playDangerChime } from '../utils/audio';
import { Radio, AlertTriangle, Volume2, VolumeX, RotateCcw, CheckCircle2, Copy, Check, Users, Info } from 'lucide-react';

export const SimulatorView: React.FC = () => {
  // Game Setup
  const [student1, setStudent1] = useState('Mia');
  const [student2, setStudent2] = useState('Jonas');
  const [hasStarted, setHasStarted] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Runtime State
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isSecondChoiceActive, setIsSecondChoiceActive] = useState(false);
  const [ladderLevel, setLadderLevel] = useState<TrustLadderLevel>(0);
  const [messages, setMessages] = useState<{ sender: 'ki' | 'elever'; text: string; timestamp: string }[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameOutcome, setGameOutcome] = useState<'won' | 'death' | 'ladder_out' | 'declined' | null>(null);
  const [deathReason, setDeathReason] = useState('');
  const [showRealHistory, setShowRealHistory] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Timer Ref
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Elapsed timer
  useEffect(() => {
    if (!hasStarted || isGameOver) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [hasStarted, isGameOver]);

  const currentScene = SCENES[currentSceneIndex] || SCENES[0];
  const activeOptions = isSecondChoiceActive && currentScene.secondOptions ? currentScene.secondOptions : currentScene.options;

  // Sound helpers
  const triggerSquelch = () => {
    if (soundEnabled) playRadioSquelch();
  };
  const triggerBeep = () => {
    if (soundEnabled) playRogerBeep();
  };
  const triggerDanger = () => {
    if (soundEnabled) playDangerChime();
  };

  // Start game handler
  const handleStartGame = () => {
    setHasStarted(true);
    setElapsedSeconds(0);
    setLadderLevel(0);
    setCurrentSceneIndex(0);
    setIsSecondChoiceActive(false);
    setIsGameOver(false);
    setGameOutcome(null);
    setShowRealHistory(false);

    triggerSquelch();

    const welcomeMsg = `Det er 8. april 1943. Dere er Halldor Espelid, 22 år, norsk flyger. Mac, en erfaren fange, sier: «Aldri over den lave tråden. Aldri et ord om rømning. Og vi deler maten.» Så ruller en ball mot tråden, og en ung fange løper etter den. Vakten i tårnet løfter geværet. Hva gjør Halldor? (Si eller skriv OVER når dere er klare)`;

    setMessages([
      {
        sender: 'ki',
        text: welcomeMsg,
        timestamp: '00:00',
      },
    ]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Student talk WITHOUT over (rule 1 test)
  const handleSendWithoutOver = () => {
    if (!currentInput.trim()) return;
    triggerSquelch();

    const studentMsg = currentInput.trim();
    setMessages((prev) => [
      ...prev,
      { sender: 'elever', text: studentMsg, timestamp: formatTime(elapsedSeconds) },
      { sender: 'ki', text: 'Lytter.', timestamp: formatTime(elapsedSeconds + 1) },
    ]);
    setCurrentInput('');
  };

  // Process choice execution
  const executeChoice = (option: ChoiceOption, customNote?: string) => {
    triggerSquelch();

    const studentText = customNote
      ? `${customNote} - Vi velger ${option.id}: ${option.text} OVER.`
      : `Vi velger ${option.id}: ${option.text} OVER.`;

    const nextMessages = [...messages, { sender: 'elever' as const, text: studentText, timestamp: formatTime(elapsedSeconds) }];

    // Handle Death Choice
    if (option.triggerDeath || option.isDeath) {
      triggerDanger();
      const deathMsg =
        option.feedbackText ||
        'Halldor tar et skritt over tråden. Vakten i tårnet roper. Så blir alt stille. Spillet er slutt.';

      setMessages([
        ...nextMessages,
        {
          sender: 'ki',
          text: deathMsg,
          timestamp: formatTime(elapsedSeconds + 1),
        },
      ]);
      setDeathReason(deathMsg);
      setIsGameOver(true);
      setGameOutcome('death');
      return;
    }

    // Handle Voluntary Quit
    if (option.triggerQuit) {
      setMessages([
        ...nextMessages,
        {
          sender: 'ki',
          text: 'Nils nikker alvorlig: «Forstått, Halldor. Rømning er en plikt for mange, men komiteen tvinger ingen.» Dere trer ut av rømningsapparatet. Spillet er fullført uten rømningsforsøk.',
          timestamp: formatTime(elapsedSeconds + 1),
        },
      ]);
      setIsGameOver(true);
      setGameOutcome('declined');
      return;
    }

    // Update Ladder
    let newLadder = ladderLevel;
    if (option.ladderChange !== 0) {
      newLadder = Math.max(0, Math.min(4, ladderLevel + option.ladderChange)) as TrustLadderLevel;
      setLadderLevel(newLadder);
      if (option.ladderChange > 0) {
        triggerDanger();
      } else {
        triggerBeep();
      }
    } else {
      triggerBeep();
    }

    // Check if ladder reached 4 (Starvation / Excluded)
    if (newLadder === 4) {
      const starvationMsg =
        'Dagene går. Brakkelaget har stengt Halldor ute fra felles mat. Med tyskernes knappe rasjoner blir han svakere for hver uke. Til slutt orker han ikke lenger å stå opp til oppropet eller krype gjennom tunnelen. Spillet er slutt.';
      setMessages([
        ...nextMessages,
        {
          sender: 'ki',
          text: starvationMsg,
          timestamp: formatTime(elapsedSeconds + 1),
        },
      ]);
      setIsGameOver(true);
      setGameOutcome('ladder_out');
      return;
    }

    // Scene Progression
    if (currentScene.id === 6 && !isSecondChoiceActive) {
      // Move to Scene 6 Part 2
      setIsSecondChoiceActive(true);
      const part2Msg = `${option.feedbackText}\n\n${currentScene.secondQuestion} (Husk å avslutte med OVER)`;
      setMessages([
        ...nextMessages,
        {
          sender: 'ki',
          text: part2Msg,
          timestamp: formatTime(elapsedSeconds + 2),
        },
      ]);
      setCurrentInput('');
      return;
    }

    if (currentScene.id === 6 && isSecondChoiceActive) {
      // Completed Scene 6 Part 2
      const winMsg = `${option.feedbackText}\n\nDu kommer til skogkanten. Nils er ved siden av deg. Dere har kommet ut av tunnelen «Harry»! Nå begynner flukten. Dere vet ikke hva som venter i snøen. Spillet er vunnet!`;
      setMessages([
        ...nextMessages,
        {
          sender: 'ki',
          text: winMsg,
          timestamp: formatTime(elapsedSeconds + 2),
        },
      ]);
      setIsGameOver(true);
      setGameOutcome('won');
      setCurrentInput('');
      return;
    }

    // Advance to next scene (1 -> 2 -> 3 -> 4 -> 5 -> 6)
    const nextIndex = currentSceneIndex + 1;
    if (nextIndex < SCENES.length) {
      const nextSc = SCENES[nextIndex];
      setCurrentSceneIndex(nextIndex);
      setIsSecondChoiceActive(false);

      const nextScMsg = `${option.feedbackText}\n\n[${nextSc.dateOrPeriod}: ${nextSc.title}]\n${nextSc.description}\n\n${nextSc.question} Hint: «${nextSc.hint}» (Husk OVER når dere er klare)`;

      setMessages([
        ...nextMessages,
        {
          sender: 'ki',
          text: nextScMsg,
          timestamp: formatTime(elapsedSeconds + 2),
        },
      ]);
      setCurrentInput('');
    }
  };

  // Handle free text with OVER
  const handleSendWithOver = () => {
    if (!currentInput.trim()) return;
    const cleanInput = currentInput.trim();

    // Check if input references A, B, C or D
    const upper = cleanInput.toUpperCase();
    let matchedOption: ChoiceOption | undefined;

    if (upper.includes('VALG A') || upper.startsWith('A') || upper.includes('ALTERNATIV A')) {
      matchedOption = activeOptions.find((o) => o.id === 'A');
    } else if (upper.includes('VALG B') || upper.startsWith('B') || upper.includes('ALTERNATIV B')) {
      matchedOption = activeOptions.find((o) => o.id === 'B');
    } else if (upper.includes('VALG C') || upper.startsWith('C') || upper.includes('ALTERNATIV C')) {
      matchedOption = activeOptions.find((o) => o.id === 'C');
    } else if (upper.includes('VALG D') || upper.startsWith('D') || upper.includes('ALTERNATIV D')) {
      matchedOption = activeOptions.find((o) => o.id === 'D');
    }

    if (matchedOption) {
      executeChoice(matchedOption, cleanInput.replace(/over/gi, '').trim());
    } else {
      // General input with OVER: AI acts as GM asking for clear choice
      triggerSquelch();
      setMessages((prev) => [
        ...prev,
        { sender: 'elever', text: `${cleanInput} OVER.`, timestamp: formatTime(elapsedSeconds) },
        {
          sender: 'ki',
          text: `Halldor vurderer dette. Men situasjonen krever et klart valg. Hva velger dere: ${activeOptions.map((o) => `${o.id}) ${o.text}`).join(' eller ')}? Si OVER når dere er enige.`,
          timestamp: formatTime(elapsedSeconds + 1),
        },
      ]);
      setCurrentInput('');
    }
  };

  // Restart from scene
  const handleRestartFromScene = () => {
    setIsGameOver(false);
    setGameOutcome(null);
    setDeathReason('');
    const restartMsg = `La oss spole litt tilbake. Dere står igjen overfor valget:\n${currentScene.question} Hva gjør Halldor? (Husk OVER når dere har bestemt dere)`;
    setMessages((prev) => [
      ...prev,
      {
        sender: 'ki',
        text: restartMsg,
        timestamp: formatTime(elapsedSeconds),
      },
    ]);
  };

  const generateReportText = () => {
    return `KOMPETANSEVURDERING (LK20) - I HALLDORS FOTSPOR
Elever: ${student1} og ${student2}
Tid brukt: ${formatTime(elapsedSeconds)} (Veiledende 10–15 minutter)
Sluttresultat: ${gameOutcome === 'won' ? 'Fullført rømning til skogkanten (Vunnet)' : gameOutcome === 'death' ? 'Dødsvalg utløst' : 'Utestengt fra felles mat'}
Sluttrinn på tillitsstigen: Trinn ${ladderLevel} (${TRUST_LADDER_STEPS[ladderLevel].title})

VURDERING AV KOMPETANSEMÅL:
1. Kilder og informasjonsflyt (Samfunnsfag 10. trinn):
   Status: ${currentSceneIndex >= 4 ? 'Godt synlig' : 'Delvis synlig'}
   Merknad: ${currentSceneIndex >= 4 ? 'Elevene demonstrerte kildekritisk sans i møte med leirryktene om overføring vs. radio.' : 'Elevene fullførte ikke kildescenen fullt ut.'}

2. Lover, regler og normer (Samfunnsfag 10. trinn):
   Status: ${ladderLevel <= 2 ? 'Godt synlig' : 'Delvis synlig'}
   Merknad: ${ladderLevel <= 2 ? 'Elevene forstod hensikten med leirreglene, deling av matpakker og disiplin ved varselstråden.' : 'Elevene utfordret leirreglene og pådro seg tilbakeslag.'}

3. Menneskerettigheter og Genèvekonvensjonen (Samfunnsfag 10. trinn):
   Status: Godt synlig
   Merknad: Elevene har erfart hvordan folkeretten (matpakker, vern mot slavearbeid) og de tragiske bruddene på den (Hitlers Sagan-ordre) formet krigsfangenes virkelighet.

4. Norsk muntlig argumentasjon og samarbeid:
   Status: Godt synlig
   Merknad: Elevene overholdt OVER-protokollen og diskuterte seg frem til felles avgjørelser før sending.

Spørsmål til videre refleksjon i klassen:
- Hvorfor mente de allierte offiserene at det var deres plikt å rømme, selv med stor personlig risiko?
- Hva var forskjellen på leirreglene i Stalag Luft III (drevet av Luftwaffe) og reglene i konsentrasjonsleirene?`;
  };

  const handleCopyReport = () => {
    navigator.clipboard.writeText(generateReportText());
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Setup / Welcome Modal if not started */}
      {!hasStarted ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 shadow-sm text-center max-w-2xl mx-auto space-y-8">
          <div className="inline-flex p-3 bg-amber-50 rounded-2xl text-amber-700">
            <Radio className="w-8 h-8" />
          </div>

          <div className="space-y-3">
            <div className="text-xs font-mono text-slate-500 uppercase tracking-wider">
              Interaktivt Klasseroms-rollespill
            </div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">I Halldors fotspor: Stalag Luft III</h2>
            <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
              To elever samarbeider som Halldor Espelid. Diskuter hvert dilemma sammen. Spill-KI-en lytter i det stille, og svarer <strong>først når dere sier eller trykker «OVER»</strong>.
            </p>
          </div>

          {/* Student Names Form */}
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200/80 max-w-md mx-auto space-y-4 text-left">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Users className="w-4 h-4 text-amber-500" />
              <span>Hvem spiller sammen i dag?</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-slate-500 block mb-1">Elev 1 (Navn)</label>
                <input
                  type="text"
                  value={student1}
                  onChange={(e) => setStudent1(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  placeholder="Navn..."
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-500 block mb-1">Elev 2 (Navn)</label>
                <input
                  type="text"
                  value={student2}
                  onChange={(e) => setStudent2(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  placeholder="Navn..."
                />
              </div>
            </div>
          </div>

          {/* Key rules reminder */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left max-w-md mx-auto text-xs text-slate-600">
            <div className="p-3 bg-slate-100 rounded-lg">
              <span className="font-bold text-slate-900 block mb-1">1. OVER-regelen</span>
              KI-en svarer «Lytter.» inntil dere trykker eller sier OVER.
            </div>
            <div className="p-3 bg-slate-100 rounded-lg">
              <span className="font-bold text-slate-900 block mb-1">2. 10–15 minutter</span>
              Sekundærvakt følger med på leir-tiden og tempoet.
            </div>
            <div className="p-3 bg-slate-100 rounded-lg">
              <span className="font-bold text-slate-900 block mb-1">3. Tillitsstigen</span>
              Egennyttige valg fjerner maten. Solidaritet bygger tillit.
            </div>
          </div>

          <button
            onClick={handleStartGame}
            className="w-full max-w-md px-6 py-3.5 text-base font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors shadow-sm"
          >
            Start radiosamtalen (8. april 1943)
          </button>
        </div>
      ) : (
        /* Active Simulator Gameplay Screen */
        <div className="space-y-4">
          {/* Top Status Bar & HUD */}
          <div className="bg-slate-900 text-slate-200 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-800 rounded-lg text-amber-400">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-mono">
                  ROLLE: HALLDOR ESPELID ({student1} & {student2})
                </div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Scene {currentScene.id} av 6: {currentScene.title}</span>
                  <span className="text-xs text-amber-400 font-normal">({currentScene.dateOrPeriod})</span>
                </div>
              </div>
            </div>

            {/* Pacing Clock & Audio Controls */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-[11px] font-mono text-slate-400">LEIR-KLOKKE</div>
                <div className="text-sm font-mono font-bold text-white tabular-nums">
                  {formatTime(elapsedSeconds)} <span className="text-xs text-slate-400 font-normal">/ 15:00</span>
                </div>
              </div>

              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors"
                title={soundEnabled ? 'Lyd på' : 'Lyd av'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
              </button>

              <button
                onClick={handleStartGame}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors"
                title="Start på nytt"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Trust & Food Ladder Indicator */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">Tillits- og matstige i brakken:</span>
                <span className={`text-xs font-bold ${ladderLevel >= 3 ? 'text-red-600' : 'text-slate-900'}`}>
                  Trinn {ladderLevel} – {TRUST_LADDER_STEPS[ladderLevel].title}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                {TRUST_LADDER_STEPS[ladderLevel].dialogue}
              </span>
            </div>

            {/* 4-Step Progress Bar */}
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((stepNum) => {
                const isReached = ladderLevel >= stepNum;
                let bgClass = 'bg-slate-100 text-slate-400';
                if (isReached) {
                  if (stepNum <= 2) bgClass = 'bg-amber-100 text-amber-900 border border-amber-300';
                  else if (stepNum === 3) bgClass = 'bg-red-100 text-red-900 border border-red-300 font-bold animate-pulse';
                  else bgClass = 'bg-red-600 text-white font-bold';
                }
                return (
                  <div key={stepNum} className={`p-2 rounded-lg text-center text-xs transition-colors ${bgClass}`}>
                    <div className="font-semibold">Trinn {stepNum}</div>
                    <div className="text-[10px] truncate">
                      {stepNum === 1 ? 'Advarsel' : stepNum === 2 ? 'Tapt tid' : stepNum === 3 ? 'Siste varsel' : 'Utestengt'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dialogue Log Terminal */}
          <div className="bg-stone-900 rounded-xl border border-stone-800 p-5 min-h-[340px] max-h-[460px] overflow-y-auto font-mono text-sm space-y-4 shadow-inner">
            <div className="text-xs text-stone-500 border-b border-stone-800 pb-2 flex items-center justify-between">
              <span>RADIOSAMBAND: STALAG LUFT III (ŻAGAŃ) // OVER-REGEL AKTIV</span>
              <span className="text-amber-500">Mottakskanal åpen</span>
            </div>

            {messages.map((m, idx) => {
              const isKI = m.sender === 'ki';
              return (
                <div key={idx} className={`flex flex-col ${isKI ? 'items-start' : 'items-end'}`}>
                  <div className="flex items-center gap-2 text-[10px] text-stone-400 mb-1">
                    <span className="font-bold">{isKI ? 'FORTALLER / LEIREN' : `${student1} & ${student2} (Halldor)`}</span>
                    <span>·</span>
                    <span>{m.timestamp}</span>
                  </div>
                  <div
                    className={`p-3.5 rounded-xl max-w-xl leading-relaxed whitespace-pre-wrap ${
                      isKI
                        ? 'bg-stone-800/90 text-stone-100 border border-stone-700/60 shadow-xs'
                        : 'bg-amber-400 text-stone-950 font-sans font-medium'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Interaction Deck (If Game in Progress) */}
          {!isGameOver ? (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              {/* Question & Choices */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {isSecondChoiceActive ? 'Siste utgang ved vakttårnet' : `Valg for ${currentScene.title}`}
                </div>
                <div className="text-sm font-medium text-slate-900">
                  {isSecondChoiceActive ? currentScene.secondQuestion : currentScene.question}
                </div>
              </div>

              {/* Direct Choice Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {activeOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      playRadioClick();
                      executeChoice(opt);
                    }}
                    className="p-3 text-left rounded-lg border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 transition-all group flex items-start gap-3"
                  >
                    <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 font-bold font-mono text-xs flex items-center justify-center shrink-0 group-hover:bg-amber-400 group-hover:text-slate-950 transition-colors">
                      {opt.id}
                    </span>
                    <span className="text-xs text-slate-800 leading-snug">{opt.text}</span>
                  </button>
                ))}
              </div>

              {/* Collaborative Input & OVER Sender Bar */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="text-xs text-slate-500 flex items-center justify-between">
                  <span>Eller formuler deres eget svar / diskusjon:</span>
                  <span className="text-amber-700 font-medium">Husk å trykke på OVER når dere er enige</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendWithOver();
                    }}
                    placeholder="Skriv deres forslag eller vurdering her..."
                    className="flex-1 px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />

                  {/* Test Rule 1: Talk without OVER */}
                  <button
                    onClick={handleSendWithoutOver}
                    className="px-3 py-2.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
                    title="Simuler at dere diskuterer høyt uten å si OVER (KI-en svarer kun «Lytter.»)"
                  >
                    Snakk (uten OVER)
                  </button>

                  {/* Primary Action: Send WITH OVER */}
                  <button
                    onClick={handleSendWithOver}
                    className="px-5 py-2.5 text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center justify-center gap-2 shrink-0 shadow-sm"
                  >
                    <Radio className="w-4 h-4" />
                    <span>Send med OVER</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Game Ended Screen: Debrief & Competence Summary */
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8">
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-2xl shrink-0 ${
                    gameOutcome === 'won' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                  }`}
                >
                  {gameOutcome === 'won' ? <CheckCircle2 className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-mono text-slate-500 uppercase">
                    Spillet er ferdig · Dere har fulgt Halldor Espelid
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">
                    {gameOutcome === 'won'
                      ? 'Dere kom dere ut til skogkanten!'
                      : gameOutcome === 'death'
                      ? 'Dødsvalg utløst: Vaktene oppdaget dere'
                      : 'Halldor ble utestengt fra maten i brakken'}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {gameOutcome === 'won'
                      ? 'Dere viste tålmodighet, disiplin og kloke vurderinger. Nils og Halldor kom seg helskinnet gjennom tunnelen «Harry» og ut i snøen.'
                      : deathReason ||
                        'I en tysk fangeleir under andre verdenskrig var reglene absolutte. Et feiltrinn eller tap av kameratenes tillit var fatalt.'}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {gameOutcome !== 'won' && (
                  <button
                    onClick={handleRestartFromScene}
                    className="px-4 py-2 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Prøv på nytt fra denne scenen</span>
                  </button>
                )}

                <button
                  onClick={() => setShowRealHistory(!showRealHistory)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Info className="w-3.5 h-3.5 text-amber-400" />
                  <span>{showRealHistory ? 'Skjul virkelighetens historie' : 'Hva skjedde med Halldor i virkeligheten?'}</span>
                </button>

                <button
                  onClick={handleCopyReport}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Kopiert til utklippstavle!' : 'Kopier LK20-vurdering til lærer'}</span>
                </button>
              </div>

              {/* Real History Accordion */}
              {showRealHistory && (
                <div className="p-6 bg-stone-50 rounded-xl border border-stone-200 space-y-4 text-stone-800">
                  <div className="flex items-center gap-2 text-xs font-mono text-stone-600 font-semibold">
                    <span>HISTORISKE FAKTA FRA VIRKELIGHETEN</span>
                    <span>·</span>
                    <span>IKKE DIKTET</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
                    <div className="space-y-2">
                      <h4 className="font-bold text-stone-900 text-sm">Halldor Espelid (1920–1944)</h4>
                      <p>
                        Født på <strong>Askøy ved Bergen</strong>. Rømte fra okkupasjonen høsten 1940 med skøyta «Traust». Utdannet jagerflyger i Canada («Little Norway»), fløy Spitfire i den norske 331-skvadronen. Skutt ned som 21-åring over Frankrike i august 1942.
                      </p>
                      <p>
                        Søsteren Ingrid Espelid Hovig ble senere Norges folkekjære fjernsynskokk. Broren Mons Espelid ble stortingsrepresentant.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-bold text-stone-900 text-sm">Flukten og Gestapos krigsforbrytelse</h4>
                      <p>
                        Halldor og vennen Nils Fuglesang (fra Florø) kom seg helt til Flensburg nær Danmark før de ble pågrepet. Etter Hitlers hemmelige ordre («Sagan-ordren») ble 50 av de 76 offiserene henrettet av Gestapo i skjul – et grovt brudd på Genèvekonvensjonen.
                      </p>
                      <p>
                        Bare tre menn nådde friheten: Nordmennene Per Bergsland og Jens Müller (via Sverige) og nederlenderen Bram van der Stok. Etter krigen ble Gestapo-mennene stilt for britisk krigsforbryterdomstol og dømt.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* LK20 Competence Goals Report */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-slate-900">
                    Formativ kompetansevurdering for {student1} & {student2}
                  </h4>
                  <span className="text-xs text-slate-500 font-mono">Læreplanverket LK20</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {COMPETENCE_GOALS.slice(0, 4).map((goal) => (
                    <div key={goal.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900">{goal.title}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          Godt synlig
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{goal.sampleFeedback}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
