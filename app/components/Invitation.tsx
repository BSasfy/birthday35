import { event } from "@/lib/event";
import type { GuestAccount, PartyMember } from "@/lib/guest-types";
import type { GuestResponse } from "@/lib/response-types";
import { RsvpFlow } from "./RsvpFlow";
import { SignOutButton } from "./SignOutButton";

type Props = {
  partyMembers: PartyMember[];
  accountGuest: Pick<GuestAccount, "menu">;
  existingResponse: GuestResponse | null;
};

function firstName(name: string): string {
  return name.split(" ")[0];
}

function formatInviteeNames(members: PartyMember[]): string {
  const names = members.map((member) => firstName(member.name));
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

export function Invitation({
  partyMembers,
  accountGuest,
  existingResponse,
}: Props) {
  const invitees = formatInviteeNames(partyMembers);

  return (
    <div className="invitation">
      <div className="invitation-header">
        <p className="invitation-eyebrow">You&apos;re invited</p>
        <SignOutButton />
      </div>
      <h1 className="invitation-title">
        {invitees}, celebrate my {event.age}th birthday with me!
      </h1>

      <div className="invitation-card">
        <dl className="invitation-details">
          <div className="detail-row">
            <dt>When</dt>
            <dd>
              {event.date}
              <span className="detail-muted"> · {event.time}</span>
            </dd>
          </div>
          <div className="detail-row">
            <dt>Where</dt>
            <dd>{event.location}</dd>
          </div>
          <div className="detail-row">
            <dt>Food</dt>
            <dd>{event.food}</dd>
          </div>
          <div className="detail-row">
            <dt>Dress</dt>
            <dd>{event.dressCode}</dd>
          </div>
          <div className="detail-row">
            <dt>Gifts</dt>
            <dd>{event.giftsNote}</dd>
          </div>
          <div className="detail-row">
            <dt>RSVP by</dt>
            <dd>{event.rsvpDeadline}</dd>
          </div>
        </dl>

        <p className="invitation-message">
          It wouldn&apos;t be the same without you. Let me know if you can make
          it and choose your meal below.
        </p>
      </div>

      <RsvpFlow
        partyMembers={partyMembers}
        accountGuest={accountGuest}
        existingResponse={existingResponse}
      />
    </div>
  );
}
