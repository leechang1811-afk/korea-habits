# Supabase 연동 가이드

## 1단계: 연결 문자열 복사

1. **[Connect 버튼 클릭](https://supabase.com/dashboard/project/svnhwtiwvzwbwdbmkecw?showConnect=true)**  
   (또는 Supabase 대시보드 → 프로젝트 선택 → 상단 **Connect** 버튼)

2. **URI** 탭 선택

3. **Use connection pooling** 체크 (Transaction 모드)

4. 표시되는 `postgresql://postgres.xxx:...` 문자열 **전체 복사**

---

## 2단계: .env에 저장

```bash
cd apps/server
npm run db:setup "여기에_복사한_문자열_붙여넣기"
```

※ 비밀번호에 `!`, `@`, `#` 있어도 스크립트가 자동 인코딩합니다.

---

## 3단계: 서버 실행

```bash
cd apps/server
npm run dev
```

---

## 4단계: 연결 확인

브라우저에서 `http://localhost:5005/api/health/db` 접속

- 성공: `{"ok":true,"db":"connected"}`
- 실패: 비밀번호 재확인 또는 Supabase에서 **Reset database password**
