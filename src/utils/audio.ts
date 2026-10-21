// Clean, minimalist audio helpers (no fake static, squelch, or gimmicky noises)

export const playRadioClick = () => {
  // Silent or neutral no-op to avoid AI slop audio
};

export const playRadioSquelch = () => {
  // Silent no-op
};

export const playRogerBeep = () => {
  // Silent no-op
};

export const playDangerChime = () => {
  // Soft, subtle notification chime only for critical game states
  try {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(240, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Ignore audio errors silently
  }
};
