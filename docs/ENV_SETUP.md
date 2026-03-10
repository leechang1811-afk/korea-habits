# .env 설정 방법 (3번 단계 상세)

## Step 1: Supabase에서 연결 문자열 복사

1. Supabase 대시보드 → 프로젝트 **AppInToss_Quiz_KR** 선택
2. 왼쪽 아래 **⚙️ Project Settings** 클릭
3. 왼쪽 메뉴에서 **Database** 클릭
4. 아래로 스크롤하여 **Connection string** 섹션 찾기
5. **URI** 탭 선택
6. 표시되는 문자열 **전체 복사** (예: `postgresql://postgres.svnhwtiwwzwbwdbmkecw:xxxxx@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres`)

---

## Step 2: 비밀번호 교체

복사한 문자열에서 `[YOUR-PASSWORD]` 를 **실제 데이터베이스 비밀번호**로 바꿉니다.

- 비밀번호를 모르면: Database 화면에서 **Reset database password**로 새로 설정

---

## Step 3: .env 파일 만들기

### 방법 A: Cursor/VS Code에서

1. `apps/server` 폴더 열기
2. 새 파일 생성 → 이름: `.env`
3. 아래 내용 붙여넣기 (여기 `여기에_복사한_문자열_붙여넣기` 부분을 Supabase에서 복사한 전체 URL로 교체):

```
DATABASE_URL=여기에_복사한_문자열_붙여넣기
PORT=3001
```

### 방법 B: 터미널에서

```bash
cd "/Users/changhwanlee/Desktop/Next-Tailwind 2/apps/server"
```

그 다음 아래 중 하나 실행:

**텍스트 에디터로 새 파일 만들기:**
```bash
# macOS
open -e .env
```
→ 열리는 메모장에 다음 입력 후 저장:
```
DATABASE_URL=postgresql://postgres.xxx:비밀번호@aws-0-xx.pooler.supabase.com:6543/postgres?pgbouncer=true
PORT=3001
```

**또는 echo로 한 번에 만들기:**
```bash
echo 'DATABASE_URL=여기에Supabase에서_복사한_전체_URL_붙여넣기
PORT=3001' > .env
```
(실제로는 `여기에Supabase에서_복사한_전체_URL_붙여넣기` 를 진짜 URL로 바꿔야 함)

---

## Step 4: 확인

```bash
cd apps/server
npm run dev
```

`http://localhost:3001/api/health/db` 접속 시 `{"ok":true,"db":"connected"}` 가 나오면 성공입니다.
