import { RecipeGenerationInputSchema } from "../shared/recipe";
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
 * Vercel serverless handler for live Gemini recipe generation. It deliberately
 * sends JSON for every method, validation, provider, and unexpected error path.
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
    const message = error instanceof Error ? error.message : "Recipe generation failed unexpectedly.";
    const quotaExhausted = /no recipe-generation quota/i.test(message);
    sendJson(response, quotaExhausted ? 429 : 502, {
      error: {
        code: quotaExhausted ? "GEMINI_QUOTA_EXHAUSTED" : "GEMINI_GENERATION_FAILED",
        message,
      },
    });
  }
}
