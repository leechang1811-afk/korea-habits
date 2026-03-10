import { Router } from 'express';
import { sql, eq, and } from 'drizzle-orm';
import { db } from '../db/client.js';
import { leaderboard } from '../db/schema.js';

const router = Router();

router.get('/api/leaderboard', async (req, res) => {
  try {
    const scope = (req.query.scope as string) || 'monthly';

    const ym = new Date().toISOString().slice(0, 7);

    const rows = await db
      .select()
      .from(leaderboard)
      .where(
        and(
          eq(leaderboard.scope, scope),
          eq(leaderboard.year_month, ym)
        )
      )
      .orderBy(sql`${leaderboard.score} DESC`)
      .limit(100);

    return res.json({
      scope,
      year_month: ym,
      entries: rows.map((r, i) => ({
        rank: i + 1,
        score: r.score,
        max_level: r.max_level,
        user_hash: r.user_hash.slice(0, 8) + '...',
      })),
    });
  } catch (e) {
    console.error('GET /api/leaderboard', e);
    const scope = (req.query.scope as string) || 'monthly';
    return res.json({ scope, year_month: new Date().toISOString().slice(0, 7), entries: [] });
  }
});

export default router;
