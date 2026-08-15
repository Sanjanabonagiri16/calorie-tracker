import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { AI_MODEL, createAIClient, hasAIProvider } from "@/lib/ai";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { mealTypes } from "@/lib/validators";

const nutrient = z.coerce.number().nonnegative().catch(0);

const extractedSchema = z.object({
  name: z.string().min(1).catch("Scanned item"),
  quantity: z.coerce.number().positive().catch(1),
  unit: z.string().min(1).catch("serving"),
  mealType: z.enum(mealTypes).catch("SNACKS"),
  calories: nutrient,
  protein: nutrient,
  carbs: nutrient,
  fat: nutrient,
  fiber: nutrient,
  sugar: nutrient,
  sodium: nutrient,
  vitaminA: nutrient,
  vitaminC: nutrient,
  calcium: nutrient,
  iron: nutrient,
  confidence: z.coerce.number().min(0).max(1).nullish().transform((value) => value ?? 0),
  notes: z.string().nullish().transform((value) => value ?? ""),
});

function mockExtract(filename: string) {
  return {
    name: filename.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ") || "Scanned meal",
    quantity: 1,
    unit: "serving",
    mealType: "LUNCH" as const,
    calories: 420,
    protein: 28,
    carbs: 35,
    fat: 18,
    fiber: 6,
    sugar: 8,
    sodium: 520,
    vitaminA: 120,
    vitaminC: 15,
    calcium: 80,
    iron: 3,
    confidence: 0.55,
    notes: "Mock extraction (configure OpenRouter for real AI analysis).",
  };
}

export async function POST(req: NextRequest) {
  try {
    requireAuth(req);
    const form = await req.formData();
    const file = form.get("image");

    if (!(file instanceof File)) {
      return jsonError("image file is required", 400);
    }

    if (!file.type.startsWith("image/")) {
      return jsonError("Only image uploads are supported", 400);
    }

    if (!hasAIProvider()) {
      return jsonOk({
        extracted: mockExtract(file.name),
        provider: "mock",
      });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const base64 = bytes.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    const ai = createAIClient();
    const completion = await ai.chat.completions.create({
      model: AI_MODEL,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You extract nutrition data from food photos or nutrition labels. Return JSON with keys: name, quantity, unit, mealType (BREAKFAST|LUNCH|DINNER|SNACKS), calories, protein, carbs, fat, fiber, sugar, sodium, vitaminA, vitaminC, calcium, iron, confidence (0-1), notes. Estimate carefully when values are not explicit.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract calorie and nutrient information from this image.",
            },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    const extracted = extractedSchema.parse(JSON.parse(raw));

    return jsonOk({ extracted, provider: `openrouter:${AI_MODEL}` });
  } catch (error) {
    return handleRouteError(error);
  }
}
