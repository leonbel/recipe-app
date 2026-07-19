import {
  RecipeGenerationInputSchema,
  RecipeGenerationResponseSchema,
  type RecipeGenerationInput,
  type RecipeGenerationResponse,
} from "@shared/recipe";

const VERCEL_RECIPES_ENDPOINT = "/api/recipes";

export function shouldUseVercelRecipeEndpoint(
  deploymentTarget = import.meta.env.VITE_DEPLOYMENT_TARGET,
  hostname = typeof window === "undefined" ? "" : window.location.hostname,
): boolean {
  return deploymentTarget === "vercel" || hostname.endsWith(".vercel.app");
}

function extractErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const error = (payload as { error?: unknown }).error;
  if (!error || typeof error !== "object") return null;
  const message = (error as { message?: unknown }).message;
  return typeof message === "string" ? message : null;
}

export async function generateRecipesOnVercel(input: RecipeGenerationInput): Promise<RecipeGenerationResponse> {
  const validatedInput = RecipeGenerationInputSchema.parse(input);
  let response: Response;

  try {
    response = await fetch(VERCEL_RECIPES_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(validatedInput),
    });
  } catch {
    throw new Error("We could not reach the recipe service. Please check your connection and try again.");
  }

  const contentType = response.headers.get("content-type") ?? "";
  const rawPayload = await response.text();
  let payload: unknown;
  try {
    payload = rawPayload ? JSON.parse(rawPayload) : null;
  } catch {
    throw new Error("The recipe service returned an unexpected response. Please try again.");
  }

  if (!contentType.includes("application/json")) {
    throw new Error("The recipe service returned an unexpected response. Please try again.");
  }

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload) ?? "We could not generate recipes right now. Please try again.");
  }

  return RecipeGenerationResponseSchema.parse(payload);
}
