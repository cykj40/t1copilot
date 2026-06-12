ALTER TABLE "agent_insights" ADD COLUMN "embedding" vector(1536);--> statement-breakpoint
CREATE INDEX "agent_insights_embedding_idx" ON "agent_insights" USING hnsw ("embedding" vector_cosine_ops);