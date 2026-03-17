// index.ts에서 .env 로드함
import dns from 'node:dns';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';

// Render 등 일부 환경에서 Supabase IPv6 주소로 연결 시 ENETUNREACH 발생 → IPv4 우선
dns.setDefaultResultOrder('ipv4first');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required');
// Supabase SSL: 연결 문자열에 sslmode 없으면 추가 (Render 등 외부 연결 시 필요)
const connStr = connectionString.includes('sslmode=') ? connectionString : connectionString + (connectionString.includes('?') ? '&' : '?') + 'sslmode=require';
const pool = new pg.Pool({
  connectionString: connStr,
  connectionTimeoutMillis: 8000,
  // Render 등에서 Supabase 연결 시 "self-signed certificate in certificate chain" 방지
  ssl: { rejectUnauthorized: false },
});
export const db = drizzle(pool, { schema });
export type Db = typeof db;
