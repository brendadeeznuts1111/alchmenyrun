-- Migration: Create users and files tables

CREATE TABLE IF NOT EXISTS "users" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "name" TEXT,
  "avatar_url" TEXT,
  "created_at" INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS "files" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "user_id" TEXT,
  "key" TEXT NOT NULL,
  "size" INTEGER,
  "content_type" TEXT,
  "uploaded_at" INTEGER NOT NULL,
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
);

CREATE INDEX IF NOT EXISTS "files_user_id_idx" ON "files"("user_id");

