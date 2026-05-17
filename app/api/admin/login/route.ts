import { NextResponse } from "next/server";
import {
  createAdminSession,
  isAdminConfigured,
  verifyAdminPassword,
} from "@/lib/admin-auth";

export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "Admin access is not configured on this server." },
      { status: 503 },
    );
  }

  try {
    const { password } = (await request.json()) as { password?: string };

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Please enter the admin password." },
        { status: 400 },
      );
    }

    if (!verifyAdminPassword(password.trim())) {
      return NextResponse.json(
        { error: "Incorrect admin password." },
        { status: 401 },
      );
    }

    await createAdminSession();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Could not sign in." },
      { status: 500 },
    );
  }
}
