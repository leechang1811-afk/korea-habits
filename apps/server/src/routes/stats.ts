import { Router } from 'express';
import { sql, eq, and, gte } from 'drizzle-orm';
import { db } from '../db/client.js';
import { challengeStatsDaily } from '../db/schema.js';
import { getPercentileFromRuns } from '../db/percentile.js';

const router = Router();

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

router.get('/api/stats/success', async (req, res) => {
  try {
    const game_type = req.query.game_type as string;
    const level = parseInt(req.query.level as string, 10);

    if (!game_type || !level) {
      return res.status(400).json({ error: 'game_type and level required' });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startDate = thirtyDaysAgo.toISOString().slice(0, 10);

    const rows = await db
      .select()
      .from(challengeStatsDaily)
      .where(
        and(
          gte(challengeStatsDaily.date, startDate),
          eq(challengeStatsDaily.game_type, game_type),
          eq(challengeStatsDaily.level, level)
        )
      );

    let attempts = 0;
    let successes = 0;
    for (const r of rows) {
      attempts += Number(r.attempts);
      successes += Number(r.successes);
    }

    return res.json({
      attempts,
      successes,
      successRatePct: attempts > 0 ? Math.round((successes / attempts) * 100) : null,
    });
  } catch (e) {
    console.error('GET /api/stats/success', e);
    return res.json({ attempts: 0, successes: 0, successRatePct: null });
  }
});

router.get('/api/stats/percentile', async (req, res) => {
  try {
    const score = parseInt(req.query.score as string, 10);
    if (isNaN(score)) {
      return res.status(400).json({ error: 'score required' });
    }
    const percentileTop = await getPercentileFromRuns(score);
    return res.json({ percentileTop });
  } catch (e) {
    console.error('GET /api/stats/percentile', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/api/stats/percentile-preview', async (req, res) => {
  try {
    const currentScore = parseInt(req.query.current_score as string, 10);
    const nextScore = parseInt(req.query.next_score as string, 10);
    if (isNaN(currentScore)) {
      return res.status(400).json({ error: 'current_score required' });
    }
    const [currentPercentile, nextPercentile] = await Promise.all([
      getPercentileFromRuns(currentScore),
      isNaN(nextScore) ? getPercentileFromRuns(currentScore + 100) : getPercentileFromRuns(nextScore),
    ]);
    // nextPercentile: 다음 단계 통과 시 더 좋아지므로 숫자 감소 (상위 50% → 45% 등)
    return res.json({
      currentPercentile,
      nextPercentile: nextPercentile ?? Math.max(1, (currentPercentile ?? 50) - 5),
    });
  } catch (e) {
    console.error('GET /api/stats/percentile-preview', e);
    return res.json({ currentPercentile: 50, nextPercentile: 45 });
  }
});

export default router;
