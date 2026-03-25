# ADR-0005 — Use Express.js as the API Backend

**Status:** accepted
**Date:** 2026-03-11

---

## Context

The app requires a backend server to:
- Proxy all AI API calls (keeping keys server-side)
- Serve TTS audio files and background music
- Apply rate limiting and security headers
- Host the marketing landing page
- Support optional features (voice chat, video generation) that require persistent state

Requirements:
- Runs on Node.js (TypeScript compatible)
- Simple to configure on Replit
- Supports both HTTP and SSE (Server-Sent Events) for streaming story generation
- Low operational complexity

---

## Decision

Use **Express.js v5** running on Node.js with TypeScript (via `tsx` in development, `esbuild` bundle in production) as the backend API server on port 5000.

The server is co-located with the Expo app in a monorepo structure. In development, both servers run concurrently. In production, the Express server serves the built Expo web bundle as static files and all API routes.

---

## Consequences

### Positive
- Mature, widely-understood framework with minimal boilerplate
- SSE support for streaming story generation (`/api/generate-story-stream`)
- Simple co-location with the Expo frontend in a single Replit workspace
- `tsx` enables TypeScript execution without a separate compile step in development
- Express v5 (RC) removes `express-async-errors` boilerplate for async route handlers

### Negative
- Single-instance architecture — not horizontally scalable without a session store
- In-memory rate limiter resets on restart (acceptable for current scale)
- Express v5 is still in release candidate status at time of adoption

### Neutral
- Server runs on port 5000; Expo dev proxy routes requests through the Replit domain
- `esbuild` bundles the server for production — externals (node_modules) are not bundled

---

## Alternatives Considered

| Option | Why Not Chosen |
|--------|---------------|
| Fastify | Less familiar; marginal performance benefit at current scale |
| Next.js API Routes | Couples backend to frontend deployment; no benefit for React Native app |
| Hono | Newer; less ecosystem maturity at time of decision |
| Serverless functions (Vercel/Netlify) | Stateless functions can't cache TTS audio files to disk; SSE support is limited |
| Bun HTTP | Not supported in Replit environment at time of decision |
