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
