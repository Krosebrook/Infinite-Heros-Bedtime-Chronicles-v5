# ADR-0002 — Multi-Provider AI Fallback Chain

**Status:** accepted
**Date:** 2026-03-11

---

## Context

Story generation, image generation, and setting suggestions all require AI model calls. A children's app must be highly available — a single AI provider outage or API key exhaustion would break the core user experience.

Requirements:
- Story generation must succeed even if one or two providers are down
- All AI provider keys must stay server-side (never exposed to the client)
- The system must be extensible to add new providers without changing calling code
- Cost should be minimized — cheaper/faster models preferred as primary

---

## Decision

Implement a **priority-based fallback chain** in `server/ai/index.ts` that routes all AI requests through providers in order until one succeeds:

1. **Gemini** (`gemini-2.5-flash`) — Primary. Fast, cost-efficient, strong instruction following.
2. **OpenAI** (`gpt-4o-mini`) — First fallback. Widely available.
3. **Anthropic Claude** (`claude-sonnet-4-6`) — Second fallback. Excellent story generation quality.
4. **OpenRouter** — Third fallback. Rotates between xAI Grok, Mistral, Cohere, Meta Llama.

For image generation: Gemini (`gemini-2.5-flash-image`) primary → OpenAI (`gpt-image-1`) fallback.

Route handlers call `server/ai/index.ts` and never interact with provider SDKs directly.

---

## Consequences

### Positive
- Highly resilient — up to 4 providers can fail before story generation breaks
- New providers can be added by creating a file in `server/ai/providers/` and inserting into the chain
- All API keys remain server-side — zero client exposure risk
- Cost-optimized: cheapest provider is tried first

### Negative
- Adds latency on fallback — each failed provider adds ~2–10s before trying the next
- Different providers may produce slightly different story quality and formatting
- Must maintain and test multiple provider integrations

### Neutral
- OpenRouter is itself a gateway — its reliability depends on the underlying model providers
- Response normalization is handled per-provider to ensure consistent output shape

---

## Alternatives Considered

| Option | Why Not Chosen |
|--------|---------------|
| Single provider (Gemini only) | No resilience; any outage breaks the app |
| Client-side AI calls | Exposes API keys; no fallback logic possible |
| Load balancing across providers | Random selection loses cost optimization priority |
| LiteLLM gateway | Additional infrastructure dependency; not supported in Replit environment |
