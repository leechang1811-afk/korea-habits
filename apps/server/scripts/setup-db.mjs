#!/usr/bin/env node
/**
 * Supabase 연결 문자열을 .env에 저장
 * 
 * 사용법: node scripts/setup-db.mjs "postgresql://postgres.xxx:비밀번호@aws-0-xx.pooler.supabase.com:6543/postgres"
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env');

let url = (process.argv[2] || '').trim();
if (!url || url.includes('붙여넣기') || url.includes('여기')) {
  console.log(`
사용법: npm run db:setup "postgresql://..."

Supabase Connect → URI (Use connection pooling 체크) 에서
나오는 postgresql://... 문자열 전체를 복사한 뒤,
아래처럼 따옴표 안에 붙여넣어 실행하세요:

  cd apps/server
  npm run db:setup "postgresql://postgres.xxx:비밀번호@aws-0-xx.pooler.supabase.com:6543/postgres"

※ "여기에 붙여넣기"가 아니라 Supabase에서 복사한 실제 문자열이어야 합니다.
`);
  process.exit(1);
}

url = url.replace(/^["']|["']$/g, '').trim();
if (!url.startsWith('postgresql://') && !url.startsWith('postgres://')) {
  console.error('postgresql:// 로 시작하는 문자열이어야 합니다.');
  process.exit(1);
}

// 비밀번호 특수문자 URL 인코딩 (!@#)
const match = url.match(/^postgres(ql)?:\/\/([^:]+):([^@]+)@/);
if (match) {
  const [, , user, pass] = match;
  const encoded = pass.replace(/!/g, '%21').replace(/@/g, '%40').replace(/#/g, '%23');
  if (encoded !== pass) url = url.replace(/^postgres(ql)?:\/\/([^:]+):([^@]+)@/, `postgres$1://$2:${encoded}@`);
}
// Pooler: postgres만 있으면 프로젝트ID 추가 (이 프로젝트: svnhwtiwvzwbwdbmkecw)
if (url.includes('pooler.supabase.com') && /postgres(ql)?:\/\/postgres:/.test(url)) {
  url = url.replace(/postgres(ql)?:\/\/postgres:/, 'postgres$1://postgres.svnhwtiwvzwbwdbmkecw:');
  console.log('ℹ️  Pooler용으로 postgres.프로젝트ID 형식 자동 적용');
}

let content = '';
try {
  content = readFileSync(envPath, 'utf8');
} catch {
  content = 'PORT=5005\n';
}
const lines = content.split('\n').filter((l) => !l.startsWith('DATABASE_URL='));
lines.push(`DATABASE_URL=${url}`);
if (!content.includes('PORT=')) lines.push('PORT=5005');
writeFileSync(envPath, lines.join('\n') + '\n');

console.log('✅ .env에 저장했습니다.');
console.log('서버 재시작: cd apps/server && npm run dev');
