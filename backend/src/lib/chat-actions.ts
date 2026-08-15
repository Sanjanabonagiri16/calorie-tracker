import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  foodEntrySchema,
  foodEntryUpdateSchema,
  goalSchema,
  mealTypes,
} from "@/lib/validators";

const mealTypeSchema = z.enum(mealTypes);

const partialGoalSchema = goalSchema.partial().refine(
  (goal) => Object.values(goal).some((value) => value !== undefined),
  "At least one goal value is required"
);

export const chatActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("create_meal"),
    payload: foodEntrySchema,
  }),
  z.object({
    type: z.literal("update_meal"),
    payload: z.object({
      mealId: z.string().min(1),
      changes: foodEntryUpdateSchema,
    }),
  }),
  z.object({
    type: z.literal("delete_meal"),
    payload: z.object({ mealId: z.string().min(1) }),
  }),
  z.object({
    type: z.literal("list_meals"),
    payload: z.object({
      mealType: mealTypeSchema.optional(),
      from: z.string().datetime().optional(),
      to: z.string().datetime().optional(),
      limit: z.coerce.number().int().min(1).max(20).default(10),
    }),
  }),
  z.object({
    type: z.literal("set_goal"),
    payload: partialGoalSchema,
  }),
  z.object({
    type: z.literal("get_goal"),
    payload: z.object({}).default({}),
  }),
  z.object({
    type: z.literal("weekly_summary"),
    payload: z.object({}).default({}),
  }),
]);

export type ChatAction = z.infer<typeof chatActionSchema>;

export type ActionResult = {
  message: string;
  dataChanged: boolean;
  entryId?: string;
};

function formatMeal(entry: {
  id: string;
  name: string;
  mealType: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  eatenAt: Date;
}) {
  const date = entry.eatenAt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  return `${entry.name} — ${Math.round(entry.calories)} kcal (${entry.mealType.toLowerCase()}, ${date}) [id: ${entry.id}]`;
}

export async function executeChatAction(
  userId: string,
  action: ChatAction
): Promise<ActionResult> {
  switch (action.type) {
    case "create_meal": {
      const meal = action.payload;
      const entry = await prisma.foodEntry.create({
        data: {
          userId,
          ...meal,
          eatenAt: meal.eatenAt ? new Date(meal.eatenAt) : new Date(),
          source: "chat",
        },
      });
      return {
        message: `Logged ${entry.name} (${Math.round(entry.calories)} kcal) under ${entry.mealType.toLowerCase()}.`,
        dataChanged: true,
        entryId: entry.id,
      };
    }

    case "update_meal": {
      const existing = await prisma.foodEntry.findFirst({
        where: { id: action.payload.mealId, userId },
      });
      if (!existing) {
        return { message: "I couldn't find that meal in your account.", dataChanged: false };
      }

      const { eatenAt, ...changes } = action.payload.changes;
      const entry = await prisma.foodEntry.update({
        where: { id: existing.id },
        data: {
          ...changes,
          eatenAt: eatenAt ? new Date(eatenAt) : undefined,
        },
      });
      return {
        message: `Updated ${entry.name}. It is now ${Math.round(entry.calories)} kcal.`,
        dataChanged: true,
        entryId: entry.id,
      };
    }

    case "delete_meal": {
      const existing = await prisma.foodEntry.findFirst({
        where: { id: action.payload.mealId, userId },
      });
      if (!existing) {
        return { message: "I couldn't find that meal in your account.", dataChanged: false };
      }
      await prisma.foodEntry.delete({ where: { id: existing.id } });
      return {
        message: `Deleted ${existing.name} from your meal log.`,
        dataChanged: true,
      };
    }

    case "list_meals": {
      const { mealType, from, to, limit } = action.payload;
      const entries = await prisma.foodEntry.findMany({
        where: {
          userId,
          ...(mealType ? { mealType } : {}),
          ...(from || to
            ? {
                eatenAt: {
                  ...(from ? { gte: new Date(from) } : {}),
                  ...(to ? { lte: new Date(to) } : {}),
                },
              }
            : {}),
        },
        orderBy: { eatenAt: "desc" },
        take: limit,
      });

      return {
        message:
          entries.length > 0
            ? `Your meals:\n${entries.map((entry) => `• ${formatMeal(entry)}`).join("\n")}`
            : "No meals matched that request.",
        dataChanged: false,
      };
    }

    case "set_goal": {
      const current = await prisma.goal.findFirst({
        where: { userId, isActive: true },
      });
      const next = action.payload;
      const dailyCalories = next.dailyCalories ?? current?.dailyCalories;

      if (!dailyCalories) {
        return {
          message: "Please include a daily calorie target when setting your first goal.",
          dataChanged: false,
        };
      }

      const goal = await prisma.$transaction(async (tx) => {
        await tx.goal.updateMany({
          where: { userId, isActive: true },
          data: { isActive: false },
        });
        return tx.goal.create({
          data: {
            userId,
            dailyCalories,
            proteinGrams: next.proteinGrams ?? current?.proteinGrams ?? 0,
            carbsGrams: next.carbsGrams ?? current?.carbsGrams ?? 0,
            fatGrams: next.fatGrams ?? current?.fatGrams ?? 0,
            weightGoalKg:
              next.weightGoalKg === undefined
                ? current?.weightGoalKg ?? null
                : next.weightGoalKg,
            isActive: true,
          },
        });
      });

      return {
        message: `Goals saved: ${goal.dailyCalories} kcal, ${goal.proteinGrams}g protein, ${goal.carbsGrams}g carbs, and ${goal.fatGrams}g fat${goal.weightGoalKg ? `, with a ${goal.weightGoalKg} kg weight goal` : ""}.`,
        dataChanged: true,
      };
    }

    case "get_goal": {
      const goal = await prisma.goal.findFirst({
        where: { userId, isActive: true },
      });
      return {
        message: goal
          ? `Your active goals are ${goal.dailyCalories} kcal, ${goal.proteinGrams}g protein, ${goal.carbsGrams}g carbs, and ${goal.fatGrams}g fat${goal.weightGoalKg ? `, with a ${goal.weightGoalKg} kg weight goal` : ""}.`
          : "You don't have an active goal yet. Tell me your daily calorie target to create one.",
        dataChanged: false,
      };
    }

    case "weekly_summary": {
      const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const entries = await prisma.foodEntry.findMany({
        where: { userId, eatenAt: { gte: from } },
      });
      const totals = entries.reduce(
        (sum, entry) => ({
          calories: sum.calories + entry.calories,
          protein: sum.protein + entry.protein,
          carbs: sum.carbs + entry.carbs,
          fat: sum.fat + entry.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );
      const days = 7;
      return {
        message:
          entries.length > 0
            ? `Over the last 7 days you logged ${entries.length} meals totaling ${Math.round(totals.calories)} kcal. Daily average: ${Math.round(totals.calories / days)} kcal. Macros: ${Math.round(totals.protein)}g protein, ${Math.round(totals.carbs)}g carbs, and ${Math.round(totals.fat)}g fat.`
            : "You haven't logged any meals in the last 7 days.",
        dataChanged: false,
      };
    }
  }
}
