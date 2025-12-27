# Data Model: Database Schema

**Date**: December 23, 2025  
**Feature**: 002-managed-database

## Overview

This document defines the database schema that will be automatically bootstrapped when the database is created. The schema supports the Comprehend reading comprehension application with tables for users, exercises, tokens, vocabulary, and chat messages.

## Entities

### User

Represents a user in the system.

**Table**: `user`

**Fields**:

- `user_id` (UUID, PRIMARY KEY): Unique identifier for the user, auto-generated

**Relationships**:

- One-to-many with `exercise` (user can have multiple exercises)

**Constraints**:

- Primary key on `user_id`
- UUID generated via `gen_random_uuid()`

**Indexes**: None (single primary key lookup sufficient)

### Exercise

Represents a reading comprehension exercise created by a user.

**Table**: `exercise`

**Fields**:

- `exercise_id` (UUID, PRIMARY KEY): Unique identifier for the exercise, auto-generated
- `exercise_user_id` (UUID, NOT NULL, FOREIGN KEY): Reference to the user who created the exercise
- `title` (TEXT, NOT NULL): Title of the exercise
- `content` (TEXT, NOT NULL): Full text content of the exercise
- `language` (VARCHAR(10), NOT NULL): Language code (e.g., 'en', 'ja', 'zh')
- `created_at` (TIMESTAMP WITH TIME ZONE, DEFAULT NOW()): When the exercise was created
- `updated_at` (TIMESTAMP WITH TIME ZONE, DEFAULT NOW()): When the exercise was last modified
- `last_accessed_at` (TIMESTAMP WITH TIME ZONE, DEFAULT NOW()): When the exercise was last accessed
- `is_archived` (BOOLEAN, DEFAULT FALSE): Whether the exercise is archived

**Relationships**:

- Many-to-one with `user` (each exercise belongs to one user)
- One-to-many with `token` (exercise contains multiple tokens)
- One-to-many with `vocab` (exercise has multiple vocabulary entries)
- One-to-many with `chat_message` (exercise has multiple chat messages)

**Constraints**:

- Primary key on `exercise_id`
- Foreign key to `user(user_id)` with ON DELETE CASCADE
- NOT NULL constraints on required fields

**Indexes**:

- `idx_exercise_user_date`: Composite index on `(exercise_user_id, created_at DESC)` for efficient user exercise listing
- `idx_exercise_search`: GIN index on full-text search vector for title and content

### Token

Represents a tokenized segment of text within an exercise.

**Table**: `token`

**Fields**:

- `token_id` (UUID, PRIMARY KEY): Unique identifier for the token, auto-generated
- `token_exercise_id` (UUID, NOT NULL, FOREIGN KEY): Reference to the exercise containing this token
- `start_index` (INTEGER, NOT NULL): Starting character index in the exercise content
- `end_index` (INTEGER, NOT NULL): Ending character index in the exercise content
- `order` (INTEGER, NOT NULL): Sequential order of the token within the exercise

**Relationships**:

- Many-to-one with `exercise` (each token belongs to one exercise)
- Many-to-many with `vocab` (via `join_vocab_token`)

**Constraints**:

- Primary key on `token_id`
- Foreign key to `exercise(exercise_id)` with ON DELETE CASCADE
- NOT NULL constraints on all fields

**Indexes**:

- `idx_token_exercise_order`: Composite index on `(token_exercise_id, "order")` for efficient token retrieval in order

### Vocab

Represents a vocabulary entry (word/phrase with translation) extracted from an exercise.

**Table**: `vocab`

**Fields**:

- `vocab_id` (UUID, PRIMARY KEY): Unique identifier for the vocabulary entry, auto-generated
- `vocab_exercise_id` (UUID, NOT NULL, FOREIGN KEY): Reference to the exercise containing this vocabulary
- `vocab` (TEXT, NOT NULL): The vocabulary word or phrase
- `reading` (TEXT, NULLABLE): Phonetic reading (e.g., furigana for Japanese, pinyin for Chinese)
- `equivalent` (TEXT, NOT NULL): Translation or equivalent in user's language
- `excerpt_start_index` (INTEGER, NOT NULL): Starting character index of excerpt in exercise content
- `excerpt_end_index` (INTEGER, NOT NULL): Ending character index of excerpt in exercise content

**Relationships**:

- Many-to-one with `exercise` (each vocab entry belongs to one exercise)
- Many-to-many with `token` (via `join_vocab_token`)

**Constraints**:

- Primary key on `vocab_id`
- Foreign key to `exercise(exercise_id)` with ON DELETE CASCADE
- NOT NULL constraints on required fields

**Indexes**:

- `idx_vocab_exercise`: Index on `vocab_exercise_id` for efficient vocabulary lookup by exercise

### Join Table: vocab_token

Represents the many-to-many relationship between vocabulary entries and tokens.

**Table**: `join_vocab_token`

**Fields**:

- `join_vocab_token_vocab_id` (UUID, NOT NULL, FOREIGN KEY): Reference to vocabulary entry
- `join_vocab_token_token_id` (UUID, NOT NULL, FOREIGN KEY): Reference to token

**Relationships**:

- Many-to-one with `vocab`
- Many-to-one with `token`

**Constraints**:

- Composite primary key on `(join_vocab_token_vocab_id, join_vocab_token_token_id)`
- Foreign key to `vocab(vocab_id)` with ON DELETE CASCADE
- Foreign key to `token(token_id)` with ON DELETE CASCADE

**Indexes**: None (composite primary key sufficient)

### Chat Message

Represents a message in a conversation about an exercise (user questions, assistant responses).

**Table**: `chat_message`

**Fields**:

- `chat_message_id` (UUID, PRIMARY KEY): Unique identifier for the message, auto-generated
- `chat_message_exercise_id` (UUID, NOT NULL, FOREIGN KEY): Reference to the exercise this message is about
- `role` (VARCHAR(20), NOT NULL): Role of the message sender ('user' or 'assistant')
- `content` (TEXT, NOT NULL): Message content
- `created_at` (TIMESTAMP WITH TIME ZONE, DEFAULT NOW()): When the message was created

**Relationships**:

- Many-to-one with `exercise` (each message belongs to one exercise)

**Constraints**:

- Primary key on `chat_message_id`
- Foreign key to `exercise(exercise_id)` with ON DELETE CASCADE
- CHECK constraint: `role IN ('user', 'assistant')`
- NOT NULL constraints on all fields

**Indexes**:

- `idx_chat_exercise_date`: Composite index on `(chat_message_exercise_id, created_at)` for efficient message retrieval in chronological order

## Schema Relationships Diagram

```
user
  └── exercise (1:N)
      ├── token (1:N)
      ├── vocab (1:N)
      │   └── join_vocab_token (N:M with token)
      └── chat_message (1:N)
```

## Validation Rules

1. **Exercise Language**: Must be a valid language code (VARCHAR(10))
2. **Chat Message Role**: Must be either 'user' or 'assistant' (enforced by CHECK constraint)
3. **Token Indices**: `start_index` must be less than `end_index` (application-level validation)
4. **Vocab Excerpt Indices**: `excerpt_start_index` must be less than `excerpt_end_index` (application-level validation)
5. **Timestamps**: All timestamp fields use `TIMESTAMP WITH TIME ZONE` for proper timezone handling

## State Transitions

### Exercise Lifecycle

1. **Created**: `created_at` set, `is_archived = false`
2. **Updated**: `updated_at` updated when exercise content modified
3. **Accessed**: `last_accessed_at` updated when exercise viewed
4. **Archived**: `is_archived = true` (soft delete)

### Chat Message Flow

1. **User Message**: `role = 'user'`, `content` contains user question
2. **Assistant Response**: `role = 'assistant'`, `content` contains assistant response
3. Messages ordered by `created_at` for conversation history

## PostgreSQL Extensions

### pgroonga

**Purpose**: Full-text search for CJK (Chinese, Japanese, Korean) languages

**Installation**: `CREATE EXTENSION IF NOT EXISTS pgroonga;`

**Usage**: Enables proper text search for non-Latin scripts in exercise content and vocabulary

**Note**: Installed during bootstrap using master credentials (requires superuser)

## Bootstrap Sequence

1. Create all tables (user, exercise, token, vocab, join_vocab_token, chat_message)
2. Create all indexes
3. Create all foreign key constraints
4. Install pgroonga extension
5. Create IAM database user for service authentication
6. Test IAM connection

## Data Integrity

- **Cascade Deletes**: All child records (tokens, vocab, messages) are automatically deleted when parent exercise is deleted
- **Referential Integrity**: Foreign keys ensure data consistency
- **UUID Primary Keys**: Prevent ID collisions and provide globally unique identifiers
- **Timestamps**: All timestamps use timezone-aware types for accurate temporal queries
