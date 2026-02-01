/**
 * Run all database migrations in order against Supabase Postgres.
 * Requires DATABASE_URL in .env
 * 
 * Usage: npm run db:migrate:all
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'
import dotenv from 'dotenv'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const root = resolve(__dirname, '..')

dotenv.config({ path: resolve(root, '.env') })

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('❌ Missing DATABASE_URL in .env')
  console.error('Get it from: Supabase Dashboard > Project Settings > Database > Connection string (URI)')
  console.error('Add to .env: DATABASE_URL=postgresql://postgres.[REF]:[YOUR-PASSWORD]@...')
  process.exit(1)
}

// Migration files in order
const migrations = [
  'db/01_schema_fixes.sql',
  'db/03_bookings_columns.sql',
  'db/04_bookings_prd_snapshot.sql',
  'db/05_department_and_jsonb.sql',
  'db/06_department_rls.sql'
]

const client = new pg.Client({ connectionString: DATABASE_URL })

async function runMigrations() {
  try {
    await client.connect()
    console.log('✅ Connected to database\n')

    for (const migrationFile of migrations) {
      const filePath = resolve(root, migrationFile)
      let sql
      try {
        sql = readFileSync(filePath, 'utf8')
      } catch (e) {
        console.error(`❌ File not found: ${migrationFile}`)
        continue
      }

      console.log(`📄 Running ${migrationFile}...`)
      try {
        await client.query(sql)
        console.log(`✅ ${migrationFile} completed\n`)
      } catch (err) {
        console.error(`❌ ${migrationFile} failed:`, err.message)
        console.error('Stopping migrations.\n')
        process.exit(1)
      }
    }

    console.log('🎉 All migrations completed successfully!')
  } catch (err) {
    console.error('❌ Database connection failed:', err.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

runMigrations()
