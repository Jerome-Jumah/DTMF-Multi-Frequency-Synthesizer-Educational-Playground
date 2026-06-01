/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Low Group Frequencies (Row-wise)
export const LOW_FREQS = [697, 770, 852, 941] as const;
export type LowFreq = typeof LOW_FREQS[number];

// High Group Frequencies (Column-wise)
export const HIGH_FREQS = [1209, 1336, 1477, 1633] as const;
export type HighFreq = typeof HIGH_FREQS[number];

export interface DtmfKeyInfo {
  key: string;
  low: LowFreq;
  high: HighFreq;
  label?: string; // e.g. "OPER" for 0
}

export const DTMF_GRID: DtmfKeyInfo[][] = [
  [
    { key: "1", low: 697, high: 1209 },
    { key: "2", low: 697, high: 1336, label: "ABC" },
    { key: "3", low: 697, high: 1477, label: "DEF" },
    { key: "A", low: 697, high: 1633 }
  ],
  [
    { key: "4", low: 770, high: 1209, label: "GHI" },
    { key: "5", low: 770, high: 1336, label: "JKL" },
    { key: "6", low: 770, high: 1477, label: "MNO" },
    { key: "B", low: 770, high: 1633 }
  ],
  [
    { key: "7", low: 852, high: 1209, label: "PQRS" },
    { key: "8", low: 852, high: 1336, label: "TUV" },
    { key: "9", low: 852, high: 1477, label: "WXYZ" },
    { key: "C", low: 852, high: 1633 }
  ],
  [
    { key: "*", low: 941, high: 1209 },
    { key: "0", low: 941, high: 1336, label: "OPER" },
    { key: "#", low: 941, high: 1477 },
    { key: "D", low: 941, high: 1633 }
  ]
];

export interface SequenceStep {
  key: string;
  durationMs: number;
  pauseMs: number;
}

export interface ToneGeneratorState {
  isPlaying: boolean;
  activeKey: string | null;
  activeLowFreq: number | null;
  activeHighFreq: number | null;
  volume: number; // 0.0 to 1.0
  playSequence: boolean;
  sequenceString: string;
}
