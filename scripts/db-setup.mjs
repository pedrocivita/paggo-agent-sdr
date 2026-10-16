// Creates the tables if they do not exist. Runs before every build.
import { readFile } from "node:fs/promises";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.warn("db-setup: DATABASE_URL not set, skipping");
  process.exit(0);
}

const sql = postgres(url, { max: 1, prepare: false });
await sql.unsafe(await readFile(new URL("../db/schema.sql", import.meta.url), "utf8"));
await sql.end();
console.log("db-setup: schema ready");
