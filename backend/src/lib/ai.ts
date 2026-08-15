import OpenAI from "openai";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

export const AI_MODEL =
  process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

export function hasAIProvider() {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

export function createAIClient() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  return new OpenAI({
    apiKey,
    baseURL: OPENROUTER_BASE_URL,
    defaultHeaders: {
      "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
      "X-Title": "Nourish Calorie Tracker",
    },
  });
}
