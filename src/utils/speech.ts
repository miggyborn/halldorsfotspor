// Voice utility for Norwegian narration (supporting both Gemini AI TTS and Web Speech API)

let currentAudio: HTMLAudioElement | null = null;
let cachedVoices: SpeechSynthesisVoice[] = [];

// Initialize and cache browser voices
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const updateVoices = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
  updateVoices();
  window.speechSynthesis.onvoiceschanged = updateVoices;
}

export function getNorwegianBrowserVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  if (cachedVoices.length === 0) {
    cachedVoices = window.speechSynthesis.getVoices();
  }
  return cachedVoices.filter((v) => {
    const lang = v.lang.toLowerCase();
    const name = v.name.toLowerCase();
    return (
      lang.startsWith('nb') ||
      lang.startsWith('no') ||
      lang.startsWith('nn') ||
      name.includes('norsk') ||
      name.includes('norwegian') ||
      name.includes('nora') ||
      name.includes('henrik') ||
      name.includes('iselin')
    );
  });
}

export function findBestNorwegianVoice(): SpeechSynthesisVoice | null {
  const norwegianVoices = getNorwegianBrowserVoices();
  if (norwegianVoices.length > 0) {
    // Prefer Norwegian voices with natural labels or standard names
    const preferred = norwegianVoices.find(
      (v) =>
        v.name.toLowerCase().includes('nora') ||
        v.name.toLowerCase().includes('henrik') ||
        v.name.toLowerCase().includes('iselin') ||
        v.name.toLowerCase().includes('natural') ||
        v.name.toLowerCase().includes('google')
    );
    return preferred || norwegianVoices[0];
  }

  // Fallback to any voice that has 'no' in lang or Scandinavia
  const generalMatch = cachedVoices.find(
    (v) => v.lang.toLowerCase().includes('no') || v.lang.toLowerCase().includes('nb')
  );
  return generalMatch || null;
}

export const stopSpeech = () => {
  if (typeof window !== 'undefined') {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
};

export interface SpeakOptions {
  voiceType?: 'ai' | 'browser';
  geminiVoice?: 'Fenrir' | 'Kore' | 'Puck' | 'Zephyr';
  selectedBrowserVoiceName?: string;
}

export const speakNorwegianText = async (
  text: string,
  enabled: boolean,
  options: SpeakOptions = {}
): Promise<boolean> => {
  if (!enabled || typeof window === 'undefined') return false;

  stopSpeech();

  // Clean brackets, meta-hints, parenthetical reminders and quotation marks so only pure dialogue is spoken
  const cleanText = text
    .replace(/\[.*?\]/g, '')
    .replace(/Hint:.*?(?:\.|\n|$)/gi, '')
    .replace(/\(.*?\)/g, '')
    .replace(/«|»/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanText) return false;

  const { voiceType = 'ai', geminiVoice = 'Fenrir', selectedBrowserVoiceName } = options;

  // 1. Try Gemini Neural Norwegian TTS if requested
  if (voiceType === 'ai') {
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText, voiceName: geminiVoice }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audio) {
          const audioUrl = `data:audio/wav;base64,${data.audio}`;
          currentAudio = new Audio(audioUrl);
          currentAudio.play().catch(() => {
            // Autoplay might require interaction; fallback to browser TTS
            fallbackBrowserTTS(cleanText, selectedBrowserVoiceName);
          });
          return true;
        }
      }
    } catch {
      // Server TTS failed or not connected, proceed to browser TTS
    }
  }

  // 2. Fallback to Browser Native Norwegian TTS
  return fallbackBrowserTTS(cleanText, selectedBrowserVoiceName);
};

function fallbackBrowserTTS(cleanText: string, specificVoiceName?: string): boolean {
  if (!('speechSynthesis' in window)) return false;

  try {
    const utterance = new SpeechSynthesisUtterance(cleanText);

    let chosenVoice: SpeechSynthesisVoice | null = null;
    if (specificVoiceName) {
      chosenVoice = cachedVoices.find((v) => v.name === specificVoiceName) || null;
    }
    if (!chosenVoice) {
      chosenVoice = findBestNorwegianVoice();
    }

    if (chosenVoice) {
      utterance.voice = chosenVoice;
    }

    utterance.lang = 'nb-NO';
    utterance.rate = 0.92; // Calm, respectful pace for WW2 history
    utterance.pitch = 1.0;

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.error('Browser speech error:', err);
    return false;
  }
}
