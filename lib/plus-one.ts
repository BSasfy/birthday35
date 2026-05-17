import type { GuestAccount, PartyMember } from "./guest-types";
import { getMealMembers } from "./guest-types";

export function plusOneMemberId(guestId: string): string {
  return `${guestId}-plus-one`;
}

export function isPlusOneMemberId(memberId: string): boolean {
  return memberId.endsWith("-plus-one");
}

export function allowsPlusOne(
  guest: Pick<GuestAccount, "allowPlusOne">,
): boolean {
  return guest.allowPlusOne === true;
}

export function buildMealMembers(
  guest: GuestAccount,
  options: { includePlusOne: boolean; plusOneName?: string },
): PartyMember[] {
  const base = getMealMembers(guest);
  if (!allowsPlusOne(guest) || !options.includePlusOne) {
    return base;
  }

  const name = options.plusOneName?.trim() || "Guest";
  return [
    ...base,
    { id: plusOneMemberId(guest.id), name, menu: "adult" as const },
  ];
}
