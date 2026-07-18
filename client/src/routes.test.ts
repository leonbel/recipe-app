import { describe, expect, it } from "vitest";
import { APP_ROUTES, ROUTE_DEFINITIONS, cookingPath, recipeDetailPath } from "./routes";

describe("application route registry", () => {
  it("contains every planned screen", () => {
    expect(ROUTE_DEFINITIONS.map(({ id }) => id)).toEqual([
      "capture",
      "login",
      "signup",
      "auth-callback",
      "results",
      "recipe-detail",
      "cooking",
      "history",
    ]);
  });

  it("keeps the capture screen at the application root", () => {
    expect(APP_ROUTES.capture).toBe("/");
  });

  it("builds encoded recipe detail and cooking URLs", () => {
    expect(recipeDetailPath("summer bowl")).toBe("/recipes/summer%20bowl");
    expect(cookingPath("summer bowl")).toBe("/recipes/summer%20bowl/cook");
  });
});
