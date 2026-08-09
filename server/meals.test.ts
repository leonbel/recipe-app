import { beforeEach, describe, expect, it, vi } from "vitest";

const { createMealLog, listMealLogs } = vi.hoisted(() => ({
  createMealLog: vi.fn(),
  listMealLogs: vi.fn(),
}));

vi.mock("./db", () => ({ createMealLog, listMealLogs }));

import { REVIEW_RECIPES } from "../client/src/lib/reviewRecipes";
import { appRouter } from "./routers";

const signedInContext = { req: {}, res: {}, user: { id: 42, role: "user" } } as never;
const signedOutContext = { req: {}, res: {}, user: null } as never;

describe("meal tRPC procedures", () => {
  beforeEach(() => vi.resetAllMocks());

  it("writes a validated meal log only for the authenticated user", async () => {
    createMealLog.mockResolvedValue({ id: 12, recipeName: REVIEW_RECIPES[0].name });
    const caller = appRouter.createCaller(signedInContext);
    const result = await caller.meals.create({ recipe: REVIEW_RECIPES[0], servings: 2, rating: 5, notes: "Would cook again." });

    expect(createMealLog).toHaveBeenCalledWith(42, expect.objectContaining({ servings: 2, rating: 5 }));
    expect(result).toEqual({ id: 12, recipeName: REVIEW_RECIPES[0].name });
  });

  it("returns only the authenticated user's history", async () => {
    listMealLogs.mockResolvedValue([{ id: 12, recipeName: REVIEW_RECIPES[0].name }]);
    const caller = appRouter.createCaller(signedInContext);

    await expect(caller.meals.list()).resolves.toEqual([{ id: 12, recipeName: REVIEW_RECIPES[0].name }]);
    expect(listMealLogs).toHaveBeenCalledWith(42);
  });

  it("rejects meal history requests without an authenticated user", async () => {
    const caller = appRouter.createCaller(signedOutContext);
    await expect(caller.meals.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
