import { Router } from 'express';
import { eq, and, sql } from 'drizzle-orm';
import { db } from '../db/client.js';
import { leaderboard, runs } from '../db/schema.js';
import { getPercentileFromLeaderboard, getGlobalUserRankAndPercentile } from '../db/percentile.js';

const router = Router();

router.get('/api/me/summary', async (req, res) => {
  try {
    const user_hash = req.query.user_hash as string;
    if (!user_hash) {
      return res.status(400).json({ error: 'user_hash required' });
    }

    const ym = new Date().toISOString().slice(0, 7);
    const monthStart = ym + '-01';
    const nextMonth = new Date(ym + '-01');
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const monthEnd = nextMonth.toISOString().slice(0, 10);

    const rows = await db
      .select()
      .from(leaderboard)
      .where(
        and(
          eq(leaderboard.scope, 'monthly'),
          eq(leaderboard.year_month, ym),
          eq(leaderboard.user_hash, user_hash)
        )
      )
      .limit(1);

    const entry = rows[0];

    const rankRows = await db
      .select()
      .from(leaderboard)
      .where(
        and(
          eq(leaderboard.scope, 'monthly'),
          eq(leaderboard.year_month, ym)
        )
      )
      .orderBy(sql`${leaderboard.score} DESC`);

    const best_rank = entry ? rankRows.findIndex((r) => r.user_hash === user_hash) + 1 || null : null;

    const runRows = await db
      .select()
      .from(runs)
      .where(
        and(
          eq(runs.user_hash, user_hash),
          sql`${runs.created_at} >= ${monthStart}`,
          sql`${runs.created_at} < ${monthEnd}`
        )
      )
      .orderBy(sql`${runs.created_at} DESC`);

    let avg_score: number | null = null;
    let min_score: number | null = null;
    let latest_score: number | null = null;
    let latest_rank: number | null = null;

    if (runRows.length > 0) {
      const scores = runRows.map((r) => r.score);
      avg_score = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      min_score = Math.min(...scores);
      latest_score = runRows[0]!.score;
      const aboveLatest = rankRows.filter((r) => r.score > latest_score!).length;
      latest_rank = aboveLatest + 1;
    }

    const best_score = entry?.score ?? 0;
    const best_level = entry?.max_level ?? 0;

    const percentileTop = best_score > 0 ? await getPercentileFromLeaderboard(best_score, ym) : null;

    // 전체 데이터 대비 (all-time, 모든 유저)
    const alltimeRunRows = await db
      .select()
      .from(runs)
      .where(eq(runs.user_hash, user_hash));

    let alltime_best_score: number | null = null;
    let alltime_min_score: number | null = null;
    let alltime_avg_score: number | null = null;
    let alltime_rank: number | null = null;
    let alltime_percentile_top: number | null = null;

    if (alltimeRunRows.length > 0) {
      const scores = alltimeRunRows.map((r) => r.score);
      alltime_best_score = Math.max(...scores);
      alltime_min_score = Math.min(...scores);
      alltime_avg_score = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      const global = await getGlobalUserRankAndPercentile(alltime_best_score);
      if (global) {
        alltime_rank = global.rank;
        alltime_percentile_top = global.percentile_top;
      }
    }

    return res.json({
      user_hash,
      best_score,
      best_level,
      best_rank: best_rank ?? null,
      latest_score: latest_score ?? null,
      latest_rank: latest_rank ?? null,
      avg_score: avg_score ?? null,
      min_score: min_score ?? null,
      percentile_top: percentileTop,
      monthly_rank: best_rank,
      alltime_best_score: alltime_best_score ?? null,
      alltime_min_score: alltime_min_score ?? null,
      alltime_avg_score: alltime_avg_score ?? null,
      alltime_rank: alltime_rank ?? null,
      alltime_percentile_top: alltime_percentile_top ?? null,
    });
  } catch (e) {
    console.error('GET /api/me/summary', e);
    return res.json({
      user_hash: req.query.user_hash,
      best_score: 0,
      best_level: 0,
      best_rank: null,
      latest_score: null,
      latest_rank: null,
      avg_score: null,
      min_score: null,
      percentile_top: null,
      monthly_rank: null,
      alltime_best_score: null,
      alltime_min_score: null,
      alltime_avg_score: null,
      alltime_rank: null,
      alltime_percentile_top: null,
    });
  }
});

export default router;
