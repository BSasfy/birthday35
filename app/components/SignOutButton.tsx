"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <button
      type="button"
      className="btn-ghost"
      onClick={handleSignOut}
      disabled={loading}
    >
      {loading ? "…" : "Sign out"}
    </button>
  );
}
