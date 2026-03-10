import type { GameType } from './types.js';
import { GAME_TYPES } from './types.js';

/** 9~14단계 인덱스 (도형 파란색 MEMORY 최소 1회 보장) */
const STAGE_9_TO_14_INDICES = [8, 9, 10, 11, 12, 13];

/**
 * 20단계 문제유형 순서 생성:
 * - 5유형 각 20% 비중 (REACTION, TAP10, MEMORY, CALCULATION, PAINT 각 4회)
 * - 같은 유형 연속 2회 이하
 * - 9~14단계에 MEMORY(도형 파란색) 최소 1회 보장
 * - 랜덤 출제
 */
export function generateGameOrder(): GameType[] {
  const order: GameType[] = [];
  const counts = [4, 4, 4, 4, 4];
  const shuffledCounts = [...counts].sort(() => Math.random() - 0.5);
  const remaining = new Map<GameType, number>();
  GAME_TYPES.forEach((t, i) => {
    remaining.set(t, shuffledCounts[i]!);
  });

  for (let i = 0; i < 20; i++) {
    const lastTwo = order.slice(-2);
    const avail = GAME_TYPES.filter((gt) => {
      const count = remaining.get(gt)!;
      if (count <= 0) return false;
      if (lastTwo.length === 2 && lastTwo[0] === gt && lastTwo[1] === gt) return false;
      return true;
    });

    const choices = avail.length > 0 ? avail : GAME_TYPES.filter((gt) => remaining.get(gt)! > 0);
    const pick = choices[Math.floor(Math.random() * choices.length)]!;
    order.push(pick);
    remaining.set(pick, remaining.get(pick)! - 1);
  }

  const mem: GameType = 'MEMORY';
  const hasMemIn9to14 = STAGE_9_TO_14_INDICES.some((idx) => order[idx] === mem);
  if (!hasMemIn9to14) {
    const memIdx = order.findIndex((gt) => gt === mem);
    const swapIdx = STAGE_9_TO_14_INDICES[Math.floor(Math.random() * STAGE_9_TO_14_INDICES.length)]!;
    if (memIdx >= 0 && swapIdx >= 0) {
      [order[memIdx], order[swapIdx]] = [order[swapIdx]!, order[memIdx]!];
    }
  }

  return order;
}

