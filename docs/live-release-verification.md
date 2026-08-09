# Live Release Verification

On 2026-08-09, the production alias `https://recipe-app-ten-lyart.vercel.app` was checked after GitHub commit `de0bfb44077c17e0d16e19bd536c16b7ba889b62` deployed successfully.

- `/recipes?review=design` loaded without a Vercel 404 and displayed four populated frosted recipe cards with Pollinations.ai food imagery.
- The **Harissa Chicken & Chickpeas** card opened `/recipes/harissa-chicken-chickpeas?review=design` successfully.
- The live detail route presented food imagery, dietary tags, the servings control, scaled ingredient quantities, the method, and the route into cooking mode.

The account-backed post-cook and meal-history flow requires the documented Vercel runtime values before a live signed-in acceptance test can be completed.
