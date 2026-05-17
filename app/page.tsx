import { getSessionGuestId } from "@/lib/auth";
import { findGuestById, getMealMembers } from "@/lib/guests";
import { getResponseForGuest } from "@/lib/responses";
import { event } from "@/lib/event";
import { LoginForm } from "./components/LoginForm";
import { Invitation } from "./components/Invitation";

export default async function Home() {
  let guestName: string | null = null;
  let partyMembers: { id: string; name: string; menu?: "adult" | "kids" }[] =
    [];
  let accountGuest: { menu?: "adult" | "kids" } = {};
  let existingResponse = null;

  try {
    const guestId = await getSessionGuestId();
    if (guestId) {
      const guest = await findGuestById(guestId);
      if (guest) {
        guestName = guest.name;
        partyMembers = getMealMembers(guest);
        accountGuest = { menu: guest.menu };
        existingResponse = await getResponseForGuest(guestId);
      }
    }
  } catch {
    // SESSION_SECRET missing in dev — show login
  }

  return (
    <div className="page">
      <div className="page-glow" aria-hidden />
      <header className="site-header">
        <span className="site-mark">{event.age}</span>
        <span className="site-host">
          {event.hostName}&apos;s birthday party
        </span>
      </header>

      <main className="site-main">
        {guestName ? (
          <Invitation
            partyMembers={partyMembers}
            accountGuest={accountGuest}
            existingResponse={existingResponse}
          />
        ) : (
          <section className="gate">
            <h1 className="gate-title">A private invitation</h1>
            <p className="gate-lead">
              This celebration is for guests on the list. Enter the personal
              password from your invite to see your RSVP and choose your meal.
            </p>
            <LoginForm />
          </section>
        )}
      </main>

      <footer className="site-footer">
        <p>See you soon!</p>
      </footer>
    </div>
  );
}
