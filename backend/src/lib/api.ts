import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { AuthError } from "./auth";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

export function handleRouteError(error: unknown) {
  if (error instanceof AuthError) {
    return jsonError(error.message, error.status);
  }
  if (error instanceof ZodError) {
    return jsonError("Validation failed", 400, error.flatten());
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return jsonError("That value is already taken", 409);
    }
    if (error.code === "P2025") {
      return jsonError("Record not found", 404);
    }
  }
  console.error(error);
  return jsonError("Internal server error", 500);
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Builds an inclusive `eatenAt` range filter.
 *
 * A bare "YYYY-MM-DD" upper bound would otherwise resolve to midnight and
 * exclude the whole day it names, so date-only values are widened to the end
 * of that day. Unparseable values are ignored rather than throwing, keeping a
 * malformed query string from failing the whole request.
 */
export function parseDateRange(from: string | null, to: string | null) {
  const range: { gte?: Date; lte?: Date } = {};

  if (from) {
    const start = new Date(from);
    if (!Number.isNaN(start.getTime())) range.gte = start;
  }

  if (to) {
    const end = new Date(DATE_ONLY.test(to) ? `${to}T23:59:59.999Z` : to);
    if (!Number.isNaN(end.getTime())) range.lte = end;
  }

  return Object.keys(range).length > 0 ? range : undefined;
}

export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 20)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": process.env.FRONTEND_ORIGIN || "http://localhost:3000",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function withCors(response: NextResponse) {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}
