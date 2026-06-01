# DTMF Multi-Frequency Synthesizer & Educational Playground

A highly-polished, real-time Dual-Tone Multi-Frequency (DTMF) signal generator, audio synthesizer, digital signal visualizer, and math sandbox. This repository serves as both an interactive educational client-side tool and a reference implementation for porting high-performance, real-time PCM audio generation directly into **pure Dart/Flutter** and **Android (Kotlin)**!

---

## 🚀 Key Features

- **Interactive DSP Matrix Keypad:** Trigger standard ITU-T dual-frequency phone signaling tones (rows: `697Hz`, `770Hz`, `852Hz`, `941Hz` / columns: `1209Hz`, `1336Hz`, `1477Hz`, `1633Hz`) using click, touch, or active computer keyboard hotkeys.
- **Dual-Lane Real-Time Oscilloscope:** Visually trace the low, high, and mixed interference waves using mathematical canvas rendering to observe wave-constructive/destructive behaviors instantly!
- **Fast Fourier Transform (FFT) Spectrum Analyzer:** Read real-time microphone energy or system Web Audio frequencies to inspect active wave peaks clearly against standard digital bounds.
- **Dialing Sequence Terminal:** Program speed, tone durations, and pauses (silence) to execute telephone automated sequences like standard DTMF modems or Dialers.
- **Interference Sound Labs:** Free-play sliders allowing kids and physics students to dial any low/high frequencies to hear acoustic "beating" and mathematical signal mixtures.
- **Exporters for Dart & Kotlin:** Pure, dependency-free reference libraries implementing real-time PCM buffer creation with standard WAV headers on-the-fly.

---

## 🧠 The Science Behind DTMF (Under the Hood!)

When you dial a key on a traditional telephone, the hardware does not send a pulsed click or a single beep. Instead, it generates a composite wave of **two distinct sine waves** overlaying each other simultaneously.

```
                  HIGH GROUP FREQUENCIES (Col-wise)
                  1209 Hz      1336 Hz      1477 Hz      1633 Hz
                +------------+------------+------------+------------+
     697 Hz     |     1      |     2      |     3      |     A      |  Row 1
                +------------+------------+------------+------------+
     770 Hz     |     4      |     5      |     6      |     B      |  Row 2
LOW  -----------+------------+------------+------------+------------+
     852 Hz     |     7      |     8      |     9      |     C      |  Row 3
                +------------+------------+------------+------------+
     941 Hz     |     *      |     0      |     #      |     D      |  Row 4
                +------------+------------+------------+------------+
```

### 1. The Physics Math Formula

The combined waveform, $y(t)$, is the sum of the fundamental Low Group wave and the High Group wave at any instant of time:

$$y(t) = \frac{1}{2} \left[ \sin(2\pi \cdot f_{\text{low}} \cdot t) + \sin(2\pi \cdot f_{\text{high}} \cdot t) \right]$$

Where:

- $t$ is the elapsed time in seconds.
- $f_{\text{low}}$ is the selected low frequency based on the key’s grid row coordinate.
- $f_{\text{high}}$ is the selected high frequency based on the key’s grid column coordinate.
- $\frac{1}{2}$ is an amplitude safety scalar ensuring that when the waves reinforce, they do not exceed standard dynamic clipping limits.

### 2. Guarding Against Accidents (Why Two Notes?)

Phone signals must travel on acoustic lines alongside talking humans, music, or shouting babies. If telephone lines recognized single keys by just **one** note, standard throat chatter or high-pitched whistling might trigger dialing loops or redirect call lines by accident!

By requiring **two separate, mathematically unique notes** in precise row-column combinations, standard speech has a probability of less than 1 in 100,000 of triggering active dials.

### 3. How the Central Office Decodes: The Goertzel Filter

At the receiving station, the central exchange decodes these dual signals. Instead of executing heavy, memory-intensive Fast Fourier Transforms (FFT) across all frequencies, telephone computers run an optimized algorithm called **The Goertzel Algorithm**.

Think of Goertzel as high-school resonance: it behaves like 8 individual metal tuning forks connected to a board. The algorithm only computes the mathematical coefficient weights for our 8 specific DTMF frequencies, checking if the energy of exactly one column fork and one row fork spikes past a logical loudness threshold, revealing the dialed key cleanly!

---

## 📱 Porting to Pure Dart (Flutter Library Ready!)

Currently, many Flutter projects rely on slow assets or native platform channels to play dial sounds. Our pure Dart port allows you to generate standard binary byte buffers on-the-fly on any thread without importing heavy third-party packages.

### Dart PCM Wave Synthesis Implementation

```dart
import 'dart:math';
import 'dart:typed_data';

class DtmfGenerator {
  static const int sampleRate = 44100; // Standard CD Quality

  static const Map<String, List<double>> dtmfMap = {
    '1': [697, 1209], '2': [697, 1336], '3': [697, 1477], 'A': [697, 1633],
    '4': [770, 1209], '5': [770, 1336], '6': [770, 1477], 'B': [770, 1633],
    '7': [852, 1209], '8': [852, 1336], '9': [852, 1477], 'C': [852, 1633],
    '*': [941, 1209], '0': [941, 1336], '#': [941, 1477], 'D': [941, 1633],
  };

  /// Generates a signed Int16 array representation of dual-tone waves.
  static Int16List generatePcm(String key, int durationMs, {double amplitude = 0.5}) {
    final cleanKey = key.toUpperCase();
    if (!dtmfMap.containsKey(cleanKey)) {
      throw ArgumentError('Invalid key: $key');
    }

    final freqs = dtmfMap[cleanKey]!;
    final double f1 = freqs[0];
    final double f2 = freqs[1];

    final int totalSamples = (sampleRate * (durationMs / 1000)).round();
    final Int16List buffer = Int16List(totalSamples);

    for (int i = 0; i < totalSamples; i++) {
      final double t = i / sampleRate;
      final double wave = 0.5 * (sin(2 * pi * f1 * t) + sin(2 * pi * f2 * t));

      // Clamp to prevent clip cracking and map to short range (-32768 to 32767)
      buffer[i] = (wave.clamp(-1.0, 1.0) * 32767 * amplitude).round();
    }
    return buffer;
  }
}
```

---

## 🛠️ Applet Development & Runtime Setup

### Structure

- `/src/dtmf-engine.ts`: The central Web Audio oscillator controller that mixes low/high filters and maps sequences.
- `/src/components/visualizer.tsx`: Custom-drawn canvas oscilloscope and FFT magnitude analyzers.
- `/src/components/keypad.tsx`: Grid coordinates mapping system.
- `/src/components/lesson-kid.tsx`: Interactive slides explaining signal routing and the tuning fork analogy.
- `/src/components/code-exporter.tsx`: Quick source displays for standard Flutter/Android system ports.

### Setup and Running Locally

1. Clone this repository to your computer workspace:
   ```bash
   git clone https://github.com/your-username/dtmf-matrix-generator.git
   cd dtmf-matrix-generator
   ```
2. Install standard node modules:
   ```bash
   npm install
   ```
3. Boot the local development server:
   ```bash
   npm run dev
   ```
4. Build static, minified assets for free static hosts (Vercel, GitHub Pages, Netlify):
   ```bash
   npm run build
   ```

---

## 🎓 Background Reference

This implementation drew inspiration from standard telecom physical science guidelines and open android modules like `hardcodedjoy/android-app-dtmf-generator`. We optimized the waveform rendering in clean, reactive React/TypeScript to maximize learning layout potential.

Enjoy making some retro soundwaves! 📞🔊
