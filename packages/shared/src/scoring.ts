import type { GameType } from './types.js';

/**
 * 각 문제유형 결과를 0~100으로 표준화
 */
export function normalizeStageScore(
  rawScore: number,
  maxPossible: number,
  success: boolean
): number {
  if (!success) return 0;
  if (maxPossible <= 0) return 100;
  return Math.min(100, Math.round((rawScore / maxPossible) * 100));
}

/**
 * Run 점수 계산
 * run_score = Σ(stage_score * stage_multiplier) + stage_clear_bonus
 * stage_multiplier = 1 + (stage_index-1)*0.08
 * stage_clear_bonus = stage_index * 10
 */
export function computeRunScore(perStageScores: { score: number }[]): number {
  let total = 0;
  perStageScores.forEach((s, i) => {
    const stageIndex = i + 1;
    const multiplier = 1 + (stageIndex - 1) * 0.08;
    const bonus = stageIndex * 10;
    total += s.score * multiplier + bonus;
  });
  return Math.round(total);
}

const GAME_LABELS: Record<GameType, string> = {
  REACTION: '반응 속도',
  TAP10: '10초 터치',
  MEMORY: '기억력',
  CALCULATION: '계산 속도',
  PAINT: '물감 색깔 (색 혼합 추론)',
};

/** 약점별 개선 팁 */
const WEAKNESS_TIPS: Record<GameType, string> = {
  REACTION: '목표 색이 나올 때까지 집중해 기다리세요.',
  TAP10: '숫자가 목표에 가까워질 때 타이밍을 미리 예측해 보세요.',
  MEMORY: '도형·숫자를 구역별로 나눠 기억해 보세요.',
  CALCULATION: '덧셈·뺄셈을 반복 연습하면 속도가 빨라집니다.',
  PAINT: 'R+G=노랑, R+B=보라, G+B=청록. 빨강·초록·파랑을 합쳐 목표색을 만드세요.',
};

export function getStrengthWeakness(breakdown: Record<GameType, number>): {
  strength: string;
  weakness: string;
  weaknessTip: string;
} {
  const entries = Object.entries(breakdown) as [GameType, number][];
  const sorted = [...entries].sort((a, b) => b[1] - a[1]);
  const strength = sorted[0] ? GAME_LABELS[sorted[0][0]] : '없음';
  const weaknessType = sorted[sorted.length - 1]?.[0];
  const weakness = weaknessType ? GAME_LABELS[weaknessType] : '없음';
  const weaknessTip = weaknessType ? WEAKNESS_TIPS[weaknessType] ?? '' : '';
  return { strength, weakness, weaknessTip };
}
