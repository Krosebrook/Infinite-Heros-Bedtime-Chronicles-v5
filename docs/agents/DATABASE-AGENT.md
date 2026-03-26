<!-- Last verified: 2026-03-26 -->
# DATABASE-AGENT.md — Database & Schema Expert

Specialized agent context for all work touching PostgreSQL, Drizzle ORM, schema definitions, and database migrations.

---

## Domain Scope

This agent is authoritative for:
- `shared/schema.ts` — Drizzle ORM table definitions (re-exports from `shared/models/`)
- `shared/models/chat.ts` — `conversations` and `messages` tables
- `server/db.ts` — Drizzle ORM client initialization
- `server/storage.ts` — In-memory MemStorage for users (`User` / `InsertUser`)
- All Drizzle queries and schema migrations
- `drizzle.config.ts` — Drizzle Kit configuration

---

## Tech Stack

| Concern | Technology |
|---------|-----------|
| ORM | Drizzle ORM |
| Database | PostgreSQL |
| Migration tool | Drizzle Kit (`npm run db:push`) |
| Schema location | `shared/schema.ts`, `shared/models/chat.ts` |
| Client location | `server/db.ts` |

---

## Schema Files

### `shared/models/chat.ts` — Conversation tables

```typescript
// Canonical structure (do not modify without human review)
export const conversations = pgTable('conversations', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  title: text('title'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  conversationId: integer('conversation_id')
    .notNull()
    .references(() => conversations.id, { onDelete: 'cascade' }),
  role: text('role').notNull(),  // 'user' | 'assistant'
  content: text('content').notNull(),
  audioUrl: text('audio_url'),
  createdAt: timestamp('created_at').defaultNow(),
});
```

### `shared/schema.ts` — Re-exports

`shared/schema.ts` re-exports from `shared/models/chat.ts`. Both are referenced in `drizzle.config.ts`.

---

## Database Client (`server/db.ts`)

```typescript
// Always import from server/db.ts — never instantiate Drizzle elsewhere
import { db } from '@/server/db';
import { conversations, messages } from '@shared/schema';

// Example query
const userConversations = await db
  .select()
  .from(conversations)
  .where(eq(conversations.userId, userId))
  .orderBy(desc(conversations.updatedAt));
```

**Never** instantiate `drizzle()` directly in route handlers. Use `server/db.ts` exclusively.

---

## In-Memory Storage (`server/storage.ts`)

`server/storage.ts` implements `MemStorage` for user management (not story data). It is distinct from:
- `lib/storage.ts` — Client-side AsyncStorage helpers
- Server-side in-memory story cache

```typescript
// MemStorage interface
interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}
```

This class uses an in-memory `Map` — data does not persist across server restarts.

---

## Migration Workflow

```bash
# Apply schema changes to the target database
npm run db:push
# Requires DATABASE_URL env var to be set
```

**Before running a migration:**
1. Verify `DATABASE_URL` points to the correct environment.
2. Back up production data before applying to production.
3. Test the migration against a dev database first.
4. Schema changes to `shared/schema.ts` or `shared/models/chat.ts` require human review.

---

## When Database Is Required

The PostgreSQL database is **only required for voice chat** features. Core story functionality uses AsyncStorage (client) and in-memory cache (server) only.

Voice chat routes are conditionally registered:

```typescript
// server/routes.ts
if (process.env.AI_INTEGRATIONS_OPENAI_API_KEY &&
    process.env.AI_INTEGRATIONS_OPENAI_BASE_URL &&
    process.env.DATABASE_URL) {
  registerConversationRoutes(app);
}
```

---

## Voice Chat Route Reference

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/conversations` | List all conversations for user |
| `POST` | `/api/conversations` | Create new conversation |
| `GET` | `/api/conversations/:id` | Get conversation with message history |
| `DELETE` | `/api/conversations/:id` | Delete conversation (cascades to messages) |
| `POST` | `/api/conversations/:id/messages` | Send message in conversation |

---

## Adding a New Table

1. Create `shared/models/<name>.ts` following the `chat.ts` pattern.
2. Export the table from `shared/schema.ts`.
3. Verify `drizzle.config.ts` picks up the schema path.
4. Run `npm run db:push` against a dev database.
5. Update `docs/ARCHITECTURE.md` with the new table.
6. Flag for human review — schema changes affect production data.

---

## Drizzle Query Patterns

```typescript
// Select with filter
const result = await db.select()
  .from(conversations)
  .where(eq(conversations.userId, userId));

// Insert
const [newConvo] = await db.insert(conversations)
  .values({ userId, title })
  .returning();

// Update
await db.update(conversations)
  .set({ updatedAt: new Date() })
  .where(eq(conversations.id, id));

// Delete
await db.delete(messages)
  .where(eq(messages.conversationId, conversationId));

// Joins
const withMessages = await db.select()
  .from(conversations)
  .leftJoin(messages, eq(messages.conversationId, conversations.id))
  .where(eq(conversations.id, id));
```

---

## Environment Variables

```
DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

Required only for voice chat features. Not needed for core story app functionality.

---

## What This Agent Must Flag for Human Review

- Any change to `shared/schema.ts` or `shared/models/chat.ts` (affects production schema)
- Any migration that drops or renames columns
- Changes to cascade delete rules
- New database tables (require schema migration plan)
- Changes to `drizzle.config.ts`
- Any raw SQL queries (prefer Drizzle ORM type-safe builders)

---

## Related Agent Files

- [`BACKEND-API-AGENT.md`](./BACKEND-API-AGENT.md) — Route patterns using database
- [`AUDIO-TTS-AGENT.md`](./AUDIO-TTS-AGENT.md) — Voice chat features that use the database
- [`SECURITY-SAFETY-AGENT.md`](./SECURITY-SAFETY-AGENT.md) — Data access security
