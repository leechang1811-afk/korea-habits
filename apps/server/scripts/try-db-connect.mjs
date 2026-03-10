#!/usr/bin/env node
/**
 * 여러 Supabase 연결 조합 시도
 * node apps/server/scripts/try-db-connect.mjs
 */
import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { config } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env') });

const projectIds = ['svnhwtiwvzwbwdbmkecw', 'svnhwtiwwzwbwdbmkecw'];
const regions = ['ap-northeast-2', 'us-east-1', 'ap-southeast-1'];

const envPass = process.env.DATABASE_URL?.match(/:([^:@]+)@/)?.[1] || '';
const passwords = [
  ...(envPass ? [envPass, envPass.replace(/!/g, '%21').replace(/@/g, '%40').replace(/#/g, '%23')] : []),
  'dnflepdlxjqpdltm21%21%40%23',
  'dnflepdlxjqpdltm21',
  'dnflepdlxjqpdltm21%21',
  'DNFLepdlxjqpdltm%21%40%23',
].filter(Boolean);

async function tryConnect(url) {
  const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 5000 });
  try {
    await client.connect();
    const r = await client.query('SELECT 1');
    await client.end();
    return { ok: true };
  } catch (e) {
    return { ok: false, err: e.message };
  }
}

async function main() {
  console.log('Supabase 연결 시도 중...\n');
  const configs = [];
  for (const projectId of projectIds) {
    for (const region of regions) {
      for (const password of passwords) {
        configs.push({
          url: `postgresql://postgres.${projectId}:${password}@aws-0-${region}.pooler.supabase.com:6543/postgres?pgbouncer=true`,
          label: `pooler ${projectId.slice(0, 10)} ${region}`,
        });
      }
    }
    for (const password of passwords) {
      configs.push({
        url: `postgresql://postgres:${password}@db.${projectId}.supabase.co:5432/postgres`,
        label: `direct ${projectId.slice(0, 10)}`,
      });
    }
  }
  for (const { url, label } of configs) {
    const r = await tryConnect(url);
    if (r.ok) {
      console.log('✅ 성공:', label);
      console.log('\n이 URL을 .env에 넣으세요:');
      console.log('DATABASE_URL=' + url);
      process.exit(0);
    }
    console.log('❌', label, '→', r.err?.slice(0, 60) || r.err);
  }
  console.log('\n모든 조합 실패. Supabase Connect에서 URI를 직접 복사해 .env에 넣으세요.');
}

main().catch(console.error);
