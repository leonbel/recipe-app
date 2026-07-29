# Vercel SPA Routing Sources

The production diagnosis confirmed that the Vercel project serves `/` and static assets correctly but returns `404 NOT_FOUND` for the client-side `/recipes` route. The documented remedy is a same-application rewrite in the root `vercel.json` file that sends unmatched client routes to the SPA entry point while leaving real files and functions available.

Vercel documents that rewrites are declared in `vercel.json`, route a request without changing the browser URL, and should be used for same-application routing when the framework does not provide server routing. [Vercel: Rewrites](https://vercel.com/docs/routing/rewrites).

The project configuration reference confirms that `vercel.json` controls build output, functions, and rewrites. [Vercel: Static Configuration with vercel.json](https://vercel.com/docs/project-configuration/vercel-json).
