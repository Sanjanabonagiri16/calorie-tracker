import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { foodEntryUpdateSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const auth = requireAuth(req);
    const { id } = await params;
    const entry = await prisma.foodEntry.findFirst({
      where: { id, userId: auth.userId },
    });
    if (!entry) return jsonError("Meal not found", 404);
    return jsonOk({ entry });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const auth = requireAuth(req);
    const { id } = await params;
    const body = foodEntryUpdateSchema.parse(await req.json());

    const existing = await prisma.foodEntry.findFirst({
      where: { id, userId: auth.userId },
    });
    if (!existing) return jsonError("Meal not found", 404);

    const entry = await prisma.foodEntry.update({
      where: { id },
      data: {
        ...body,
        eatenAt: body.eatenAt ? new Date(body.eatenAt) : undefined,
      },
    });

    return jsonOk({ entry });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const auth = requireAuth(req);
    const { id } = await params;

    const existing = await prisma.foodEntry.findFirst({
      where: { id, userId: auth.userId },
    });
    if (!existing) return jsonError("Meal not found", 404);

    await prisma.foodEntry.delete({ where: { id } });
    return jsonOk({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
