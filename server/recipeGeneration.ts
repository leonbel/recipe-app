import {
  buildRecipeGenerationPrompt,
  GEMINI_RECIPE_RESPONSE_SCHEMA,
  RECIPE_GENERATION_SYSTEM_PROMPT,
  RecipeGenerationInputSchema,
  RecipeGenerationResponseSchema,
  type RecipeGenerationInput,
  type RecipeGenerationResponse,
} from "../shared/recipe";

const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  promptFeedback?: { blockReason?: string };
};

function parseJsonResponse(value: string): unknown {
  const trimmed = value.trim();
  const withoutFence = trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  return JSON.parse(withoutFence);
}

export async function generateRecipeOptions(input: RecipeGenerationInput): Promise<RecipeGenerationResponse> {
  const validatedInput = RecipeGenerationInputSchema.parse(input);
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini recipe generation is not configured.");

  const response = await fetch(GEMINI_ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: RECIPE_GENERATION_SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: buildRecipeGenerationPrompt(validatedInput) }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: GEMINI_RECIPE_RESPONSE_SCHEMA,
        temperature: 0.7,
        maxOutputTokens: 8_192,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("[Recipe generation] Gemini request failed", response.status, body.slice(0, 800));
    if (response.status === 429) {
      throw new Error("The configured Gemini key has no recipe-generation quota available yet. Enable Gemini API billing or use a key with available quota, then try again.");
    }
    throw new Error("Gemini could not generate recipes right now.");
  }

  const payload = (await response.json()) as GeminiResponse;
  const content = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
  if (!content) {
    throw new Error(payload.promptFeedback?.blockReason ? "Gemini could not complete this recipe request." : "Gemini returned an empty recipe response.");
  }

  return RecipeGenerationResponseSchema.parse(parseJsonResponse(content));
}
