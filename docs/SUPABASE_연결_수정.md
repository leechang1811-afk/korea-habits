# Supabase "Tenant or user not found" 해결

## 1단계: Supabase에서 URI 복사

1. https://supabase.com/dashboard 로그인
2. **프로젝트 선택** (왼쪽 목록)
3. 좌측 하단 **Project Settings** (톱니바퀴) 클릭
4. **Database** 메뉴 클릭
5. 아래로 스크롤 → **Connection string** 섹션
6. **URI** 탭 선택
7. **"Use connection pooling"** 체크박스 **반드시 체크**
8. 비밀번호 입력란에 DB 비밀번호 입력 (설정한 것)
9. **Connection string** 박스의 URI **전체 선택 후 복사**  
   예: `postgresql://postgres.xxxxx:비밀번호@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres`

## 2단계: 프로젝트가 Paused인지 확인

- 프로젝트 목록에 "Paused" 표시가 있으면 **Restore project** 클릭 후 잠시 대기

## 3단계: 비밀번호가 맞는지 확인

- 비밀번호를 잊었다면 **Database** → **Reset database password** 에서 새 비밀번호 설정
- 새 비밀번호로 위 1단계에서 URI 다시 복사

## 4단계: .env에 저장

터미널에서:

```bash
cd "/Users/changhwanlee/Desktop/Next-Tailwind 2/apps/server"
npm run db:setup '여기에_복사한_URI_전체_붙여넣기'
```

⚠️ **비밀번호에 `!` 가 들어가면 반드시 작은따옴표 `'...'` 로 감싸세요.**

예:
```bash
npm run db:setup 'postgresql://postgres.abcdefgh:MyPass123!@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true'
```

## 5단계: 서버 재시작

```bash
cd "/Users/changhwanlee/Desktop/Next-Tailwind 2"
npm run dev
```

브라우저에서 http://localhost:5005/api/health/db 접속 → `{"ok":true,"db":"connected"}` 확인
