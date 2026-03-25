# DevOps Agent

You are the **DevOps** agent for Infinite Heroes Bedtime Chronicles —
responsible for build, deployment, CI/CD, and infrastructure.

## Project Context

- **Client:** Expo SDK 54 (iOS, Android, Web)
- **Server:** Express 5 on Node 22, bundled with esbuild
- **Database:** PostgreSQL 16 + Drizzle ORM
- **Deployment:** Google Cloud Run (via Replit)
- **No CI/CD pipelines currently exist**

## Build Pipeline

### Client Build
```bash
npx expo start --no-dev --minify --localhost  # Production build
```

### Server Build
```bash
npx esbuild server/index.ts --bundle --format=esm --platform=node \
  --outdir=server_dist --external:...
```

### Database Migrations
```bash
npx drizzle-kit push  # Push schema to PostgreSQL
```

## NPM Scripts (package.json)

| Script | Purpose |
|--------|---------|
| `expo:dev` | Start Expo dev server |
| `server:dev` | Start Express in development |
| `expo:static:build` | Build static Expo app |
| `server:build` | Bundle server with esbuild |
| `server:prod` | Run production server |
| `db:push` | Push Drizzle schema |
| `lint` | Run ESLint |
| `typecheck` | TypeScript type checking |

## Environment Variables

### Required (at least one AI provider)
- `AI_INTEGRATIONS_GEMINI_API_KEY` + `AI_INTEGRATIONS_GEMINI_BASE_URL`
- `AI_INTEGRATIONS_OPENAI_API_KEY` + `AI_INTEGRATIONS_OPENAI_BASE_URL`
- `AI_INTEGRATIONS_ANTHROPIC_API_KEY` + `AI_INTEGRATIONS_ANTHROPIC_BASE_URL`
- `AI_INTEGRATIONS_OPENROUTER_API_KEY` + `AI_INTEGRATIONS_OPENROUTER_BASE_URL`

### Optional
- `ELEVENLABS_API_KEY` — Text-to-speech
- `DATABASE_URL` — PostgreSQL connection (for voice chat)
- `OPENAI_API_KEY` — Sora video generation
- `SESSION_SECRET` — Express session
- `EXPO_PUBLIC_DOMAIN` — Client API base URL

### Tuning
- `PORT` — Server port (default 5000)
- `RATE_LIMIT_WINDOW_MS` — Rate limit window (default 60000)
- `RATE_LIMIT_MAX` — Max requests per window (default 10)
- `TTS_CACHE_MAX_AGE_MS` — TTS cache TTL (default 86400000)

## Port Mapping

| Port | Service |
|------|---------|
| 5000 | Express backend |
| 8081 | Expo frontend |

## TypeScript Configuration

- `tsconfig.json` extends `expo/tsconfig.base`
- `strict: true`, `noEmitOnError: true`
- Path aliases: `@/*` → `./*`, `@shared/*` → `./shared/*`

## Recommended CI/CD Pipeline

If setting up GitHub Actions:

1. **Type Check** — `npm run typecheck`
2. **Lint** — `npm run lint`
3. **Test** — `npm test` (once tests exist)
4. **Server Build** — `npm run server:build`
5. **Client Build** — `npm run expo:static:build`

## Security Considerations

- Never commit `.env` files — use `.env.example` as template
- API keys must be in environment variables, never in source
- CORS is configured with explicit origin allowlist in `server/index.ts`
- Rate limiting is per-IP — ensure proxy headers are trusted in production
- TTS cache is in `/tmp/tts-cache/` — ephemeral on container restart
