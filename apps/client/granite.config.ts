import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  // 앱인토스 콘솔에 등록한 앱 ID(영문 슬러그)와 동일해야 합니다.
  appName: 'good-habit-builder',
  brand: {
    displayName: '좋은 습관 만들기',
    primaryColor: '#059669',
    // 앱인토스 공통 내비/콘솔 미리보기는 절대 URL이 안정적입니다. 배포 도메인이 바뀌면 같이 수정하세요.
    icon: 'https://korea-habits.vercel.app/app-brand-logo.png',
  },
  web: {
    host: 'localhost',
    port: 5010,
    commands: {
      dev: 'vite',
      build: 'npm run build:ait',
    },
  },
  outdir: 'dist',
  permissions: [],
  // 비게임 미니앱은 'partner'로 표준 내비게이션 바가 적용됩니다. 'game'이면 반려 사유가 될 수 있어요.
  webViewProps: {
    type: 'partner',
    pullToRefreshEnabled: false,
    bounces: false,
    overScrollMode: 'never',
  },
});
