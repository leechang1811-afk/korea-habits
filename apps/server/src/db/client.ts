// index.ts에서 .env 로드함
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required');
const pool = new pg.Pool({
  connectionString,
  connectionTimeoutMillis: 8000,
});
export const db = drizzle(pool, { schema });
export type Db = typeof db;
