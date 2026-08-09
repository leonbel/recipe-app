import { COOKIE_NAME } from "@shared/const";
import { MealLogInputSchema } from "@shared/mealLog";
import { RecipeGenerationInputSchema } from "@shared/recipe";
import { TRPCError } from "@trpc/server";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { createMealLog, listMealLogs } from "./db";
import { generateRecipeOptions } from "./recipeGeneration";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  recipes: router({
    generate: publicProcedure.input(RecipeGenerationInputSchema).mutation(async ({ input }) => {
      try {
        return await generateRecipeOptions(input);
      } catch (error) {
        console.error("[Recipe generation] Failed", error);
        const message = error instanceof Error ? error.message : "We could not generate recipes right now. Please try again.";
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message,
        });
      }
    }),
  }),

  meals: router({
    create: protectedProcedure.input(MealLogInputSchema).mutation(async ({ ctx, input }) => {
      try {
        return await createMealLog(ctx.user.id, input);
      } catch (error) {
        const message = error instanceof Error ? error.message : "We could not save that meal right now.";
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message });
      }
    }),
    list: protectedProcedure.query(async ({ ctx }) => {
      try {
        return await listMealLogs(ctx.user.id);
      } catch (error) {
        const message = error instanceof Error ? error.message : "We could not load meal history right now.";
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message });
      }
    }),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
