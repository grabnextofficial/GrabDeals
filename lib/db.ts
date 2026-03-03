/**
 * D1 Database client via Cloudflare Worker proxy
 * Worker URL: https://db-api.lurnx.workers.dev/
 *
 * Required environment variable (set on Vercel):
 *   DB_API_SECRET  – the API_SECRET set on the Cloudflare Worker (env.API_SECRET)
 */

const WORKER_URL = 'https://db-api.lurnx.workers.dev/';

function getSecret() {
  const secret = process.env.DB_API_SECRET;
  if (!secret) throw new Error('Missing env: DB_API_SECRET');
  return secret;
}

export async function executeQuery(sql: string, params: any[] = []): Promise<any> {
  const secret = getSecret();

  const response = await fetch(WORKER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql, params }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`DB Worker error ${response.status}: ${text}`);
  }

  const json: any = await response.json();

  if (json.error) {
    throw new Error(`D1 query failed: ${json.error}`);
  }

  // Worker returns { results: [...] } for all queries
  const trimmed = sql.trim().toUpperCase();
  if (trimmed.startsWith('SELECT')) {
    return Array.isArray(json.results) ? json.results : [];
  }
  return json.results ?? json;
}
