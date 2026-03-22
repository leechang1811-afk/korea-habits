# Vercel 흰 화면 / 아무것도 안 나올 때

https://korea-quiz-client.vercel.app 에 접속했는데 아무것도 안 보이면 아래를 순서대로 확인하세요.

---

## 1. Vercel Root Directory 확인 (가장 흔한 원인)

**Vercel 대시보드** → **korea-quiz-client** → **Settings** → **General** → **Root Directory**

| 설정 | 결과 |
|------|------|
| **비어 있음** 또는 **`.`** | ✅ 정상 (루트에서 빌드) |
| `apps/client` | ⚠️ 이 경우 `apps/client/vercel.json` 사용됨. `build:vercel` 스크립트로 shared 패키지 먼저 빌드함 |

Root Directory가 `apps/client`로 되어 있으면, 루트의 `vercel.json` 대신 `apps/client/vercel.json`이 적용됩니다. 두 경우 모두 동작하도록 설정해 두었습니다.

---

## 2. 환경 변수 확인

**Settings** → **Environment Variables**

| Name | Value |
|------|-------|
| `VITE_API_URL` | `https://korea-quiz.onrender.com/api` |

끝에 `/api` 포함. Production, Preview 모두 체크.

---

## 3. 배포 로그 확인

**Deployments** → 최신 배포 클릭 → **Building** / **Deployed** 로그 확인

- **Building** 실패 시: 빌드 에러 메시지 확인
- **Deployed** 성공인데 흰 화면: 브라우저 개발자 도구(F12) → Console 탭에서 에러 확인

---

## 4. 브라우저에서 확인

1. **F12** → **Console** 탭: 빨간색 에러가 있는지
2. **Network** 탭: `/assets/*.js`, `/assets/*.css` 가 404인지
3. **캐시 비우기** 후 새로고침 (Cmd+Shift+R 또는 Ctrl+Shift+R)

---

## 5. 수동 재배포

1. **Deployments** → 최신 배포 우측 **⋯** → **Redeploy**
2. 1~2분 대기 후 https://korea-quiz-client.vercel.app 새로고침

---

## 6. 로컬 빌드로 확인

```bash
cd /Users/changhwanlee/Desktop/Next-Tailwind\ 2
npm run build:vercel
cd apps/client && npx vite preview
```

`http://localhost:4173` 에서 정상 표시되면 로컬 빌드는 성공. Vercel 설정 문제일 가능성이 높습니다.
