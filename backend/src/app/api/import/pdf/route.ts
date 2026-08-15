import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { AI_MODEL, createAIClient, hasAIProvider } from "@/lib/ai";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { mealTypes } from "@/lib/validators";

type ParsedRow = {
  name: string;
  mealType: (typeof mealTypes)[number];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  quantity: number;
  unit: string;
  eatenAt: Date;
};

const aiRowSchema = z.object({
  entries: z.array(
    z.object({
      name: z.string().min(1),
      mealType: z.enum(mealTypes).catch("SNACKS"),
      calories: z.coerce.number().nonnegative(),
      protein: z.coerce.number().nonnegative().catch(0),
      carbs: z.coerce.number().nonnegative().catch(0),
      fat: z.coerce.number().nonnegative().catch(0),
      fiber: z.coerce.number().nonnegative().catch(0),
      sugar: z.coerce.number().nonnegative().catch(0),
      sodium: z.coerce.number().nonnegative().catch(0),
      quantity: z.coerce.number().positive().catch(1),
      unit: z.string().min(1).catch("serving"),
      eatenAt: z.string().optional(),
    })
  ),
});

function normalizeMealType(value: string): (typeof mealTypes)[number] {
  const v = value.toUpperCase();
  if (v.includes("BREAK")) return "BREAKFAST";
  if (v.includes("LUNCH")) return "LUNCH";
  if (v.includes("DINNER")) return "DINNER";
  return "SNACKS";
}

function parseDate(value: string) {
  const isoDate = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDate) {
    // Noon UTC keeps the calendar day stable across timezones.
    return new Date(`${isoDate[0]}T12:00:00.000Z`);
  }

  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime()) && /T|\d:\d/.test(value)) return direct;

  // Common diary formats: 15/08/2026, 08-15-2026
  const slash = value.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (slash) {
    const a = Number(slash[1]);
    const b = Number(slash[2]);
    const y = Number(slash[3].length === 2 ? `20${slash[3]}` : slash[3]);
    // Prefer day-first when day > 12; otherwise month-first.
    const dayFirst = a > 12;
    const month = dayFirst ? b : a;
    const day = dayFirst ? a : b;
    return new Date(Date.UTC(y, month - 1, day, 12, 0, 0));
  }

  return null;
}

/** Columns a diary export may contain, matched against its header labels. */
type ColumnField =
  | "date"
  | "mealType"
  | "name"
  | "quantity"
  | "unit"
  | "calories"
  | "protein"
  | "carbs"
  | "fat"
  | "fiber"
  | "sugar"
  | "sodium";

/*
 * Order matters: the first unclaimed field whose pattern matches wins, so
 * "meal type" is resolved before the looser food-name pattern can claim it.
 */
const COLUMN_MATCHERS: [ColumnField, RegExp][] = [
  ["mealType", /^(meal ?type|meal|category|slot)$/],
  ["date", /^(date|day|when|logged|eaten|timestamp)$/],
  ["name", /(food|item|name|description|dish|product)/],
  ["quantity", /^(quantity|qty|amount|serving|servings|portion|portions)$/],
  ["unit", /^(unit|units|measure|uom)$/],
  ["calories", /^(calorie|calories|kcal|cals|energy)$/],
  ["protein", /^protein/],
  ["carbs", /^(carb|carbs|carbohydrate|carbohydrates)/],
  ["fat", /^(fat|fats|total ?fat)/],
  ["fiber", /^(fiber|fibre)/],
  ["sugar", /^(sugar|sugars)/],
  ["sodium", /^(sodium|salt)/],
];

function splitColumns(line: string) {
  return line
    .split(/[,|\t]| {2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/** Strips units and punctuation so "Calories (kcal)" matches "calories". */
function normalizeHeaderLabel(label: string) {
  return label
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z ]/g, "")
    .trim();
}

/**
 * Maps a header row to column indexes. Returns null when the line doesn't look
 * like a header, so headerless diaries fall back to positional parsing.
 */
function detectHeader(parts: string[]): Partial<Record<ColumnField, number>> | null {
  const map: Partial<Record<ColumnField, number>> = {};

  parts.forEach((part, index) => {
    const label = normalizeHeaderLabel(part);
    if (!label) return;
    const match = COLUMN_MATCHERS.find(
      ([field, pattern]) => map[field] === undefined && pattern.test(label)
    );
    if (match) map[match[0]] = index;
  });

  // Name and calories are the minimum needed to build a usable entry.
  return map.name !== undefined && map.calories !== undefined ? map : null;
}

function toNumber(value: string | undefined, fallback = 0) {
  if (value === undefined) return fallback;
  const parsed = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildRow(
  parts: string[],
  columns: Partial<Record<ColumnField, number>>
): ParsedRow | null {
  const at = (field: ColumnField) => {
    const index = columns[field];
    return index === undefined ? undefined : parts[index];
  };

  const name = at("name")?.trim();
  if (!name) return null;

  const calories = toNumber(at("calories"), NaN);
  if (Number.isNaN(calories)) return null;

  const quantity = toNumber(at("quantity"), 1);
  const rawDate = at("date");

  return {
    name,
    mealType: normalizeMealType(at("mealType") || "SNACKS"),
    calories,
    protein: toNumber(at("protein")),
    carbs: toNumber(at("carbs")),
    fat: toNumber(at("fat")),
    fiber: toNumber(at("fiber")),
    sugar: toNumber(at("sugar")),
    sodium: toNumber(at("sodium")),
    quantity: quantity > 0 ? quantity : 1,
    unit: at("unit")?.trim() || "serving",
    eatenAt: (rawDate ? parseDate(rawDate) : null) ?? new Date(),
  };
}

/**
 * Column order varies between diary exports, so a header row is used to map
 * fields whenever one is present. Only headerless files fall back to the
 * documented date/mealType/name/calories/protein/carbs/fat ordering.
 */
function parseTabularText(text: string): ParsedRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const rows: ParsedRow[] = [];
  let columns: Partial<Record<ColumnField, number>> | null = null;

  for (const line of lines) {
    const parts = splitColumns(line);
    if (parts.length < 3) continue;

    if (!columns) {
      const header = detectHeader(parts);
      if (header) {
        columns = header;
        continue;
      }
    }

    if (columns) {
      const row = buildRow(parts, columns);
      if (row) rows.push(row);
      continue;
    }

    // Positional fallback: [date] mealType name calories protein carbs fat quantity
    if (parts.length < 4) continue;
    const maybeDate = parseDate(parts[0]);
    const offset = maybeDate ? 1 : 0;
    const name = parts[offset + 1];
    const calories = toNumber(parts[offset + 2], NaN);
    if (!name || Number.isNaN(calories)) continue;

    const quantity = toNumber(parts[offset + 6], 1);
    rows.push({
      name,
      mealType: normalizeMealType(parts[offset] || "SNACKS"),
      calories,
      protein: toNumber(parts[offset + 3]),
      carbs: toNumber(parts[offset + 4]),
      fat: toNumber(parts[offset + 5]),
      fiber: 0,
      sugar: 0,
      sodium: 0,
      quantity: quantity > 0 ? quantity : 1,
      unit: "serving",
      eatenAt: maybeDate ?? new Date(),
    });
  }

  return rows;
}

async function extractWithAI(text: string): Promise<ParsedRow[]> {
  if (!hasAIProvider()) return [];

  const ai = createAIClient();
  const completion = await ai.chat.completions.create({
    model: AI_MODEL,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `Extract food diary entries from messy PDF/CSV text into JSON:
{ "entries": [{ "name": string, "mealType": "BREAKFAST"|"LUNCH"|"DINNER"|"SNACKS", "calories": number, "protein": number, "carbs": number, "fat": number, "fiber": number, "sugar": number, "sodium": number, "quantity": number, "unit": string, "eatenAt": ISO8601 optional }] }
Skip headers and non-food lines. If a value is missing, use 0 (quantity defaults to 1, unit defaults to "serving"). Map column labels by meaning, not position.`,
      },
      {
        role: "user",
        content: `Diary text:\n${text.slice(0, 12000)}`,
      },
    ],
  });

  const parsed = aiRowSchema.parse(
    JSON.parse(completion.choices[0]?.message?.content || '{"entries":[]}')
  );

  return parsed.entries.map((entry) => ({
    name: entry.name,
    mealType: entry.mealType,
    calories: entry.calories,
    protein: entry.protein,
    carbs: entry.carbs,
    fat: entry.fat,
    fiber: entry.fiber,
    sugar: entry.sugar,
    sodium: entry.sodium,
    quantity: entry.quantity,
    unit: entry.unit,
    eatenAt: entry.eatenAt ? new Date(entry.eatenAt) : new Date(),
  }));
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return jsonError("PDF or text file is required", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let text = "";
    let source: "tabular" | "ai" = "tabular";

    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      try {
        const { PDFParse } = await import("pdf-parse");
        const parser = new PDFParse({ data: new Uint8Array(buffer) });
        const parsed = await parser.getText();
        text = parsed.text || "";
      } catch {
        return jsonError(
          "Could not read that PDF. Try re-exporting it or upload a CSV/TXT diary.",
          400
        );
      }
    } else {
      text = buffer.toString("utf8");
    }

    if (!text.trim()) {
      return jsonError(
        "No readable text found in the file. Image-only scanned PDFs need OCR export as text/CSV first.",
        400
      );
    }

    let rows = parseTabularText(text);
    if (rows.length === 0 && hasAIProvider()) {
      rows = await extractWithAI(text);
      source = "ai";
    }

    if (rows.length === 0) {
      return jsonError(
        "No meal rows found. Expected columns like: date, mealType, name, calories, protein, carbs, fat",
        400
      );
    }

    const created = await prisma.$transaction(
      rows.map((row) =>
        prisma.foodEntry.create({
          data: {
            userId: auth.userId,
            name: row.name,
            mealType: row.mealType,
            calories: row.calories,
            protein: row.protein,
            carbs: row.carbs,
            fat: row.fat,
            fiber: row.fiber,
            sugar: row.sugar,
            sodium: row.sodium,
            quantity: row.quantity,
            unit: row.unit,
            eatenAt: Number.isNaN(row.eatenAt.getTime()) ? new Date() : row.eatenAt,
            source: source === "ai" ? "pdf_import_ai" : "pdf_import",
          },
        })
      )
    );

    return jsonOk(
      {
        imported: created.length,
        items: created,
        parser: source,
      },
      201
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
