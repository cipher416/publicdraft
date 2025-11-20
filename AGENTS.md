# AGENTS.md

## Commands

- Build all: `bun run build`
- Lint all: `bun turbo lint` # (no package.json script yet)
- Typecheck all: `bun run check-types`
- Dev web: `bun run dev:web` (vite on :3001)
- Dev server: `bun run dev:server` (bun --hot)
- DB push: `bun run db:push`
- No tests yet; add vitest/jest to apps/web & server package.json when needed.

## Code Style

- TS strict; use `tsc --noEmit` or `tsc -b` for checks.
- Imports: Absolute `@/components/...` or `../hooks/...`; group by type.
- Naming: camelCase vars/functions, PascalCase components/routes.
- Components: shadcn/ui pattern (Tailwind, Radix, cva).
- Router: TanStack React Router file-based (`editor.$roomId.tsx`).
- Server: Elysia; derive schemas with Zod.
- No comments unless requested; mimic existing patterns (Yjs/Tiptap collab).
- Error handling: Redirect unauth to /login; use try/catch sparingly.
- Run `bun turbo lint && bun run check-types` after changes.

## TanStack Start Guidelines

- Full-stack React framework powered by TanStack Router (routing) and Vite (build tool).
- Key features: Full-document SSR, streaming, server functions (type-safe RPC), middleware, end-to-end type safety.
- Use for SSR/SSG apps; deploy to any Vite-compatible host.
- Limitations: No React Server Components yet (in progress).
- Quick Start: Follow [docs](https://tanstack.com/start/latest/docs/react/quick-start) for setup with Vite + Router.

### Routing (File-based)

- Directory: apps/web/src/routes/
- Root: \_\_root.tsx with createRootRoute({ head: meta/links, component: RootComponent() })
- Index: index.tsx or posts./ (trailing slash)
- Dynamic: posts.$postId.tsx (params.postId)
- Nested/Layout: parent component with <Outlet />
- Pathless layout: \_layout.tsx
- Server routes: routes/api/file.$.ts (handlers: { GET: ({params}) => Response })

### Component Structure

- RootDocument: <html><head><HeadContent /></head><body><nav with Link to='/' activeProps={{className:'font-bold'}} /><Outlet /><Scripts /></body></html>
- Links: import {Link} from '@tanstack/react-router'
- Loaders: async ({params}) => data; useLoaderData()
- Error/NotFound: errorComponent: () => <DefaultCatchBoundary />, notFoundComponent: () => <NotFound />
- Devtools: <TanStackRouterDevtools position='bottom-right' />
