import { createId } from '@paralleldrive/cuid2'
import { boolean, index, jsonb, pgEnum, pgTable, real, text, timestamp } from 'drizzle-orm/pg-core'
import { vectorColumn } from './embeddings.js'
import { users } from './users.js'

export const agentIdEnum = pgEnum('agent_id', [
  'orchestrator',
  'glucose',
  'exercise',
  'modeling',
  'event_logger',
  'research',
  'insight',
])

export const insightTypeEnum = pgEnum('insight_type', [
  'pattern',
  'drift_alert',
  'hypo_risk',
  'dose_recommendation',
  'lab_flag',
  'weekly_summary',
  'appointment_prep',
])

export const agentInsights = pgTable(
  'agent_insights',
  {
    id: text('id')
      .$defaultFn(() => createId())
      .primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    agentId: agentIdEnum('agent_id').notNull(),
    insightType: insightTypeEnum('insight_type').notNull(),
    summary: text('summary').notNull(),
    detail: jsonb('detail').notNull(),
    confidence: real('confidence'),
    requiresApproval: boolean('requires_approval').notNull().default(true),
    approved: boolean('approved'),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    embedding: vectorColumn('embedding', { dimensions: 1536 }),
  },
  (table) => [
    index('agent_insights_embedding_idx').using('hnsw', table.embedding.op('vector_cosine_ops')),
  ],
)

export type AgentInsightRow = typeof agentInsights.$inferSelect
export type NewAgentInsightRow = typeof agentInsights.$inferInsert
