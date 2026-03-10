import { count, lt, eq, and } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { db } from './client.js';
import { runs, leaderboard } from './schema.js';

/**
 * runs 테이블 전체 기준 점수 순위 → 상위 % 계산 (플레이 횟수 기준)
 */
export async function getPercentileFromRuns(score: number): Promise<number> {
  const [belowResult, totalResult] = await Promise.all([
    db.select({ count: count() }).from(runs).where(lt(runs.score, score)),
    db.select({ count: count() }).from(runs),
  ]);

  const belowCount = Number(belowResult[0]?.count ?? 0);
  const total = Number(totalResult[0]?.count ?? 0);

  if (total === 0) return 50; // 데이터 없으면 중간값

  // rank = belowCount + 1 (나보다 낮은 사람 수 + 1 = 내 등수)
  // 1등(전부 나보다 낮음) → 상위 0.1%, 꼴찌(나보다 높은 점수만) → 상위 99.9%
  const beatRate = total > 0 ? (belowCount / total) * 100 : 50;
  let displayPercent = 100 - beatRate;

  if (belowCount >= total - 1) displayPercent = 0.1; // 1등 = 상위 0.1%
  else if (belowCount <= 0) displayPercent = 99.9; // 꼴찌 = 상위 99.9%

  if (displayPercent < 1 || displayPercent > 99) {
    return Math.round(displayPercent * 10) / 10;
  }
  return Math.round(displayPercent);
}

/**
 * 이번 달 전체 유저 대비 상위 % 계산
 * - leaderboard: 유저당 1행 (최고 점수)
 * - belowCount = 내 점수보다 낮은 유저 수
 * - 1등=0.1%, 꼴찌=99.9%
 */
export async function getPercentileFromLeaderboard(
  score: number,
  yearMonth: string
): Promise<number> {
  const [belowResult, totalResult] = await Promise.all([
    db
      .select({ count: count() })
      .from(leaderboard)
      .where(
        and(
          eq(leaderboard.scope, 'monthly'),
          eq(leaderboard.year_month, yearMonth),
          lt(leaderboard.score, score)
        )
      ),
    db
      .select({ count: count() })
      .from(leaderboard)
      .where(
        and(
          eq(leaderboard.scope, 'monthly'),
          eq(leaderboard.year_month, yearMonth)
        )
      ),
  ]);

  const belowCount = Number(belowResult[0]?.count ?? 0);
  const total = Number(totalResult[0]?.count ?? 0);

  if (total === 0) return 50;

  const beatRate = total > 0 ? (belowCount / total) * 100 : 50;
  let displayPercent = 100 - beatRate;

  if (belowCount >= total - 1) displayPercent = 0.1;
  else if (belowCount <= 0) displayPercent = 99.9;

  if (displayPercent < 1 || displayPercent > 99) {
    return Math.round(displayPercent * 10) / 10;
  }
  return Math.round(displayPercent);
}

/**
 * 전체 데이터(모든 유저 전체 기간) 대비 순위 및 상위%
 * - runs에서 유저별 최고점 산출 후 비교
 */
export async function getGlobalUserRankAndPercentile(
  score: number
): Promise<{ rank: number; percentile_top: number } | null> {
  const result = await db.execute(sql`
    WITH user_bests AS (
      SELECT user_hash, MAX(score)::int AS best_score FROM runs GROUP BY user_hash
    ),
    counts AS (
      SELECT
        (SELECT COUNT(*)::int FROM user_bests WHERE best_score > ${score}) AS above_count,
        (SELECT COUNT(*)::int FROM user_bests) AS total
    )
    SELECT above_count, total FROM counts
  `);

  const row = (result.rows as { above_count: number; total: number }[])[0];
  if (!row || row.total === 0) return null;

  const aboveCount = Number(row.above_count ?? 0);
  const total = Number(row.total ?? 0);
  const rank = aboveCount + 1;

  const belowCount = total - aboveCount - 1;
  let displayPercent = total > 0 ? 100 - (belowCount / total) * 100 : 50;
  if (belowCount >= total - 1) displayPercent = 0.1;
  else if (belowCount <= 0) displayPercent = 99.9;
  const percentile_top = displayPercent < 1 || displayPercent > 99
    ? Math.round(displayPercent * 10) / 10
    : Math.round(displayPercent);

  return { rank, percentile_top };
}
