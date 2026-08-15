import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import {
  handleRouteError,
  jsonOk,
  parseDateRange,
  parsePagination,
} from "@/lib/api";
import { foodEntrySchema, mealTypes } from "@/lib/validators";

export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePagination(searchParams);

    const mealType = searchParams.get("mealType");

    const where: {
      userId: string;
      mealType?: string;
      eatenAt?: { gte?: Date; lte?: Date };
    } = { userId: auth.userId };

    if (mealType && mealTypes.includes(mealType as (typeof mealTypes)[number])) {
      where.mealType = mealType;
    }

    const eatenAt = parseDateRange(
      searchParams.get("from"),
      searchParams.get("to")
    );
    if (eatenAt) where.eatenAt = eatenAt;

    const [items, total] = await Promise.all([
      prisma.foodEntry.findMany({
        where,
        orderBy: { eatenAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.foodEntry.count({ where }),
    ]);

    return jsonOk({
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    const body = foodEntrySchema.parse(await req.json());

    const entry = await prisma.foodEntry.create({
      data: {
        userId: auth.userId,
        mealType: body.mealType,
        name: body.name,
        quantity: body.quantity,
        unit: body.unit,
        calories: body.calories,
        protein: body.protein,
        carbs: body.carbs,
        fat: body.fat,
        fiber: body.fiber,
        sugar: body.sugar,
        sodium: body.sodium,
        vitaminA: body.vitaminA,
        vitaminC: body.vitaminC,
        calcium: body.calcium,
        iron: body.iron,
        eatenAt: body.eatenAt ? new Date(body.eatenAt) : new Date(),
        source: body.source || "manual",
      },
    });

    return jsonOk({ entry }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
