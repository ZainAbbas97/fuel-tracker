import pg from 'pg';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { Pool } = pg;
if (!process.env.DATABASE_URL) console.warn('DATABASE_URL is not set; API requests will fail until Postgres is configured.');
export const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined });

export async function migrate() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const sql = await fs.readFile(path.join(here, 'migrations', '001_init.sql'), 'utf8');
  await pool.query(sql);
}
