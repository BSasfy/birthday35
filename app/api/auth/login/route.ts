import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { findGuestByPassword } from "@/lib/guests";

export async function POST(request: Request) {
  try {
    const { password } = (await request.json()) as { password?: string };

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Please enter your personal password." },
        { status: 400 },
      );
    }

    const guest = await findGuestByPassword(password.trim());
    if (!guest) {
      return NextResponse.json(
        { error: "That password doesn’t match our guest list. Double-check your invite." },
        { status: 401 },
      );
    }

    await createSession(guest.id);

    return NextResponse.json({
      ok: true,
      name: guest.name,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
