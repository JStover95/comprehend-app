-- Database Schema for Comprehend Application
-- This schema is automatically bootstrapped when the database is first deployed
-- All operations use IF NOT EXISTS to ensure idempotency

-- Install pg_bigm extension for CJK full-text search
CREATE EXTENSION IF NOT EXISTS pg_bigm;

-- ==========================================
-- Tables
-- ==========================================

-- User table
CREATE TABLE IF NOT EXISTS "user" (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

-- Exercise table
CREATE TABLE IF NOT EXISTS exercise (
  exercise_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  language VARCHAR(10) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
  last_accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT fk_exercise_user FOREIGN KEY (exercise_user_id) REFERENCES "user"(user_id) ON DELETE CASCADE
);

-- Token table
CREATE TABLE IF NOT EXISTS token (
  token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_exercise_id UUID NOT NULL,
  start_index INTEGER NOT NULL,
  end_index INTEGER NOT NULL,
  "order" INTEGER NOT NULL,
  CONSTRAINT fk_token_exercise FOREIGN KEY (token_exercise_id) REFERENCES exercise(exercise_id) ON DELETE CASCADE
);

-- Vocab table
CREATE TABLE IF NOT EXISTS vocab (
  vocab_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vocab_exercise_id UUID NOT NULL,
  vocab TEXT NOT NULL,
  reading TEXT,
  equivalent TEXT NOT NULL,
  excerpt_start_index INTEGER NOT NULL,
  excerpt_end_index INTEGER NOT NULL,
  CONSTRAINT fk_vocab_exercise FOREIGN KEY (vocab_exercise_id) REFERENCES exercise(exercise_id) ON DELETE CASCADE
);

-- Join table for vocab_token many-to-many relationship
CREATE TABLE IF NOT EXISTS join_vocab_token (
  join_vocab_token_vocab_id UUID NOT NULL,
  join_vocab_token_token_id UUID NOT NULL,
  PRIMARY KEY (join_vocab_token_vocab_id, join_vocab_token_token_id),
  CONSTRAINT fk_join_vocab FOREIGN KEY (join_vocab_token_vocab_id) REFERENCES vocab(vocab_id) ON DELETE CASCADE,
  CONSTRAINT fk_join_token FOREIGN KEY (join_vocab_token_token_id) REFERENCES token(token_id) ON DELETE CASCADE
);

-- Chat message table
CREATE TABLE IF NOT EXISTS chat_message (
  chat_message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_message_exercise_id UUID NOT NULL,
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
  CONSTRAINT fk_chat_exercise FOREIGN KEY (chat_message_exercise_id) REFERENCES exercise(exercise_id) ON DELETE CASCADE,
  CONSTRAINT chk_chat_role CHECK (role IN ('user', 'assistant'))
);

-- ==========================================
-- Indexes
-- ==========================================

-- Exercise indexes
CREATE INDEX IF NOT EXISTS idx_exercise_user_date ON exercise(exercise_user_id, created_at DESC);
-- Note: Full-text search index (idx_exercise_search) would be created separately if using pg_bigm

-- Token indexes
CREATE INDEX IF NOT EXISTS idx_token_exercise_order ON token(token_exercise_id, "order");

-- Vocab indexes
CREATE INDEX IF NOT EXISTS idx_vocab_exercise ON vocab(vocab_exercise_id);

-- Chat message indexes
CREATE INDEX IF NOT EXISTS idx_chat_exercise_date ON chat_message(chat_message_exercise_id, created_at);

