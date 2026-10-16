// One Postgres connection pool, created on first use so the build never
// needs a database.

import postgres from "postgres";

let pool: postgres.Sql | undefined;

export function sql(): postgres.Sql {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL não configurada");
    // prepare: false keeps it compatible with poolers such as Neon and Supabase.
    pool = postgres(url, { max: 5, prepare: false });
  }
  return pool;
}
