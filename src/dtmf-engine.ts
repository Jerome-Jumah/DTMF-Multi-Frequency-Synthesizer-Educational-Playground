/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export class DtmfEngine {
  private static instance: DtmfEngine | null = null;

  public audioCtx: AudioContext | null = null;
  public analyserNode: AnalyserNode | null = null;
  private masterGainNode: GainNode | null = null;

  private oscLow: OscillatorNode | null = null;
  private oscHigh: OscillatorNode | null = null;
  private oscLowGain: GainNode | null = null;
  private oscHighGain: GainNode | null = null;

  private volume: number = 0.3; // Local storage or state
  private onStateChange: ((playing: boolean, activeKey: string | null) => void) | null = null;

  private isSequencePlaying: boolean = false;
  private safetyTimeoutId: number | null = null;

  private constructor() {
    // Lazy loaded on first user gesture
  }

  public static getInstance(): DtmfEngine {
    if (!this.instance) {
      this.instance = new DtmfEngine();
    }
    return this.instance;
  }

  public registerStateCallback(cb: (playing: boolean, activeKey: string | null) => void) {
    this.onStateChange = cb;
  }

  public init() {
    if (this.audioCtx) {
      if (this.audioCtx.state === "suspended") {
        this.audioCtx.resume();
      }
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();

      this.analyserNode = this.audioCtx.createAnalyser();
      this.analyserNode.fftSize = 1024;
      this.analyserNode.smoothingTimeConstant = 0.3;

      this.masterGainNode = this.audioCtx.createGain();
      this.masterGainNode.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);

      // Routing: Oscillators -> Individual Gains -> Analyser -> Master Gain -> Destination
      this.analyserNode.connect(this.masterGainNode);
      this.masterGainNode.connect(this.audioCtx.destination);
    } catch (e) {
      console.error("Web Audio API not supported in this browser:", e);
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGainNode && this.audioCtx) {
      this.masterGainNode.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  /**
   * Starts playing a dual-tone frequency pair
   */
  public startTone(lowFreq: number, highFreq: number) {
    this.init();
    if (!this.audioCtx || !this.analyserNode) return;

    // Clear any existing active safety timeouts
    if (this.safetyTimeoutId) {
      window.clearTimeout(this.safetyTimeoutId);
      this.safetyTimeoutId = null;
    }

    // Disconnect existing if any
    this.stopToneImmediate();

    const now = this.audioCtx.currentTime;

    // Create Oscillators
    this.oscLow = this.audioCtx.createOscillator();
    this.oscLow.type = "sine";
    this.oscLow.frequency.setValueAtTime(lowFreq, now);

    this.oscHigh = this.audioCtx.createOscillator();
    this.oscHigh.type = "sine";
    this.oscHigh.frequency.setValueAtTime(highFreq, now);

    // Create Gains for separate mix (0.5 each of current channel strength)
    this.oscLowGain = this.audioCtx.createGain();
    this.oscLowGain.gain.setValueAtTime(0.5, now);

    this.oscHighGain = this.audioCtx.createGain();
    this.oscHighGain.gain.setValueAtTime(0.5, now);

    // Route
    this.oscLow.connect(this.oscLowGain);
    this.oscLowGain.connect(this.analyserNode);

    this.oscHigh.connect(this.oscHighGain);
    this.oscHighGain.connect(this.analyserNode);

    // Start
    this.oscLow.start(now);
    this.oscHigh.start(now);

    // Safety timeout: Auto stop after 1.8 seconds max hold to prevent stuck tones on mobile/interrupted streams
    this.safetyTimeoutId = window.setTimeout(() => {
      this.stopTone();
    }, 1800);
  }

  /**
   * Stops the active tone smoothly to prevent sudden audio clicks
   */
  public stopTone() {
    if (this.safetyTimeoutId) {
      window.clearTimeout(this.safetyTimeoutId);
      this.safetyTimeoutId = null;
    }

    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    const fadeTime = 0.03; // 30ms smooth release transition

    if (this.oscLowGain && this.oscHighGain) {
      // Linear ramp to avoid any crackle / pop artifacts
      this.oscLowGain.gain.setValueAtTime(this.oscLowGain.gain.value, now);
      this.oscLowGain.gain.exponentialRampToValueAtTime(0.0001, now + fadeTime);

      this.oscHighGain.gain.setValueAtTime(this.oscHighGain.gain.value, now);
      this.oscHighGain.gain.exponentialRampToValueAtTime(0.0001, now + fadeTime);

      // Stop and clean up reference after fade
      const low = this.oscLow;
      const high = this.oscHigh;

      setTimeout(
        () => {
          try {
            low?.stop();
            high?.stop();
            low?.disconnect();
            high?.disconnect();
          } catch (err) {
            // Guard against already stopped
          }
        },
        fadeTime * 1000 + 10,
      );
    } else {
      this.stopToneImmediate();
    }

    this.oscLow = null;
    this.oscHigh = null;
    this.oscLowGain = null;
    this.oscHighGain = null;
  }

  private stopToneImmediate() {
    try {
      if (this.oscLow) {
        this.oscLow.stop();
        this.oscLow.disconnect();
      }
      if (this.oscHigh) {
        this.oscHigh.stop();
        this.oscHigh.disconnect();
      }
    } catch (e) {
      // Guard
    }
    this.oscLow = null;
    this.oscHigh = null;
  }

  /**
   * Plays a pre-programmed sequence of DTMF digits (e.g. phone number)
   */
  public async playSequence(
    sequence: string,
    onStep: (activeKey: string | null) => void,
    toneDurationMs: number = 200,
    pauseDurationMs: number = 100,
  ): Promise<void> {
    this.isSequencePlaying = true;
    this.init();

    // Map characters to frequencies
    const freqMap: Record<string, [number, number]> = {
      "1": [697, 1209],
      "2": [697, 1336],
      "3": [697, 1477],
      A: [697, 1633],
      "4": [770, 1209],
      "5": [770, 1336],
      "6": [770, 1477],
      B: [770, 1633],
      "7": [852, 1209],
      "8": [852, 1336],
      "9": [852, 1477],
      C: [852, 1633],
      "*": [941, 1209],
      "0": [941, 1336],
      "#": [941, 1477],
      D: [941, 1633],
      " ": [0, 0], // pause/space
      "-": [0, 0],
      ",": [0, 0],
    };

    // Clean up sequence string
    const chars = sequence.toUpperCase().split("");

    for (const char of chars) {
      if (!this.isSequencePlaying) break;

      const freqs = freqMap[char];
      if (freqs && freqs[0] > 0 && freqs[1] > 0) {
        onStep(char);
        this.startTone(freqs[0], freqs[1]);
        await new Promise(resolve => setTimeout(resolve, toneDurationMs));
        this.stopTone();
        onStep(null);
      } else {
        // Just pause for non-dtmf characters or spaces
        onStep(null);
        await new Promise(resolve => setTimeout(resolve, toneDurationMs));
      }

      // Inter-digit pause
      await new Promise(resolve => setTimeout(resolve, pauseDurationMs));
    }

    this.isSequencePlaying = false;
    onStep(null);
  }

  public cancelSequence() {
    this.isSequencePlaying = false;
    this.stopTone();
  }

  public getIsSequencePlaying(): boolean {
    return this.isSequencePlaying;
  }
}
