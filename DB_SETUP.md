# DB 연동 설정 (배포 전)

배포 전 Supabase DB를 연동하고 마이그레이션을 적용하는 가이드입니다.

---

## 1. Supabase 프로젝트 준비

### 새로 만드는 경우

1. [supabase.com](https://supabase.com) → 로그인
2. **New Project** → 프로젝트 이름 입력 (예: `korea-quiz`)
3. 비밀번호 설정 후 **Create project** (생성 완료까지 1~2분)

### DATABASE_URL 확보

1. Supabase 대시보드 → **Settings** → **Database**
2. **Connection string** 섹션에서 **URI** 탭 선택
3. 연결 문자열 복사:
   ```
   postgresql://postgres.[PROJECT_REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
4. `[YOUR-PASSWORD]`를 실제 DB 비밀번호로 바꾸세요  
   (Connection string의 `[YOUR-PASSWORD]`를 지우고 본인 비밀번호 입력)

---

## 2. .env 파일 생성

프로젝트 루트에서:

```bash
# apps/server/.env 파일 생성
mkdir -p apps/server
touch apps/server/.env
```

`apps/server/.env` 내용:

```
DATABASE_URL=postgresql://postgres.xxxxx:내비밀번호@aws-0-xx.pooler.supabase.com:6543/postgres
PORT=3001
```

- Supabase Connection pooler URL(포트 6543) 사용 권장 (동시 연결에 유리)
- 직접 연결이 필요하면 포트 5432 사용

---

## 3. 마이그레이션 실행

```bash
cd apps/server
npm run db:migrate
```

성공 시 예:
```
No config path provided, using default
Reading config file...
Applying migration 0000_init.sql
Migration 0000_init.sql applied successfully
```

---

## 4. DB 연결 확인

```bash
cd apps/server
npm run db:check
```

정상이면 예:
```
✅ DB 연결 성공

✅ score_histogram_daily
✅ challenge_stats_daily
✅ leaderboard

--- 데이터 현황 ---
   score_histogram_daily: 0건
   challenge_stats_daily: 0건
   leaderboard: 0건
```

---

## 5. 로컬에서 API 테스트 (선택)

DB 연동 후 백엔드가 정상 동작하는지 확인:

```bash
# 터미널 1: 서버 실행
cd apps/server && npm run dev

# 터미널 2: health 체크
curl http://localhost:3001/api/health
# {"ok":true}

curl http://localhost:3001/api/health/db
# {"ok":true,"db":"connected"}
```

---

## 완료 체크리스트

- [ ] Supabase 프로젝트 생성
- [ ] `apps/server/.env`에 `DATABASE_URL` 설정
- [ ] `npm run db:migrate` 성공
- [ ] `npm run db:check`로 3개 테이블 확인
- [ ] (선택) 로컬 서버 `/api/health/db` 응답 확인

이제 Railway 배포 시 `DATABASE_URL`만 환경변수로 넣어주면 됩니다.
