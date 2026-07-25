import { RecipeGenerationInputSchema } from "../shared/recipe";
import { createFallbackRecipeResponse } from "./mockRecipes";
import { generateRecipeOptions } from "../server/recipeGeneration";

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

  try {
    const recipes = await generateRecipeOptions(parsedInput.data);
    sendJson(response, 200, recipes);
  } catch (error) {
    console.warn("[Vercel recipe fallback] Gemini generation failed; returning mock recipes for UI testing.", error);
    sendJson(response, 200, createFallbackRecipeResponse());
  }
}
