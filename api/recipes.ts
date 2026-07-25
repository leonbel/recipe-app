import { RecipeGenerationInputSchema, type RecipeGenerationInput } from "../shared/recipe";
import { createFallbackRecipeResponse } from "./mockRecipes";

type VercelRequest = {
  method?: string;
  body?: unknown;
};

type VercelResponse = {
  setHeader(name: string, value: string): void;
  status(code: number): VercelResponse;
  json(body: unknown): void;
};

export const config = { maxDuration: 30 };

function sendJson(response: VercelResponse, status: number, body: unknown) {
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.setHeader("cache-control", "no-store");
  response.status(status).json(body);
}

function parseBody(body: unknown): unknown {
  if (typeof body !== "string") return body;
  try {
    return JSON.parse(body);
  } catch {
    return undefined;
  }
}

async function generateOrFallback(input: RecipeGenerationInput) {
  try {
    // Keep the Gemini module inside the protected boundary so a function-load
    // failure cannot bypass the successful mock-recipe response.
    const { generateRecipeOptions } = await import("../server/recipeGeneration");
    return await generateRecipeOptions(input);
  } catch {
    console.warn("[Vercel recipe fallback] Serving fixture recipes after an unavailable Gemini generation request.");
    return createFallbackRecipeResponse();
  }
}

/**
 * Vercel serverless handler for live Gemini recipe generation. It returns JSON
 * for every response path and supplies fixture recipes if Gemini is unavailable.
 */
export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "POST") {
    response.setHeader("allow", "POST");
    sendJson(response, 405, { error: { code: "METHOD_NOT_ALLOWED", message: "Use POST for recipe generation." } });
    return;
  }

  const parsedInput = RecipeGenerationInputSchema.safeParse(parseBody(request.body));
  if (!parsedInput.success) {
    sendJson(response, 400, {
      error: {
        code: "INVALID_RECIPE_REQUEST",
        message: "Provide at least one ingredient, one approved health goal, and a valid time option.",
      },
    });
    return;
  }

  const recipes = await generateOrFallback(parsedInput.data);
  sendJson(response, 200, recipes);
}
