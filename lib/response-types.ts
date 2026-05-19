import type { MealChoices, MenuType } from "./meals";
import type { Attendance } from "./rsvp";

export type MemberMealChoices = MealChoices & {
  memberId: string;
  memberName: string;
  attending: boolean;
  menu?: MenuType;
};

export type GuestResponse = {
  guestId: string;
  guestName: string;
  attendance: Attendance;
  submittedAt: string;
  members?: MemberMealChoices[];
} & Partial<MealChoices>;

export function isPartyResponse(
  response: GuestResponse,
): response is GuestResponse & { members: MemberMealChoices[] } {
  return Array.isArray(response.members) && response.members.length > 0;
}

/** Attending members first; used on the host dashboard. */
export function sortPartyMembersForAdmin(
  members: MemberMealChoices[],
): MemberMealChoices[] {
  return [...members].sort((a, b) => {
    if (a.attending === b.attending) return 0;
    return a.attending ? -1 : 1;
  });
}
