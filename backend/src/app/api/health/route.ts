import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    service: "calorie-tracker-api",
    status: "ok",
    version: "1.0.0",
  });
}
