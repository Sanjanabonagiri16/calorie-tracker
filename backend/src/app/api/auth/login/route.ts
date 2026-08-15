import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken, verifyPassword } from "@/lib/auth";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { loginSchema } from "@/lib/validators";

export async function POST(req: NextRequest) {
  try {
    const body = loginSchema.parse(await req.json());
    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
      return jsonError("Invalid email or password", 401);
    }

    const token = signToken({ userId: user.id, email: user.email });
    return jsonOk({
      user: { id: user.id, email: user.email, name: user.name },
      token,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
