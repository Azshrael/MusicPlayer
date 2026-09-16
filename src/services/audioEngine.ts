import { EqualizerState, Track } from '../types';

export const EQ_FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

export const EQ_PRESETS: Record<string, number[]> = {
  'Flat': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  'Bass Boost': [8, 7, 5, 3, 1, 0, 0, 0, 1, 2],
  'Rock': [5, 4, 2, -1, -2, 0, 2, 4, 6, 6],
  'Pop': [1, 2, 4, 5, 3, 0, -1, 1, 3, 4],
  'Jazz': [4, 3, 1, 2, -1, -1, 0, 2, 4, 5],
  'Electronic': [6, 5, 2, 0, -2, 2, 1, 3, 5, 6],
  'Vocal': [-2, -1, -1, 2, 5, 5, 4, 2, 0, -2],
  'Classical': [5, 4, 3, 2, -1, -1, 0, 3, 4, 5],
  'Hip-Hop': [7, 6, 3, 1, -1, -1, 1, -1, 2, 3],
  'Metal': [6, 4, 1, -2, -3, 0, 4, 7, 5, 4],
};

export const DEFAULT_EQ_STATE: EqualizerState = {
  enabled: true,
  bands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  preset: 'Flat',
  bassBoost: 0,
  virtualizer: 0,
  preamp: 0,
};

class AudioEngine {
  private audio: HTMLAudioElement;
  private audioCtx: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private preampGainNode: GainNode | null = null;
  private filterNodes: BiquadFilterNode[] = [];
  private bassFilterNode: BiquadFilterNode | null = null;
  private pannerNode: StereoPannerNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private isInitialized = false;

  private onTimeUpdateCallback: ((time: number, duration: number) => void) | null = null;
  private onTrackEndedCallback: (() => void) | null = null;

  private eqState: EqualizerState = { ...DEFAULT_EQ_STATE };

  constructor() {
    this.audio = new Audio();
    this.audio.crossOrigin = 'anonymous';
    this.audio.preload = 'auto';

    this.audio.addEventListener('timeupdate', () => {
      if (this.onTimeUpdateCallback) {
        this.onTimeUpdateCallback(this.audio.currentTime, this.audio.duration || 0);
      }
    });

    this.audio.addEventListener('ended', () => {
      if (this.onTrackEndedCallback) {
        this.onTrackEndedCallback();
      }
    });
  }

  public setOnTimeUpdate(cb: (time: number, duration: number) => void): void {
    this.onTimeUpdateCallback = cb;
  }

  public setOnTrackEnded(cb: () => void): void {
    this.onTrackEndedCallback = cb;
  }

  public async loadTrack(url: string): Promise<void> {
    this.audio.src = url;
    this.audio.load();
  }

  public async play(): Promise<void> {
    await this.resume();
    try {
      await this.audio.play();
    } catch (err) {
      console.warn('Playback error (interaction required or network):', err);
    }
  }

  public pause(): void {
    this.audio.pause();
  }

  public seek(seconds: number): void {
    if (!isNaN(seconds) && isFinite(seconds)) {
      this.audio.currentTime = seconds;
    }
  }

  public setVolume(volume: number): void {
    const clamped = Math.max(0, Math.min(1, volume));
    this.audio.volume = clamped;
  }

  public getAudioElement(): HTMLAudioElement {
    return this.audio;
  }

  public initWebAudio(): void {
    if (this.isInitialized) return;

    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass();

      // Create Preamp Gain
      this.preampGainNode = this.audioCtx.createGain();
      this.preampGainNode.gain.value = 1.0;

      // Create Bass Boost filter (low shelf at 80Hz)
      this.bassFilterNode = this.audioCtx.createBiquadFilter();
      this.bassFilterNode.type = 'lowshelf';
      this.bassFilterNode.frequency.value = 80;
      this.bassFilterNode.gain.value = 0;

      // Create 10 EQ peaking filters
      this.filterNodes = EQ_FREQUENCIES.map((freq) => {
        const filter = this.audioCtx!.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = freq;
        filter.Q.value = 1.4;
        filter.gain.value = 0;
        return filter;
      });

      // Spatial stereo panner
      if (this.audioCtx.createStereoPanner) {
        this.pannerNode = this.audioCtx.createStereoPanner();
        this.pannerNode.pan.value = 0;
      }

      // Analyser for real-time visualizer
      this.analyserNode = this.audioCtx.createAnalyser();
      this.analyserNode.fftSize = 128;
      this.analyserNode.smoothingTimeConstant = 0.8;

      // Connect source to chain:
      // Source -> Preamp -> BassFilter -> EQ[0..9] -> StereoPanner -> Analyser -> Destination
      this.sourceNode = this.audioCtx.createMediaElementSource(this.audio);

      let lastNode: AudioNode = this.sourceNode;
      lastNode.connect(this.preampGainNode);
      lastNode = this.preampGainNode;

      lastNode.connect(this.bassFilterNode);
      lastNode = this.bassFilterNode;

      for (const filter of this.filterNodes) {
        lastNode.connect(filter);
        lastNode = filter;
      }

      if (this.pannerNode) {
        lastNode.connect(this.pannerNode);
        lastNode = this.pannerNode;
      }

      lastNode.connect(this.analyserNode);
      this.analyserNode.connect(this.audioCtx.destination);

      this.isInitialized = true;
      this.applyEqualizerState(this.eqState);
    } catch (e) {
      console.warn('Web Audio initialization error (will use HTMLAudioElement fallback):', e);
    }
  }

  public async resume(): Promise<void> {
    if (!this.isInitialized) {
      this.initWebAudio();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      try {
        await this.audioCtx.resume();
      } catch (err) {
        console.error('AudioContext resume error:', err);
      }
    }
  }

  public applyEqualizerState(state: EqualizerState): void {
    this.eqState = { ...state };
    if (!this.isInitialized || !this.audioCtx) return;

    const enabled = state.enabled;

    // Apply bands
    this.filterNodes.forEach((filter, idx) => {
      const gainVal = enabled ? (state.bands[idx] ?? 0) : 0;
      filter.gain.setTargetAtTime(gainVal, this.audioCtx!.currentTime, 0.05);
    });

    // Apply Bass Boost (0 - 100% -> 0 - 14dB)
    if (this.bassFilterNode) {
      const bassGain = enabled ? (state.bassBoost / 100) * 14 : 0;
      this.bassFilterNode.gain.setTargetAtTime(bassGain, this.audioCtx.currentTime, 0.05);
    }

    // Apply Preamp (-6 to +6 dB -> linear factor)
    if (this.preampGainNode) {
      const db = enabled ? state.preamp : 0;
      const linearGain = Math.pow(10, db / 20);
      this.preampGainNode.gain.setTargetAtTime(linearGain, this.audioCtx.currentTime, 0.05);
    }
  }

  public getVisualizerData(): Uint8Array | null {
    if (!this.analyserNode) return null;
    const bufferLength = this.analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyserNode.getByteFrequencyData(dataArray);
    return dataArray;
  }

  public getWaveformData(): Uint8Array | null {
    if (!this.analyserNode) return null;
    const bufferLength = this.analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyserNode.getByteTimeDomainData(dataArray);
    return dataArray;
  }

  public updateMediaSession(
    track: Track, 
    handlers: {
      onPlay: () => void;
      onPause: () => void;
      onNext: () => void;
      onPrev: () => void;
      onSeek: (seconds: number) => void;
    }
  ): void {
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: track.title,
          artist: track.artist,
          album: track.album || 'Aura Sound',
          artwork: [
            { src: track.coverArt, sizes: '96x96', type: 'image/jpeg' },
            { src: track.coverArt, sizes: '192x192', type: 'image/jpeg' },
            { src: track.coverArt, sizes: '512x512', type: 'image/jpeg' },
          ],
        });

        navigator.mediaSession.setActionHandler('play', handlers.onPlay);
        navigator.mediaSession.setActionHandler('pause', handlers.onPause);
        navigator.mediaSession.setActionHandler('previoustrack', handlers.onPrev);
        navigator.mediaSession.setActionHandler('nexttrack', handlers.onNext);
        navigator.mediaSession.setActionHandler('seekto', (details) => {
          if (details.seekTime !== undefined) {
            handlers.onSeek(details.seekTime);
          }
        });
      } catch (err) {
        console.warn('MediaSession API handler error:', err);
      }
    }
  }
}

export const audioEngine = new AudioEngine();
