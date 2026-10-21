// Audio input manager for microphone permission, live volume meter, and audio echo check

export type MicPermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported';

export interface MicStatus {
  state: MicPermissionState;
  hasAudioSignal: boolean;
  errorMessage?: string;
}

class MicrophoneManager {
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animationFrameId: number | null = null;
  private volumeCallback: ((volume: number, hasVoice: boolean) => void) | null = null;
  private permissionState: MicPermissionState = 'prompt';

  public async checkInitialPermission(): Promise<MicPermissionState> {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      this.permissionState = 'unsupported';
      return 'unsupported';
    }

    try {
      if (navigator.permissions && navigator.permissions.query) {
        const status = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        if (status.state === 'granted') {
          this.permissionState = 'granted';
        } else if (status.state === 'denied') {
          this.permissionState = 'denied';
        } else {
          this.permissionState = 'prompt';
        }

        status.onchange = () => {
          if (status.state === 'granted') this.permissionState = 'granted';
          else if (status.state === 'denied') this.permissionState = 'denied';
        };

        return this.permissionState;
      }
    } catch {
      // Ignore permissions.query fallback
    }

    return this.permissionState;
  }

  public async requestAccess(): Promise<{ granted: boolean; error?: string }> {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      this.permissionState = 'unsupported';
      return { granted: false, error: 'Nettleseren støtter ikke mikrofon-opptak.' };
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.mediaStream = stream;
      this.permissionState = 'granted';
      this.setupAudioAnalysis(stream);
      return { granted: true };
    } catch (err: any) {
      console.warn('Microphone permission request error:', err);
      this.permissionState = 'denied';
      let msg = 'Mikrofontilgang ble avvist i nettleseren.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Mikrofonen er blokkert. Klikk på hengelåsen eller mikrofonikonet i nettleserens adresselinje for å tillate mikrofon.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'Ingen mikrofon ble funnet på enheten din.';
      }
      return { granted: false, error: msg };
    }
  }

  private setupAudioAnalysis(stream: MediaStream) {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      this.audioContext = new AudioContextClass();
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.5;
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!this.analyser) return;
        this.analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        // Normalize roughly to 0 - 100
        const volume = Math.min(100, Math.round((average / 128) * 100));
        const hasVoice = volume > 8; // threshold for audible voice

        if (this.volumeCallback) {
          this.volumeCallback(volume, hasVoice);
        }

        this.animationFrameId = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (e) {
      console.warn('Could not setup audio analyzer:', e);
    }
  }

  public onVolumeChange(callback: (volume: number, hasVoice: boolean) => void) {
    this.volumeCallback = callback;
  }

  public getPermissionState(): MicPermissionState {
    return this.permissionState;
  }

  public getStream(): MediaStream | null {
    return this.mediaStream;
  }

  public async recordShortSample(durationMs: number = 3000): Promise<string> {
    if (!this.mediaStream) {
      const res = await this.requestAccess();
      if (!res.granted || !this.mediaStream) throw new Error('Ingen mikrofontilgang');
    }

    return new Promise((resolve, reject) => {
      try {
        const mediaRecorder = new MediaRecorder(this.mediaStream!);
        const chunks: BlobPart[] = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          const url = URL.createObjectURL(blob);
          resolve(url);
        };

        mediaRecorder.start();
        setTimeout(() => {
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
          }
        }, durationMs);
      } catch (err) {
        reject(err);
      }
    });
  }

  public cleanup() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
  }
}

export const micManager = new MicrophoneManager();
