# korea-quiz 설정

## 로컬에서 실행

```bash
cd "/Users/changhwanlee/Desktop/Next-Tailwind 2"

# 1. 의존성 설치
npm install

# 2. DB 연결 설정 (apps/server/.env에 DATABASE_URL 저장)
cd apps/server
npm run db:setup "postgresql://postgres:비밀번호@db.프로젝트ID.supabase.co:5432/postgres"

# 3. 전체 앱 실행 (서버 5005 + 클라이언트 5002)
cd ..
npm run dev
```

- **앱 주소**: http://localhost:5173
- **API**: http://localhost:5005
- 비밀번호에 `!`가 있으면 따옴표로 감싸기: `npm run db:setup 'postgresql://...'`

---

## 1. GitHub에 korea-quiz 레포 만들기

1. [github.com](https://github.com) → 로그인
2. 오른쪽 상단 **+** → **New repository**
3. 설정:
   - **Repository name**: `korea-quiz`
   - **Public** 선택
   - **Add a README file** 체크 해제 (이미 로컬에 코드가 있음)
4. **Create repository** 클릭

---

## 2. 로컬에서 push (아래 명령 실행)

GitHub에서 `korea-quiz` 레포를 만든 뒤, 터미널에서:

```bash
cd "/Users/changhwanlee/Desktop/Next-Tailwind 2"

# 1. 새 원격 추가
git remote add korea-quiz https://github.com/leechang1811-afk/korea-quiz.git

# 2. 변경사항 추가 & 커밋
git add .
git commit -m "korea-quiz: 나는 한국 상위 몇%? 앱"

# 3. korea-quiz 레포로 push
git push -u korea-quiz main
```

---

## 3. Supabase에 테이블 생성

1. [Supabase 대시보드](https://supabase.com/dashboard) → 프로젝트 선택
2. 좌측 **SQL Editor** 클릭
3. **New query** 클릭
4. `apps/server/drizzle/supabase_init.sql` 파일 내용 전체 복사 → 붙여넣기
5. **Run** (또는 Ctrl+Enter) 실행
6. "Tables created successfully!" 메시지 확인

---

## 4. 앱 플로우 테스트

1. http://localhost:5173 접속
2. **시작하기** → 5가지 게임 진행
3. 결과 확인 후 **순위 보기**, **내 기록** 동작 확인

---

## 5. Vercel에 프로젝트 연결

1. [vercel.com](https://vercel.com) → 로그인 (GitHub)
2. **Add New** → **Project**
3. **Import**에서 `leechang1811-afk/korea-quiz` 선택
4. **Configure**:
   - Framework: Vite (자동 감지될 수 있음)
   - Root Directory: `.`
   - Build Command: `npm run build:client`
   - Output Directory: `apps/client/dist`
   - **Environment Variables**에서 `VITE_API_URL` 추가 (Railway URL 나중에 입력 가능)
   - (선택) `VITE_KAKAO_JS_KEY`: 카카오톡 공유용 [developers.kakao.com](https://developers.kakao.com)에서 발급
5. **Deploy** 클릭

---

## 참고

- Mafia-game 레포는 그대로 유지됨 (origin은 변경하지 않음)
- 백엔드(Railway) 배포 후 `VITE_API_URL`을 Vercel에서 다시 설정하고 Redeploy
