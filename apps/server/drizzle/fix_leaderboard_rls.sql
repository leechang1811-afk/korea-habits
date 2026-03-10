-- leaderboard 등 백엔드 전용 테이블 RLS 비활성화
-- Supabase 대시보드 > SQL Editor에서 실행하세요
-- (백엔드가 postgres 연결로 접근하므로 대부분 해당 없지만, 문제 시 실행)

ALTER TABLE IF EXISTS "leaderboard" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "runs" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "score_histogram_daily" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "challenge_stats_daily" DISABLE ROW LEVEL SECURITY;
