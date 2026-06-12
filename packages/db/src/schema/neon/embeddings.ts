import { createId } from '@paralleldrive/cuid2'
import { customType, index, integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { labDocuments } from './labs.js'
import { researchCache } from './research.js'
import { users } from './users.js'

// pgvector column — requires CREATE EXTENSION IF NOT EXISTS vector; in Neon before migrating.
// IVFFlat indexes for ANN search must be created via raw SQL after migration:
//   CREATE INDEX ON glucose_embeddings USING ivfflat (embedding vector_cosine_ops);
export const vectorColumn = customType<{
  data: number[]
  driverData: string
  config: { dimensions: number }
}>({
  dataType(config) {
    const dim = config?.dimensions ?? 1536
    return `vector(${String(dim)})`
  },
  fromDriver(value: string): number[] {
    return value.slice(1, -1).split(',').map(Number)
  },
  toDriver(value: number[]): string {
    return `[${value.join(',')}]`
  },
})

interface GlucoseWindowMetadata {
  avgMgdl: number
  minMgdl: number
  maxMgdl: number
  trendDirection: string
  eventCount: number
  hasInsulin: boolean
  hasCarbs: boolean
  hasExercise: boolean
}

export const glucoseEmbeddings = pgTable(
  'glucose_embeddings',
  {
    id: text('id')
      .$defaultFn(() => createId())
      .primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    windowStart: timestamp('window_start', { withTimezone: true }).notNull(),
    windowEnd: timestamp('window_end', { withTimezone: true }).notNull(),
    embedding: vectorColumn('embedding', { dimensions: 1536 }).notNull(),
    metadata: jsonb('metadata').$type<GlucoseWindowMetadata>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index('glucose_embeddings_user_id_window_start_idx').on(table.userId, table.windowStart),
  ],
)

export type GlucoseEmbeddingRow = typeof glucoseEmbeddings.$inferSelect
export type NewGlucoseEmbeddingRow = typeof glucoseEmbeddings.$inferInsert

export const labEmbeddings = pgTable('lab_embeddings', {
  id: text('id')
    .$defaultFn(() => createId())
    .primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  labDocumentId: text('lab_document_id')
    .notNull()
    .references(() => labDocuments.id),
  chunkIndex: integer('chunk_index').notNull(),
  content: text('content').notNull(),
  embedding: vectorColumn('embedding', { dimensions: 1536 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
})

export type LabEmbeddingRow = typeof labEmbeddings.$inferSelect
export type NewLabEmbeddingRow = typeof labEmbeddings.$inferInsert

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
