import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  // 앱인토스 콘솔에 등록한 앱 ID(영문 슬러그)와 동일해야 합니다.
  appName: 'good-habit-builder',
  brand: {
    displayName: '좋은 습관 만들기',
    primaryColor: '#059669',
    // 콘솔 > 앱 정보에서 600×600 아이콘 우클릭 → 링크 복사 후 붙여넣기
    icon: '/app-brand-logo.png',
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
  webViewProps: {
    type: 'game',
  },
});
