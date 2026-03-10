# Vercel 배포 가이드

## 1. 사전 준비: 백엔드 배포

클라이언트가 API를 호출하므로 **서버를 먼저** Railway, Render 등에 배포하세요.

### Railway 예시

1. [Railway](https://railway.app) → New Project → Deploy from GitHub
2. **korea-quiz** 저장소 선택
3. **Root Directory**: `apps/server` 설정
4. **Build Command**: `npm install && npx tsc`
5. **Start Command**: `node dist/index.js`
6. **환경변수**: `DATABASE_URL`, `PORT=5005`
7. 배포 후 URL 확인 (예: `https://korea-quiz-api-production.up.railway.app`)

> 서버 경로가 `/api/runs/submit` 등이므로, `VITE_API_URL`은 `https://your-server.railway.app/api` 형식으로 끝까지 포함해서 설정하세요.

---

## 2. Vercel 배포

### 2-1. GitHub 연결

1. [Vercel](https://vercel.com) 로그인
2. **New Project** → **Import Git Repository**
3. **korea-quiz** 저장소 선택 → **Import**

### 2-2. 빌드 설정 (자동)

`vercel.json`이 있어 아래 설정이 자동 적용됩니다.

| 항목 | 값 |
|------|-----|
| Build Command | `npm run build:vercel` |
| Output Directory | `apps/client/dist` |
| Install Command | `npm install` |

그대로 두고 **Continue**를 누르세요.

### 2-3. 환경변수

**Environment Variables**에서 다음 변수를 추가하세요.

| 변수 | 값 | 설명 |
|------|-----|------|
| `VITE_API_URL` | `https://your-backend-url.com` | **필수** - 백엔드 API 주소 (끝에 `/api` 제외) |
| `VITE_KAKAO_JS_KEY` | 카카오 JS 키 | 선택 - 카카오톡 공유 기능용 |

- `VITE_API_URL` 예시: `https://korea-quiz-api-production.up.railway.app/api`
- 이 값이 API 베이스이므로, `/runs/submit` 등이 자동으로 붙어 호출됩니다.

### 2-4. 배포

**Deploy** 버튼을 눌러 배포를 진행하세요.

---

## 3. 배포 후 확인

1. **Deployments**에서 URL 확인 (예: `korea-quiz-xxx.vercel.app`)
2. 접속 후 게임 플레이 → 결과 저장/조회 동작 확인
3. OG 이미지 및 공유용 URL은 `apps/client/index.html`에서 필요 시 수정

---

## 4. CORS

백엔드의 CORS는 `origin: true`로 모든 출처를 허용하므로,  
Vercel 도메인에서의 API 호출은 별도 설정 없이 동작합니다.
