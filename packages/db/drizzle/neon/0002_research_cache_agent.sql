ALTER TABLE "research_cache" DROP COLUMN IF EXISTS "source_title";--> statement-breakpoint
ALTER TABLE "research_cache" DROP COLUMN IF EXISTS "relevance_tags";--> statement-breakpoint
ALTER TABLE "research_cache" ALTER COLUMN "content" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "research_cache" ADD COLUMN "interaction_id" text;--> statement-breakpoint
ALTER TABLE "research_cache" ADD COLUMN "status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "research_cache" ADD COLUMN "embedding" vector(1536);--> statement-breakpoint
ALTER TABLE "research_cache" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
UPDATE "research_cache" SET "interaction_id" = 'legacy-' || "id" WHERE "interaction_id" IS NULL;--> statement-breakpoint
ALTER TABLE "research_cache" ALTER COLUMN "interaction_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "research_cache" ADD CONSTRAINT "research_cache_interaction_id_unique" UNIQUE("interaction_id");--> statement-breakpoint
CREATE INDEX "research_cache_embedding_idx" ON "research_cache" USING hnsw ("embedding" vector_cosine_ops);
