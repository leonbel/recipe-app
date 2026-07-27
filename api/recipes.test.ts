import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import handler, { createFallbackRecipeResponse } from "./recipes";

type MockResponse = { headers: Record<string, string>; statusCode: number; body: unknown; response: { setHeader(name: string, value: string): void; status(code: number): unknown; json(body: unknown): void } };

function createResponse(): MockResponse {
  const state = {} as MockResponse;
  state.headers = {}; state.statusCode = 200; state.body = undefined;
  const response = { setHeader(name: string, value: string) { state.headers[name] = value; }, status(code: number) { state.statusCode = code; return response; }, json(body: unknown) { state.body = body; } };
  state.response = response;
  return state;
}

const validRequest = { ingredients: ["Chicken breast", "Spinach"], healthGoals: ["High protein"], timeAvailable: "30 min" };
const fallbackNames = ["Moroccan Chicken Tagine", "Spanish Chicken and Chickpea", "Tuscan Braised Chicken", "Indian Butter Chicken"];

describe("self-contained Vercel recipes API", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("has no runtime imports and exposes a self-contained fallback contract", () => {
    const source = readFileSync(new URL("./recipes.ts", import.meta.url), "utf8");
    expect(source).not.toMatch(/^\s*import\s/m);
    expect(source).not.toMatch(/\bimport\s*\(/);
    expect(createFallbackRecipeResponse().recipes.map((recipe) => recipe.name)).toEqual(fallbackNames);
  });

  it("returns JSON for unsupported methods and invalid requests", async () => {
    const methodState = createResponse();
    await handler({ method: "GET" }, methodState.response);
    expect(methodState.statusCode).toBe(405);
    expect(methodState.headers["content-type"]).toContain("application/json");

    const inputState = createResponse();
    await handler({ method: "POST", body: { ingredients: [] } }, inputState.response);
    expect(inputState.statusCode).toBe(400);
    expect(inputState.body).toMatchObject({ error: { code: "INVALID_RECIPE_REQUEST" } });
  });

  it("returns a successful JSON fallback for quota and provider failures", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("quota", { status: 429 }));
    vi.stubGlobal("fetch", fetchMock);
    const state = createResponse();
    await handler({ method: "POST", body: validRequest }, state.response);
    expect(state.statusCode).toBe(200);
    expect(state.headers["content-type"]).toContain("application/json");
    expect((state.body as { recipes: Array<{ name: string }> }).recipes.map((recipe) => recipe.name)).toEqual(fallbackNames);

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("provider unavailable")));
    const networkState = createResponse();
    await handler({ method: "POST", body: validRequest }, networkState.response);
    expect(networkState.statusCode).toBe(200);
    expect((networkState.body as { recipes: unknown[] }).recipes).toHaveLength(4);
  });
});
