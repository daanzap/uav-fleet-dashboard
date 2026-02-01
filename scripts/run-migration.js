/**
 * Run a SQL migration file against the Supabase Postgres database.
 * Requires DATABASE_URL in .env (Supabase: Project Settings > Database > Connection string > URI).
 *
 * Usage: node scripts/run-migration.js db/03_bookings_columns.sql
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'
import dotenv from 'dotenv'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const root = resolve(__dirname, '..')

dotenv.config({ path: resolve(root, '.env') })

const migrationPath = process.argv[2]
if (!migrationPath) {
  console.error('Usage: node scripts/run-migration.js <path-to.sql>')
  console.error('Example: node scripts/run-migration.js db/03_bookings_columns.sql')
  process.exit(1)
}

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL in .env')
  console.error('Get it from: Supabase Dashboard > Project Settings > Database > Connection string (URI)')
  console.error('Add to .env: DATABASE_URL=postgresql://postgres.[REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres')
  process.exit(1)
}

const filePath = resolve(root, migrationPath)
let sql
try {
  sql = readFileSync(filePath, 'utf8')
} catch (e) {
  console.error('File not found:', filePath)
  process.exit(1)
}

const client = new pg.Client({ connectionString: DATABASE_URL })

async function run() {
  try {
    await client.connect()
    await client.query(sql)
    console.log('Migration ran successfully:', migrationPath)
  } catch (err) {
    console.error('Migration failed:', err.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

run()
