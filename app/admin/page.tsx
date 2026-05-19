import type { Metadata } from "next";
import { AdminDashboard } from "../components/AdminDashboard";
import { AdminLoginForm } from "../components/AdminLoginForm";
import { isAdminConfigured, isAdminSession } from "@/lib/admin-auth";
import { event } from "@/lib/event";
import {
  getPendingInvitees,
  loadGuests,
  type PendingInvitee,
} from "@/lib/guests";
import {
  getAllResponses,
  getResponsesStorage,
  type GuestResponse,
} from "@/lib/responses";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Host dashboard",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const configured = isAdminConfigured();
  let isAdmin = false;
  let responses: GuestResponse[] = [];
  let guestCount = 0;
  let pendingInvitees: PendingInvitee[] = [];
  let storage: "redis" | "file" = "file";

  if (configured) {
    try {
      isAdmin = await isAdminSession();
      if (isAdmin) {
        const guests = await loadGuests();
        responses = await getAllResponses();
        guestCount = guests.length;
        pendingInvitees = getPendingInvitees(guests, responses);
        storage = getResponsesStorage();
      }
    } catch {
      isAdmin = false;
    }
  }

  return (
    <div className="page">
      <div className="page-glow" aria-hidden />
      <header className="site-header">
        <span className="site-mark">{event.age}</span>
        <span className="site-host">Host dashboard</span>
      </header>

      <main className="site-main site-main--wide">
        {!configured ? (
          <section className="gate">
            <h1 className="gate-title">Admin not configured</h1>
            <p className="gate-lead">
              Set <code>ADMIN_PASSWORD</code> in your environment (at least 8
              characters), then redeploy or restart the dev server.
            </p>
          </section>
        ) : isAdmin ? (
          <AdminDashboard
            responses={responses}
            pendingInvitees={pendingInvitees}
            storage={storage}
            guestCount={guestCount}
          />
        ) : (
          <section className="gate">
            <h1 className="gate-title">Host dashboard</h1>
            <p className="gate-lead">
              Sign in to see every guest&apos;s RSVP and meal choices in one
              place.
            </p>
            <AdminLoginForm />
          </section>
        )}
      </main>
    </div>
  );
}
