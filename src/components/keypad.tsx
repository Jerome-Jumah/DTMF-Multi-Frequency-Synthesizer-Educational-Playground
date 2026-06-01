/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Keyboard, Phone, Volume2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { DTMF_GRID, DtmfKeyInfo, HIGH_FREQS, HighFreq, LOW_FREQS, LowFreq } from "../types";
import { DtmfEngine } from "../dtmf-engine";

interface KeypadProps {
  onKeyActive: (key: string | null, low: LowFreq | null, high: HighFreq | null) => void;
  activeKey: string | null;
}

export function Keypad({ onKeyActive, activeKey }: KeypadProps) {
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const [volume, setVolume] = useState<number>(0.3);

  // Sync state if controlled from outside (like running sequential dialing)
  useEffect(() => {
    if (activeKey) {
      setPressedKey(activeKey);
    } else {
      setPressedKey(null);
    }
  }, [activeKey]);

  // Handle playing individual key
  const handlePressStart = (e: React.PointerEvent, keyInfo: DtmfKeyInfo) => {
    if (activeKey) return; // Ignore if playing automated sequence
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
    setPressedKey(keyInfo.key);
    onKeyActive(keyInfo.key, keyInfo.low, keyInfo.high);
    DtmfEngine.getInstance().startTone(keyInfo.low, keyInfo.high);
  };

  const handlePressEnd = (e: React.PointerEvent) => {
    if (activeKey) return; // Done by external automated player
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}
    setPressedKey(null);
    onKeyActive(null, null, null);
    DtmfEngine.getInstance().stopTone();
  };

  // Keyboard controls
  useEffect(() => {
    const findKeyInfo = (char: string): DtmfKeyInfo | null => {
      const flat = DTMF_GRID.flat();
      return flat.find(k => k.key === char.toUpperCase()) || null;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Disallow typing inside inputs to prevent activating keys on text entry
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        return;
      }

      if (e.repeat) return; // Prevent stutter

      const keyChar = e.key === "Enter" ? null : e.key;
      if (!keyChar) return;

      const keyInfo = findKeyInfo(keyChar);
      if (keyInfo) {
        setPressedKey(keyInfo.key);
        onKeyActive(keyInfo.key, keyInfo.low, keyInfo.high);
        DtmfEngine.getInstance().startTone(keyInfo.low, keyInfo.high);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        return;
      }

      const keyInfo = findKeyInfo(e.key);
      if (keyInfo && pressedKey === keyInfo.key) {
        setPressedKey(null);
        onKeyActive(null, null, null);
        DtmfEngine.getInstance().stopTone();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [pressedKey, activeKey, onKeyActive]);

  // Initialize engine on first action
  const touchStartEngine = () => {
    DtmfEngine.getInstance().init();
  };

  // Sync volume state
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    DtmfEngine.getInstance().setVolume(val);
  };

  // Helper to determine row/column indices
  const getActiveRowCol = () => {
    if (!pressedKey) return { rIdx: -1, cIdx: -1 };

    for (let r = 0; r < DTMF_GRID.length; r++) {
      for (let c = 0; c < DTMF_GRID[r].length; c++) {
        if (DTMF_GRID[r][c].key === pressedKey) {
          return { rIdx: r, cIdx: c };
        }
      }
    }
    return { rIdx: -1, cIdx: -1 };
  };

  const { rIdx: activeRow, cIdx: activeCol } = getActiveRowCol();

  return (
    <div
      className="flex flex-col gap-6 bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl shadow-xl max-w-lg mx-auto"
      onPointerDown={touchStartEngine}
    >
      {/* App Header / Brand Decorator */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <Phone className="w-5 h-5 text-amber-500" />
          <span className="font-sans font-bold text-slate-100 tracking-wide uppercase text-sm">DTMF Signaling Console</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded select-none">
          <Keyboard className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-mono text-[10px]">Keyboard Hotkeys Enabled</span>
        </div>
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-4 relative">
        {/* Low Frequency Row Labels Indicator */}
        <div className="flex flex-col justify-around py-4 text-right pr-2">
          {LOW_FREQS.map((freq, idx) => (
            <div
              key={freq}
              className={`font-mono text-xs font-bold transition-all duration-200 ${
                activeRow === idx ? "text-rose-500 scale-105 translate-x-1" : "text-slate-500"
              }`}
            >
              <span className="text-[10px] block font-normal text-slate-600">Row {idx + 1}</span>
              {freq} Hz
            </div>
          ))}
        </div>

        {/* The Matrix Keys Grid */}
        <div className="flex flex-col gap-4">
          {/* Column Frequencies */}
          <div className="grid grid-cols-4 gap-3 text-center px-1">
            {HIGH_FREQS.map((freq, idx) => (
              <div
                key={freq}
                className={`font-mono text-xs font-bold transition-all duration-200 ${
                  activeCol === idx ? "text-sky-400 scale-105 -translate-y-1" : "text-slate-500"
                }`}
              >
                <div className="text-[9px] font-normal text-slate-600">Col {idx + 1}</div>
                {freq} Hz
              </div>
            ))}
          </div>

          {/* Buttons Matrix */}
          <div className="grid grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800/80 shadow-inner relative overflow-hidden">
            {/* Horizontal frequency grid-light animation overlay */}
            {activeRow !== -1 && (
              <div
                className="absolute left-0 right-0 h-0.5 bg-rose-500/30 shadow-[0_0_12px_#f43f5e] transition-all duration-100 pointer-events-none"
                style={{
                  top: `${(activeRow / 4) * 100 + 12.5}%`,
                }}
              />
            )}

            {/* Vertical frequency grid-light animation overlay */}
            {activeCol !== -1 && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-sky-400/30 shadow-[0_0_12px_#38bdf8] transition-all duration-100 pointer-events-none"
                style={{
                  left: `${(activeCol / 4) * 100 + 12.5}%`,
                }}
              />
            )}

            {DTMF_GRID.map((row, r) =>
              row.map(btn => {
                const isPressed = pressedKey === btn.key;
                const isLetterKey = ["A", "B", "C", "D"].includes(btn.key);

                return (
                  <button
                    key={btn.key}
                    onPointerDown={e => handlePressStart(e, btn)}
                    onPointerUp={handlePressEnd}
                    onPointerLeave={handlePressEnd}
                    onPointerCancel={handlePressEnd}
                    onContextMenu={e => e.preventDefault()}
                    className={`relative flex flex-col items-center justify-center aspect-square rounded-lg select-none cursor-pointer transition-all ${
                      isPressed
                        ? "bg-amber-500 border-amber-600 text-slate-950 translate-y-0.5 shadow-none"
                        : isLetterKey
                          ? "bg-slate-800 hover:bg-slate-700 text-sky-400 border-slate-700 active:bg-slate-700 shadow-md translate-y-0"
                          : "bg-slate-800 hover:bg-slate-700/80 text-slate-100 border-slate-700 active:bg-slate-700"
                    } border-b-4 font-sans focus:outline-none`}
                    style={{ touchAction: "none" }}
                    id={`dtmf-btn-${btn.key}`}
                  >
                    <span className="text-2xl font-bold tracking-tight">{btn.key}</span>
                    {btn.label && (
                      <span
                        className={`text-[9px] font-medium uppercase font-mono tracking-widest mt-0.5 ${
                          isPressed ? "text-slate-900" : "text-slate-400"
                        }`}
                      >
                        {btn.label}
                      </span>
                    )}
                    {/* Tiny sub-badge for precise hardware tone info */}
                    <span
                      className={`text-[8px] font-mono absolute bottom-1 right-1.5 opacity-30 ${isPressed ? "text-slate-900" : "text-slate-500"}`}
                    >
                      R{r + 1}C{btn.key === "A" ? "4" : btn.key === "B" ? "4" : btn.key === "C" ? "4" : btn.key === "D" ? "4" : "col"}
                    </span>
                  </button>
                );
              }),
            )}
          </div>
        </div>
      </div>

      {/* Volume and Status Indicators */}
      <div className="flex flex-col gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-slate-400" />
            <span>Synth Gain Control</span>
          </div>
          <span className="text-amber-500 font-semibold">{Math.round(volume * 100)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="0.5"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          title="Master System Volume Slider"
          id="system-volume-slider"
        />
        {pressedKey && (
          <div className="flex items-center justify-between text-[10px] font-mono mt-1 text-slate-400 border-t border-slate-900 pt-2">
            <span>Grid Coordinates:</span>
            <div className="flex gap-2">
              <span className="text-rose-400 font-bold">Row Freq: {DTMF_GRID.flat().find(k => k.key === pressedKey)?.low}Hz</span>
              <span className="text-slate-600">|</span>
              <span className="text-sky-400 font-bold">Col Freq: {DTMF_GRID.flat().find(k => k.key === pressedKey)?.high}Hz</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
