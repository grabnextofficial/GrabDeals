/**
 * D1 Database client — uses Cloudflare D1 binding directly on Pages.
 * Falls back to external Worker proxy for local development.
 *
 * On Cloudflare Pages: env.DB is bound via wrangler.toml [[d1_databases]]
 * Locally: set DB_API_SECRET + uses https://db-api.lurnx.workers.dev/
 */

import { getRequestContext } from '@cloudflare/next-on-pages'

function getDB(): D1Database | null {
  try {
    const ctx = getRequestContext()
    return (ctx?.env as any)?.DB ?? null
  } catch {
    return null
  }
}

// Helper: get env value from Cloudflare context (works on edge)
function getEnv(key: string): string | undefined {
  try {
    const ctx = getRequestContext()
    return (ctx?.env as any)?.[key] ?? process.env[key]
  } catch {
    return process.env[key]
  }
}

// External worker fallback (local dev)
const WORKER_URL = 'https://db-api.lurnx.workers.dev/'

async function executeQueryViaWorker(sql: string, params: any[] = []): Promise<any> {
  const secret = getEnv('DB_API_SECRET')
  if (!secret) throw new Error('Missing env: DB_API_SECRET')

  const response = await fetch(WORKER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql, params }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`DB Worker error ${response.status}: ${text}`)
  }

  const json: any = await response.json()
  if (json.error) throw new Error(`D1 query failed: ${json.error}`)

  const trimmed = sql.trim().toUpperCase()
  if (trimmed.startsWith('SELECT')) {
    return Array.isArray(json.results) ? json.results : []
  }
  return json.results ?? json
}

// Execute directly using D1 binding (Cloudflare Pages)
async function executeQueryViaD1(db: D1Database, sql: string, params: any[] = []): Promise<any> {
  const stmt = db.prepare(sql).bind(...params)
  const trimmed = sql.trim().toUpperCase()

  if (trimmed.startsWith('SELECT')) {
    const result = await stmt.all()
    return result.results ?? []
  } else {
    const result = await stmt.run()
    return result
  }
}

export async function executeQuery(sql: string, params: any[] = []): Promise<any> {
  const db = getDB()

  if (db) {
    // Running on Cloudflare Pages — use D1 binding directly
    return executeQueryViaD1(db, sql, params)
  } else {
    // Local dev fallback — use external worker proxy
    return executeQueryViaWorker(sql, params)
  }
}
