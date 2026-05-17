import type { MenuType } from "./meals";

export type PartyMember = {
  id: string;
  name: string;
  menu?: MenuType;
};

export type GuestAccount = {
  id: string;
  name: string;
  menu?: MenuType;
  /** Lets this guest optionally add one unnamed invitee (+1) at RSVP. */
  allowPlusOne?: boolean;
  partyMembers?: PartyMember[];
};

export function resolveMemberMenu(
  member: PartyMember,
  account: Pick<GuestAccount, "menu">,
): MenuType {
  return member.menu ?? account.menu ?? "adult";
}

export function getMealMembers(account: GuestAccount): PartyMember[] {
  if (account.partyMembers?.length) return account.partyMembers;
  return [{ id: account.id, name: account.name, menu: account.menu }];
}
