import React, { useState, useEffect, useRef } from 'react';
import { SCENES, TRUST_LADDER_STEPS, HISTORICAL_FACTS, COMPETENCE_GOALS } from './data/gameContent';
import { TrustLadderLevel } from './types/game';
import { voiceListener } from './utils/speechRecognition';
import { speakNorwegianText, stopSpeech } from './utils/speech';
import { FocusArchiveDisplay } from './components/FocusArchiveDisplay';
import {
  Mic,
  MicOff,
  Square,
  Volume2,
  VolumeX,
  RotateCcw,
  Copy,
  Check,
  BookOpen,
  Shield,
  AlertCircle,
  Sparkles,
  Info,
  X,
  Loader2,
  Map,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Compass,
} from 'lucide-react';

export type GameMode = 'guided' | 'open';

interface ChatMessage {
  id: string;
  sender: 'forteller' | 'elever';
  text: string;
  timestamp: string;
  scene?: number;
  isStreaming?: boolean;
  source?: 'text' | 'voice';
}

const GUIDED_INSPIRATIONS: Record<number, string[]> = {
  1: [
    'Dra fangen bak tråden',
    'Rop en advarsel til ham',
    'Vink til vakten og forklar',
  ],
  2: [
    'Bli utkikk ved brakken',
    'Hjelp til med å spre sand',
    'Spør Nils om karttegning',
  ],
  3: [
    'Del sjokoladen med brakken',
    'Spar rasjonen til flukten',
    'Bytt mot varme ullsokker',
  ],
  4: [
    'Velt en kaffekjele for å avlede',
    'Start en opphetet diskusjon',
    'Få fangene til å synge høyt',
  ],
  5: [
    'Lytt til hemmelig BBC-radio',
    'Spør en erfaren fange om råd',
    'Avvis ryktet som falskt',
  ],
  6: [
    'Vent til lyskasteren passerer',
    'Kryp i snøen mot nærmeste tre',
    'Hold pusten til vakten snur seg',
  ],
};

const INITIAL_PROMPT_GUIDED =
  'Stalag Luft III, april 1943. En medfange løper over den hvite varseltråden etter en ball. Vakten i tårnet hever riflen. Vil du gripe tak i fangen og dra ham tilbake, rope en advarsel, eller gjøre noe annet?';

const INITIAL_PROMPT_OPEN =
  'Stalag Luft III, april 1943. En medfange løper over den hvite varseltråden etter en ball. De andre fangene fryser til og holder pusten idet vakten i tårnet hever riflen. Du kjenner adrenalinet pumpe og har lyst til å avverge situasjonen før skuddet går av.';

export default function App() {
  const [gameMode, setGameMode] = useState<GameMode>('guided');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [currentScene, setCurrentScene] = useState(1);
  const [ladderLevel, setLadderLevel] = useState<TrustLadderLevel>(0);
  const [studentNames, setStudentNames] = useState('Mia og Jonas');
  const [isEditingNames, setIsEditingNames] = useState(false);
  const [tempNames, setTempNames] = useState('Mia og Jonas');

  // Voice dictation & Norwegian AI transcription state
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0);
  const [interimSpeechText, setInterimSpeechText] = useState('');
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const [micSupported, setMicSupported] = useState(true);
  const [showTextFallback, setShowTextFallback] = useState(false);

  // Audio speech narration state
  const [voiceAudioActive, setVoiceAudioActive] = useState<string | null>(null);

  // AI response loading
  const [isAILoading, setIsAILoading] = useState(false);
  const [isArchiveExpanded, setIsArchiveExpanded] = useState(false);

  // Game over state
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameOverOutcome, setGameOverOutcome] = useState<
    'won' | 'death' | 'ladder_out' | 'isolation_camp' | null
  >(null);
  const [pedagogicalFeedback, setPedagogicalFeedback] = useState('');

  // Info modal / LK20
  const [showPedagogy, setShowPedagogy] = useState(false);
  const [copiedTranscript, setCopiedTranscript] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize game on mount
  useEffect(() => {
    setMicSupported(voiceListener.isSupported());
    resetConversation();
  }, []);

  // Smooth autoscroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAILoading]);

  const resetConversation = (modeOverride?: GameMode) => {
    stopSpeech();
    voiceListener.cancel();
    setIsListening(false);
    setIsTranscribing(false);
    setAudioVolume(0);
    setInterimSpeechText('');
    setVoiceNotice(null);
    setIsAILoading(false);
    setIsArchiveExpanded(false);
    setIsGameOver(false);
    setGameOverOutcome(null);
    setCurrentScene(1);
    setLadderLevel(0);
    setPedagogicalFeedback('');

    const activeMode = modeOverride || gameMode;
    const initialText = activeMode === 'guided' ? INITIAL_PROMPT_GUIDED : INITIAL_PROMPT_OPEN;

    const initialMsg: ChatMessage = {
      id: 'init-1',
      sender: 'forteller',
      text: initialText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      scene: 1,
    };
    setMessages([initialMsg]);
  };

  const handleToggleMode = (newMode: GameMode) => {
    if (newMode === gameMode) return;
    setGameMode(newMode);

    // If game has just started with only the initial prompt, seamlessly update the opening
    if (messages.length <= 1) {
      const initialText = newMode === 'guided' ? INITIAL_PROMPT_GUIDED : INITIAL_PROMPT_OPEN;
      setMessages([
        {
          id: 'init-1',
          sender: 'forteller',
          text: initialText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          scene: 1,
        },
      ]);
    }
  };

  // Stop recording and transcribe Norwegian audio with Gemini
  const handleStopAndTranscribe = async () => {
    if (!isListening) return;
    setIsListening(false);
    setIsTranscribing(true);
    setVoiceNotice('Modellen tolker den norske stemmen...');

    try {
      const transcribedText = await voiceListener.stopListening();
      setIsTranscribing(false);
      setAudioVolume(0);
      setInterimSpeechText('');

      if (transcribedText && transcribedText.trim()) {
        const clean = transcribedText.trim();
        setVoiceNotice(null);
        setCurrentInput(clean);
        // Feed into existing app as a message directly!
        await handleSubmitTurn(clean, 'voice');
      } else {
        setVoiceNotice('Hørte ingen tale. Prøv å snakke litt tydeligere inn i mikrofonen.');
        setTimeout(() => setVoiceNotice(null), 4000);
      }
    } catch (err: any) {
      console.warn('Voice transcription error:', err);
      setIsTranscribing(false);
      setVoiceNotice('Kunne ikke transkribere lyden: ' + (err?.message || 'Prøv igjen'));
      setTimeout(() => setVoiceNotice(null), 4000);
    }
  };

  const handleCancelVoice = () => {
    voiceListener.cancel();
    setIsListening(false);
    setIsTranscribing(false);
    setAudioVolume(0);
    setInterimSpeechText('');
    setVoiceNotice(null);
  };

  // Toggle voice listening: start hearing when mic is clicked, or stop and submit
  const toggleSpeechRecognition = async () => {
    if (isListening) {
      await handleStopAndTranscribe();
      return;
    }

    if (isAILoading || isTranscribing) return;

    stopSpeech();
    setVoiceNotice(null);
    setInterimSpeechText('');
    setAudioVolume(0);

    try {
      await voiceListener.startListening({
        onInterimText: (txt) => {
          setInterimSpeechText(txt);
          if (txt) {
            setCurrentInput(txt);
          }
        },
        onVolumeChange: (vol) => {
          setAudioVolume(vol);
        },
        onTranscribing: () => {
          setIsTranscribing(true);
        },
        onFinalResult: (finalText) => {
          if (finalText && finalText.trim()) {
            setCurrentInput(finalText.trim());
          }
        },
        onError: (errMsg) => {
          setIsListening(false);
          setIsTranscribing(false);
          setVoiceNotice(errMsg);
          setTimeout(() => setVoiceNotice(null), 4500);
        },
        onStateChange: (rec) => {
          setIsListening(rec);
        },
      });
    } catch (err: any) {
      setIsListening(false);
      setVoiceNotice(err?.message || 'Mikrofontilgang kreves');
      setTimeout(() => setVoiceNotice(null), 4500);
    }
  };

  // Play audio for a specific message (clean Gemini TTS)
  const handlePlayAudio = async (msgId: string, text: string) => {
    if (voiceAudioActive === msgId) {
      stopSpeech();
      setVoiceAudioActive(null);
      return;
    }

    stopSpeech();
    setVoiceAudioActive(msgId);

    try {
      await speakNorwegianText(text, true, {
        voiceType: 'ai',
        geminiVoice: 'Fenrir',
      });
    } catch {
      // Fallback handled inside speakNorwegianText
    } finally {
      setVoiceAudioActive(null);
    }
  };

  // Submit student turn to Gemini AI
  const handleSubmitTurn = async (textToSend?: string, source: 'text' | 'voice' = 'text') => {
    const rawText = (textToSend !== undefined ? textToSend : currentInput).trim();
    if (!rawText || isAILoading || isGameOver) return;

    // Stop microphone if currently recording
    if (isListening) {
      voiceListener.cancel();
      setIsListening(false);
    }

    stopSpeech();
    setCurrentInput('');
    setInterimSpeechText('');

    const userMsg: ChatMessage = {
      id: `elever-${Date.now()}`,
      sender: 'elever',
      text: rawText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      scene: currentScene,
      source,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsAILoading(true);

    try {
      const historyContext = messages.map((m) => ({
        role: m.sender,
        text: m.text,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: rawText,
          history: historyContext,
          currentScene,
          ladderLevel,
          studentNames,
          gameMode,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server status: ${res.status}`);
      }

      const data = await res.json();
      const narrativeText = data.text || data.narrative || 'Fortelleren vurderer situasjonen.';

      // Update scene and ladder state
      const nextScene = typeof data.newScene === 'number' ? data.newScene : currentScene;
      if (nextScene > currentScene) {
        setCurrentScene(Math.min(6, nextScene));
      }

      if (typeof data.ladderDelta === 'number') {
        setLadderLevel((prev) => {
          const nextVal = Math.max(0, Math.min(4, prev + data.ladderDelta));
          return nextVal as TrustLadderLevel;
        });
      }

      if (data.pedagogicalFeedback) {
        setPedagogicalFeedback(data.pedagogicalFeedback);
      }

      // Check game-over states
      if (data.isGameOver) {
        setIsGameOver(true);
        setGameOverOutcome(data.outcome || 'death');
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'forteller',
        text: narrativeText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        scene: nextScene,
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsArchiveExpanded(false);

      // Play audio narration aloud when AI is done thinking and outputs message
      handlePlayAudio(aiMsg.id, narrativeText);
    } catch (err) {
      console.warn('Direct chat endpoint error, using local fallback:', err);
      handleFallbackTurn(rawText);
    } finally {
      setIsAILoading(false);
      setIsArchiveExpanded(false);
      inputRef.current?.focus();
    }
  };

  // Local fallback turn if server has a network blip
  const handleFallbackTurn = (rawText: string) => {
    const lower = rawText.toLowerCase();
    let reply = '';
    let nextScene = currentScene;

    // Check for extreme suicidal / violent attempts that immediately lose the game
    const isExtremeAttempt =
      lower.includes('drep') ||
      lower.includes('angrip') ||
      lower.includes('slå vakten') ||
      lower.includes('storme') ||
      lower.includes('skyte');

    if (isExtremeAttempt) {
      reply =
        'Det ekstreme forsøket utløser øyeblikkelig full leiralarm. Væpnede forsterkninger overmanner Halldor på stedet. Han blir lagt i jern og fraktet bort til en høysikkerhetsleir på permanent isolat.';
      setIsGameOver(true);
      setGameOverOutcome('isolation_camp');
      setCurrentScene(currentScene);
      const fallbackMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'forteller',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        scene: currentScene,
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      return;
    }

    const isGuided = gameMode === 'guided';

    if (currentScene === 1) {
      if (lower.includes('dra') || lower.includes('rope') || lower.includes('stopp') || lower.includes('advar') || lower.includes('holde')) {
        reply = isGuided
          ? 'Halldor river fangen bakover i tide, og vakten senker riflen. Nils Fuglesang stiller seg ved siden av deg. Vil du tilby deg som utkikk, hjelpe til med sanden, eller spørre Nils om komiteen?'
          : 'Halldor river fangen bakover i tide, og vakten senker riflen. Like etter stiller Nils Fuglesang seg ved siden av deg og myser mot brakke 104, mens du kjenner en sterk lyst til å høre hva fluktkomiteen forbereder.';
        nextScene = 2;
      } else if (lower.includes('over tråden') || lower.includes('klatre')) {
        reply = isGuided
          ? 'Vakten brøler «Halt!» og skyter et varselskudd i bakken! Halldor soner et døgn i kakebu, men overlever. Vil du nå oppsøke Nils for å hjelpe til med kart, eller ta utkikk ved brakken?'
          : 'Vakten brøler «Halt!» og skyter et varselskudd i bakken! Halldor overmannes og må sone et døgn i kakebu, men overlever. Nils oppsøker deg i brakken etterpå mens de andre fangene hvisker om fluktplaner.';
        setLadderLevel((prev) => Math.min(3, prev + 1) as TrustLadderLevel);
        nextScene = 2;
      } else {
        reply = isGuided
          ? 'Halldor roer situasjonen og vakten lar ballen ligge. Nils stiller seg ved siden av deg. Vil du spørre ham om forberedelsene, eller tilby deg å spre sand i luftegården?'
          : 'Halldor roer situasjonen og vakten lar ballen ligge. Nils Fuglesang stiller seg ved siden av deg og kaster et blikk mot brakkene, mens du kjenner trangen til å ta del i motstandsarbeidet.';
        nextScene = 2;
      }
    } else if (currentScene === 2) {
      reply = isGuided
        ? 'Nils nikker og lar deg tre inn i arbeidet. En ny forsyning med pakker ankommer brakken. Vil du dele sjokoladen med de andre, spare den til selve flukten, eller bytte den bort?'
        : 'Nils nikker og lar deg tre inn i arbeidet. Rundt deg forbereder fangene falske kart og sandlommer i stillhet. Noen dager senere ankommer nye forsyninger, og en kamerat stirrer lengselsfullt på en uåpnet boks.';
      nextScene = 3;
    } else if (currentScene === 3) {
      reply = isGuided
        ? 'Maten fordeles og samholdet styrkes. Plutselig stopper en tysk vakt mistenksomt like utenfor sjakten. Vil du velte en kjele for å avlede ham, starte en diskusjon, eller late som ingenting?'
        : 'Maten fordeles og samholdet styrkes. Like etter ser du en tysk vakt stanse mistenksomt like utenfor brakka der tunnelsjakten ligger skjult. Kameratene dine stivner til, og du kjenner pulsen stige mens tyskeren titter inn.';
      nextScene = 4;
    } else if (currentScene === 4) {
      reply = isGuided
        ? 'Tyskeren overbevises og går videre. Samtidig sprer et urolig rykte seg om at leiren skal tømmes. Vil du sjekke hemmelig BBC-radio, snakke med en erfaren offiser, eller avvise ryktet?'
        : 'Tyskeren lures videre og sjakten forblir hemmelig. Samtidig sprer et rykte seg om at leiren skal tømmes, mens hemmelig BBC-radio klargjøres for kveldens sending. Du vil finne ut hva som faktisk stemmer.';
      nextScene = 5;
    } else if (currentScene === 5) {
      reply = isGuided
        ? 'Dere beholder roen og stoler på fakta. Natten til 25. mars ligger dere klare i sjakten Harry i snøen. Vil du vente til lyskasteren passerer, åle deg mot trærne, eller teste vakten med snø?'
        : 'Dere beholder roen og stoler på faktaene. Natten til 25. mars ligger du og Nils i tunnelmunningen i den bitende snøen. Søkelyset fra vakttårnet sveiper like foran skogkanten, og du venter på det rette sekundet.';
      nextScene = 6;
    } else {
      reply =
        'Halldor åler seg lydløst gjennom snøen og når skogkanten sammen med Nils Fuglesang. Dere er fri!';
      setIsGameOver(true);
      setGameOverOutcome('won');
    }

    setCurrentScene(nextScene);
    const fallbackMsg: ChatMessage = {
      id: `ai-${Date.now()}`,
      sender: 'forteller',
      text: reply,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      scene: nextScene,
    };
    setMessages((prev) => [...prev, fallbackMsg]);
    setIsArchiveExpanded(false);
    handlePlayAudio(fallbackMsg.id, reply);
  };

  const handleCopyTranscript = () => {
    const text = messages
      .map((m) => `[${m.timestamp}] ${m.sender === 'elever' ? studentNames : 'Forteller'}:\n${m.text}\n`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopiedTranscript(true);
    setTimeout(() => setCopiedTranscript(false), 2000);
  };

  const currentSceneInfo = SCENES[Math.min(SCENES.length - 1, Math.max(0, currentScene - 1))];
  const trustInfo = TRUST_LADDER_STEPS[ladderLevel];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-400 selection:text-zinc-950">
      {/* Minimalist Top Navigation */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30 px-4 py-3 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          {/* Brand & Subtitle */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base sm:text-lg tracking-tight text-zinc-100">
                I Halldors fotspor
              </span>
              <span className="text-xs font-mono text-zinc-400 hidden sm:inline">
                Stalag Luft III (1943–1944)
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span className="text-zinc-300 font-medium">
                {currentSceneInfo?.title || 'Fangeleiren'}
              </span>
              <span>•</span>
              <span
                className={`font-mono text-[11px] px-1.5 py-0.5 rounded ${
                  ladderLevel === 0
                    ? 'bg-zinc-800 text-zinc-300'
                    : ladderLevel <= 2
                    ? 'bg-amber-950 text-amber-300 border border-amber-800/50'
                    : 'bg-red-950 text-red-300 border border-red-800/50'
                }`}
                title={trustInfo?.effect}
              >
                Samhold: {trustInfo?.title}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPedagogy(true)}
              className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1.5 border border-transparent hover:border-zinc-700"
              title="Læringsmål og historisk bakgrunn"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden md:inline">LK20-mål</span>
            </button>

            <button
              onClick={handleCopyTranscript}
              className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1.5 border border-transparent hover:border-zinc-700"
              title="Kopier hele samtaleloggen"
            >
              {copiedTranscript ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span className="hidden md:inline">{copiedTranscript ? 'Kopiert' : 'Kopier'}</span>
            </button>

            <button
              onClick={() => resetConversation()}
              className="p-2 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800/60 rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1.5 border border-transparent hover:border-zinc-700"
              title="Start ny samtale fra begynnelsen"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Ny samtale</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Chat Stream Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-between">
        {/* Messages Feed */}
        <div className="space-y-4 pb-6">
          {/* Player Names and Mode Switcher Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400 px-1 py-1.5 border-b border-zinc-800/60 pb-2">
            <div className="flex items-center gap-1.5">
              <span>Spillere:</span>
              {isEditingNames ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={tempNames}
                    onChange={(e) => setTempNames(e.target.value)}
                    className="px-2 py-0.5 text-xs bg-zinc-900 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:border-amber-400"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      if (tempNames.trim()) setStudentNames(tempNames.trim());
                      setIsEditingNames(false);
                    }}
                    className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded cursor-pointer"
                  >
                    Lagre
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setTempNames(studentNames);
                    setIsEditingNames(true);
                  }}
                  className="font-medium text-zinc-200 hover:text-amber-400 underline decoration-dotted cursor-pointer"
                  title="Trykk for å endre spillernavn"
                >
                  {studentNames}
                </button>
              )}
            </div>

            {/* 2 Spillmoduser: Veiledet (med hint) og Åpne valg (selvstendig) */}
            <div className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
              <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 px-1.5 hidden md:inline">
                Modus:
              </span>
              <button
                type="button"
                onClick={() => handleToggleMode('guided')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  gameMode === 'guided'
                    ? 'bg-amber-400 text-zinc-950 shadow-sm font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`}
                title="Veiledet modus: Enklere for de som ikke har fulgt nok med i timen. Gir hint over mikrofonen og alternativer som leder videre i historien."
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Veiledet (med hint)</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleMode('open')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  gameMode === 'open'
                    ? 'bg-amber-400 text-zinc-950 shadow-sm font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`}
                title="Åpne valg: Selvstendig utfordring. Ingen tips over mikrofonen – dere velger hva dere gjør med de rådende omstendighetene."
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Åpne valg (selvstendig)</span>
              </button>
            </div>
          </div>

          {/* Conversation Bubbles */}
          {messages.map((msg) => {
            const isForteller = msg.sender === 'forteller';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isForteller ? 'items-start' : 'items-end'} transition-all`}
              >
                {/* Message Header */}
                <div className="flex items-center gap-2 mb-1 px-1">
                  <span className="text-xs font-medium text-zinc-400">
                    {isForteller ? 'Forteller • Stalag Luft III' : studentNames}
                  </span>
                  <span className="text-[11px] text-zinc-400 font-mono">{msg.timestamp}</span>
                  {!isForteller && msg.source === 'voice' && (
                    <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                      <Mic className="w-2.5 h-2.5" /> Tale
                    </span>
                  )}
                </div>

                {/* Message Body */}
                <div
                  className={`relative max-w-2xl rounded-2xl p-4 sm:p-5 text-sm sm:text-[15px] leading-relaxed shadow-sm ${
                    isForteller
                      ? 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-sm'
                      : 'bg-zinc-800 border border-zinc-700/80 text-zinc-100 rounded-tr-sm'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>

                  {/* Speech Narration Button on Forteller message */}
                  {isForteller && (
                    <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
                      <span className="font-mono text-[11px]">Historisk veileder</span>
                      <button
                        onClick={() => handlePlayAudio(msg.id, msg.text)}
                        className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-amber-400 transition-colors cursor-pointer py-1 px-2 rounded hover:bg-zinc-800/60"
                        title="Spill av opplesning på norsk"
                      >
                        {voiceAudioActive === msg.id ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                            <span className="text-amber-400">Stopper...</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Les opp</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Live Typing / Thinking Indicator in message feed */}
          {isAILoading && (
            <div className="flex flex-col items-start animate-in fade-in duration-150">
              <div className="flex items-center gap-2 mb-1 px-1">
                <span className="text-xs font-medium text-amber-400">Forteller</span>
                <span className="text-[11px] text-zinc-500 font-mono">vurderer situasjonen...</span>
              </div>
              <div className="bg-zinc-900 border border-amber-500/30 rounded-2xl rounded-tl-sm px-4 py-3 text-xs sm:text-sm text-zinc-300 flex items-center gap-2.5 shadow-md">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                <span className="italic text-zinc-300">
                  Fortelleren vurderer elevenes handling...
                </span>
              </div>
            </div>
          )}

          {/* Game Over Resolution Card */}
          {isGameOver && (
            <div
              className={`p-5 rounded-2xl border ${
                gameOverOutcome === 'won'
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-100'
                  : gameOverOutcome === 'isolation_camp'
                  ? 'bg-red-950/40 border-red-800/60 text-red-100'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-200'
              } space-y-3 mt-4`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-base flex items-center gap-2">
                  {gameOverOutcome === 'won' ? (
                    <>
                      <Sparkles className="w-5 h-5 text-emerald-400" />
                      <span>Gratulerer! Halldor kom seg gjennom tunnelen.</span>
                    </>
                  ) : gameOverOutcome === 'isolation_camp' ? (
                    <>
                      <Shield className="w-5 h-5 text-red-400" />
                      <span>Overført til høysikkerhetsleir på isolat</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-amber-400" />
                      <span>Spillet er over for denne gang</span>
                    </>
                  )}
                </h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                  Sluttresultat
                </span>
              </div>

              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                {gameOverOutcome === 'won'
                  ? 'I den virkelige historien var Halldor Espelid en av 76 offiserer som rømte gjennom tunnelen Harry natten til 25. mars 1944. 73 ble tatt til fange igjen, og 50 av dem – inkludert Halldor (23 år) og Nils Fuglesang – ble skutt av Gestapo på Hitlers ordre, i strid med Genèvekonvensjonen.'
                  : gameOverOutcome === 'isolation_camp'
                  ? 'Det ekstreme forsøket førte til full leiralarm. Halldor ble overmannet på stedet, lagt i jern og umiddelbart overført vekk fra Stalag Luft III til en av de større fangeleirene på permanent isolat (som Oflag IV-C Colditz eller Gestapo-fengsel) uten kontakt med medfanger og uten rømningsmulighet.'
                  : 'Fangeleiren Stalag Luft III krevde disiplin, tålmodighet og sterkt samhold. Hvert minste feiltrinn kunne få fatale konsekvenser i møte med leirvaktene.'}
              </p>

              {pedagogicalFeedback && (
                <div className="text-xs bg-zinc-950/60 p-3 rounded-lg border border-zinc-800 text-zinc-300">
                  <span className="font-semibold text-zinc-200">Vurdering LK20: </span>
                  {pedagogicalFeedback}
                </div>
              )}

              <div className="pt-2 flex flex-wrap gap-2">
                <button
                  onClick={() => resetConversation()}
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-semibold rounded-xl text-xs cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Start ny samtale</span>
                </button>
                <button
                  onClick={handleCopyTranscript}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium rounded-xl text-xs cursor-pointer transition-colors flex items-center gap-1.5 border border-zinc-700"
                >
                  <Copy className="w-4 h-4" />
                  <span>{copiedTranscript ? 'Kopiert til utklippstavle!' : 'Kopier samtalelogg til lærer'}</span>
                </button>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Voice-Only Input Console */}
        {!isGameOver && (
          <div className="sticky bottom-0 bg-zinc-950/95 backdrop-blur-md pt-2 pb-3 border-t border-zinc-800/80 space-y-3">
            {/* Infokort: Lagt ned ved start, kommer opp når KI tenker, går ned igjen når ferdig */}
            <div className="max-w-2xl mx-auto w-full transition-all duration-300">
              <button
                type="button"
                onClick={() => setIsArchiveExpanded(!isArchiveExpanded)}
                className={`w-full py-1.5 px-3 rounded-xl border text-xs flex items-center justify-between transition-all cursor-pointer group ${
                  isAILoading || isArchiveExpanded
                    ? 'bg-zinc-900 border-amber-500/50 text-amber-200 shadow-lg'
                    : 'bg-zinc-900/80 hover:bg-zinc-800/90 border-zinc-800 text-zinc-300 hover:text-amber-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Map className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span className="font-medium text-[11px] sm:text-xs">
                    Historisk leirarkiv: Kart & dokumenter
                  </span>
                  {isAILoading ? (
                    <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                      KI tenker – kartet er oppe
                    </span>
                  ) : (
                    <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">
                      {isArchiveExpanded ? 'Åpent' : 'Lagt ned'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
                  <span className="hidden sm:inline font-mono text-[10px] text-zinc-500">
                    {isAILoading
                      ? 'Går ned automatisk når svaret leses opp'
                      : isArchiveExpanded
                      ? 'Trykk for å legge ned'
                      : 'Trykk for å åpne'}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-300 ${
                      isAILoading || isArchiveExpanded ? 'rotate-180 text-amber-400' : ''
                    }`}
                  />
                </div>
              </button>

              {/* Infokort-innhold som kommer opp under tenking eller når eleven åpner det */}
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  isAILoading || isArchiveExpanded
                    ? 'max-h-[600px] opacity-100 mt-2 pointer-events-auto'
                    : 'max-h-0 opacity-0 mt-0 pointer-events-none'
                }`}
              >
                <FocusArchiveDisplay currentScene={currentScene} isLoading={isAILoading} />
              </div>
            </div>
            {/* Voice Notice Toast / Error */}
            {voiceNotice && !isListening && !isTranscribing && (
              <div className="max-w-md mx-auto bg-zinc-900 border border-amber-500/40 rounded-xl px-3.5 py-2 text-xs text-amber-300 flex items-center justify-between">
                <span>{voiceNotice}</span>
                <button
                  type="button"
                  onClick={() => setVoiceNotice(null)}
                  className="text-zinc-400 hover:text-zinc-200 text-xs ml-2 cursor-pointer font-bold"
                >
                  ×
                </button>
              </div>
            )}

            {/* Tips over mikrofonknappen KUN i Veiledet modus (fjernet for åpne valg) */}
            {!isListening && !isTranscribing && gameMode === 'guided' && GUIDED_INSPIRATIONS[currentScene] && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar justify-center">
                <span className="text-[11px] text-zinc-400 shrink-0 font-mono flex items-center gap-1">
                  <Lightbulb className="w-3 h-3 text-amber-400" />
                  <span>Tips å si:</span>
                </span>
                {GUIDED_INSPIRATIONS[currentScene].map((insp, idx) => (
                  <span
                    key={idx}
                    className="shrink-0 px-2.5 py-1 rounded-full text-xs select-none border transition-colors bg-amber-950/40 text-amber-200 border-amber-800/60"
                  >
                    «{insp}»
                  </span>
                ))}
              </div>
            )}

            {/* Active Live Norwegian Voice Recording Box */}
            {isListening && (
              <div className="max-w-md mx-auto bg-zinc-900 border border-red-500/50 rounded-2xl p-4 space-y-3 shadow-xl animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    <span className="text-xs font-semibold text-red-200">
                      Lytter til stemmen din...
                    </span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors ${
                        audioVolume > 0.04
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {audioVolume > 0.04 ? '🟢 Lyd registrert' : '🟡 Snakk inn...'}
                    </span>
                  </div>

                  {/* Responsive Audio Volume Meter */}
                  <div
                    className="flex items-center gap-1 h-5 px-2 bg-zinc-950/80 rounded-md border border-zinc-800"
                    title="Mikrofonlydstyrke"
                  >
                    {[0.6, 1.2, 1.6, 1.1, 0.7].map((multiplier, i) => {
                      const heightPct = Math.max(
                        20,
                        Math.min(100, Math.round(audioVolume * 100 * multiplier))
                      );
                      return (
                        <div
                          key={i}
                          className="w-1 bg-red-400 rounded-full transition-all duration-75"
                          style={{ height: `${heightPct}%` }}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Live spoken words preview */}
                <div className="text-sm text-zinc-200 italic min-h-[2.5rem] bg-zinc-950/70 p-3 rounded-xl border border-zinc-800/80 flex items-center justify-center text-center">
                  {interimSpeechText ? (
                    <span>«{interimSpeechText}»</span>
                  ) : (
                    <span className="text-zinc-500 not-italic text-xs">
                      Snakk inn i mikrofonen nå...
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs pt-0.5">
                  <button
                    type="button"
                    onClick={handleCancelVoice}
                    className="px-2.5 py-1 text-zinc-400 hover:text-zinc-200 cursor-pointer transition-colors"
                  >
                    Avbryt opptak
                  </button>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    Siste utsagn prioriteres
                  </span>
                </div>
              </div>
            )}

            {/* Transcribing Indicator */}
            {isTranscribing && (
              <div className="max-w-md mx-auto py-4 px-6 bg-zinc-900 border border-amber-500/40 rounded-2xl flex items-center justify-center gap-3 text-sm text-amber-300 font-medium shadow-lg">
                <Loader2 className="w-5 h-5 text-amber-400 animate-spin shrink-0" />
                <span>Tolker norsk tale og sender inn...</span>
              </div>
            )}

            {/* Large Dedicated Microphone Button (Only way to input) */}
            {!isTranscribing && (
              <div className="max-w-md mx-auto w-full">
                {isListening ? (
                  <button
                    type="button"
                    onClick={handleStopAndTranscribe}
                    className="w-full py-4 sm:py-4.5 px-6 rounded-2xl bg-red-600 hover:bg-red-500 active:scale-[0.98] text-white font-bold text-base sm:text-lg flex items-center justify-center gap-3 shadow-xl shadow-red-950/40 transition-all cursor-pointer border border-red-500 animate-pulse"
                  >
                    <Square className="w-5 h-5 fill-current shrink-0" />
                    <span>Ferdig – Send inn tale</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={toggleSpeechRecognition}
                    disabled={isAILoading}
                    className="w-full py-4 sm:py-4.5 px-6 rounded-2xl bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-zinc-950 font-bold text-base sm:text-lg flex items-center justify-center gap-3 shadow-xl shadow-amber-950/20 transition-all cursor-pointer border border-amber-300 disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <span className="p-1.5 rounded-xl bg-zinc-950 text-amber-400 group-hover:scale-110 transition-transform">
                      <Mic className="w-6 h-6" />
                    </span>
                    <span className="tracking-tight">Trykk for å snakke</span>
                  </button>
                )}
                {!isListening && (
                  <div className="text-center mt-2 space-y-1">
                    <p className="text-[11px] text-zinc-400 font-medium">
                      Bruk mikrofonen for å svare. Opptaket sendes direkte når du trykker ferdig.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowTextFallback(!showTextFallback)}
                      className="text-[11px] text-zinc-500 hover:text-amber-400 underline cursor-pointer transition-colors"
                    >
                      {showTextFallback ? 'Skjul tastaturfelt' : 'Problemer med mikrofon? Skriv her'}
                    </button>
                  </div>
                )}

                {/* Emergency Text Input Fallback if microphone hardware is silent or disconnected */}
                {showTextFallback && !isListening && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSubmitTurn(currentInput, 'text');
                    }}
                    className="flex items-center gap-2 max-w-md mx-auto pt-2"
                  >
                    <input
                      type="text"
                      value={currentInput}
                      onChange={(e) => setCurrentInput(e.target.value)}
                      placeholder="Skriv hva Halldor gjør her..."
                      className="flex-1 px-3.5 py-2.5 text-xs bg-zinc-900 border border-zinc-700 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={!currentInput.trim() || isAILoading}
                      className="px-3.5 py-2.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold rounded-xl text-xs cursor-pointer disabled:opacity-40"
                    >
                      Send
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Pedagogy & LK20 Guidance Modal */}
      {showPedagogy && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" />
                <span>Læringsmål og historisk ramme</span>
              </h2>
              <button
                onClick={() => setShowPedagogy(false)}
                className="p-1 text-zinc-400 hover:text-zinc-200 cursor-pointer rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-zinc-300 leading-relaxed">
              <p>
                <strong>Formål for 9.–10. trinn:</strong> Elevene skal reflektere over etiske dilemmaer,
                samhold, kildekritikk og konsekvenser under totalitære regimer under andre verdenskrig.
              </p>

              <div className="space-y-2 pt-1">
                <h3 className="font-semibold text-zinc-200 text-xs uppercase tracking-wider font-mono">
                  Relevante kompetansemål (LK20):
                </h3>
                {COMPETENCE_GOALS.slice(0, 3).map((goal) => (
                  <div key={goal.id} className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
                    <div className="font-medium text-amber-300 text-xs">{goal.title}</div>
                    <div className="text-zinc-400 text-xs">{goal.description}</div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1 text-xs">
                <span className="font-medium text-zinc-200">Om Halldor Espelid (1920–1944):</span>
                <p className="text-zinc-400">
                  Flyger i 331 skvadron fra Askøy. Skutt ned over Frankrike i 1942 og internert i Stalag Luft III.
                  Deltok i flukten i mars 1944. Henrettet av Gestapo sammen med 49 medfanger. Minnesmerke er reist på Askøy og i Bergen.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowPedagogy(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded-xl cursor-pointer"
              >
                Lukk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
