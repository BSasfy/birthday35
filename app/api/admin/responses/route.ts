import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/admin-auth";
import { getAllResponses } from "@/lib/responses";

export async function GET() {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const responses = await getAllResponses();
  return NextResponse.json({ responses });
}
