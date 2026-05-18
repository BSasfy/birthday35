"use client";

import { useMemo, useState } from "react";
import { plusOneMemberId } from "@/lib/plus-one";
import {
  fixedDessert,
  getMenuOptions,
  type MealOption,
} from "@/lib/meals";
import {
  resolveMemberMenu,
  type GuestAccount,
  type PartyMember,
} from "@/lib/guest-types";
import {
  isPartyResponse,
  type GuestResponse,
  type MemberMealChoices,
} from "@/lib/response-types";

type Props = {
  guestId: string;
  partyMembers: PartyMember[];
  accountGuest: Pick<GuestAccount, "menu">;
  allowPlusOne?: boolean;
  existingResponse: GuestResponse | null;
};

function readPlusOneFromResponse(
  guestId: string,
  existingResponse: GuestResponse | null,
): { hasPlusOne: boolean; plusOneName: string } {
  const plusId = plusOneMemberId(guestId);
  if (existingResponse && isPartyResponse(existingResponse)) {
    const plus = existingResponse.members.find((m) => m.memberId === plusId);
    if (plus) {
      return { hasPlusOne: true, plusOneName: plus.memberName };
    }
  }
  return { hasPlusOne: false, plusOneName: "" };
}

type MemberFormState = {
  attending: boolean;
  main: string;
  dessert: string;
  dietaryNotes: string;
  allergies: string;
};

function buildInitialMemberState(
  partyMembers: PartyMember[],
  accountGuest: Pick<GuestAccount, "menu">,
  existingResponse: GuestResponse | null,
): Record<string, MemberFormState> {
  const saved: Partial<MemberMealChoices>[] =
    existingResponse && isPartyResponse(existingResponse)
      ? existingResponse.members
      : existingResponse?.main
        ? [
            {
              memberId: partyMembers[0].id,
              memberName: partyMembers[0].name,
              attending: true,
              main: existingResponse.main,
              dessert: existingResponse.dessert ?? fixedDessert.id,
              dietaryNotes: existingResponse.dietaryNotes ?? "",
              allergies: existingResponse.allergies ?? "",
            },
          ]
        : [];

  return Object.fromEntries(
    partyMembers.map((member) => {
      const match = saved.find((entry) => entry.memberId === member.id);
      const menu = resolveMemberMenu(member, accountGuest);
      const attending = match ? (match.attending ?? Boolean(match.main)) : true;

      return [
        member.id,
        {
          attending,
          main: match?.main ?? "",
          dessert:
            match?.dessert ??
            (menu === "kids" ? "" : fixedDessert.id),
          dietaryNotes: match?.dietaryNotes ?? "",
          allergies: match?.allergies ?? "",
        },
      ];
    }),
  );
}

function MealOptionChoice({
  option,
  name,
  checked,
  onChange,
}: {
  option: MealOption;
  name: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="meal-option">
      <input
        type="radio"
        name={name}
        value={option.id}
        checked={checked}
        onChange={onChange}
        required
      />
      <span className="meal-option-label">
        <span className="meal-option-title">{option.label}</span>
        {option.description && (
          <span className="meal-option-desc">{option.description}</span>
        )}
      </span>
    </label>
  );
}

export function MealQuestionnaire({
  guestId,
  partyMembers,
  accountGuest,
  allowPlusOne = false,
  existingResponse,
}: Props) {
  const isFixedParty = partyMembers.length > 1;
  const initialPlusOne = readPlusOneFromResponse(guestId, existingResponse);
  const [hasPlusOne, setHasPlusOne] = useState(initialPlusOne.hasPlusOne);
  const [plusOneName, setPlusOneName] = useState(initialPlusOne.plusOneName);

  const mealMembers = useMemo(() => {
    if (!allowPlusOne || !hasPlusOne) return partyMembers;
    const name = plusOneName.trim() || "Guest";
    return [
      ...partyMembers,
      { id: plusOneMemberId(guestId), name, menu: "adult" as const },
    ];
  }, [allowPlusOne, hasPlusOne, plusOneName, partyMembers, guestId]);

  const isMultiGuest = mealMembers.length > 1;
  const plusOneId = plusOneMemberId(guestId);

  const [memberState, setMemberState] = useState(() =>
    buildInitialMemberState(mealMembers, accountGuest, existingResponse),
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const memberMenus = mealMembers.map((member) => ({
    member,
    menu: resolveMemberMenu(member, accountGuest),
  }));

  const hasKids = memberMenus.some(({ menu }) => menu === "kids");
  const hasAdults = memberMenus.some(({ menu }) => menu === "adult");

  const hasExisting =
    existingResponse?.attendance === "yes" &&
    (isPartyResponse(existingResponse) || Boolean(existingResponse.main));

  function updateMember(
    memberId: string,
    field: keyof MemberFormState,
    value: string | boolean,
  ) {
    setMemberState((prev) => ({
      ...prev,
      [memberId]: { ...prev[memberId], [field]: value },
    }));
  }

  function setMemberAttending(memberId: string, attending: boolean) {
    const menu = memberMenus.find((m) => m.member.id === memberId)?.menu ?? "adult";
    setMemberState((prev) => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        attending,
        ...(attending
          ? {}
          : {
              main: "",
              dessert: menu === "kids" ? "" : fixedDessert.id,
              dietaryNotes: "",
              allergies: "",
            }),
      },
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (allowPlusOne && hasPlusOne && !plusOneName.trim()) {
      setError("Please enter your guest's name.");
      return;
    }

    if (isFixedParty) {
      const anyoneComing = mealMembers.some(
        (member) => memberState[member.id].attending,
      );
      if (!anyoneComing) {
        setError(
          "At least one person in your party needs to be coming — or change your RSVP above.",
        );
        return;
      }
    }

    setLoading(true);

    const payload =
      isFixedParty || allowPlusOne
      ? {
          attendance: "yes",
          members: memberMenus.map(({ member, menu }) => {
            const state = memberState[member.id];
            const displayName =
              member.id === plusOneId ? plusOneName.trim() : member.name;
            return {
              memberId: member.id,
              memberName: displayName,
              attending: state.attending,
              menu,
              main: state.attending ? state.main : "",
              dessert: state.attending
                ? menu === "kids"
                  ? state.dessert
                  : fixedDessert.id
                : "",
              dietaryNotes: state.attending ? state.dietaryNotes : "",
              allergies: state.attending ? state.allergies : "",
            };
          }),
        }
      : (() => {
          const { member, menu } = memberMenus[0];
          const state = memberState[member.id];
          return {
            attendance: "yes",
            main: state.main,
            dessert: menu === "kids" ? state.dessert : fixedDessert.id,
            dietaryNotes: state.dietaryNotes,
            allergies: state.allergies,
          };
        })();

    try {
      const res = await fetch("/api/meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Could not save your choices.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="meal-form" onSubmit={handleSubmit}>
      <h2 className="meal-form-title">
        {isMultiGuest ? "Your menu choices" : "Your menu choices"}
      </h2>
      <p className="meal-form-intro">
        {isFixedParty && hasKids && hasAdults
          ? "Your main meal and a drink with your main are on me. Grown-ups will also have birthday cake — kids can pick a dessert below. Toggle off anyone who can't make it."
          : isFixedParty && hasKids
            ? "Choose a main and dessert for each child who's coming. Toggle off anyone who can't make it."
            : isFixedParty
              ? "Your main meal and a drink with your main are on me — choose a main for everyone who's coming. Toggle off anyone who can't make it. And of course there will be cake!"
              : allowPlusOne
                ? "Your main meal and a drink with your main are on me — just pick what you'd like below. Bringing someone? Toggle +1 to add them. And of course there will be cake!"
                : hasKids
                  ? "Pick a main and dessert below — it's on me!"
                  : "Your main meal and a drink with your main are on me — just pick what you'd like below. And of course there will be cake!"}
      </p>
      {allowPlusOne && (
        <label className="plus-one-toggle">
          <input
            type="checkbox"
            checked={hasPlusOne}
            onChange={(e) => {
              const next = e.target.checked;
              setHasPlusOne(next);
              if (!next) {
                setPlusOneName("");
                setMemberState((prev) => {
                  const next = { ...prev };
                  delete next[plusOneId];
                  return next;
                });
              } else {
                setMemberState((prev) => ({
                  ...prev,
                  [plusOneId]: {
                    attending: true,
                    main: "",
                    dessert: fixedDessert.id,
                    dietaryNotes: "",
                    allergies: "",
                  },
                }));
              }
            }}
          />
          <span className="plus-one-toggle-label">I&apos;m bringing a +1</span>
        </label>
      )}
      {hasExisting && !success && (
        <p className="meal-form-note">
          You&apos;ve already submitted — update anytime before the RSVP
          deadline.
        </p>
      )}

      {memberMenus.map(({ member, menu }) => {
        const state = memberState[member.id];
        if (!state) return null;
        const cantMakeIt = isFixedParty && !state.attending;
        const options = getMenuOptions(menu, member.id);
        const isKids = menu === "kids";
        const isPlusOne = member.id === plusOneId;

        return (
          <div
            key={member.id}
            className={`party-member${cantMakeIt ? " party-member--absent" : ""}${isKids ? " party-member--kids" : ""}`}
          >
            {isFixedParty && (
              <div className="party-member-header">
                <div className="party-member-heading">
                  <h3 className="party-member-name">{member.name}</h3>
                  {isKids && (
                    <span className="party-member-badge">Kids menu</span>
                  )}
                </div>
                <label className="member-absence-switch">
                  <input
                    type="checkbox"
                    checked={!state.attending}
                    onChange={(e) =>
                      setMemberAttending(member.id, !e.target.checked)
                    }
                  />
                  <span className="member-absence-track" aria-hidden />
                  <span className="member-absence-label">
                    Can&apos;t make it
                  </span>
                </label>
              </div>
            )}

            {isMultiGuest && !isFixedParty && (
              <div className="party-member-header party-member-header--plus-one">
                {isPlusOne ? (
                  <label className="plus-one-name-field">
                    <span className="plus-one-name-label">Your guest&apos;s name</span>
                    <input
                      type="text"
                      className="login-input plus-one-name-input"
                      value={plusOneName}
                      onChange={(e) => setPlusOneName(e.target.value)}
                      placeholder="Their name"
                      required
                      maxLength={80}
                    />
                  </label>
                ) : (
                  <h3 className="party-member-name">{member.name}</h3>
                )}
              </div>
            )}

            {!isMultiGuest && isKids && (
              <span className="party-member-badge party-member-badge-solo">
                Kids menu
              </span>
            )}

            {cantMakeIt ? (
              <p className="party-member-absent-note">
                We&apos;ll miss {member.name}! Come back here if anything
                changes!
              </p>
            ) : (
              <>
                <fieldset className="meal-section">
                  <legend className="meal-section-legend">
                    <span className="meal-section-title">Main</span>
                    <span className="meal-section-subtitle">
                      {isMultiGuest
                        ? isPlusOne
                          ? "Their choice of main meal"
                          : `${member.name}'s choice`
                        : "Your choice of main meal"}
                    </span>
                  </legend>
                  <div className="meal-options">
                    {options.main.map((option) => (
                      <MealOptionChoice
                        key={option.id}
                        option={option}
                        name={`main-${member.id}`}
                        checked={state.main === option.id}
                        onChange={() =>
                          updateMember(member.id, "main", option.id)
                        }
                      />
                    ))}
                  </div>
                </fieldset>

                {isKids ? (
                  <fieldset className="meal-section">
                    <legend className="meal-section-legend">
                      <span className="meal-section-title">Dessert</span>
                      <span className="meal-section-subtitle">
                        Pick something sweet
                      </span>
                    </legend>
                    <div className="meal-options">
                      {options.dessert.map((option) => (
                        <MealOptionChoice
                          key={option.id}
                          option={option}
                          name={`dessert-${member.id}`}
                          checked={state.dessert === option.id}
                          onChange={() =>
                            updateMember(member.id, "dessert", option.id)
                          }
                        />
                      ))}
                    </div>
                  </fieldset>
                ) : (
                  <div className="meal-section meal-section-compact">
                    <div className="meal-section-legend">
                      <span className="meal-section-title">Dessert</span>
                    </div>
                    <p className="meal-option-fixed">{fixedDessert.label}</p>
                  </div>
                )}

                <div className="meal-text-fields">
                  <label className="meal-text-label">
                    Dietary preferences
                    <textarea
                      value={state.dietaryNotes}
                      onChange={(e) =>
                        updateMember(member.id, "dietaryNotes", e.target.value)
                      }
                      placeholder="Vegetarian, gluten-free, etc. (optional)"
                      rows={2}
                    />
                  </label>
                  <label className="meal-text-label">
                    Allergies
                    <textarea
                      value={state.allergies}
                      onChange={(e) =>
                        updateMember(member.id, "allergies", e.target.value)
                      }
                      placeholder="Please list any allergies (optional)"
                      rows={2}
                    />
                  </label>
                </div>
              </>
            )}
          </div>
        );
      })}

      {error && (
        <p className="meal-error" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="meal-success" role="status">
          {isMultiGuest
            ? "Thank you — your RSVP is saved. See you at the table!"
            : "Thank you — your choices are saved. See you at the table!"}
        </p>
      )}

      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? "Saving…" : hasExisting ? "Update choices" : "Send choices"}
      </button>
    </form>
  );
}
