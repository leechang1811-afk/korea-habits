import './loadEnv.js';
import express from 'express';
import cors from 'cors';
import { db } from './db/client.js';
import { sql } from 'drizzle-orm';
import runsRouter from './routes/runs.js';
import statsRouter from './routes/stats.js';
import leaderboardRouter from './routes/leaderboard.js';
import meRouter from './routes/me.js';

const app = express();
const PORT = process.env.PORT || 5005;

app.use(cors({ origin: true }));
app.use(express.json());

app.use(runsRouter);
app.use(statsRouter);
app.use(leaderboardRouter);
app.use(meRouter);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/health/db', async (_req, res) => {
  try {
    await db.execute(sql`SELECT 1`);
    res.json({ ok: true, db: 'connected' });
  } catch (e) {
    console.error('DB health check failed:', e);
    res.status(503).json({ ok: false, db: 'error', message: (e as Error).message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
