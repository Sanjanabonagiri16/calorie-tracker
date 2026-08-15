import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { handleRouteError, jsonOk, parsePagination } from "@/lib/api";
import { goalSchema } from "@/lib/validators";

export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePagination(searchParams);
    const activeOnly = searchParams.get("active") === "true";

    const where = {
      userId: auth.userId,
      ...(activeOnly ? { isActive: true } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.goal.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.goal.count({ where }),
    ]);

    return jsonOk({
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    const body = goalSchema.parse(await req.json());

    await prisma.goal.updateMany({
      where: { userId: auth.userId, isActive: true },
      data: { isActive: false },
    });

    const goal = await prisma.goal.create({
      data: {
        userId: auth.userId,
        dailyCalories: body.dailyCalories,
        proteinGrams: body.proteinGrams,
        carbsGrams: body.carbsGrams,
        fatGrams: body.fatGrams,
        weightGoalKg: body.weightGoalKg ?? null,
        isActive: true,
      },
    });

    return jsonOk({ goal });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(req: NextRequest) {
  return PUT(req);
}
