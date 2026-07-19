# Vercel Recipe Generation

The deployed browser detects a Vercel build and sends recipe-generation requests to `POST /api/recipes`. The Vercel serverless handler validates the request, calls `gemini-2.0-flash` server-side, and returns JSON for success, validation, method, quota, and provider-error paths.

Set `GEMINI_API_KEY` in the Vercel project environment for the target deployment environments. Do not expose this key as a `VITE_*` variable. Vercel builds the client with the `VERCEL` marker and serves the serverless handler from `api/recipes.ts`; local Manus development continues to use the existing tRPC route.

The project uses `pnpm build` and emits its Vite client build to `dist/public`. The committed `vercel.json` sets this output directory and allows the recipes serverless function up to 30 seconds.
