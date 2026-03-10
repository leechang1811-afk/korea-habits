-- AppInToss Quiz KR - Supabase 초기 테이블 생성
-- Supabase 대시보드 > SQL Editor에서 이 스크립트를 실행하세요

-- 1. score_histogram_daily: 점수 분포 (bucket = floor(score/200))
CREATE TABLE IF NOT EXISTS "score_histogram_daily" (
  "date" date NOT NULL,
  "bucket" integer NOT NULL,
  "count" bigint DEFAULT 0 NOT NULL,
  PRIMARY KEY ("date", "bucket")
);

-- 2. challenge_stats_daily: 게임유형·레벨별 성공률
CREATE TABLE IF NOT EXISTS "challenge_stats_daily" (
  "date" date NOT NULL,
  "game_type" varchar(20) NOT NULL,
  "level" integer NOT NULL,
  "attempts" bigint DEFAULT 0 NOT NULL,
  "successes" bigint DEFAULT 0 NOT NULL,
  PRIMARY KEY ("date", "game_type", "level")
);

-- 3. runs: 개인 플레이 기록 (평균/최저/최신 산출용)
CREATE TABLE IF NOT EXISTS "runs" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_hash" varchar(64) NOT NULL,
  "score" integer NOT NULL,
  "max_level" integer NOT NULL,
  "created_at" varchar(30) NOT NULL
);

-- 4. leaderboard: 월간 리더보드 (유저별 최고 점수)
CREATE TABLE IF NOT EXISTS "leaderboard" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_hash" varchar(64) NOT NULL,
  "scope" varchar(20) NOT NULL,
  "year_month" varchar(7) NOT NULL,
  "score" integer NOT NULL,
  "max_level" integer NOT NULL,
  "created_at" date NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "leaderboard_user_scope_ym_idx" 
  ON "leaderboard" ("user_hash", "scope", "year_month");

-- 완료 메시지
SELECT 'Tables created successfully!' AS status;
