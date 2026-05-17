import { getSessionGuestId } from "@/lib/auth";
import { findGuestById, getMealMembers } from "@/lib/guests";
import { getResponseForGuest } from "@/lib/responses";
import { event } from "@/lib/event";
import { LoginForm } from "./components/LoginForm";
import { Invitation } from "./components/Invitation";

export default async function Home() {
  let guestName: string | null = null;
  let guestId: string | null = null;
  let partyMembers: { id: string; name: string; menu?: "adult" | "kids" }[] =
    [];
  let accountGuest: { menu?: "adult" | "kids" } = {};
  let allowPlusOne = false;
  let existingResponse = null;

  try {
    const sessionGuestId = await getSessionGuestId();
    if (sessionGuestId) {
      const guest = await findGuestById(sessionGuestId);
      if (guest) {
        guestName = guest.name;
        guestId = guest.id;
        partyMembers = getMealMembers(guest);
        accountGuest = { menu: guest.menu };
        allowPlusOne = guest.allowPlusOne === true;
        existingResponse = await getResponseForGuest(sessionGuestId);
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
        {guestName && guestId ? (
          <Invitation
            guestId={guestId}
            partyMembers={partyMembers}
            accountGuest={accountGuest}
            allowPlusOne={allowPlusOne}
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
