import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { createContext } from "../../server/_core/context";
import { appRouter } from "../../server/routers";

/**
 * Vercel's Node request/response objects are Express-compatible. Keeping this
 * adapter at the API boundary lets the deployed SPA use the same protected
 * tRPC contracts as local development, including Supabase bearer auth.
 */
const trpcHandler = createExpressMiddleware({
  router: appRouter,
  createContext,
});

export default trpcHandler;
