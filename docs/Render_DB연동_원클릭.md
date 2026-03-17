# Render DB 연동 원클릭

ENETUNREACH(상위 50%/45% 고정) 해결을 위해 아래 한 줄만 실행하세요.

## 1. Render API Key 발급

https://dashboard.render.com/settings/api-keys → **Create API Key**

## 2. 원클릭 실행

```bash
# apps/server/.env에 RENDER_API_KEY=발급한키 추가 후:
RENDER_API_KEY=발급한키 npm run render:sync-db
```

또는 한 줄로:

```bash
RENDER_API_KEY=여기에키붙여넣기 npm run render:sync-db
```

## 동작

1. **Start Command** → `node --dns-result-order=ipv4first apps/server/dist/index.js` (IPv4 우선)
2. **DATABASE_URL** → `apps/server/.env` 값이 있으면 Render에 동기화
3. **재배포** 자동 트리거

## DATABASE_URL (포트 6543 필수)

`apps/server/.env`에 Supabase **Connection pooling** URI:

```
DATABASE_URL=postgresql://postgres.프로젝트ID:비밀번호@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true
```

- Supabase: Database → Connection string → **Connection pooling** (Transaction) → 포트 **6543**
