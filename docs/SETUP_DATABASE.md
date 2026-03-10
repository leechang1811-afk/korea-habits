# 데이터베이스 생성 및 연동 (Supabase)

AppInToss_Quiz_KR 프로젝트의 Supabase 데이터베이스를 설정하는 방법입니다.

---

## 1단계: Supabase에서 SQL 실행

1. [Supabase 대시보드](https://supabase.com/dashboard) 로그인
2. **AppInToss_Quiz_KR** 프로젝트 선택
3. 왼쪽 메뉴에서 **SQL Editor** 클릭
4. **+ New query** 선택
5. 아래 SQL 전체 복사 후 붙여넣기:

```sql
-- score_histogram_daily: 점수 분포
CREATE TABLE IF NOT EXISTS "score_histogram_daily" (
  "date" date NOT NULL,
  "bucket" integer NOT NULL,
  "count" bigint DEFAULT 0 NOT NULL,
  PRIMARY KEY ("date", "bucket")
);

-- challenge_stats_daily: 게임유형·레벨별 성공률
CREATE TABLE IF NOT EXISTS "challenge_stats_daily" (
  "date" date NOT NULL,
  "game_type" varchar(20) NOT NULL,
  "level" integer NOT NULL,
  "attempts" bigint DEFAULT 0 NOT NULL,
  "successes" bigint DEFAULT 0 NOT NULL,
  PRIMARY KEY ("date", "game_type", "level")
);

-- runs: 개인 플레이 기록
CREATE TABLE IF NOT EXISTS "runs" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_hash" varchar(64) NOT NULL,
  "score" integer NOT NULL,
  "max_level" integer NOT NULL,
  "created_at" varchar(30) NOT NULL
);

-- leaderboard: 월간 리더보드
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
```

6. **Run** 버튼 클릭 → "Success" 메시지 확인
7. **Tables** 메뉴에서 4개 테이블이 생성되었는지 확인

---

## 2단계: 연결 문자열 복사

1. Supabase 왼쪽 메뉴 **Project Settings** (휴지통 아이콘 옆 ⚙️) 클릭
2. **Database** 탭 선택
3. **Connection string** 섹션에서 **URI** 탭 선택
4. **Copy** 버튼으로 연결 문자열 복사
5. 비밀번호 부분 `[YOUR-PASSWORD]`를 **실제 Database Password**로 교체  
   - 비밀번호는 프로젝트 생성 시 저장했거나, **Reset database password**로 새로 설정 가능

연결 문자열 예시:
```
postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
```

> **Tip**: Transaction Mode(Pooler) 포트 **6543** 사용 권장. Direct Connection(5432)도 가능하지만 풀러가 권장됨.

---

## 3단계: 로컬 환경변수 설정

**방법 A - 자동 설정 (권장)**
1. Supabase Connect → URI (Use connection pooling 체크) → 문자열 전체 복사
2. 터미널에서:
```bash
cd apps/server
npm run db:setup "여기에_복사한_문자열_붙여넣기"
```

**방법 B - 수동**
1. `apps/server/.env` 파일 생성 또는 수정
2. `DATABASE_URL=` 뒤에 Supabase에서 복사한 URI 붙여넣기

---

## 4단계: 연결 테스트

터미널에서:

```bash
cd apps/server
npm run dev
```

서버가 정상 기동되고, 게임 플레이 후 결과 제출이 되면 연동 성공입니다.

**DB 헬스 체크**:
```bash
curl http://localhost:3001/api/health/db
```
→ `{"ok":true,"db":"connected"}` 응답이면 연결됨.

---

## 배포 시 (Railway 등)

백엔드를 Railway 등에 배포할 때:

1. 해당 플랫폼의 **Environment Variables**에 `DATABASE_URL` 추가
2. Supabase에서 복사한 연결 문자열 그대로 입력
3. Redeploy

---

## 테이블 설명

| 테이블 | 용도 |
|--------|------|
| `score_histogram_daily` | 일별 점수 분포 (퍼센타일 계산) |
| `challenge_stats_daily` | 게임유형·레벨별 시도/성공 수 |
| `runs` | 개인 플레이 기록 (평균·최저·최신) |
| `leaderboard` | 월간 리더보드 (유저별 최고점) |
