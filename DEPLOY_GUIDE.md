# 🚀 한국인 상위 몇%? — 전체 배포 가이드

순서대로 따라하면 됩니다. **1 → 2 → 3** 순으로 진행하세요.

---

## 1️⃣ Supabase (데이터베이스)

### 1-1. 프로젝트 생성

1. [Supabase](https://supabase.com) 접속 → 로그인
2. **New Project** 클릭
3. 이름: `korea-quiz` (아무거나 OK)
4. 비밀번호 설정 후 **Create new project** (1~2분 대기)

### 1-2. DATABASE_URL 복사

1. 왼쪽 **Project Settings** (톱니바퀴) 클릭
2. **Database** 메뉴 이동
3. **Connection string** → **URI** 탭
4. `postgresql://postgres.[프로젝트ref]:[비밀번호]@...` 형식 문자열 **복사**
5. 비밀번호 부분 `[YOUR-PASSWORD]`를 실제 비밀번호로 바꿔서 저장

### 1-3. 테이블 생성

1. 왼쪽 **SQL Editor** 클릭
2. **New query** 클릭
3. `apps/server/drizzle/supabase_init.sql` 파일 내용을 복사해서 붙여넣기
4. **Run** 버튼 클릭

---

## 2️⃣ Render (백엔드 API 서버) — 무료

### 2-1. 배포

1. [Render](https://render.com) 접속 → **Get Started** → **GitHub** 로그인
2. **New +** → **Web Service**
3. **Connect a repository** → **korea-quiz** 저장소 선택
4. 아래 설정 입력:

| 항목 | 값 |
|------|-----|
| **Name** | `korea-quiz-api` (아무거나 OK) |
| **Region** | Singapore (한국과 가까움) |
| **Branch** | `main` |
| **Runtime** | Node |
| **Build Command** | `npm install && npm run build:server` |
| **Start Command** | `node apps/server/dist/index.js` |
| **Instance Type** | **Free** 선택 |

5. **Advanced** → **Environment Variables** 클릭

### 2-2. 환경변수 설정

**Add Environment Variable** 클릭 후:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | (1단계에서 복사한 Supabase URI) |

> Render가 자동으로 `PORT`를 넣어주므로 따로 설정하지 않아도 됩니다.

### 2-3. 배포 & 도메인 확인

1. **Create Web Service** 클릭
2. 빌드가 끝나면 상단에 **URL** 표시 (예: `https://korea-quiz-api.onrender.com`)
3. **끝에 `/api` 붙인 주소**를 메모 (예: `https://korea-quiz-api.onrender.com/api`)

> ⚠️ **무료 플랜**: 15분 동안 요청이 없으면 슬립 모드로 들어갑니다. 첫 요청 시 1분 정도 깨어나는데, 잠시 기다리면 됩니다.

---

## 3️⃣ Vercel (프론트엔드)

### 3-1. 배포

1. [Vercel](https://vercel.com) 접속 → **Continue with GitHub**
2. **Add New** → **Project**
3. **korea-quiz** 저장소 **Import**
4. **Configure Project** 화면에서 설정 확인 후 **Deploy** 클릭

### 3-2. 환경변수 설정

1. 프로젝트 **Settings** → **Environment Variables**
2. **Add** 클릭
3. 아래 입력:

| Name | Value |
|------|-------|
| `VITE_API_URL` | `https://(Railway 도메인)/api` |

예: `https://korea-quiz-production.up.railway.app/api`

4. **Save** 후 **Redeploy** (최상단 Deployments → ... → Redeploy)

---

## ✅ 확인

1. **Vercel URL**로 접속 (예: `https://korea-quiz-xxx.vercel.app`)
2. 게임 플레이 → 결과 저장 → 기록 페이지 정상 동작 확인

---

## 💡 문제 해결

| 현상 | 확인 사항 |
|------|-----------|
| "연결을 확인하고 다시 시도" | Vercel `VITE_API_URL`이 Render 주소인지, `/api`까지 포함됐는지 확인 |
| Render 빌드 실패 | GitHub에 최신 코드가 푸시된 상태인지 확인 |
| 첫 요청 느림 (1분 정도) | 무료 플랜 슬립 모드. 15분 미사용 시 잠들고, 요청 시 깨어남 |
| DB 오류 | Supabase SQL Editor에서 테이블이 생성됐는지 확인 |
