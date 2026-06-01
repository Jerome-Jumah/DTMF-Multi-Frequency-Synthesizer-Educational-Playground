/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Activity, AlertCircle, HelpCircle, Music, Sliders, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { DtmfEngine } from "../dtmf-engine";

export function LessonKid() {
  const [custLow, setCustLow] = useState<number>(750);
  const [custHigh, setCustHigh] = useState<number>(1400);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Handle playing custom experiment frequencies
  useEffect(() => {
    if (isPlaying) {
      DtmfEngine.getInstance().startTone(custLow, custHigh);
    } else {
      DtmfEngine.getInstance().stopTone();
    }
  }, [isPlaying, custLow, custHigh]);

  const toggleCustomPlay = () => {
    if (!isPlaying) {
      DtmfEngine.getInstance().init();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="flex flex-col gap-8 bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl shadow-xl max-w-4xl mx-auto text-slate-100">
      {/* Visual Title */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-5">
        <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
          <Sparkles className="w-6 h-6 text-amber-500" />
        </div>
        <div>
          <h2 className="font-sans font-bold text-xl text-slate-100">DTMF Explained Like You&apos;re 10!</h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">The Physics, Math and Codes of Dual-Tone Signaling</p>
        </div>
      </div>

      {/* Grid of Concepts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: What is DTMF? */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800/80 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-rose-400">
            <Music className="w-4.5 h-4.5" />
            <h3 className="font-sans font-semibold text-sm uppercase tracking-wider">1. What does &quot;DTMF&quot; mean?</h3>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            It stands for <strong className="text-slate-100">Dual-Tone Multi-Frequency</strong>. When you press a key on your phone, instead of
            whistling just <em className="text-amber-500 font-normal">one</em> note, the phone plays{" "}
            <strong className="text-slate-100">two different musical notes at the exact same time</strong>!
          </p>
          <div className="bg-slate-900/60 p-3.5 rounded-lg text-xs border border-slate-900/85">
            <span className="font-bold block text-slate-200 mb-1">💡 The Pizza Crust Analogy:</span>
            If you order a pizza with just cheese, it could taste like any standard flatbread or pie. But if you order{" "}
            <strong className="text-amber-500">Pepperoni + Pineapple</strong>, that unique combination makes it unmistakable! DTMF does the same thing
            with sound.
          </div>
        </div>

        {/* Card 2: Why two notes? */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800/80 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sky-400">
            <HelpCircle className="w-4.5 h-4.5" />
            <h3 className="font-sans font-semibold text-sm uppercase tracking-wider">2. Why did engineers do this?</h3>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            Back in the day, old phone systems clicked mechanical switches. When electronic lines arrived, they needed a fast way to dial numbers
            using tone whistles.
          </p>
          <p className="text-sm text-slate-300 leading-relaxed">
            But there was a problem! Humans speaking or background noises (like whistling kettles, music on the radio, or baby cries) might make the
            exact same note and trigger dials by accident!
          </p>
          <div className="bg-slate-900/60 p-3.5 rounded-lg text-xs text-rose-300/90 border border-slate-900/85">
            <strong className="text-slate-200">The Solution:</strong> Sound proofing! Humans almost never speak at two perfectly aligned frequencies
            simultaneously. Checking for <strong className="text-slate-100">two precise notes</strong> keeps speech from dial-hacking the phone line!
          </div>
        </div>
      </div>

      {/* The Interactive Signal Mixer Experiment Box */}
      <div className="bg-slate-950 p-5 md:p-6 rounded-xl border border-slate-800/80 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-500">
            <Sliders className="w-5 h-5" />
            <h3 className="font-sans font-semibold text-sm uppercase tracking-wider">3. Play with Constructive and Destructive Interference!</h3>
          </div>
          <span className="text-[10px] font-mono bg-slate-900 px-2.5 py-1 rounded-full text-slate-400">Beats Experiment Station</span>
        </div>

        <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
          When waves overlap in the air, they mathematically <strong className="text-slate-200">add up</strong>. When crest meets crest, they grow
          louder (constructive). When crest meets trough, they cancel each other out (destructive). Drag these sliders to blend any two frequencies
          and hear the mathematical interference!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
          {/* Slider 1 */}
          <div className="flex flex-col gap-3.5 bg-slate-900 p-4 rounded-lg border border-slate-800/60">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-rose-400 font-bold">LOW GROUP (f1)</span>
              <span className="text-slate-400">{custLow} Hz</span>
            </div>
            <input
              type="range"
              min="500"
              max="1100"
              step="5"
              value={custLow}
              onChange={e => setCustLow(parseInt(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
              disabled={isPlaying && false}
              title="Custom Low Frequency Slider"
              id="custom-low-freq-slider"
            />
            <span className="text-[10px] text-slate-500">Corresponds to phone keypad Rows: generally low, deep rumble pitch.</span>
          </div>

          {/* Slider 2 */}
          <div className="flex flex-col gap-3.5 bg-slate-900 p-4 rounded-lg border border-slate-800/60">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-sky-400 font-bold">HIGH GROUP (f2)</span>
              <span className="text-slate-400">{custHigh} Hz</span>
            </div>
            <input
              type="range"
              min="1100"
              max="1900"
              step="5"
              value={custHigh}
              onChange={e => setCustHigh(parseInt(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
              disabled={isPlaying && false}
              title="Custom High Frequency Slider"
              id="custom-high-freq-slider"
            />
            <span className="text-[10px] text-slate-500">Corresponds to phone keypad Columns: high-pitched whistling squeak.</span>
          </div>
        </div>

        {/* Action button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2 pt-4 border-t border-slate-900">
          <div className="flex flex-col gap-1 text-xs text-slate-400">
            <div className="flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-amber-500" id="custom-beats-icon" />
              <span className="font-mono text-slate-300">
                Formula: sin(2π × {custLow} × t) + sin(2π × {custHigh} × t)
              </span>
            </div>
            <span>Notice the rhythmic &quot;wobbling&quot; sound? That is frequency beat oscillation!</span>
          </div>

          <button
            onClick={toggleCustomPlay}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-lg font-sans font-bold tracking-wide uppercase text-xs cursor-pointer border transition-all ${
              isPlaying
                ? "bg-rose-500 border-rose-600 text-white shadow-lg shadow-rose-950 hover:bg-rose-600"
                : "bg-amber-500 border-amber-600 text-slate-950 shadow-md hover:bg-amber-400 shadow-slate-950"
            }`}
            id="custom-tone-toggle-btn"
          >
            {isPlaying ? "STOP CUSTOM SYNTH" : "PLAY CUSTOM TONES"}
          </button>
        </div>
      </div>

      {/* Section 4: Decoding */}
      <div className="bg-slate-950 p-5 md:p-6 rounded-xl border border-slate-800/80 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-indigo-400">
          <AlertCircle className="w-4.5 h-4.5" />
          <h3 className="font-sans font-semibold text-sm uppercase tracking-wider">4. How does the receiving computer decode the notes?</h3>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
          When the central hub or your smartphone mic listens to this audio, it uses a high-school physics trick called{" "}
          <strong className="text-slate-100">Resonance</strong>. In digital math on Android or Java, this is coded using the{" "}
          <strong className="text-amber-500 underline font-semibold cursor-help" title="An optimized digital filter for specific target tones">
            Goertzel Algorithm
          </strong>
          :
        </p>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex flex-col gap-3 mt-1.5">
          <p className="text-xs text-slate-200 leading-relaxed">
            🔬 <strong className="text-slate-105">The Tuning Fork Analogy:</strong> Imagine a wooden board with 8 metal tuning forks on it—one for
            each DTMF frequency (697Hz, 770Hz... up to 1633Hz).
          </p>
          <ul className="list-disc pl-5 text-xs text-slate-400 space-y-1.5">
            <li>When the speaker plays sound wave combinations, the wood vibrates.</li>
            <li>
              If tone <strong className="text-amber-500 font-semibold">852 Hz</strong> is present, the 852Hz tuning fork starts singing at full
              volume!
            </li>
            <li>
              If tone <strong className="text-sky-400 font-semibold">1477 Hz</strong> is also present, that tuning fork hums too!
            </li>
            <li>
              The computer looks at the wooden board, sees that ONLY the <strong className="text-rose-400">852Hz (Row 3)</strong> and the{" "}
              <strong className="text-sky-400">1477Hz (Column 3)</strong> forks are vibrating, looks at its keypad grid, and instantly knows:{" "}
              <strong className="text-slate-100 text-sm">Key &quot;9&quot; was pressed!</strong>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
