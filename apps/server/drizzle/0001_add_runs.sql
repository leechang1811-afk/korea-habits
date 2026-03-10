-- runs: 개인 플레이 기록 (평균/최저/최신 산출용)
CREATE TABLE IF NOT EXISTS "runs" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_hash" varchar(64) NOT NULL,
  "score" integer NOT NULL,
  "max_level" integer NOT NULL,
  "created_at" varchar(30) NOT NULL
);
