import pg from "pg";

const url = process.env.DATABASE_URL;
console.log("Host being used:", url ? new URL(url).host : "DATABASE_URL NOT SET");

const pool = new pg.Pool({ connectionString: url });
try {
  const r = await pool.query("select now()");
  console.log("CONNECTED OK:", r.rows[0]);
} catch (e) {
  console.error("FAILED:", e.code, "-", e.message);
} finally {
  await pool.end();
}
