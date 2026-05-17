import { NextResponse } from "next/server";
import { getSessionGuestId } from "@/lib/auth";
import {
  findGuestById,
  getMealMembers,
  resolveMemberMenu,
  type Guest,
  type PartyMember,
} from "@/lib/guests";
import {
  fixedDessert,
  getMenuOptions,
  type MealChoices,
  type MenuType,
} from "@/lib/meals";
import {
  getResponseForGuest,
  saveResponse,
  type MemberMealChoices,
} from "@/lib/responses";
import { allowsPlusOne, isPlusOneMemberId, plusOneMemberId } from "@/lib/plus-one";
import { isAttendance, type Attendance } from "@/lib/rsvp";

function isValidChoice(
  value: unknown,
  options: readonly { id: string }[],
): value is string {
  return (
    typeof value === "string" &&
    options.some((option) => option.id === value)
  );
}

function parseMemberMealFields(
  source: Record<string, unknown>,
  menu: MenuType,
): MealChoices | null {
  const options = getMenuOptions(menu);

  if (!isValidChoice(source.main, options.main)) {
    return null;
  }

  if (menu === "kids") {
    if (!isValidChoice(source.dessert, options.dessert)) {
      return null;
    }
  }

  return {
    main: source.main,
    dessert:
      menu === "kids"
        ? (source.dessert as string)
        : fixedDessert.id,
    dietaryNotes:
      typeof source.dietaryNotes === "string"
        ? source.dietaryNotes.slice(0, 500)
        : "",
    allergies:
      typeof source.allergies === "string" ? source.allergies.slice(0, 500) : "",
  };
}

function validateSingleMealChoices(
  body: Record<string, unknown>,
  guest: Guest,
): (MealChoices & { menu: MenuType }) | null {
  const member = getMealMembers(guest)[0];
  const menu = resolveMemberMenu(member, guest);
  const fields = parseMemberMealFields(body, menu);
  if (!fields) return null;
  return { ...fields, menu };
}

function validatePartyMealChoices(
  body: Record<string, unknown>,
  partyMembers: PartyMember[],
  guest: Guest,
): MemberMealChoices[] | null {
  if (!Array.isArray(body.members)) return null;

  const results: MemberMealChoices[] = [];
  let attendingCount = 0;

  for (const member of partyMembers) {
    const entry = body.members.find(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        "memberId" in item &&
        item.memberId === member.id,
    ) as Record<string, unknown> | undefined;

    if (!entry) return null;

    const attending = entry.attending !== false;
    const menu = resolveMemberMenu(member, guest);

    if (!attending) {
      results.push({
        memberId: member.id,
        memberName: member.name,
        attending: false,
        menu,
        main: "",
        dessert: "",
        dietaryNotes: "",
        allergies: "",
      });
      continue;
    }

    attendingCount += 1;
    const fields = parseMemberMealFields(entry, menu);
    if (!fields) return null;

    results.push({
      memberId: member.id,
      memberName: member.name,
      attending: true,
      menu,
      ...fields,
    });
  }

  if (results.length !== partyMembers.length || attendingCount === 0) {
    return null;
  }

  return results;
}

function validatePlusOneMealChoices(
  body: Record<string, unknown>,
  guest: Guest,
): MemberMealChoices[] | null {
  if (!Array.isArray(body.members)) return null;

  const primary = getMealMembers(guest)[0];
  const plusId = plusOneMemberId(guest.id);

  const primaryEntry = body.members.find(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      "memberId" in item &&
      item.memberId === primary.id,
  ) as Record<string, unknown> | undefined;

  if (!primaryEntry || primaryEntry.attending === false) return null;

  const primaryMenu = resolveMemberMenu(primary, guest);
  const primaryFields = parseMemberMealFields(primaryEntry, primaryMenu);
  if (!primaryFields) return null;

  const results: MemberMealChoices[] = [
    {
      memberId: primary.id,
      memberName: primary.name,
      attending: true,
      menu: primaryMenu,
      ...primaryFields,
    },
  ];

  const plusEntry = body.members.find(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      "memberId" in item &&
      item.memberId === plusId,
  ) as Record<string, unknown> | undefined;

  if (!plusEntry) return results;

  const plusName =
    typeof plusEntry.memberName === "string" ? plusEntry.memberName.trim() : "";
  if (!plusName || plusName.length > 80) return null;
  if (plusEntry.attending === false) return null;

  const plusMember: PartyMember = { id: plusId, name: plusName, menu: "adult" };
  const plusMenu = resolveMemberMenu(plusMember, guest);
  const plusFields = parseMemberMealFields(plusEntry, plusMenu);
  if (!plusFields) return null;

  results.push({
    memberId: plusId,
    memberName: plusName,
    attending: true,
    menu: plusMenu,
    ...plusFields,
  });

  return results;
}

function emptyMeals(menu: MenuType = "adult"): MealChoices {
  return {
    main: "",
    dessert: menu === "kids" ? "" : fixedDessert.id,
    dietaryNotes: "",
    allergies: "",
  };
}

export async function GET() {
  const guestId = await getSessionGuestId();
  if (!guestId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await getResponseForGuest(guestId);
  return NextResponse.json({ response: existing });
}

export async function POST(request: Request) {
  const guestId = await getSessionGuestId();
  if (!guestId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const guest = await findGuestById(guestId);
  if (!guest) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as Record<string, unknown>;

  if (!isAttendance(body.attendance)) {
    return NextResponse.json(
      { error: "Please let us know if you can make it." },
      { status: 400 },
    );
  }

  const attendance = body.attendance as Attendance;
  const submittedAt = new Date().toISOString();
  const mealMembers = getMealMembers(guest);
  const isFixedParty = mealMembers.length > 1;
  const hasPlusOneOption = allowsPlusOne(guest);
  const accountMenu = resolveMemberMenu(mealMembers[0], guest);

  if (attendance === "no" || attendance === "maybe") {
    const response = {
      guestId: guest.id,
      guestName: guest.name,
      attendance,
      submittedAt,
      ...(isFixedParty || hasPlusOneOption
        ? { members: [] }
        : emptyMeals(accountMenu)),
    };
    await saveResponse(response);
    return NextResponse.json({ ok: true, response });
  }

  if (isFixedParty) {
    const members = validatePartyMealChoices(body, mealMembers, guest);
    if (!members) {
      return NextResponse.json(
        {
          error:
            "Please complete each guest's menu (main and dessert for kids), or mark them as can't make it.",
        },
        { status: 400 },
      );
    }

    const response = {
      guestId: guest.id,
      guestName: guest.name,
      attendance: "yes" as const,
      submittedAt,
      members,
    };

    await saveResponse(response);
    return NextResponse.json({ ok: true, response });
  }

  if (hasPlusOneOption) {
    const members = validatePlusOneMealChoices(body, guest);
    if (!members) {
      const hasPlusEntry =
        Array.isArray(body.members) &&
        body.members.some(
          (item) =>
            typeof item === "object" &&
            item !== null &&
            "memberId" in item &&
            isPlusOneMemberId(String(item.memberId)),
        );

      return NextResponse.json(
        {
          error: hasPlusEntry
            ? "Please enter your guest's name and choose their main."
            : "Please choose your main.",
        },
        { status: 400 },
      );
    }

    const response = {
      guestId: guest.id,
      guestName: guest.name,
      attendance: "yes" as const,
      submittedAt,
      members,
    };

    await saveResponse(response);
    return NextResponse.json({ ok: true, response });
  }

  const choices = validateSingleMealChoices(body, guest);
  if (!choices) {
    return NextResponse.json(
      {
        error:
          accountMenu === "kids"
            ? "Please choose a main and dessert."
            : "Please choose your main.",
      },
      { status: 400 },
    );
  }

  const response = {
    guestId: guest.id,
    guestName: guest.name,
    attendance: "yes" as const,
    submittedAt,
    ...choices,
  };

  await saveResponse(response);
  return NextResponse.json({ ok: true, response });
}
