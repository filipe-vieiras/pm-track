import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@shared/schema";
import path from "path";

const dbPath = path.resolve(process.cwd(), "data.db");
const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });

// Create tables if they don't exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    token TEXT NOT NULL UNIQUE,
    evaluator_token TEXT NOT NULL,
    evaluator_name TEXT NOT NULL,
    evaluator_email TEXT NOT NULL DEFAULT '',
    group_name TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS assessments (
    id TEXT PRIMARY KEY,
    group_id TEXT,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    scores TEXT NOT NULL,
    pillar_data TEXT NOT NULL,
    level_id TEXT NOT NULL,
    level_label TEXT NOT NULL,
    pct REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS evaluations (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL,
    assessment_id TEXT NOT NULL,
    evaluator_name TEXT NOT NULL,
    date TEXT NOT NULL,
    scores TEXT NOT NULL,
    pillar_data TEXT NOT NULL,
    level_id TEXT NOT NULL,
    level_label TEXT NOT NULL,
    pct REAL NOT NULL
  );
`);

// Migrations for existing databases
const migrations = [
  `ALTER TABLE assessments ADD COLUMN group_id TEXT`,
  `ALTER TABLE groups ADD COLUMN evaluator_token TEXT`,
  `ALTER TABLE groups ADD COLUMN evaluator_email TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE assessments ADD COLUMN pm_token TEXT NOT NULL DEFAULT ''`,
];
for (const m of migrations) {
  try { sqlite.exec(m); } catch (_) { /* column already exists */ }
}

// Fill evaluator_token for groups that don't have one yet
sqlite.exec(`UPDATE groups SET evaluator_token = token WHERE evaluator_token IS NULL OR evaluator_token = ''`);
