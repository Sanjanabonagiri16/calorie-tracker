import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { AI_MODEL, createAIClient, hasAIProvider } from "@/lib/ai";
import { handleRouteError, jsonOk, parsePagination } from "@/lib/api";
import {
  chatActionSchema,
  executeChatAction,
  type ActionResult,
} from "@/lib/chat-actions";
import { chatSchema, mealTypes } from "@/lib/validators";

const llmResponseSchema = z.object({
  reply: z.string().catch(""),
  actions: z.array(z.unknown()).max(5).catch([]),
});

function omitNullValues(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  return Object.fromEntries(
    Object.entries(value).filter(([, field]) => field !== null)
  );
}

/** Models commonly emit null for unknown optional nutrients; treat those as omitted. */
function normalizeActionCandidate(candidate: unknown) {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return candidate;
  }
  const action = candidate as Record<string, unknown>;
  if (action.type === "create_meal") {
    return { ...action, payload: omitNullValues(action.payload) };
  }
  if (
    action.type === "update_meal" &&
    action.payload &&
    typeof action.payload === "object" &&
    !Array.isArray(action.payload)
  ) {
    const payload = action.payload as Record<string, unknown>;
    return {
      ...action,
      payload: { ...payload, changes: omitNullValues(payload.changes) },
    };
  }
  return candidate;
}

async function getContext(userId: string) {
  const [goal, recentEntries, weekEntries, recentMessages] = await Promise.all([
    prisma.goal.findFirst({ where: { userId, isActive: true } }),
    prisma.foodEntry.findMany({
      where: { userId },
      orderBy: { eatenAt: "desc" },
      take: 10,
    }),
    prisma.foodEntry.findMany({
      where: {
        userId,
        eatenAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { role: true, content: true },
    }),
  ]);

  const weekly = weekEntries.reduce(
    (sum, entry) => ({
      calories: sum.calories + entry.calories,
      protein: sum.protein + entry.protein,
      carbs: sum.carbs + entry.carbs,
      fat: sum.fat + entry.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return {
    activeGoal: goal
      ? {
          dailyCalories: goal.dailyCalories,
          proteinGrams: goal.proteinGrams,
          carbsGrams: goal.carbsGrams,
          fatGrams: goal.fatGrams,
          weightGoalKg: goal.weightGoalKg,
        }
      : null,
    recentMeals: recentEntries.map((entry) => ({
      id: entry.id,
      name: entry.name,
      mealType: entry.mealType,
      quantity: entry.quantity,
      unit: entry.unit,
      calories: entry.calories,
      protein: entry.protein,
      carbs: entry.carbs,
      fat: entry.fat,
      eatenAt: entry.eatenAt.toISOString(),
    })),
    weekly: { ...weekly, mealCount: weekEntries.length },
    recentConversation: recentMessages.reverse(),
  };
}

function ruleBasedReply(message: string, ctx: Awaited<ReturnType<typeof getContext>>) {
  const lower = message.toLowerCase();
  if (lower.includes("goal")) {
    if (!ctx.activeGoal) return "You don't have an active goal yet.";
    return `Your active goals: ${ctx.activeGoal.dailyCalories} kcal, protein ${ctx.activeGoal.proteinGrams}g, carbs ${ctx.activeGoal.carbsGrams}g, fat ${ctx.activeGoal.fatGrams}g.`;
  }
  if (lower.includes("week") || lower.includes("summary")) {
    return `This week you logged ${ctx.weekly.mealCount} entries totaling about ${Math.round(ctx.weekly.calories)} calories.`;
  }
  if (lower.includes("log") || lower.includes("ate") || lower.includes("meal")) {
    return "AI actions are unavailable right now. You can still check goals and weekly summaries here.";
  }
  return `I can help with goals and weekly summaries. Recent entries: ${
    ctx.recentMeals.slice(0, 3).map((e) => e.name).join(", ") || "none yet"
  }.`;
}

export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePagination(searchParams);

    const where = { userId: auth.userId };
    const [items, total] = await Promise.all([
      prisma.chatMessage.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.chatMessage.count({ where }),
    ]);

    return jsonOk({
      items: items.reverse(),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    const body = chatSchema.parse(await req.json());
    const ctx = await getContext(auth.userId);

    await prisma.chatMessage.create({
      data: { userId: auth.userId, role: "user", content: body.message },
    });

    let reply = ruleBasedReply(body.message, ctx);
    const actionResults: ActionResult[] = [];

    if (hasAIProvider()) {
      const ai = createAIClient();
      const completion = await ai.chat.completions.create({
        model: AI_MODEL,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are Nourish, a nutrition assistant that can answer questions and operate a calorie-tracker app.

Always return valid JSON:
{
  "reply": "brief conversational response; never claim an action succeeded",
  "actions": [
    { "type": "action_name", "payload": {} }
  ]
}

Available actions:
- create_meal: payload has mealType (${mealTypes.join("|")}), name, quantity, unit, calories, protein, carbs, fat, fiber, sugar, sodium, vitaminA, vitaminC, calcium, iron, optional eatenAt ISO timestamp.
- update_meal: payload has mealId and changes (any create_meal fields). Use only IDs in recentMeals.
- delete_meal: payload has mealId. Use only when the user explicitly asks to delete/remove a meal, and only an ID in recentMeals.
- list_meals: payload may have mealType, from ISO datetime, to ISO datetime, and limit (1-20).
- set_goal: payload may contain dailyCalories, proteinGrams, carbsGrams, fatGrams, weightGoalKg. Preserve omitted values by omitting them.
- get_goal: empty payload.
- weekly_summary: empty payload.

Rules:
- Use actions for app operations instead of merely explaining how to use the UI.
- You may return multiple actions when the user clearly requests multiple operations.
- For general nutritional questions, answer in reply with no action.
- Never invent a meal ID. Resolve a meal name against recentMeals: when exactly one entry clearly matches, use its ID directly; ask only when zero or multiple entries plausibly match.
- When the user says they ate something, log it with create_meal in the same turn. Estimate the nutrients yourself from standard nutrition data for a typical portion; never ask the user to supply calorie or macro numbers. Say in reply that the figures are estimates they can edit.
- Ask for clarification only when the food itself cannot be identified (for example "I ate lunch" with no description). A named dish or ingredient list is always enough detail to estimate.
- Dates must be ISO 8601. Current time is ${new Date().toISOString()}.
- Health information is educational, not medical diagnosis.

Private user context:
${JSON.stringify(ctx)}`,
          },
          { role: "user", content: body.message },
        ],
      });

      const parsed = llmResponseSchema.parse(
        JSON.parse(completion.choices[0]?.message?.content || "{}")
      );
      reply = parsed.reply || "";

      for (const candidate of parsed.actions) {
        const action = chatActionSchema.safeParse(
          normalizeActionCandidate(candidate)
        );
        if (!action.success) {
          console.warn(
            "Invalid chat action",
            JSON.stringify(candidate),
            action.error.flatten()
          );
          actionResults.push({
            message: "I couldn't safely validate one requested action, so I skipped it.",
            dataChanged: false,
          });
          continue;
        }
        actionResults.push(await executeChatAction(auth.userId, action.data));
      }
    }

    const actionMessages = actionResults.map((result) => result.message);
    const content = [reply, ...actionMessages].filter(Boolean).join("\n\n");
    const assistant = await prisma.chatMessage.create({
      data: {
        userId: auth.userId,
        role: "assistant",
        content: content || "I couldn't complete that request. Please rephrase it.",
      },
    });

    return jsonOk({
      message: assistant,
      actions: actionResults,
      dataChanged: actionResults.some((result) => result.dataChanged),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
