import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { handleRouteError, jsonOk } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { id: true, email: true, name: true, createdAt: true },
    });
    return jsonOk({ user });
  } catch (error) {
    return handleRouteError(error);
  }
}
