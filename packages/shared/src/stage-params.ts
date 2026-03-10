import type { GameType } from './types.js';

// 기억력: 레벨별 자리수/노출시간, 후반 3x3 패턴
export interface MemoryParams {
  digitCount: number;
  exposeMs: number;
  usePattern: boolean; // 3x3 패턴
  patternSize?: number;
}

export const MEMORY_PARAMS: Record<number, MemoryParams> = {
  1: { digitCount: 5, exposeMs: 5000, usePattern: false },
  2: { digitCount: 5, exposeMs: 4500, usePattern: false },
  3: { digitCount: 6, exposeMs: 4200, usePattern: false },
  4: { digitCount: 6, exposeMs: 3900, usePattern: false },
  5: { digitCount: 7, exposeMs: 3600, usePattern: false },
  6: { digitCount: 7, exposeMs: 3400, usePattern: false },
  7: { digitCount: 8, exposeMs: 3200, usePattern: false },
  8: { digitCount: 8, exposeMs: 3000, usePattern: false },
  9: { digitCount: 7, exposeMs: 1100, usePattern: true, patternSize: 3 },
  10: { digitCount: 8, exposeMs: 900, usePattern: true, patternSize: 3 },
  11: { digitCount: 8, exposeMs: 700, usePattern: true, patternSize: 3 },
  12: { digitCount: 9, exposeMs: 550, usePattern: true, patternSize: 4 },
  13: { digitCount: 9, exposeMs: 450, usePattern: true, patternSize: 4 },
  14: { digitCount: 9, exposeMs: 380, usePattern: true, patternSize: 4 },
  15: { digitCount: 9, exposeMs: 280, usePattern: true, patternSize: 4 },
  16: { digitCount: 9, exposeMs: 220, usePattern: true, patternSize: 4 },
  17: { digitCount: 9, exposeMs: 180, usePattern: true, patternSize: 4 },
  18: { digitCount: 9, exposeMs: 150, usePattern: true, patternSize: 4 },
  19: { digitCount: 9, exposeMs: 120, usePattern: true, patternSize: 4 },
  20: { digitCount: 9, exposeMs: 80, usePattern: true, patternSize: 4 },
};

// 계산: 레벨별 난이도 (초반 덧셈/뺄셈, 후반 O/X)
export interface CalcParams {
  maxNum: number;
  ops: ('+' | '-')[];
  useOX: boolean;
}

export const CALC_PARAMS: Record<number, CalcParams> = {
  1: { maxNum: 15, ops: ['+'], useOX: false },
  2: { maxNum: 20, ops: ['+', '-'], useOX: false },
  3: { maxNum: 35, ops: ['+', '-'], useOX: false },
  4: { maxNum: 50, ops: ['+', '-'], useOX: false },
  5: { maxNum: 70, ops: ['+', '-'], useOX: false },
  6: { maxNum: 100, ops: ['+', '-'], useOX: false },
  7: { maxNum: 140, ops: ['+', '-'], useOX: false },
  8: { maxNum: 180, ops: ['+', '-'], useOX: false },
  9: { maxNum: 300, ops: ['+', '-'], useOX: false },
  10: { maxNum: 350, ops: ['+', '-'], useOX: true },
  11: { maxNum: 400, ops: ['+', '-'], useOX: true },
  12: { maxNum: 450, ops: ['+', '-'], useOX: true },
  13: { maxNum: 500, ops: ['+', '-'], useOX: true },
  14: { maxNum: 600, ops: ['+', '-'], useOX: true },
  15: { maxNum: 700, ops: ['+', '-'], useOX: true },
  16: { maxNum: 800, ops: ['+', '-'], useOX: true },
  17: { maxNum: 900, ops: ['+', '-'], useOX: true },
  18: { maxNum: 1000, ops: ['+', '-'], useOX: true },
  19: { maxNum: 1200, ops: ['+', '-'], useOX: true },
  20: { maxNum: 1500, ops: ['+', '-'], useOX: true },
};

// 10초 터치: 레벨별 정확도 요구
export interface Tap10Params {
  targetOnly: boolean; // 표적만 탭
  targetMoves: boolean; // 표적 이동
}

export const TAP10_PARAMS: Record<number, Tap10Params> = {
  1: { targetOnly: false, targetMoves: false },
  2: { targetOnly: false, targetMoves: false },
  3: { targetOnly: false, targetMoves: false },
  4: { targetOnly: true, targetMoves: false },
  5: { targetOnly: true, targetMoves: false },
  6: { targetOnly: true, targetMoves: false },
  7: { targetOnly: true, targetMoves: false },
  8: { targetOnly: true, targetMoves: true },
  9: { targetOnly: true, targetMoves: true },
  10: { targetOnly: true, targetMoves: true },
  11: { targetOnly: true, targetMoves: true },
  12: { targetOnly: true, targetMoves: true },
  13: { targetOnly: true, targetMoves: true },
  14: { targetOnly: true, targetMoves: true },
  15: { targetOnly: true, targetMoves: true },
  16: { targetOnly: true, targetMoves: true },
  17: { targetOnly: true, targetMoves: true },
  18: { targetOnly: true, targetMoves: true },
  19: { targetOnly: true, targetMoves: true },
  20: { targetOnly: true, targetMoves: true },
};

export function getMemoryParams(level: number): MemoryParams {
  return MEMORY_PARAMS[Math.min(20, Math.max(1, level))] ?? MEMORY_PARAMS[1];
}

export function getCalcParams(level: number): CalcParams {
  return CALC_PARAMS[Math.min(20, Math.max(1, level))] ?? CALC_PARAMS[1];
}

export function getTap10Params(level: number): Tap10Params {
  return TAP10_PARAMS[Math.min(20, Math.max(1, level))] ?? TAP10_PARAMS[1];
}

// 물감 색깔: 레벨↑ = 혼합 색 많아짐(2~5), 드롭 빠름, 떨어지는 색 다양해짐
export type PaintBaseColor = 'R' | 'G' | 'B' | 'Y' | 'M' | 'C' | 'O' | 'L' | 'P' | 'T';

export interface PaintParams {
  baseColors: PaintBaseColor[];
  dropIntervalMs: number;
  fallDurationSec: number;
  mixCount: 2 | 3 | 4 | 5;
}

export const PAINT_PARAMS: Record<number, PaintParams> = {
  1: { baseColors: ['R', 'G', 'B'], dropIntervalMs: 1400, fallDurationSec: 2.2, mixCount: 2 },
  2: { baseColors: ['R', 'G', 'B'], dropIntervalMs: 1200, fallDurationSec: 2, mixCount: 2 },
  3: { baseColors: ['R', 'G', 'B', 'Y', 'M', 'C'], dropIntervalMs: 1000, fallDurationSec: 1.8, mixCount: 2 },
  4: { baseColors: ['R', 'G', 'B', 'Y', 'M', 'C'], dropIntervalMs: 900, fallDurationSec: 1.6, mixCount: 3 },
  5: { baseColors: ['R', 'G', 'B', 'Y', 'M', 'C'], dropIntervalMs: 800, fallDurationSec: 1.5, mixCount: 3 },
  6: { baseColors: ['R', 'G', 'B', 'Y', 'M', 'C'], dropIntervalMs: 700, fallDurationSec: 1.4, mixCount: 3 },
  7: { baseColors: ['R', 'G', 'B', 'Y', 'M', 'C'], dropIntervalMs: 600, fallDurationSec: 1.3, mixCount: 3 },
  8: { baseColors: ['R', 'G', 'B', 'Y', 'M', 'C', 'O', 'L'], dropIntervalMs: 550, fallDurationSec: 1.2, mixCount: 3 },
  9: { baseColors: ['R', 'G', 'B', 'Y', 'M', 'C', 'O', 'L', 'P'], dropIntervalMs: 500, fallDurationSec: 1.1, mixCount: 4 },
  10: { baseColors: ['R', 'G', 'B', 'Y', 'M', 'C', 'O', 'L', 'P', 'T'], dropIntervalMs: 450, fallDurationSec: 1, mixCount: 4 },
  11: { baseColors: ['R', 'G', 'B', 'Y', 'M', 'C', 'O', 'L', 'P', 'T'], dropIntervalMs: 400, fallDurationSec: 0.95, mixCount: 4 },
  12: { baseColors: ['R', 'G', 'B', 'Y', 'M', 'C', 'O', 'L', 'P', 'T'], dropIntervalMs: 360, fallDurationSec: 0.9, mixCount: 4 },
  13: { baseColors: ['R', 'G', 'B', 'Y', 'M', 'C', 'O', 'L', 'P', 'T'], dropIntervalMs: 320, fallDurationSec: 0.85, mixCount: 4 },
  14: { baseColors: ['R', 'G', 'B', 'Y', 'M', 'C', 'O', 'L', 'P', 'T'], dropIntervalMs: 280, fallDurationSec: 0.8, mixCount: 4 },
  15: { baseColors: ['R', 'G', 'B', 'Y', 'M', 'C', 'O', 'L', 'P', 'T'], dropIntervalMs: 250, fallDurationSec: 0.75, mixCount: 5 },
  16: { baseColors: ['R', 'G', 'B', 'Y', 'M', 'C', 'O', 'L', 'P', 'T'], dropIntervalMs: 220, fallDurationSec: 0.7, mixCount: 5 },
  17: { baseColors: ['R', 'G', 'B', 'Y', 'M', 'C', 'O', 'L', 'P', 'T'], dropIntervalMs: 190, fallDurationSec: 0.65, mixCount: 5 },
  18: { baseColors: ['R', 'G', 'B', 'Y', 'M', 'C', 'O', 'L', 'P', 'T'], dropIntervalMs: 160, fallDurationSec: 0.6, mixCount: 5 },
  19: { baseColors: ['R', 'G', 'B', 'Y', 'M', 'C', 'O', 'L', 'P', 'T'], dropIntervalMs: 140, fallDurationSec: 0.55, mixCount: 5 },
  20: { baseColors: ['R', 'G', 'B', 'Y', 'M', 'C', 'O', 'L', 'P', 'T'], dropIntervalMs: 120, fallDurationSec: 0.5, mixCount: 5 },
};

export function getPaintParams(level: number): PaintParams {
  return PAINT_PARAMS[Math.min(20, Math.max(1, level))] ?? PAINT_PARAMS[1];
}
