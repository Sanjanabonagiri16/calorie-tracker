import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { registerSchema } from "@/lib/validators";

export async function POST(req: NextRequest) {
  try {
    const body = registerSchema.parse(await req.json());
    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) {
      return jsonError("Email already registered", 409);
    }

    const user = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
        passwordHash: await hashPassword(body.password),
      },
      select: { id: true, email: true, name: true },
    });

    return jsonOk(
      {
        user,
        message: "Account created successfully. Please log in.",
      },
      201
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
