/**
 * 공통 제한시간: 9+ 짧음, 16+ 더 짧음, 20 = 2초 (1% 통과)
 */
export function timeLimitForLevel(level: number): number {
  if (level <= 1) return 25;
  if (level >= 20) return 2;
  if (level >= 16) {
    const t = (level - 16) / 4;
    return Math.round(5 - t * 3);
  }
  if (level >= 9) {
    const t = (level - 9) / 7;
    return Math.round(8 - t * 3);
  }
  const t = (level - 1) / 8;
  return Math.round(25 - t * 9);
}

/** 타이밍 게임 성공 허용 범위(초): 1~8은 ±0.8, 9+는 ±0.5 */
export function timingSuccessToleranceForLevel(level: number): number {
  return level <= 8 ? 0.8 : 0.5;
}

/**
 * 타이밍 게임 시간 배속: 9+ 빠름, 16+ 더 빠름, 20 = 6배 (1% 통과)
 */
export function timingSpeedMultiplierForLevel(level: number): number {
  if (level <= 1) return 1;
  if (level >= 20) return 6;
  if (level >= 16) {
    const t = (level - 16) / 4;
    return Math.round((4.5 + t * 1.5) * 10) / 10;
  }
  if (level >= 9) {
    const t = (level - 9) / 7;
    return Math.round((2.5 + t * 2) * 10) / 10;
  }
  const t = (level - 1) / 8;
  return Math.round((1 + t * 0.8) * 10) / 10;
}

/**
 * 반응속도 게임 전용 제한시간: 1단계 45초, 20단계 8초
 */
export function reactionTimeLimitForLevel(level: number): number {
  if (level <= 1) return 45;
  if (level >= 20) return 8;
  const t = (level - 1) / 19;
  return Math.round(45 - t * 37);
}

/**
 * 10초 터치(시간 맞추기) 게임 제한시간: 최대 10초, 20단계 3초
 */
export function tap10TimeLimitForLevel(level: number): number {
  if (level <= 1) return 10;
  if (level >= 20) return 3;
  const t = (level - 1) / 19;
  return Math.round(10 - t * 7);
}

/**
 * 물감 색깔 맞추기 게임 제한시간(초)
 */
export function paintTimeLimitForLevel(level: number): number {
  if (level <= 1) return 30;
  if (level >= 20) return 8;
  const t = (level - 1) / 19;
  return Math.round(30 - t * 22);
}

/**
 * 반응속도 게임 색상 전환 주기(ms):
 * - 9~14: 약 25% 성공 (380ms→180ms)
 * - 16~19: 더 어려움 (150ms→70ms)
 * - 20: 1% 통과 (40ms)
 */
export function colorIntervalForLevel(level: number): number {
  if (level <= 1) return 800;
  if (level >= 20) return 40;
  if (level >= 16) {
    const t = (level - 16) / 4;
    return Math.round(150 - t * 80);
  }
  if (level >= 9) {
    const t = (level - 9) / 7;
    return Math.round(380 - t * 200);
  }
  const t = (level - 1) / 8;
  return Math.round(900 - t * 450);
}
