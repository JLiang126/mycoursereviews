import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { env } from '@/env.mjs';

import * as schema from './schema';

// For serverless/edge environments or hot-reloading Next.js dev server,
// prevent creating multiple connections in development.
const globalForDb = globalThis as unknown as {
    conn: postgres.Sql | undefined;
};

const conn = globalForDb.conn ?? postgres(env.DATABASE_URL);
if (env.NODE_ENV !== 'production') globalForDb.conn = conn;

export const db = drizzle(conn, {
    schema,
    logger: env.NODE_ENV === 'development',
});
