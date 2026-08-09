# Vercel Recipe Generation

The deployed browser detects a Vercel build and sends recipe-generation requests to `POST /api/recipes`. The Vercel serverless handler validates the request, calls `gemini-2.0-flash` server-side, and returns JSON for success, validation, method, quota, and provider-error paths.

Set `GEMINI_API_KEY` in the Vercel project environment for the target deployment environments. Do not expose this key as a `VITE_*` variable. Vercel builds the client with the `VERCEL` marker and serves the serverless handler from `api/recipes.ts`; local Manus development continues to use the existing tRPC route.

The project uses `pnpm build` and emits its Vite client build to `dist/public`. The committed `vercel.json` sets this output directory and allows the recipes serverless function up to 30 seconds.

## Account meal history

`/api/trpc/[trpc]` now exposes the same protected meal-log procedures used in local development. The browser forwards the active Supabase access token with its tRPC requests. The serverless context verifies that token with Supabase, maps the account to an internal user, and then persists completed cooks in the `meal_logs` table.

Set these values in the Vercel project for the same environments as the client build:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | MySQL/TiDB connection used by `meal_logs` and internal users. |
| `VITE_SUPABASE_URL` | Supabase project URL used by the browser and the serverless bearer-token verifier. |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key used by the browser and the serverless bearer-token verifier. |

The anonymous key is designed for browser distribution; keep service-role keys out of Vercel client variables. After configuring the database URL, deploy and sign in through the recipe app once before testing post-cook history.
