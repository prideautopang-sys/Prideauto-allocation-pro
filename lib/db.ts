import { Pool } from '@neondatabase/serverless';

let pool: Pool;

function getPool(): Pool {
    console.log('[DB] getPool called.');
    if (!pool) {
        console.log('[DB] Pool does not exist, creating new one.');
        if (!process.env.DATABASE_URL) {
            console.error('[DB] FATAL: DATABASE_URL environment variable is not set.');
            throw new Error('DATABASE_URL environment variable is not set on the server.');
        }
        try {
            pool = new Pool({ connectionString: process.env.DATABASE_URL });
            console.log('[DB] New pool created successfully.');
        } catch(e) {
            console.error('[DB] FATAL: Error creating new Pool.', e);
            throw e; // re-throw the error to be caught by the API handler
        }
    } else {
        console.log('[DB] Reusing existing pool.');
    }
    return pool;
}


export async function sql(query: string, params: any[] = []) {
  console.log('[DB] sql function invoked.');
  const dbPool = getPool();
  let client;
  try {
    console.log('[DB] Attempting to connect client from pool...');
    client = await dbPool.connect();
    console.log('[DB] Client connected successfully.');
    
    // Log a snippet of the query for debugging, but be mindful of sensitive data in a real production env
    console.log(`[DB] Executing query: ${query.substring(0, 100).replace(/\n/g, ' ')}...`);
    const result = await client.query(query, params);
    console.log('[DB] Query executed successfully.');
    return result;
  } catch (error) {
    console.error('[DB] Error during SQL execution (connect or query).', error);
    // Re-throw the error so the API handler's catch block can handle it and send a proper response.
    throw error;
  } finally {
    if (client) {
      console.log('[DB] Releasing client.');
      try {
        client.release();
        console.log('[DB] Client released successfully.');
      } catch (releaseError) {
        console.error('[DB] Error releasing database client:', releaseError);
      }
    }
  }
}