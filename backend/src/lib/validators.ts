import { z } from "zod";

export const mealTypes = ["BREAKFAST", "LUNCH", "DINNER", "SNACKS"] as const;

/** Emails are stored lowercase, so normalize before any lookup or insert. */
const emailField = z.preprocess(
  (value) => (typeof value === "string" ? value.trim().toLowerCase() : value),
  z.string().email()
);

export const registerSchema = z.object({
  email: emailField,
  name: z.string().trim().min(1).max(100),
  password: z.string().min(6).max(100),
});

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1),
});

export const goalSchema = z.object({
  dailyCalories: z.number().positive(),
  proteinGrams: z.number().nonnegative(),
  carbsGrams: z.number().nonnegative(),
  fatGrams: z.number().nonnegative(),
  weightGoalKg: z.number().positive().optional().nullable(),
});

export const foodEntrySchema = z.object({
  mealType: z.enum(mealTypes),
  name: z.string().min(1).max(200),
  quantity: z.number().positive().default(1),
  unit: z.string().min(1).max(40).default("serving"),
  calories: z.number().nonnegative(),
  protein: z.number().nonnegative().default(0),
  carbs: z.number().nonnegative().default(0),
  fat: z.number().nonnegative().default(0),
  fiber: z.number().nonnegative().default(0),
  sugar: z.number().nonnegative().default(0),
  sodium: z.number().nonnegative().default(0),
  vitaminA: z.number().nonnegative().default(0),
  vitaminC: z.number().nonnegative().default(0),
  calcium: z.number().nonnegative().default(0),
  iron: z.number().nonnegative().default(0),
  eatenAt: z.string().datetime().optional(),
  source: z.string().optional(),
});

// Keep update fields truly optional. Reusing `foodEntrySchema.partial()` would
// retain create-time defaults and overwrite omitted nutrients with zero.
export const foodEntryUpdateSchema = z
  .object({
    mealType: z.enum(mealTypes),
    name: z.string().min(1).max(200),
    quantity: z.number().positive(),
    unit: z.string().min(1).max(40),
    calories: z.number().nonnegative(),
    protein: z.number().nonnegative(),
    carbs: z.number().nonnegative(),
    fat: z.number().nonnegative(),
    fiber: z.number().nonnegative(),
    sugar: z.number().nonnegative(),
    sodium: z.number().nonnegative(),
    vitaminA: z.number().nonnegative(),
    vitaminC: z.number().nonnegative(),
    calcium: z.number().nonnegative(),
    iron: z.number().nonnegative(),
    eatenAt: z.string().datetime(),
    source: z.string(),
  })
  .partial()
  .refine(
    (changes) => Object.values(changes).some((value) => value !== undefined),
    "At least one meal field is required"
  );

export const chatSchema = z.object({
  message: z.string().min(1).max(2000),
});
