"use client";

import { useState } from "react";
import {
  fixedDessert,
  getMenuOptions,
  type MealOption,
  type MenuType,
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
  partyMembers: PartyMember[];
  accountGuest: Pick<GuestAccount, "menu">;
  existingResponse: GuestResponse | null;
};

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
  partyMembers,
  accountGuest,
  existingResponse,
}: Props) {
  const isParty = partyMembers.length > 1;
  const [memberState, setMemberState] = useState(() =>
    buildInitialMemberState(partyMembers, accountGuest, existingResponse),
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const memberMenus = partyMembers.map((member) => ({
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

    if (isParty) {
      const anyoneComing = partyMembers.some(
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

    const payload = isParty
      ? {
          attendance: "yes",
          members: memberMenus.map(({ member, menu }) => {
            const state = memberState[member.id];
            return {
              memberId: member.id,
              memberName: member.name,
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
        {isParty ? "Your party's menu choices" : "Your menu choices"}
      </h2>
      <p className="meal-form-intro">
        {isParty && hasKids && hasAdults
          ? "Your main meal and a drink with your main are on me. Grown-ups will also have birthday cake — kids can pick a dessert below. Toggle off anyone who can't make it."
          : isParty && hasKids
            ? "Choose a main and dessert for each child who's coming. Toggle off anyone who can't make it."
            : isParty
              ? "Your main meal and a drink with your main are on me — choose a main for everyone who's coming. Toggle off anyone who can't make it. And of course there will be cake!"
              : hasKids
                ? "Pick a main and dessert below — it's on me!"
                : "Your main meal and a drink with your main are on me — just pick what you'd like below. And of course there will be cake!"}
      </p>
      {hasExisting && !success && (
        <p className="meal-form-note">
          You&apos;ve already submitted — update anytime before the RSVP
          deadline.
        </p>
      )}

      {memberMenus.map(({ member, menu }) => {
        const state = memberState[member.id];
        const cantMakeIt = isParty && !state.attending;
        const options = getMenuOptions(menu);
        const isKids = menu === "kids";

        return (
          <div
            key={member.id}
            className={`party-member${cantMakeIt ? " party-member--absent" : ""}${isKids ? " party-member--kids" : ""}`}
          >
            {isParty && (
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

            {!isParty && isKids && (
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
                      {isParty
                        ? `${member.name}'s choice`
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
          {isParty
            ? "Thank you — your party's RSVP is saved. See you at the table!"
            : "Thank you — your choices are saved. See you at the table!"}
        </p>
      )}

      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? "Saving…" : hasExisting ? "Update choices" : "Send choices"}
      </button>
    </form>
  );
}
