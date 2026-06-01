/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Activity, FileCode, GraduationCap, Play, Square } from "lucide-react";
import { useState } from "react";
import { CodeExporter } from "./components/code-exporter";
import { Keypad } from "./components/keypad";
import { LessonKid } from "./components/lesson-kid";
import { Visualizer } from "./components/visualizer";
import { freqMap } from "./constants";
import { DtmfEngine } from "./dtmf-engine";
import { HighFreq, LowFreq } from "./types";

export default function App() {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [activeLow, setActiveLow] = useState<number | null>(null);
  const [activeHigh, setActiveHigh] = useState<number | null>(null);

  // Automated Sequence Dialer State
  const [dialString, setDialString] = useState<string>("1-800-474-3263-#");
  const [toneDuration, setToneDuration] = useState<number>(150);
  const [pauseDuration, setPauseDuration] = useState<number>(100);
  const [isDialing, setIsDialing] = useState<boolean>(false);

  // Sync state from manual keyboard/mouse keypad triggers
  const handleKeyActive = (key: string | null, low: LowFreq | null, high: HighFreq | null) => {
    setActiveKey(key);
    setActiveLow(low);
    setActiveHigh(high);
  };

  // Run automated sequence playing
  const handleDialSequence = async () => {
    if (isDialing) return;
    setIsDialing(true);

    const engine = DtmfEngine.getInstance();

    try {
      await engine.playSequence(
        dialString,
        char => {
          if (char) {
            const freqs = freqMap[char];
            if (freqs) {
              setActiveKey(char);
              setActiveLow(freqs[0]);
              setActiveHigh(freqs[1]);
            }
          } else {
            setActiveKey(null);
            setActiveLow(null);
            setActiveHigh(null);
          }
        },
        toneDuration,
        pauseDuration,
      );
    } catch (e) {
      console.error(e);
    } finally {
      setIsDialing(false);
      setActiveKey(null);
      setActiveLow(null);
      setActiveHigh(null);
    }
  };

  const handleCancelDialing = () => {
    DtmfEngine.getInstance().cancelSequence();
    setIsDialing(false);
    setActiveKey(null);
    setActiveLow(null);
    setActiveHigh(null);
  };

  const loadPresetSequence = (val: string) => {
    setDialString(val);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none antialiased">
      {/* Decorative Outer Top Glow Bar (Architectural Visuals) */}
      <div className="h-1 bg-gradient-to-r from-amber-500 via-rose-500 to-sky-400 w-full" />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 md:py-12 flex flex-col gap-10">
        {/* Header Block with Telecom aesthetics */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-900 pb-6">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                V1.0 - DSP Synthesizer
              </span>
            </div>
            <h1 className="font-sans font-bold text-3xl text-slate-100 tracking-tight mt-1">
              DTMF Matrix <span className="text-amber-500 font-light">&amp;</span> Tone Generator
            </h1>
            <p className="text-xs md:text-sm text-slate-400 font-mono mt-0.5">Learn, Synthesize, and Export Dual-Tone Multi-Frequency signals.</p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 self-start sm:self-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Web Audio Engine Active</span>
          </div>
        </header>

        {/* Central Dashboard Layout */}
        <section className="grid grid-cols-1 lg:grid-cols-[1.1fr_1.5fr] gap-8 items-start">
          {/* Keypad Column */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 px-1 mb-2">
              <Activity className="w-4.5 h-4.5 text-amber-500" />
              <span className="font-sans font-semibold text-xs text-slate-400 uppercase tracking-widest">Interactive Operator Pad</span>
            </div>
            <Keypad onKeyActive={handleKeyActive} activeKey={activeKey} />
          </div>

          {/* Real-time Oscilloscope and FFT Visualizers Column */}
          <div className="flex flex-col gap-1.5 h-full">
            <div className="flex items-center gap-2 px-1 mb-1.5">
              <Activity className="w-4.5 h-4.5 text-sky-400 animate-pulse" />
              <span className="font-sans font-semibold text-xs text-slate-400 uppercase tracking-widest">Spectral Oscilloscope Monitor</span>
            </div>
            <Visualizer activeKey={activeKey} activeLow={activeLow} activeHigh={activeHigh} />
          </div>
        </section>

        {/* Automated Sequence Dialer Terminal */}
        <section className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl shadow-xl flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-850 pb-4">
            <div className="flex items-center gap-2 text-amber-500">
              <Play className="w-5 h-5" />
              <h3 className="font-sans font-bold text-sm uppercase tracking-wider text-slate-200">Automated Sequence Dialing Terminal</h3>
            </div>
            <div className="text-[10px] font-mono bg-slate-950 px-2.5 py-1 rounded text-slate-500 select-none border border-slate-850">
              CCITT / ITU Standardization Speed Playback
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input & Presets Pane */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-mono text-slate-400" htmlFor="dial-string-input">
                  Enter Sequence to Dial (0-9, A-D, *, #, and spaces for pause)
                </label>
                <div className="flex items-stretch gap-2">
                  <input
                    type="text"
                    id="dial-string-input"
                    value={dialString}
                    onChange={e => setDialString(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 font-mono text-sm text-amber-500 focus:outline-none focus:border-amber-500/50 shadow-inner"
                    placeholder="e.g., 18005550199#"
                    disabled={isDialing}
                  />

                  {isDialing ? (
                    <button
                      onClick={handleCancelDialing}
                      className="bg-rose-500 border border-rose-600 hover:bg-rose-600 text-slate-100 px-5 rounded-lg flex items-center justify-center gap-1.5 text-xs font-sans font-bold uppercase tracking-wider cursor-pointer transition-all"
                      id="dialer-btn-cancel"
                    >
                      <Square className="w-3.5 h-3.5" />
                      CANCEL
                    </button>
                  ) : (
                    <button
                      onClick={handleDialSequence}
                      className="bg-amber-500 border border-amber-650 hover:bg-amber-450 text-slate-950 px-6 rounded-lg flex items-center justify-center gap-1.5 text-xs font-sans font-bold uppercase tracking-wider cursor-pointer shadow-lg shadow-amber-950/20 transition-all active:translate-y-0.5"
                      id="dialer-btn-play"
                    >
                      <Play className="w-3.5 h-3.5" />
                      DIAL RECORD
                    </button>
                  )}
                </div>
              </div>

              {/* Presets List */}
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-[10px] font-mono text-slate-500 select-none mr-2">Preset Dials:</span>
                <button
                  onClick={() => loadPresetSequence("1-800-474-3263-#")}
                  className="bg-slate-950 hover:bg-slate-800 text-slate-300 px-2.5 py-1 rounded text-[11px] font-mono border border-slate-800 cursor-pointer transition-all"
                  disabled={isDialing}
                  id="preset-p1"
                >
                  US standard (1-800-GRID-#)
                </button>
                <button
                  onClick={() => loadPresetSequence("1234567890*#")}
                  className="bg-slate-950 hover:bg-slate-800 text-slate-300 px-2.5 py-1 rounded text-[11px] font-mono border border-slate-800 cursor-pointer transition-all"
                  disabled={isDialing}
                  id="preset-p2"
                >
                  Keypad Scan test
                </button>
                <button
                  onClick={() => loadPresetSequence("A-B-C-D-1-5-9-#")}
                  className="bg-slate-950 hover:bg-slate-800 text-slate-300 px-2.5 py-1 rounded text-[11px] font-mono border border-slate-800 cursor-pointer transition-all"
                  disabled={isDialing}
                  id="preset-p3"
                >
                  Priority Signal Lines (A-B-C-D)
                </button>
              </div>
            </div>

            {/* Speeds & Timings Pane */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col gap-4">
              <span className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-widest block border-b border-slate-900 pb-1.5">
                Speed Configuration
              </span>

              {/* Slider: Tone Duration */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span>Tone Duration:</span>
                  <span className="text-amber-500 font-bold">{toneDuration}ms</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="500"
                  step="10"
                  value={toneDuration}
                  onChange={e => setToneDuration(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  disabled={isDialing}
                  title="Dial tone duration milliseconds slider"
                  id="timing-tone-duration-slider"
                />
              </div>

              {/* Slider: Pause Duration */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span>Inter-digit Pause:</span>
                  <span className="text-sky-400 font-bold">{pauseDuration}ms</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="400"
                  step="10"
                  value={pauseDuration}
                  onChange={e => setPauseDuration(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                  disabled={isDialing}
                  title="Inter-digit pause duration milliseconds slider"
                  id="timing-pause-duration-slider"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Physics Lesson Tab & Code Library Port Tabs */}
        <section className="grid grid-cols-1 gap-10">
          {/* Section: Kid Lesson */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 px-1 mb-2">
              <GraduationCap className="w-5 h-5 text-amber-500" />
              <span className="font-sans font-semibold text-xs text-slate-400 uppercase tracking-widest">
                Interactive Learning Playground (Physics of Sound)
              </span>
            </div>
            <LessonKid />
          </div>

          {/* Section: Code Exporter */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 px-1 mb-2">
              <FileCode className="w-5 h-5 text-sky-400 animate-pulse" />
              <span className="font-sans font-semibold text-xs text-slate-400 uppercase tracking-widest">Production-Ready Porting Resources</span>
            </div>
            <CodeExporter />
          </div>
        </section>
      </main>

      {/* Decorative Bottom Bar Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-600 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>DTMF Dual-Tone Math-Grid Operator Node</span>
          <span>© 1963-2026 Bell Labs &amp; ITU Standard Signalling</span>
        </div>
      </footer>
    </div>
  );
}
