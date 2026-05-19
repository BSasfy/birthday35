import bcrypt from "bcryptjs";
import { readFile } from "fs/promises";
import path from "path";
import type { GuestAccount } from "./guest-types";

export type { PartyMember } from "./guest-types";
export { getMealMembers, resolveMemberMenu } from "./guest-types";

export type PendingInvitee = {
  guestId: string;
  name: string;
  /** All invite names when this login covers a household party. */
  partyNames?: string[];
};

export function getPendingInvitees(
  guests: GuestAccount[],
  responses: { guestId: string }[],
): PendingInvitee[] {
  const responded = new Set(responses.map((r) => r.guestId));
  return guests
    .filter((guest) => !responded.has(guest.id))
    .map((guest) => ({
      guestId: guest.id,
      name: guest.name,
      partyNames:
        guest.partyMembers && guest.partyMembers.length > 1
          ? guest.partyMembers.map((member) => member.name)
          : undefined,
    }))
    .sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    );
}

const guestsPath = path.join(process.cwd(), "data", "guests.json");
const examplePath = path.join(process.cwd(), "data", "guests.example.json");

export type Guest = GuestAccount & {
  passwordHash: string;
};

async function readGuestsJson(): Promise<Guest[]> {
  const fromEnv = process.env.GUESTS_JSON?.trim();
  if (fromEnv) {
    return JSON.parse(fromEnv) as Guest[];
  }

  let raw: string;
  try {
    raw = await readFile(guestsPath, "utf-8");
  } catch {
    raw = await readFile(examplePath, "utf-8");
  }

  return JSON.parse(raw) as Guest[];
}

export async function loadGuests(): Promise<Guest[]> {
  return readGuestsJson();
}

export async function findGuestByPassword(
  password: string,
): Promise<Guest | null> {
  const guests = await loadGuests();
  for (const guest of guests) {
    const match = await bcrypt.compare(password, guest.passwordHash);
    if (match) return guest;
  }
  return null;
}

export async function findGuestById(id: string): Promise<Guest | null> {
  const guests = await loadGuests();
  return guests.find((g) => g.id === id) ?? null;
}
