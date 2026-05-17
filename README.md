# T1Copilot
> The open source AI copilot for Type 1 diabetes.

Built by a T1D, for T1Ds. T1Copilot connects your Dexcom CGM, 
bloodwork, Apple Health, and fitness data into a multi-agent 
AI system that surfaces real insights, detects patterns, and 
helps you navigate your care.

Self-hosted. Bring your own data. Own everything.

## Features
- Real-time CGM data via Dexcom API
- Bloodwork and lab result tracking  
- Apple Health integration via iOS Shortcut
- Peloton and fitness data correlation
- Multi-agent AI analysis with LangGraph
- HITL (human-in-the-loop) approval for all recommendations
- Semantic memory with PGVector
- Next.js dashboard with real-time glucose display

## Architecture
- apps/web — Next.js 15 dashboard (deploy to Vercel)
- packages/agents — LangGraph orchestrator + specialist agents
- packages/db — Drizzle ORM with Turso (SQLite) and Neon (Postgres + PGVector)
- packages/mcp-clients — typed clients for Dexcom and Peloton MCP servers

## Self-hosting
(setup instructions coming)

## Tech Stack
TypeScript, Next.js 15, LangGraph.js, Drizzle ORM, 
Turso, Neon, PGVector, Tailwind CSS, shadcn/ui, 
Zod, Vitest, Playwright

## Medical Disclaimer
T1Copilot is not a medical device and does not provide 
medical advice. All insights are assistive only. 
You are the final authority on all health decisions. 
Bring your own data — your health data never touches 
our servers because we don't have any.
