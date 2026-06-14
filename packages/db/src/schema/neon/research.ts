import { createId } from '@paralleldrive/cuid2'
import { index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { vectorColumn } from './embeddings.js'
import { users } from './users.js'

export const researchCache = pgTable(
  'research_cache',
  {
    id: text('id')
      .$defaultFn(() => createId())
      .primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    query: text('query').notNull(),
    interactionId: text('interaction_id').notNull().unique(),
    status: text('status').notNull().default('pending'),
    sourceUrl: text('source_url'),
    content: text('content'),
    agentSummary: text('agent_summary'),
    embedding: vectorColumn('embedding', { dimensions: 1536 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index('research_cache_embedding_idx').using('hnsw', table.embedding.op('vector_cosine_ops')),
  ],
)

export type ResearchCacheRow = typeof researchCache.$inferSelect
export type NewResearchCacheRow = typeof researchCache.$inferInsert

export const researchEmbeddings = pgTable('research_embeddings', {
  id: text('id')
    .$defaultFn(() => createId())
    .primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  researchCacheId: text('research_cache_id')
    .notNull()
    .references(() => researchCache.id),
  chunkIndex: integer('chunk_index').notNull(),
  content: text('content').notNull(),
  embedding: vectorColumn('embedding', { dimensions: 1536 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
})

export type ResearchEmbeddingRow = typeof researchEmbeddings.$inferSelect
export type NewResearchEmbeddingRow = typeof researchEmbeddings.$inferInsert
