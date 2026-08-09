# Live Release Verification

On 2026-08-09, the production alias `https://recipe-app-ten-lyart.vercel.app` was checked after GitHub commit `de0bfb44077c17e0d16e19bd536c16b7ba889b62` deployed successfully.

- `/recipes?review=design` loaded without a Vercel 404 and displayed four populated frosted recipe cards with Pollinations.ai food imagery.
- The **Harissa Chicken & Chickpeas** card opened `/recipes/harissa-chicken-chickpeas?review=design` successfully.
- The live detail route presented food imagery, dietary tags, the servings control, scaled ingredient quantities, the method, and the route into cooking mode.

The account-backed post-cook and meal-history flow requires the documented Vercel runtime values before a live signed-in acceptance test can be completed.

## Post-reconnection production check

After reconnecting the Vercel Git integration, commit `1cf1ca6` triggered a successful production deployment from the repaired source. The stable alias now returned HTTP 401 (rather than `FUNCTION_INVOCATION_FAILED`) for unauthenticated `GET /api/meals`, confirming that the self-contained protected endpoint is active.

The public capture route at `/` was also checked on the stable alias. It loaded the guest kitchen experience with ingredient entry, quick-add chips, all seven health-goal controls, all four time controls, and the recipe-discovery action.

The route map defines `/login`, not `/auth`. As expected, `/auth` returns a Vercel 404 because it is not an application route. The defined `/login` route loaded successfully with Google sign-in, email/password sign-in, signup, and guest access controls.

The protected `/history` route redirected an unauthenticated visitor to `/login?next=%2Fhistory`, preserving the intended destination for a signed-in account and avoiding any exposure of meal-history data.

The populated Harissa recipe’s live cooking route loaded successfully. Its timer-bearing third step displayed the 30-minute countdown with start and reset controls, confirming that the deployed detail-to-cooking flow and per-step timer UI are available on production.

## Serving deployment and remaining prerequisites

Vercel deployment `dpl_4WJHzRX8tiJKtVcyZtdhDcagEvEZ` reached the `READY` production state from GitHub commit `1cf1ca6d9e636229e32c373629f0dbe73136784a`. That no-code trigger commit follows repaired source commit `b5a2496`, so the three production aliases—including `recipe-app-ten-lyart.vercel.app`—serve the repaired source tree.

An HTTP deep-link sweep returned the application entry document for every defined client route: `/`, `/login`, `/signup`, `/auth/callback`, `/recipes`, `/recipes/:recipeId`, `/recipes/:recipeId/cook`, and `/history`.

| Remaining item | Why it remains external | Required action |
| --- | --- | --- |
| Live Google sign-in | Google provider configuration belongs to the Supabase project owner. | Enable the Google provider in Supabase Auth and set the approved redirect URLs. |
| Live Gemini recipes | The previously requested Gemini 2.0 Flash model has been shut down. | The owner approved migration to Gemini 3.6 Flash; live verification is pending deployment of that migration. Schema-valid fallback recipes remain available during the transition. |
| Signed-in meal save acceptance | Browser verification requires a real account session and deployed database environment. | Confirm `DATABASE_URL`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_ANON_KEY` are set in Vercel, then complete one cook while signed in and confirm it appears in history after a reload. |

### Gemini model migration

After the owner funded the existing paid Tier 1 Gemini billing account, a direct key test returned a 404 for `gemini-2.0-flash`, confirming that the failure was model retirement rather than billing configuration. Google lists Gemini 2.0 Flash as shut down on June 1, 2026 and identifies `gemini-3.6-flash` as its replacement. With the owner's approval, both recipe-generation entry points now use `gemini-3.6-flash` while retaining the existing structured response validation and schema-valid fallback path.[1]

A funded-key verification against `gemini-3.6-flash` returned HTTP 200 for a JSON-schema-constrained response, confirming that the approved successor supports the structured-output capability required by the recipe contract. Production deployment verification remains pending.

[1]: https://ai.google.dev/gemini-api/docs/deprecations
