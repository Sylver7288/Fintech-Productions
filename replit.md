# NovaPay

A full-stack personal banking mobile app (like Kuda) — register, log in, manage accounts, send money, track transactions, manage cards, and set savings goals.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxy at `/api`)
- `pnpm --filter @workspace/mobile run dev` — run the Expo mobile app (port 18115, proxy at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 (artifact: `artifacts/api-server`)
- Mobile: Expo / React Native (artifact: `artifacts/mobile`)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec in `lib/api-spec/openapi.yaml`)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/api-client-react/` — generated React Query hooks (run codegen to update)
- `lib/api-zod/` — generated Zod schemas for request/response validation
- `lib/db/src/schema/` — Drizzle table definitions (users, accounts, transactions, cards, savings)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/middlewares/auth.ts` — Bearer token auth middleware
- `artifacts/api-server/src/lib/tokens.ts` — in-memory token store
- `artifacts/mobile/app/` — Expo Router screens
- `artifacts/mobile/context/AuthContext.tsx` — auth state + token persistence
- `artifacts/mobile/constants/colors.ts` — design tokens (purple `#6C5CE7` primary theme)

## Architecture decisions

- **No JWT** — uses in-memory token store (`Map<token, userId>`) for simplicity. Tokens are lost on server restart (by design for dev); swap for a DB-backed session table for production.
- **Contract-first API** — OpenAPI spec defines the contract; Orval generates both the React Query hooks and Zod validation schemas from it. Never hand-write these files.
- **Seeded accounts on register** — new users get a current account with ₦71,700 balance, a virtual card, and 8 demo transactions so the app looks populated from first login.
- **Currency** — Nigerian Naira (₦ / NGN) throughout.
- **Numeric DB columns** — `balance` and `amount` fields are `numeric` in Postgres but always serialized as JS `number` in API responses (via `parseFloat`). The OpenAPI spec types them as `number`.

## Product

- **Auth**: register with name/email/phone/password; login; persistent session via AsyncStorage
- **Home dashboard**: total balance, monthly income/spend, quick actions, recent transactions
- **Transactions**: filterable list (All / Money In / Money Out), transaction detail screen
- **Transfer**: send money to any bank with amount, recipient, description
- **Cards**: view virtual cards, freeze/unfreeze
- **Savings goals**: create goals with emoji + color, track progress
- **Profile**: user info, KYC status, sign out

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after any change to `openapi.yaml` — the generated files in `lib/api-client-react` and `lib/api-zod` must stay in sync.
- The API server rebuilds from source on each `dev` start (esbuild). Cold start takes ~400ms.
- `pnpm run dev` at workspace root is intentionally absent. Start each artifact via its workflow.
- In the mobile app, `setBaseUrl` is called at module level in `app/_layout.tsx` using `EXPO_PUBLIC_DOMAIN`. On native, this must point to the proxy domain, not localhost.

## User preferences

- The application is branded for a Microfinance Bank (MFB) named **Novamoni** (replacing/rebranding the existing "NovaPay" references).


## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
