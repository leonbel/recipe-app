import { describe, expect, it } from "vitest";

const apiKey = process.env.GEMINI_API_KEY;
const modelId = "gemini-2.0-flash";

describe("Gemini project configuration", () => {
  it("authenticates a lightweight model metadata request for gemini-2.0-flash", async () => {
    expect(apiKey, "GEMINI_API_KEY must be configured").toBeTruthy();

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelId}`, {
      headers: { "x-goog-api-key": apiKey! },
    });

    expect(response.status).toBe(200);
    const model = (await response.json()) as { name?: string };
    expect(model.name).toContain(modelId);
  }, 15_000);
});
