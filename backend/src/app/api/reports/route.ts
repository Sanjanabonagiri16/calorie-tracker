import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { handleRouteError, jsonOk } from "@/lib/api";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dayKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    const { searchParams } = new URL(req.url);
    const days = Math.min(90, Math.max(1, Number(searchParams.get("days") || 7)));

    const to = new Date();
    const from = startOfDay(new Date(to.getTime() - (days - 1) * 24 * 60 * 60 * 1000));

    const [entries, goal] = await Promise.all([
      prisma.foodEntry.findMany({
        where: {
          userId: auth.userId,
          eatenAt: { gte: from, lte: to },
        },
        orderBy: { eatenAt: "asc" },
      }),
      prisma.goal.findFirst({
        where: { userId: auth.userId, isActive: true },
      }),
    ]);

    const byDay: Record<
      string,
      {
        date: string;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        fiber: number;
        sugar: number;
        sodium: number;
        vitaminA: number;
        vitaminC: number;
        calcium: number;
        iron: number;
      }
    > = {};

    for (let i = 0; i < days; i++) {
      const d = new Date(from.getTime() + i * 24 * 60 * 60 * 1000);
      const key = dayKey(d);
      byDay[key] = {
        date: key,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
        vitaminA: 0,
        vitaminC: 0,
        calcium: 0,
        iron: 0,
      };
    }

    for (const entry of entries) {
      const key = dayKey(entry.eatenAt);
      if (!byDay[key]) continue;
      byDay[key].calories += entry.calories;
      byDay[key].protein += entry.protein;
      byDay[key].carbs += entry.carbs;
      byDay[key].fat += entry.fat;
      byDay[key].fiber += entry.fiber;
      byDay[key].sugar += entry.sugar;
      byDay[key].sodium += entry.sodium;
      byDay[key].vitaminA += entry.vitaminA;
      byDay[key].vitaminC += entry.vitaminC;
      byDay[key].calcium += entry.calcium;
      byDay[key].iron += entry.iron;
    }

    const daily = Object.values(byDay);
    const totals = daily.reduce(
      (acc, day) => {
        acc.calories += day.calories;
        acc.protein += day.protein;
        acc.carbs += day.carbs;
        acc.fat += day.fat;
        acc.fiber += day.fiber;
        acc.sugar += day.sugar;
        acc.sodium += day.sodium;
        acc.vitaminA += day.vitaminA;
        acc.vitaminC += day.vitaminC;
        acc.calcium += day.calcium;
        acc.iron += day.iron;
        return acc;
      },
      {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
        vitaminA: 0,
        vitaminC: 0,
        calcium: 0,
        iron: 0,
      }
    );

    const goalVsActual = daily.map((day) => ({
      date: day.date,
      caloriesActual: Math.round(day.calories),
      caloriesGoal: goal?.dailyCalories ?? null,
      proteinActual: Math.round(day.protein),
      proteinGoal: goal?.proteinGrams ?? null,
      carbsActual: Math.round(day.carbs),
      carbsGoal: goal?.carbsGrams ?? null,
      fatActual: Math.round(day.fat),
      fatGoal: goal?.fatGrams ?? null,
    }));

    return jsonOk({
      range: { from: from.toISOString(), to: to.toISOString(), days },
      calorieTrend: daily.map((d) => ({
        date: d.date,
        calories: Math.round(d.calories),
      })),
      macroBreakdown: daily.map((d) => ({
        date: d.date,
        protein: Math.round(d.protein),
        carbs: Math.round(d.carbs),
        fat: Math.round(d.fat),
      })),
      micronutrientSummary: {
        fiber: Math.round(totals.fiber),
        sugar: Math.round(totals.sugar),
        sodium: Math.round(totals.sodium),
        vitaminA: Math.round(totals.vitaminA),
        vitaminC: Math.round(totals.vitaminC),
        calcium: Math.round(totals.calcium),
        iron: Math.round(totals.iron),
      },
      goalVsActual,
      activeGoal: goal,
      totals: {
        calories: Math.round(totals.calories),
        protein: Math.round(totals.protein),
        carbs: Math.round(totals.carbs),
        fat: Math.round(totals.fat),
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
