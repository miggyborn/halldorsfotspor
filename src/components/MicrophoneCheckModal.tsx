import React, { useState, useEffect, useRef } from 'react';
import { micManager, MicPermissionState } from '../utils/audioInput';
import { speechRecognizer } from '../utils/speechRecognition';
import {
  Mic,
  MicOff,
  Volume2,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Radio,
  X,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface MicrophoneCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReadyToStart: () => void;
}

export const MicrophoneCheckModal: React.FC<MicrophoneCheckModalProps> = ({
  isOpen,
  onClose,
  onReadyToStart,
}) => {
  const [permissionState, setPermissionState] = useState<MicPermissionState>('prompt');
  const [errorMessage, setErrorMessage] = useState('');
  const [volume, setVolume] = useState(0);
  const [hasDetectedVoice, setHasDetectedVoice] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isRecordingEcho, setIsRecordingEcho] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [echoAudioUrl, setEchoAudioUrl] = useState<string | null>(null);
  const [isPlayingEcho, setIsPlayingEcho] = useState(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Check permission on mount / open
  useEffect(() => {
    if (!isOpen) return;

    micManager.checkInitialPermission().then((state) => {
      setPermissionState(state);
      if (state === 'granted') {
        activateLiveAnalysis();
      }
    });

    return () => {
      speechRecognizer.stop();
    };
  }, [isOpen]);

  const activateLiveAnalysis = () => {
    micManager.onVolumeChange((vol, hasVoice) => {
      setVolume(vol);
      if (hasVoice) {
        setHasDetectedVoice(true);
      }
    });

    // Start live speech test
    speechRecognizer.start(
      (result: { transcript: string; hasOver?: boolean; isFinal?: boolean }) => {
        if (result.transcript) {
          setLiveTranscript(result.transcript);
          setHasDetectedVoice(true);
        }
      },
      () => {},
      () => {}
    );
  };

  const handleRequestAccess = async () => {
    setErrorMessage('');
    const res = await micManager.requestAccess();
    if (res.granted) {
      setPermissionState('granted');
      activateLiveAnalysis();
    } else {
      setPermissionState('denied');
      setErrorMessage(
        res.error ||
          'Mikrofontilgang ble ikke gitt. Sjekk tillatelsene i nettleserens adressefelt.'
      );
    }
  };

  // 3-second echo test so user can actually hear what the mic recorded
  const handleRecordEchoTest = async () => {
    try {
      setIsRecordingEcho(true);
      setCountdown(3);

      const timer = setInterval(() => {
        setCountdown((prev) => (prev > 1 ? prev - 1 : 1));
      }, 1000);

      const audioUrl = await micManager.recordShortSample(3000);
      clearInterval(timer);
      setIsRecordingEcho(false);
      setEchoAudioUrl(audioUrl);

      // Auto-play the echo sample
      const audio = new Audio(audioUrl);
      audioPlayerRef.current = audio;
      setIsPlayingEcho(true);
      audio.onended = () => setIsPlayingEcho(false);
      audio.play().catch(() => setIsPlayingEcho(false));
    } catch (e: any) {
      setIsRecordingEcho(false);
      console.warn('Echo test error:', e);
    }
  };

  const handleReplayEcho = () => {
    if (!echoAudioUrl) return;
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
    const audio = new Audio(echoAudioUrl);
    audioPlayerRef.current = audio;
    setIsPlayingEcho(true);
    audio.onended = () => setIsPlayingEcho(false);
    audio.play().catch(() => setIsPlayingEcho(false));
  };

  if (!isOpen) return null;

  const totalBars = 18;
  const activeBars = Math.round((volume / 100) * totalBars);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl text-stone-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-400/10 border border-amber-400/30 rounded-xl text-amber-400">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-stone-100">Radiosamband & Mikrofontest</h3>
              <p className="text-xs text-stone-400 font-mono">
                Sjekk at nettleseren hører stemmene deres før start
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content based on permission state */}
        {permissionState !== 'granted' ? (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-2.5">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold uppercase">
                <Mic className="w-4 h-4" />
                <span>Mikrofontilgang påkrevd</span>
              </div>
              <p className="text-sm text-stone-300 leading-relaxed">
                Spillet <strong className="text-stone-100">«I Halldors fotspor»</strong> er lagt opp som en levende radiosamtale.
                Elevene skal snakke sammen med egne stemmer og si <strong>OVER</strong>.
              </p>
              <p className="text-xs text-stone-400">
                Trykk på knappen under. Nettleseren vil spørre om å tillate mikrofon – velg <strong>«Tillat» (Allow)</strong>.
              </p>
            </div>

            {permissionState === 'denied' && (
              <div className="p-4 rounded-xl bg-red-950/60 border border-red-800/80 space-y-2 text-xs text-red-200">
                <div className="flex items-center gap-2 font-bold text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Mikrofonen er blokkert i nettleseren</span>
                </div>
                <p className="leading-relaxed">
                  {errorMessage ||
                    'Klikk på hengelåsen eller mikrofon-ikonet i adressefeltet øverst i nettleseren, sett tillatelse til «Tillat», og prøv igjen.'}
                </p>
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleRequestAccess}
                className="flex-1 py-3.5 px-6 rounded-xl font-bold text-sm bg-amber-400 hover:bg-amber-300 text-stone-950 flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 transition-all cursor-pointer"
              >
                <Mic className="w-4 h-4" />
                <span>Be om mikrofontilgang</span>
              </button>
              <button
                type="button"
                onClick={onReadyToStart}
                className="py-3.5 px-4 rounded-xl text-xs font-mono text-stone-400 hover:text-stone-200 bg-stone-800 border border-stone-700 transition-colors cursor-pointer"
              >
                Fortsett med tastatur
              </button>
            </div>
          </div>
        ) : (
          /* GRANTED STATE: LIVE VU-METER, TRANSCRIPTION, & ECHO TEST */
          <div className="space-y-5">
            <div className="flex items-center gap-2 p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-emerald-300 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Mikrofontilgang er godkjent og aktiv!</span>
            </div>

            {/* LIVE VU METER */}
            <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-stone-400 uppercase">Live lydnivå (VU-meter):</span>
                <span
                  className={`font-mono font-bold ${
                    hasDetectedVoice ? 'text-emerald-400' : 'text-stone-400'
                  }`}
                >
                  {volume > 8 ? `Stemme registrert (${volume}%)` : 'Venter på stemme...'}
                </span>
              </div>

              {/* Graphical Equalizer Bars */}
              <div className="flex items-end gap-1 h-8 bg-stone-900 rounded-lg p-1.5 border border-stone-800">
                {Array.from({ length: totalBars }).map((_, i) => {
                  const isActive = i < activeBars;
                  const isHigh = i > 12;
                  const isMed = i > 7;
                  return (
                    <div
                      key={i}
                      className={`flex-1 rounded-xs transition-all duration-75 ${
                        isActive
                          ? isHigh
                            ? 'bg-red-500 h-full'
                            : isMed
                            ? 'bg-amber-400 h-4/5'
                            : 'bg-emerald-400 h-3/5'
                          : 'bg-stone-800 h-1/5'
                      }`}
                    />
                  );
                })}
              </div>

              <div className="text-[11px] text-stone-400 italic text-center">
                Snakk inn i mikrofonen nå. Søylene skal bevege seg i takt med stemmen din.
              </div>
            </div>

            {/* LIVE SPEECH TRANSCRIPTION PREVIEW */}
            <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-stone-400 uppercase">Hva mikrofonen hører:</span>
                <span className="text-[10px] font-mono text-amber-400">Tale-til-tekst</span>
              </div>
              <div className="p-3 bg-stone-900 rounded-lg min-h-[44px] flex items-center text-sm font-medium text-stone-100 italic border border-stone-800/80">
                {liveTranscript ? (
                  <span>«{liveTranscript}»</span>
                ) : (
                  <span className="text-stone-400 not-italic text-xs font-mono">
                    Si f.eks: «Dette er Mia og Sander OVER»...
                  </span>
                )}
              </div>
            </div>

            {/* ECHO AUDIO TEST: HEAR YOUR OWN VOICE */}
            <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-stone-400 uppercase">Lydtest i høyttaler:</span>
                {echoAudioUrl && (
                  <span className="text-emerald-400 text-[10px] font-mono flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Opptak bekreftet
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRecordEchoTest}
                  disabled={isRecordingEcho}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isRecordingEcho
                      ? 'bg-red-600 text-white animate-pulse'
                      : 'bg-stone-800 hover:bg-stone-700 text-amber-400 border border-stone-700'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                  <span>
                    {isRecordingEcho
                      ? `Tar opp stemmen din... (${countdown}s)`
                      : 'Gjør 3 sekunders lydtest (Hør din egen stemme)'}
                  </span>
                </button>

                {echoAudioUrl && !isRecordingEcho && (
                  <button
                    type="button"
                    onClick={handleReplayEcho}
                    disabled={isPlayingEcho}
                    className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 cursor-pointer"
                    title="Spill av på nytt"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>

              {isPlayingEcho && (
                <div className="text-[11px] text-amber-300 font-mono text-center animate-pulse flex items-center justify-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Spiller av mikrofon-opptaket nå...</span>
                </div>
              )}
            </div>

            {/* START BUTTON */}
            <div className="pt-2">
              <button
                type="button"
                onClick={onReadyToStart}
                className="w-full py-4 px-6 rounded-xl font-bold text-sm bg-amber-400 hover:bg-amber-300 text-stone-950 flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 transition-all cursor-pointer"
              >
                <span>Mikrofon er klar – Start radiosamtalen</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
