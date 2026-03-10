import { pgTable, serial, date, integer, bigint, varchar, primaryKey, unique } from 'drizzle-orm/pg-core';

// score_histogram_daily: bucket = floor(score/200)
export const scoreHistogramDaily = pgTable(
  'score_histogram_daily',
  {
    date: date('date').notNull(),
    bucket: integer('bucket').notNull(),
    count: bigint('count', { mode: 'number' }).notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.date, t.bucket] })]
);

// challenge_stats_daily: success rate per game_type, level
export const challengeStatsDaily = pgTable(
  'challenge_stats_daily',
  {
    date: date('date').notNull(),
    game_type: varchar('game_type', { length: 20 }).notNull(),
    level: integer('level').notNull(),
    attempts: bigint('attempts', { mode: 'number' }).notNull().default(0),
    successes: bigint('successes', { mode: 'number' }).notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.date, t.game_type, t.level] })]
);

// runs: 개인 플레이 기록 (평균/최저/최신 산출용)
export const runs = pgTable('runs', {
  id: serial('id').primaryKey(),
  user_hash: varchar('user_hash', { length: 64 }).notNull(),
  score: integer('score').notNull(),
  max_level: integer('max_level').notNull(),
  created_at: varchar('created_at', { length: 30 }).notNull(),
});

// leaderboard: monthly top 100
export const leaderboard = pgTable(
  'leaderboard',
  {
    id: serial('id').primaryKey(),
    user_hash: varchar('user_hash', { length: 64 }).notNull(),
    scope: varchar('scope', { length: 20 }).notNull(),
    year_month: varchar('year_month', { length: 7 }).notNull(),
    score: integer('score').notNull(),
    max_level: integer('max_level').notNull(),
    created_at: date('created_at').notNull(),
  },
  (t) => [unique().on(t.user_hash, t.scope, t.year_month)]
);
