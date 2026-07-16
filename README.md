# T1Copilot
> The open source AI copilot for Type 1 diabetes.

Built by a T1D, for T1Ds. T1Copilot connects your Dexcom CGM,
bloodwork, Apple Health, and fitness data into an AI system that
surfaces real insights, detects patterns, and helps you navigate
your care.

Self-hosted. Bring your own data. Own everything.

## Features
- Real-time CGM data via Dexcom API
- Bloodwork and lab result tracking  
- Apple Health integration via iOS Shortcut
- Peloton and fitness data correlation
- Tool-based AI analysis with the Vercel AI SDK
- HITL (human-in-the-loop) approval for all recommendations
- Semantic memory with PGVector
- Next.js dashboard with real-time glucose display

## Architecture
- apps/web — Next.js 15 dashboard and AI SDK runtime (deploy to Vercel)
- apps/web/src/lib/agent-core.ts — `agentTools` and tool-based agent behavior
- packages/db — Drizzle ORM with Turso (SQLite) and Neon (Postgres + PGVector)
- packages/mcp-clients — typed clients for Dexcom and Peloton MCP servers

The request path uses the Vercel AI SDK's `streamText`/`generateText` APIs and `tool()` calls;
there is no agent graph in production. LangGraph was built for P3 and evaluated as the agent
runtime, then deliberately replaced by the AI SDK route for ship speed. The original implementation
is preserved at git tag `<TAG_NAME>`.

## Self-hosting
(setup instructions coming)

## Tech Stack
TypeScript, Next.js 15, Vercel AI SDK, Drizzle ORM,
Turso, Neon, PGVector, Tailwind CSS, shadcn/ui, 
Zod, Vitest, Playwright

## Medical Disclaimer
T1Copilot is not a medical device and does not provide 
medical advice. All insights are assistive only. 
You are the final authority on all health decisions. 
Bring your own data — your health data never touches 
our servers because we don't have any.
