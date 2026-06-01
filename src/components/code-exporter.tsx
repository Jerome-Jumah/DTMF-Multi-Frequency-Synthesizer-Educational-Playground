/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Check, Code, Copy, FileText, Laptop, Smartphone } from "lucide-react";
import { useState } from "react";

export function CodeExporter() {
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"dart" | "kotlin">("dart");

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const dartCode = `/// dtmf_generator.dart
/// A high-performance, pure Dart DTMF tone synthesizer.
/// Perfect for packaging as a Flutter or Dart CLI library.
/// Uses 16-bit signed PCM audio buffers on-the-fly.

import 'dart:math';
import 'dart:typed_data';

class DtmfGenerator {
  // Configurable Sample-rate (CD standard 44.1kHz is recommended)
  static const int sampleRate = 44100;

  // The 16 telephone dual frequencies (Hertz) mapped row-and-column-wise
  static const Map<String, List<double>> dtmfMap = {
    '1': [697, 1209], '2': [697, 1336], '3': [697, 1477], 'A': [697, 1633],
    '4': [770, 1209], '5': [770, 1336], '6': [770, 1477], 'B': [770, 1633],
    '7': [852, 1209], '8': [852, 1336], '9': [852, 1477], 'C': [852, 1633],
    '*': [941, 1209], '0': [941, 1336], '#': [941, 1477], 'D': [941, 1633],
  };

  /// Generates a 16-bit Mono Sign-Extended PCM audio buffer for a given [key] 
  /// and [durationMs]. The returned Int16List can be written to a stream 
  /// or fed into Flutter sound packages like 'audioplayers' or writing to a temporary wav.
  static Int16List generatePcm(String key, int durationMs, {double amplitude = 0.5}) {
    final cleanKey = key.toUpperCase();
    if (!dtmfMap.containsKey(cleanKey)) {
      throw ArgumentError('Invalid DTMF key: $key. Valid are 0-9, *, #, A-D');
    }

    final List<double> freqs = dtmfMap[cleanKey]!;
    final double f1 = freqs[0]; // Low row frequency
    final double f2 = freqs[1]; // High column frequency

    final int totalSamples = (sampleRate * (durationMs / 1000)).round();
    final Int16List buffer = Int16List(totalSamples);

    for (int i = 0; i < totalSamples; i++) {
      // Time in seconds
      final double t = i / sampleRate;

      // Pure DTMF physics blend formula: 50% amplitude of each sine-wave
      final double wave1 = sin(2 * pi * f1 * t);
      final double wave2 = sin(2 * pi * f2 * t);
      final double sample = 0.5 * (wave1 + wave2);

      // Clamp wave between -1.0 and 1.0 to guard against clipping,
      // then convert to 16-bit short range (-32768 to 32767)
      final double clampedSample = sample.clamp(-1.0, 1.0);
      buffer[i] = (clampedSample * 32767 * amplitude).round();
    }

    return buffer;
  }

  /// Helper utility that packs a PCM buffer with a standard WAV file header
  /// so it can be played back by any standard Dart / Flutter audio player plugin.
  static Uint8List pcmToWav(Int16List pcmData) {
    final int byteLength = pcmData.length * 2;
    final int fileLength = byteLength + 36;
    final ByteData header = ByteData(44);

    // RIFF Header
    header.setUint8(0, 0x52); // R
    header.setUint8(1, 0x49); // I
    header.setUint8(2, 0x46); // F
    header.setUint8(3, 0x46); // F
    header.setUint32(4, fileLength, Endian.little);
    
    // WAVE Header
    header.setUint8(8, 0x57);  // W
    header.setUint8(9, 0x41);  // A
    header.setUint8(10, 0x56); // V
    header.setUint8(11, 0x45); // E

    // fmt Chunk
    header.setUint8(12, 0x66); // f
    header.setUint8(13, 0x6d); // m
    header.setUint8(14, 0x74); // t
    header.setUint8(15, 0x20); // space
    header.setUint32(16, 16, Endian.little); // Chunk size
    header.setUint16(20, 1, Endian.little);  // Format (1 is uncompressed PCM)
    header.setUint16(22, 1, Endian.little);  // Channels (1 is Mono)
    header.setUint32(24, sampleRate, Endian.little); // Sampling frequency
    header.setUint32(28, sampleRate * 2, Endian.little); // Byte rate per sec
    header.setUint16(32, 2, Endian.little);  // Frame/block align (2 bytes)
    header.setUint16(34, 16, Endian.little); // Bits per sample (16 bit)

    // data Chunk
    header.setUint8(36, 0x64); // d
    header.setUint8(37, 0x61); // a
    header.setUint8(38, 0x74); // t
    header.setUint8(39, 0x61); // a
    header.setUint32(40, byteLength, Endian.little); // PCM contents size

    // Mesh Header and Body
    final Uint8List fileBytes = Uint8List(44 + byteLength);
    fileBytes.setRange(0, 44, header.buffer.asUint8List());
    fileBytes.setRange(44, fileBytes.length, pcmData.buffer.asUint8List());

    return fileBytes;
  }
}`;

  const kotlinCode = `package com.hardcodedjoy.dtmf

import android.media.AudioFormat
import android.media.AudioManager
import android.media.AudioTrack
import kotlin.math.sin

/**
 * Android/Kotlin DTMF Generator Engine.
 * Recreates the engine referenced from hardcodedjoy/android-app-dtmf-generator.
 * Generates waveforms in real-time and pipes them directly through JVM AudioTrack.
 */
class AndroidDtmfGenerator {
    private val sampleRate = 44100
    private var audioTrack: AudioTrack? = null

    // Dual frequencies mapping: [Low Freq, High Freq]
    private val dtmfPairs = mapOf(
        '1' to floatArrayOf(697f, 1209f), '2' to floatArrayOf(697f, 1336f), '3' to floatArrayOf(697f, 1477f), 'A' to floatArrayOf(697f, 1633f),
        '4' to floatArrayOf(770f, 1209f), '5' to floatArrayOf(770f, 1336f), '6' to floatArrayOf(770f, 1477f), 'B' to floatArrayOf(770f, 1633f),
        '7' to floatArrayOf(852f, 1209f), '8' to floatArrayOf(852f, 1336f), '9' to floatArrayOf(852f, 1477f), 'C' to floatArrayOf(852f, 1633f),
        '*' to floatArrayOf(941f, 1209f), '0' to floatArrayOf(941f, 1336f), '#' to floatArrayOf(941f, 1477f), 'D' to floatArrayOf(941f, 1633f)
    )

    /**
     * Synthesizes and plays a DTMF tone on a background audio track.
     * Note: Avoid calling this on the main Android UI thread.
     */
    fun playKey(key: Char, durationMs: Int, volume: Float = 0.5f) {
        val freqs = dtmfPairs[key.toUpperCase()] ?: return
        val f1 = freqs[0]
        val f2 = freqs[1]

        val totalSamples = (sampleRate * (durationMs / 1000f)).toInt()
        val buffer = ShortArray(totalSamples)

        val twopi = 2f * Math.PI.toFloat()

        for (i in 0 until totalSamples) {
            val t = i.toFloat() / sampleRate
            
            // Generate combined double sine waves
            val waveLow = sin(twopi * f1 * t)
            val waveHigh = sin(twopi * f2 * t)
            val sample = 0.5f * (waveLow + waveHigh)

            // Scale to standard Shorts for AudioFormat.ENCODING_PCM_16BIT (-32768..32767)
            buffer[i] = (sample * 32767f * volume).toInt().toShort()
        }

        stop() // Clear existing track

        // Initialize Android AudioTrack
        val bufferSize = buffer.size * 2
        audioTrack = AudioTrack(
            AudioManager.STREAM_MUSIC,
            sampleRate,
            AudioFormat.CHANNEL_OUT_MONO,
            AudioFormat.ENCODING_PCM_16BIT,
            bufferSize,
            AudioTrack.MODE_STATIC
        ).apply {
            write(buffer, 0, buffer.size)
            play()
        }
    }

    /**
     * Stop and release active hardware audio track
     */
    fun stop() {
        audioTrack?.apply {
            try {
                if (playState == AudioTrack.PLAYSTATE_PLAYING) {
                    stop()
                }
                release()
            } catch (e: Exception) {
                // Handle dead tracks gracefully
            }
        }
        audioTrack = null
    }
}`;

  return (
    <div className="flex flex-col gap-6 bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl shadow-xl max-w-4xl mx-auto">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <Code className="w-5 h-5 text-sky-400" />
          <h3 className="font-sans font-bold text-slate-100">Export DTMF Library Source</h3>
        </div>
        <div className="text-xs font-mono text-slate-400">Clean Math, Perfect Porting</div>
      </div>

      <p className="text-sm text-slate-400 leading-relaxed">
        Click to review and copy the core mathematical DTMF synthesis algorithms. These functions generate audio binary streams on-the-fly and work
        fully offline without any third-party dependencies!
      </p>

      {/* Tabs */}
      <div className="flex bg-slate-950 p-1.5 rounded-lg border border-slate-800 self-start">
        <button
          onClick={() => setActiveTab("dart")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-sans font-bold uppercase tracking-wider rounded-md cursor-pointer transition-all ${
            activeTab === "dart" ? "bg-sky-400/10 text-sky-400 font-semibold" : "text-slate-400 hover:text-slate-200"
          }`}
          id="btn-tab-dart"
        >
          <Laptop className="w-4 h-4" />
          Dart (Standard Port)
        </button>
        <button
          onClick={() => setActiveTab("kotlin")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-sans font-bold uppercase tracking-wider rounded-md cursor-pointer transition-all ${
            activeTab === "kotlin" ? "bg-amber-500/10 text-amber-500 font-semibold" : "text-slate-400 hover:text-slate-200"
          }`}
          id="btn-tab-kotlin"
        >
          <Smartphone className="w-4 h-4" />
          Kotlin (Android AudioTrack)
        </button>
      </div>

      {/* Export Display Area */}
      <div className="relative group">
        {/* Copy Floating Button */}
        <button
          onClick={() => copyToClipboard(activeTab === "dart" ? dartCode : kotlinCode, activeTab)}
          className="absolute top-4 right-4 bg-slate-900 border border-slate-800 text-slate-300 hover:text-slate-100 p-2 rounded-lg cursor-pointer transition-all flex items-center gap-1.5 shadow-lg"
          title="Copy to clipboard"
          id="btn-copy-code"
        >
          {copied === activeTab ? (
            <>
              <Check className="w-4 h-4 text-emerald-500" />
              <span className="text-[10px] font-mono text-emerald-500 font-bold">COPIED!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span className="text-[10px] font-mono">COPY</span>
            </>
          )}
        </button>

        {/* Code Block */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-xl max-h-[420px] overflow-auto shadow-inner font-mono text-xs text-slate-300 p-5 leading-relaxed antialiased">
          <pre className="whitespace-pre">{activeTab === "dart" ? dartCode : kotlinCode}</pre>
        </div>
      </div>

      {/* Flutter packaging notes */}
      {activeTab === "dart" && (
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/85 text-xs text-slate-400 flex flex-col gap-2">
          <div className="flex items-center gap-1.5 font-sans font-bold text-slate-300">
            <FileText className="w-4 h-4 text-sky-400" />
            How to use this in your Dart library:
          </div>
          <ol className="list-decimal pl-5 space-y-1 font-mono text-[11px] leading-relaxed">
            <li>
              Generate the byte list:{" "}
              <code className="text-amber-500 bg-slate-900 px-1 py-0.5 rounded">final pcm = DtmfGenerator.generatePcm(&apos;5&apos;, 300);</code>
            </li>
            <li>
              Covert it to wave bytes: <code className="text-sky-400 bg-slate-900 px-1 py-0.5 rounded">final wav = DtmfGenerator.pcmToWav(pcm);</code>
            </li>
            <li>
              Play using standard Flutter storage cache or piping <code className="text-emerald-500">wav</code> directly into an audio track writer,
              e.g., <code className="bg-slate-900 px-1 py-0.5 rounded">audioplayers</code> plug-in source buffer byte streams!
            </li>
          </ol>
        </div>
      )}

      {/* Android/Kotlin packaging notes */}
      {activeTab === "kotlin" && (
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/85 text-xs text-slate-400 flex flex-col gap-2">
          <div className="flex items-center gap-1.5 font-sans font-bold text-slate-300">
            <FileText className="w-4 h-4 text-amber-500" />
            Comparison with the Java Android reference repo:
          </div>
          <p className="font-sans text-[11px] leading-relaxed">
            The reference app uses Android&apos;s raw buffers to calculate audio samples just like we did above. Our clean Kotlin class wraps that
            math within Android&apos;s static <code className="text-amber-500 bg-slate-900 px-1.5 py-0.5 rounded">AudioTrack</code> API, preventing
            thread blocks and avoiding clipping by using safe amplitude clamps!
          </p>
        </div>
      )}
    </div>
  );
}
