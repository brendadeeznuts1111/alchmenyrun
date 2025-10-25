#!/usr/bin/env bun
/**
 * Initialize D1 database with migrations
 * Run this script before starting the dev server
 */

import { readFileSync } from "fs";
import { join } from "path";

async function initDatabase() {
  console.log("📦 Initializing D1 database...");

  // Read migration file
  const migrationPath = join(import.meta.dir, "../src/db/migrations/0000_init.sql");
  const migrationSQL = readFileSync(migrationPath, "utf-8");

  console.log("✅ Migration file loaded");
  console.log("\nTo apply migrations:");
  console.log("1. Run 'bun alchemy dev' to start local development");
  console.log("2. Or run 'bun alchemy deploy' to deploy and auto-migrate");
  
  console.log("\nMigration SQL:");
  console.log(migrationSQL);
}

initDatabase().catch(console.error);

