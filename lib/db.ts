import { Pool } from '@neondatabase/serverless';

let pool: Pool;

function getPool(): Pool {
    if (!pool) {
        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL environment variable is not set on the server.');
        }
        pool = new Pool({ connectionString: process.env.DATABASE_URL });
    }
    return pool;
}


export async function sql(query: string, params: any[] = []) {
  const dbPool = getPool();
  let client;
  try {
    client = await dbPool.connect();
    const result = await client.query(query, params);
    return result;
  } finally {
    if (client) {
      client.release();
    }
  }
}