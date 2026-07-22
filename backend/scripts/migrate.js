import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlDir = join(__dirname, '..', 'sql');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PROJECT_REF = SUPABASE_URL?.match(/https:\/\/(.+)\.supabase\.co/)?.[1];

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !PROJECT_REF) {
  console.error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env');
  process.exit(1);
}

const files = readdirSync(sqlDir)
  .filter(f => f.endsWith('.sql'))
  .sort();

async function execSQL(sql, label) {
  const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/sql`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[${label}] HTTP ${res.status}: ${text}`);
  }
  console.log(`  OK  ${label}`);
}

async function main() {
  console.log('Ejecutando migraciones SQL en Supabase...\n');
  for (const file of files) {
    const sql = readFileSync(join(sqlDir, file), 'utf-8');
    console.log(`→ ${file}`);
    try {
      await execSQL(sql, file);
    } catch (err) {
      if (err.message.includes('already exists') || err.message.includes('already')) {
        console.log(`  SKIP ${file} (ya existe)`);
        continue;
      }
      console.error(`  FAIL ${file}:`, err.message);
    }
  }
  console.log('\nMigraciones completadas.');
}

main().catch(console.error);
