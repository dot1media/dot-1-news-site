import { neon } from '@neondatabase/serverless';
import type { NeonQueryFunction } from '@neondatabase/serverless';

/**
 * Database layer — the SAME Neon Postgres the Dot 1 News app writes to.
 *
 * This is what makes the separated site stay in sync with the app: both
 * point DATABASE_URL at the same pooled Neon connection string, so the
 * site reads exactly the articles, photos, and videos the app publishes.
 * There is no sync code because there is nothing to sync — it is one
 * database with two readers.
 *
 * The site only ever READS. All writing (content generation, publishing,
 * email, subscriptions) stays with the app's project.
 */

let sqlInstance: NeonQueryFunction<false, false> | null = null;
let instanceUrl: string | null = null;

function resolveDatabaseUrl(): string {
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    '';
  if (!url) {
    throw new Error(
      'DATABASE_URL is not configured. Add the pooled Neon connection string ' +
      '(the same one the Dot 1 News app uses) to this project\u2019s Vercel ' +
      'environment variables, then redeploy. See .env.example.',
    );
  }
  return url;
}

function getDb(): NeonQueryFunction<false, false> {
  const url = resolveDatabaseUrl();
  if (!sqlInstance || instanceUrl !== url) {
    sqlInstance = neon(url, { fetchOptions: { cache: 'no-store' } });
    instanceUrl = url;
    const host = url.split('@')[1]?.split('/')[0] || 'unknown-host';
    const pooled = host.includes('-pooler');
    console.log(`\ud83d\uddc4\ufe0f  Neon (site) \u2192 ${host} (${pooled ? 'pooled \u2713' : 'UNPOOLED \u2014 use the pooled string'})`);
  }
  return sqlInstance;
}

export const sql = ((strings: TemplateStringsArray | string, ...values: any[]) => {
  try {
    const db = getDb();
    if (typeof strings === 'string') return (db as any)(strings, values[0], values[1]);
    return db(strings, ...values);
  } catch (error: any) {
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
}) as unknown as NeonQueryFunction<false, false>;
