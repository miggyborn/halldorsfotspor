// Norwegian Voice Recognition & Dual-Engine Gemini Transcription Service
// Bulletproof audio capture across all browsers (Chrome, Safari, Edge, Firefox, iOS, Chromebooks)

export interface VoiceListenerCallbacks {
  onInterimText?: (text: string) => void;
  onVolumeChange?: (volume: number) => void;
  onTranscribing?: () => void;
  onFinalResult?: (text: string, source: 'gemini' | 'browser') => void;
  onError?: (error: string) => void;
  onStateChange?: (isRecording: boolean) => void;
}

export class NorwegianVoiceListener {
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private mediaSource: MediaStreamAudioSourceNode | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private analyser: AnalyserNode | null = null;

  // Raw PCM audio sample buffer
  private pcmChunks: Float32Array[] = [];
  private totalSamples = 0;
  private maxVolumeDetected = 0;

  // MediaRecorder backup
  private mediaRecorder: MediaRecorder | null = null;
  private mediaChunks: Blob[] = [];

  // Browser speech recognition for live typing preview
  private activeRecognition: any = null;
  private interimTranscript: string = '';

  private isRecording: boolean = false;
  private callbacks: VoiceListenerCallbacks = {};

  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(
      navigator.mediaDevices?.getUserMedia ||
      (window as any).webkitAudioContext ||
      window.AudioContext ||
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );
  }

  public async startListening(callbacks: VoiceListenerCallbacks): Promise<void> {
    if (this.isRecording) {
      await this.stopListening().catch(() => {});
    }

    this.callbacks = callbacks;
    this.pcmChunks = [];
    this.totalSamples = 0;
    this.maxVolumeDetected = 0;
    this.mediaChunks = [];
    this.interimTranscript = '';

    try {
      // 1. Request microphone access with flexible constraints for maximum device compatibility
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: { ideal: true },
            noiseSuppression: { ideal: true },
            autoGainControl: { ideal: true },
          },
        });
      } catch {
        // Fallback to basic audio constraint if enhanced constraints fail
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      this.mediaStream = stream;

      // 2. Setup AudioContext for Direct PCM Capture & Live Volume Analysis
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }

        this.mediaSource = this.audioContext.createMediaStreamSource(this.mediaStream);

        // Analyser node for frequency/volume data
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        this.mediaSource.connect(this.analyser);

        // ScriptProcessorNode to capture raw PCM Float32 audio samples
        // Buffer size 4096 gives ~85ms blocks at 48kHz
        this.scriptProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);
        this.mediaSource.connect(this.scriptProcessor);
        // Connect to destination so onaudioprocess continues firing (muted)
        this.scriptProcessor.connect(this.audioContext.destination);

        this.scriptProcessor.onaudioprocess = (e) => {
          if (!this.isRecording) return;
          const inputChannel = e.inputBuffer.getChannelData(0);
          const copy = new Float32Array(inputChannel);
          this.pcmChunks.push(copy);
          this.totalSamples += copy.length;

          // Calculate real-time RMS audio volume (0.0 to 1.0)
          let sumSquares = 0;
          for (let i = 0; i < copy.length; i++) {
            sumSquares += copy[i] * copy[i];
          }
          const rms = Math.sqrt(sumSquares / copy.length);
          const normalized = Math.min(1, rms * 6); // scale for visual responsiveness
          if (normalized > this.maxVolumeDetected) {
            this.maxVolumeDetected = normalized;
          }

          if (this.callbacks.onVolumeChange) {
            this.callbacks.onVolumeChange(normalized);
          }
        };
      }

      // 3. Setup MediaRecorder backup
      try {
        let mimeType = '';
        if (typeof MediaRecorder !== 'undefined') {
          if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
            mimeType = 'audio/webm;codecs=opus';
          } else if (MediaRecorder.isTypeSupported('audio/webm')) {
            mimeType = 'audio/webm';
          } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
            mimeType = 'audio/mp4';
          }

          this.mediaRecorder = mimeType
            ? new MediaRecorder(this.mediaStream, { mimeType })
            : new MediaRecorder(this.mediaStream);

          this.mediaRecorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
              this.mediaChunks.push(event.data);
            }
          };

          this.mediaRecorder.start(200);
        }
      } catch (mediaRecErr) {
        console.warn('MediaRecorder backup init notice (using PCM capture):', mediaRecErr);
      }

      // 4. Start concurrent isolated browser recognition for live preview (if supported)
      try {
        const SpeechRecognition =
          (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
          const rec = new SpeechRecognition();
          rec.continuous = true;
          rec.interimResults = true;
          rec.lang = 'nb-NO';

          rec.onresult = (event: any) => {
            let fullText = '';
            for (let i = 0; i < event.results.length; ++i) {
              fullText += (i > 0 ? ' ' : '') + event.results[i][0].transcript;
            }
            const clean = fullText.trim();
            if (clean) {
              this.interimTranscript = clean;
              if (this.callbacks.onInterimText) {
                this.callbacks.onInterimText(clean);
              }
            }
          };

          rec.onerror = (e: any) => {
            // Silently ignore speech-recognition-specific errors as audio is captured independently
            console.warn('Browser speech recognition preview notice:', e?.error || e);
          };

          rec.start();
          this.activeRecognition = rec;
        }
      } catch (speechRecErr) {
        console.warn('SpeechRecognition live preview not active:', speechRecErr);
      }

      this.isRecording = true;
      if (this.callbacks.onStateChange) {
        this.callbacks.onStateChange(true);
      }
    } catch (err: any) {
      console.error('Failed to start microphone:', err);
      this.cleanup();
      const msg =
        err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError'
          ? 'Mikrofontilgang ble avvist i nettleseren. Tillat mikrofon og prøv på nytt.'
          : 'Kunne ikke koble til mikrofonen: ' + (err?.message || 'Ukjent feil');
      if (this.callbacks.onError) {
        this.callbacks.onError(msg);
      }
      throw new Error(msg);
    }
  }

  public async stopListening(): Promise<string> {
    if (!this.isRecording) {
      return '';
    }

    this.isRecording = false;
    if (this.callbacks.onStateChange) {
      this.callbacks.onStateChange(false);
    }

    if (this.callbacks.onTranscribing) {
      this.callbacks.onTranscribing();
    }

    // Stop browser recognition
    if (this.activeRecognition) {
      try {
        this.activeRecognition.stop();
      } catch {
        // Ignore
      }
      this.activeRecognition = null;
    }

    // Stop MediaRecorder
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.requestData();
        this.mediaRecorder.stop();
      } catch {
        // Ignore
      }
    }

    // Give a tiny moment (80ms) for last audio buffers to flush
    await new Promise((r) => setTimeout(r, 80));

    // Flatten raw PCM samples
    const sourceSampleRate = this.audioContext?.sampleRate || 44100;
    const allPcmSamples = new Float32Array(this.totalSamples);
    let offset = 0;
    for (const chunk of this.pcmChunks) {
      allPcmSamples.set(chunk, offset);
      offset += chunk.length;
    }

    let finalTranscript = this.interimTranscript.trim();
    let transcriptionSucceeded = false;

    // 1. Try transcribing via Server / Gemini using PCM 16kHz WAV (100% reliable format)
    if (allPcmSamples.length > 2000) {
      try {
        // Resample to 16,000 Hz for optimal Gemini speech recognition and tiny payload size
        const targetSampleRate = 16000;
        const resampledSamples = this.resampleAudio(allPcmSamples, sourceSampleRate, targetSampleRate);
        const wavBuffer = this.encodeWAV(resampledSamples, targetSampleRate);
        const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });
        const base64Audio = await this.blobToBase64(wavBlob);

        const res = await fetch('/api/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: base64Audio,
            mimeType: 'audio/wav',
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.text && data.text.trim()) {
            finalTranscript = data.text.trim();
            transcriptionSucceeded = true;
            if (this.callbacks.onFinalResult) {
              this.callbacks.onFinalResult(finalTranscript, 'gemini');
            }
          }
        }
      } catch (wavErr) {
        console.warn('WAV transcription notice:', wavErr);
      }
    }

    // 2. If WAV transcription didn't return text, try MediaRecorder chunks if available
    if (!transcriptionSucceeded && this.mediaChunks.length > 0) {
      try {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const mediaBlob = new Blob(this.mediaChunks, { type: mimeType });
        if (mediaBlob.size > 500) {
          const base64Audio = await this.blobToBase64(mediaBlob);
          const res = await fetch('/api/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audioBase64: base64Audio,
              mimeType,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.text && data.text.trim()) {
              finalTranscript = data.text.trim();
              transcriptionSucceeded = true;
              if (this.callbacks.onFinalResult) {
                this.callbacks.onFinalResult(finalTranscript, 'gemini');
              }
            }
          }
        }
      } catch (mediaErr) {
        console.warn('MediaRecorder transcription notice:', mediaErr);
      }
    }

    // 3. Fallback to browser recognition if Gemini was empty but browser caught speech
    if (!transcriptionSucceeded && finalTranscript) {
      if (this.callbacks.onFinalResult) {
        this.callbacks.onFinalResult(finalTranscript, 'browser');
      }
      transcriptionSucceeded = true;
    }

    // Clean up hardware resources
    this.cleanup();

    if (!finalTranscript) {
      if (this.maxVolumeDetected < 0.02) {
        throw new Error(
          'Mikrofonen er tilkoblet, men registrerte ingen lyd. Sjekk at mikrofonen ikke er dempet på PC-en eller headsettet.'
        );
      } else {
        throw new Error('Hørte ingen tydelig tale. Prøv å snakke litt nærmere mikrofonen.');
      }
    }

    return finalTranscript;
  }

  public cancel(): void {
    this.isRecording = false;
    this.cleanup();
    if (this.callbacks.onStateChange) {
      this.callbacks.onStateChange(false);
    }
  }

  private cleanup(): void {
    if (this.scriptProcessor) {
      try {
        this.scriptProcessor.disconnect();
      } catch {}
      this.scriptProcessor = null;
    }

    if (this.mediaSource) {
      try {
        this.mediaSource.disconnect();
      } catch {}
      this.mediaSource = null;
    }

    if (this.analyser) {
      try {
        this.analyser.disconnect();
      } catch {}
      this.analyser = null;
    }

    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch {}
      this.audioContext = null;
    }

    if (this.mediaStream) {
      try {
        this.mediaStream.getTracks().forEach((track) => track.stop());
      } catch {}
      this.mediaStream = null;
    }

    if (this.activeRecognition) {
      try {
        this.activeRecognition.stop();
      } catch {}
      this.activeRecognition = null;
    }

    this.mediaRecorder = null;
    this.pcmChunks = [];
    this.mediaChunks = [];
    this.totalSamples = 0;
  }

  // Resamples a Float32Array from one sample rate to another using linear interpolation
  private resampleAudio(
    audioBuffer: Float32Array,
    fromSampleRate: number,
    toSampleRate: number
  ): Float32Array {
    if (fromSampleRate === toSampleRate) {
      return audioBuffer;
    }
    const ratio = fromSampleRate / toSampleRate;
    const newLength = Math.round(audioBuffer.length / ratio);
    const result = new Float32Array(newLength);
    for (let i = 0; i < newLength; i++) {
      const originalIndex = i * ratio;
      const indexFloor = Math.floor(originalIndex);
      const indexCeil = Math.min(audioBuffer.length - 1, indexFloor + 1);
      const interpolation = originalIndex - indexFloor;
      result[i] =
        audioBuffer[indexFloor] * (1 - interpolation) + audioBuffer[indexCeil] * interpolation;
    }
    return result;
  }

  // Pure TypeScript 16-bit Mono PCM WAV encoder
  private encodeWAV(samples: Float32Array, sampleRate: number): ArrayBuffer {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    // RIFF chunk descriptor
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    this.writeString(view, 8, 'WAVE');

    // fmt sub-chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // SubChunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
    view.setUint16(22, 1, true); // NumChannels (1 = Mono)
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, sampleRate * 2, true); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
    view.setUint16(32, 2, true); // BlockAlign (NumChannels * BitsPerSample/8)
    view.setUint16(34, 16, true); // BitsPerSample (16 bits)

    // data sub-chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, samples.length * 2, true);

    // Write PCM 16-bit samples
    let offset = 44;
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }

    return buffer;
  }

  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1] || result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  public getIsRecording(): boolean {
    return this.isRecording;
  }
}

// Singleton listener instance
export const voiceListener = new NorwegianVoiceListener();

// Backwards-compatible export
export const speechRecognizer = {
  isSupported: () => voiceListener.isSupported(),
  start: (onResult: any, onError: any, onEnd: any) => {
    voiceListener.startListening({
      onInterimText: (txt) => onResult({ transcript: txt, hasOver: false, isFinal: false }),
      onError: (err) => onError && onError(err),
      onFinalResult: (txt) => onResult({ transcript: txt, hasOver: false, isFinal: true }),
      onStateChange: (rec) => {
        if (!rec && onEnd) onEnd();
      },
    });
  },
  stop: () => voiceListener.stopListening(),
  getIsListening: () => voiceListener.getIsRecording(),
};
