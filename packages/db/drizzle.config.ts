import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is required. Set it to your PostgreSQL connection string.",
  );
}

export default defineConfig({
  // Plain relative path (forward slashes), resolved relative to this config
  // file. Building this with path.join() instead produces backslashes on
  // Windows, which breaks drizzle-kit's internal glob matching and causes
  // "No schema files found" even though the file exists.
  schema: "./src/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
