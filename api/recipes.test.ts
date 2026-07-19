import { afterEach, describe, expect, it, vi } from "vitest";

const { generateRecipeOptions } = vi.hoisted(() => ({ generateRecipeOptions: vi.fn() }));

vi.mock("../server/recipeGeneration", () => ({ generateRecipeOptions }));

import handler from "./recipes";

type MockResponse = {
  headers: Record<string, string>;
  statusCode: number;
  body: unknown;
  response: {
    setHeader(name: string, value: string): void;
    status(code: number): unknown;
    json(body: unknown): void;
  };
};

function createResponse(): MockResponse {
  const state = {} as MockResponse;
  state.headers = {};
  state.statusCode = 200;
  state.body = undefined;
  const response = {
    setHeader(name: string, value: string) {
      state.headers[name] = value;
    },
    status(code: number) {
      state.statusCode = code;
      return response;
    },
    json(body: unknown) {
      state.body = body;
    },
  };
  state.response = response;
  return state;
}

const validRequest = {
  ingredients: ["Chicken breast", "Spinach"],
  healthGoals: ["High protein"],
  timeAvailable: "30 min",
};

describe("Vercel recipes API", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns JSON for unsupported HTTP methods", async () => {
    const state = createResponse();
    await handler({ method: "GET" }, state.response);

    expect(state.statusCode).toBe(405);
    expect(state.headers["content-type"]).toContain("application/json");
    expect(state.body).toEqual({ error: { code: "METHOD_NOT_ALLOWED", message: "Use POST for recipe generation." } });
  });

  it("returns JSON validation errors rather than an HTML fallback", async () => {
    const state = createResponse();
    await handler({ method: "POST", body: { ingredients: [] } }, state.response);

    expect(state.statusCode).toBe(400);
    expect(state.headers["content-type"]).toContain("application/json");
    expect(state.body).toMatchObject({ error: { code: "INVALID_RECIPE_REQUEST" } });
  });

  it("returns validated Gemini recipes as JSON", async () => {
    const generated = { recipes: [] };
    generateRecipeOptions.mockResolvedValue(generated);
    const state = createResponse();
    await handler({ method: "POST", body: JSON.stringify(validRequest) }, state.response);

    expect(generateRecipeOptions).toHaveBeenCalledWith(validRequest);
    expect(state.statusCode).toBe(200);
    expect(state.headers["content-type"]).toContain("application/json");
    expect(state.body).toBe(generated);
  });

  it("returns a JSON 429 when Gemini has no generation quota", async () => {
    generateRecipeOptions.mockRejectedValue(new Error("The configured Gemini key has no recipe-generation quota available yet."));
    const state = createResponse();
    await handler({ method: "POST", body: validRequest }, state.response);

    expect(state.statusCode).toBe(429);
    expect(state.body).toMatchObject({ error: { code: "GEMINI_QUOTA_EXHAUSTED" } });
  });
});
