/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from "react";

import { Activity, Info, Zap } from "lucide-react";
import { DtmfEngine } from "../dtmf-engine";

interface VisualizerProps {
  activeKey: string | null;
  activeLow: number | null;
  activeHigh: number | null;
}

export function Visualizer({ activeKey, activeLow, activeHigh }: VisualizerProps) {
  const oscCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fftCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);

  // Read actual frequency state from the engine
  const [liveFrequencies, setLiveFrequencies] = useState<{ low: number; high: number } | null>(null);

  useEffect(() => {
    if (activeLow && activeHigh) {
      setLiveFrequencies({ low: activeLow, high: activeHigh });
    } else if (!activeKey) {
      // Fade out slowly, or set to null immediately
      setLiveFrequencies(null);
    }
  }, [activeKey, activeLow, activeHigh]);

  useEffect(() => {
    const engine = DtmfEngine.getInstance();

    const draw = () => {
      // Ensure canvas contexts are available
      const oscCanvas = oscCanvasRef.current;
      const fftCanvas = fftCanvasRef.current;

      const scale = window.devicePixelRatio || 1;

      // 1. Draw Math Oscilloscope
      if (oscCanvas) {
        const ctx = oscCanvas.getContext("2d");
        if (ctx) {
          // Adjust for HDPI displays
          if (oscCanvas.width !== oscCanvas.clientWidth * scale) {
            oscCanvas.width = oscCanvas.clientWidth * scale;
            oscCanvas.height = oscCanvas.clientHeight * scale;
          }

          const w = oscCanvas.width;
          const h = oscCanvas.height;

          // Clear
          ctx.fillStyle = "#111827"; // Gray 900
          ctx.fillRect(0, 0, w, h);

          // Draw grid lines
          ctx.strokeStyle = "#1f2937"; // Gray 800
          ctx.lineWidth = 1;
          for (let i = 1; i < 4; i++) {
            const y = (h / 4) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
          }

          // Phase animation
          phaseRef.current += 0.05;

          const points = 300;
          const paddingX = 40;
          const drawWidth = w - paddingX * 2;

          const lowF = liveFrequencies?.low || 0;
          const highF = liveFrequencies?.high || 0;

          // If no tone is active, simulate a very gentle 1Hz drifting ambient wave to keep dashboard alive
          const isSilent = !liveFrequencies;
          const f1 = isSilent ? 2 : lowF;
          const f2 = isSilent ? 3 : highF;
          const ampMult = isSilent ? 0.08 : 0.7;

          // Calculate offset y for 3 stacked previews
          // Top: Low Sines
          // Middle: High Sines
          // Bottom: Combined (Sum)
          const laneHeight = h / 3;

          ctx.lineWidth = 2;

          // Draw Low Wave
          ctx.beginPath();
          ctx.strokeStyle = isSilent ? "rgba(244, 63, 94, 0.2)" : "#f43f5e"; // Rose 500
          for (let i = 0; i < points; i++) {
            const x = paddingX + (i / points) * drawWidth;
            const normalizedX = i / points;
            // standard sine formula with scaling
            // cycles based on frequency, normalized for viewport
            const cycles = (f1 / 100) * 2 * Math.PI;
            const y = laneHeight / 2 + Math.sin(normalizedX * cycles - phaseRef.current) * (laneHeight * 0.35) * ampMult;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();

          // Draw High Wave
          ctx.beginPath();
          ctx.strokeStyle = isSilent ? "rgba(56, 189, 248, 0.2)" : "#38bdf8"; // Sky 400
          for (let i = 0; i < points; i++) {
            const x = paddingX + (i / points) * drawWidth;
            const normalizedX = i / points;
            const cycles = (f2 / 100) * 2 * Math.PI;
            const y = laneHeight + laneHeight / 2 + Math.sin(normalizedX * cycles - phaseRef.current * 1.5) * (laneHeight * 0.35) * ampMult;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();

          // Draw Combined Interference Sum Wave!
          ctx.beginPath();
          ctx.strokeStyle = isSilent ? "rgba(234, 179, 8, 0.2)" : "#eab308"; // Amber 500
          ctx.lineWidth = 3;
          for (let i = 0; i < points; i++) {
            const x = paddingX + (i / points) * drawWidth;
            const normalizedX = i / points;
            const cycles1 = (f1 / 100) * 2 * Math.PI;
            const cycles2 = (f2 / 100) * 2 * Math.PI;

            const sine1 = Math.sin(normalizedX * cycles1 - phaseRef.current);
            const sine2 = Math.sin(normalizedX * cycles2 - phaseRef.current * 1.5);

            const combinedSine = (sine1 + sine2) * 0.5;

            const y = laneHeight * 2 + laneHeight / 2 + combinedSine * (laneHeight * 0.4) * ampMult;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();

          // Draw graph legends
          ctx.fillStyle = "#9ca3af"; // Gray 400
          ctx.font = `${Math.max(10, 11 * scale)}px monospace`;
          ctx.fillText(`LOW WAVE [f1]: ${lowF || "Idle"} Hz`, paddingX, 22 * scale);
          ctx.fillText(`HIGH WAVE [f2]: ${highF || "Idle"} Hz`, paddingX, laneHeight + 22 * scale);
          ctx.fillText(`COMBINED SIGNAL: f1 + f2`, paddingX, laneHeight * 2 + 22 * scale);
        }
      }

      // 2. Draw Live FFT Spectrum Analyzer
      if (fftCanvas) {
        const ctx = fftCanvas.getContext("2d");
        if (ctx) {
          if (fftCanvas.width !== fftCanvas.clientWidth * scale) {
            fftCanvas.width = fftCanvas.clientWidth * scale;
            fftCanvas.height = fftCanvas.clientHeight * scale;
          }

          const w = fftCanvas.width;
          const h = fftCanvas.height;

          // Clear
          ctx.fillStyle = "#0f172a"; // Slate 900
          ctx.fillRect(0, 0, w, h);

          // Get raw frequency data from Web Audio
          let dataArray = new Uint8Array(0);
          let bufferLength = 0;

          if (engine.analyserNode && engine.audioCtx) {
            bufferLength = engine.analyserNode.frequencyBinCount;
            dataArray = new Uint8Array(bufferLength);
            engine.analyserNode.getByteFrequencyData(dataArray);
          }

          // Target frequencies to highlight
          const targetFreqs = [697, 770, 852, 941, 1209, 1336, 1477, 1633];
          const colors = [
            "#f43f5e",
            "#f43f5e",
            "#f43f5e",
            "#f43f5e", // Rows (Rose)
            "#38bdf8",
            "#38bdf8",
            "#38bdf8",
            "#38bdf8", // Columns (Sky)
          ];

          // We map frequencies on a linear or logarithmic scale.
          // Since DTMF is concentrated between 600 Hz and 1700 Hz, we will zoom into this band!
          // Min Freq: 400 Hz, Max Freq: 2000 Hz.
          const fMin = 400;
          const fMax = 2000;

          const getXForFreq = (freq: number) => {
            const pct = (freq - fMin) / (fMax - fMin);
            return 40 + pct * (w - 80);
          };

          // Draw general FFT spectrum waveform area
          if (bufferLength > 0 && engine.audioCtx) {
            ctx.beginPath();
            ctx.strokeStyle = "rgba(234, 179, 8, 0.4)"; // Faint Amber
            ctx.lineWidth = 2;
            const sampleRate = engine.audioCtx.sampleRate;

            for (let i = 0; i < bufferLength; i++) {
              const freq = (i * sampleRate) / (2 * bufferLength);
              if (freq >= fMin && freq <= fMax) {
                const x = getXForFreq(freq);
                const value = dataArray[i]; // 0-255
                const normalizedVal = value / 255;
                const y = h - 40 - normalizedVal * (h - 80);

                if (i === 0 || x === 40) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
              }
            }
            ctx.stroke();
          }

          // Draw the vertical markers and indicators for the 8 standard frequencies
          targetFreqs.forEach((tf, index) => {
            const x = getXForFreq(tf);
            const isRow = index < 4;

            // Find closest magnitude in dataArray
            let magnitude = 0;
            if (bufferLength > 0 && engine.audioCtx) {
              const sampleRate = engine.audioCtx.sampleRate;
              // Map frequency back to FFT index
              const targetIdx = Math.round((tf * 2 * bufferLength) / sampleRate);
              // Read immediate neighborhood to make it less prone to binning errors
              magnitude = Math.max(dataArray[targetIdx - 1] || 0, dataArray[targetIdx] || 0, dataArray[targetIdx + 1] || 0) / 255;
            }

            // Draw target frequency tracker gridline
            ctx.strokeStyle = magnitude > 0.1 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.03)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, 20);
            ctx.lineTo(x, h - 35);
            ctx.stroke();

            // Draw glowing node dots at current frequency energy peaks
            if (magnitude > 0.05) {
              ctx.beginPath();
              ctx.arc(x, h - 40 - magnitude * (h - 80), 5 + magnitude * 4, 0, 2 * Math.PI);
              ctx.fillStyle = colors[index];
              ctx.shadowBlur = 10;
              ctx.shadowColor = colors[index];
              ctx.fill();
              ctx.shadowBlur = 0; // reset
            }

            // Draw solid indicator pill bar at the bottom
            const isActiveFreq = liveFrequencies && (liveFrequencies.low === tf || liveFrequencies.high === tf);
            ctx.fillStyle = isActiveFreq ? colors[index] : "#334155"; // Highlight or Slate-700
            ctx.font = `bold ${Math.max(9, 10 * scale)}px monospace`;

            // Draw background pill
            ctx.fillStyle = isActiveFreq ? `${colors[index]}40` : "rgba(30, 41, 59, 0.6)";
            ctx.fillRect(x - 22, h - 32, 44, 20);

            // Border
            ctx.strokeStyle = isActiveFreq ? colors[index] : "rgba(255,255,255,0.05)";
            ctx.lineWidth = 1;
            ctx.strokeRect(x - 22, h - 32, 44, 20);

            // Label text (Hertz)
            ctx.fillStyle = isActiveFreq ? "#ffffff" : "#64748b";
            ctx.textAlign = "center";
            ctx.fillText(`${tf}`, x, h - 18);
          });

          // Draw general spectrum metadata
          ctx.fillStyle = "#94a3b8"; // Slate 400
          ctx.textAlign = "left";
          ctx.font = `${Math.max(10, 11 * scale)}px monospace`;
          ctx.fillText("LIVE SPECTRUM ANALYZER (FFT)", 40, 22 * scale);
        }
      }

      requestRef.current = requestAnimationFrame(draw);
    };

    requestRef.current = requestAnimationFrame(draw);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [liveFrequencies]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
      {/* Oscilloscope Container */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-500 animate-pulse" id="visualizer-osc-icon" />
            <span className="font-sans font-semibold text-slate-200">Real-Time Oscilloscope</span>
          </div>
          <div className="text-[10px] font-mono text-slate-500 bg-slate-800/80 px-2 py-0.5 rounded-full">Sine Mix View</div>
        </div>
        <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950/80 shadow-inner">
          <canvas ref={oscCanvasRef} className="w-full h-full block cursor-crosshair" title="Interactive Waveform Oscilloscope" />
          {activeKey && (
            <div className="absolute top-4 right-4 py-1 px-3 bg-slate-900/90 backdrop-blur border border-amber-500/50 rounded-lg shadow-xl flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500 animate-bounce" id="active-pulse-icon" />
              <span className="font-mono text-xs font-bold text-slate-100">KEY &quot;{activeKey}&quot; ENGAGED</span>
            </div>
          )}
        </div>
      </div>

      {/* FFT Spectrum Container */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-sky-400" id="visualizer-fft-icon" />
            <span className="font-sans font-semibold text-slate-200">Spectral Analysis</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/40 px-2.5 py-0.5 rounded-full select-none">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] font-mono">400Hz - 2000Hz</span>
          </div>
        </div>
        <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950/80 shadow-inner">
          <canvas ref={fftCanvasRef} className="w-full h-full block" title="Web Audio Fourier Spectrum Monitor" />
        </div>
      </div>
    </div>
  );
}
