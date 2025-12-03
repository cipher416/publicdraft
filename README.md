# publicdraft — toy collaborative editor

A small playground that stitches together TanStack Router (React), Elysia (Bun), Yjs, and Tiptap to experiment with real-time shared documents. It’s intentionally lightweight and may change often.

## Quick start

```bash
bun install
bun run dev           # runs web on :3001 and API on :3000 via Turborepo
```

- Use a `.env` in `apps/server` for `DATABASE_URL` and any CORS origins; see `bun run db:push` to apply the Drizzle schema.
- Web assumes `VITE_SERVER_URL` when deployed; local dev talks to http://localhost:3000.

## What’s here

- apps/web: React + TanStack Router frontend with Tiptap collaborative editor.
- apps/server: Elysia API with Yjs websocket bridge and auth wiring.
- packages/db, api, auth: shared schema, RPC helpers, and auth config.

## Deploy (Railway gist)

Two services: server (Bun API) and static web. Railway configs live in `apps/*/railway.json`; there’s a root `railway.json` for one-shot deploys. After provisioning Postgres, run `bun run db:push` against the service, set `CORS_ORIGIN`/`VITE_SERVER_URL`, and redeploy.

## Notes

- Type checks: `bun run check-types`
- Build all: `bun run build`
- No tests yet; treat this as a demo sandbox, not production.
