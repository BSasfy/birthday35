"use client";

import { useState } from "react";
import { attendanceOptions, type Attendance } from "@/lib/rsvp";
import type { GuestAccount, PartyMember } from "@/lib/guest-types";
import type { GuestResponse } from "@/lib/response-types";
import { MealQuestionnaire } from "./MealQuestionnaire";

type Props = {
  guestId: string;
  partyMembers: PartyMember[];
  accountGuest: Pick<GuestAccount, "menu">;
  allowPlusOne?: boolean;
  existingResponse: GuestResponse | null;
};

export function RsvpFlow({
  guestId,
  partyMembers,
  accountGuest,
  allowPlusOne,
  existingResponse,
}: Props) {
  const [attendance, setAttendance] = useState<Attendance | "">(
    existingResponse?.attendance ?? "",
  );
  const [savedAttendance, setSavedAttendance] = useState<Attendance | "">(
    existingResponse?.attendance ?? "",
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [declineSaved, setDeclineSaved] = useState(
    existingResponse?.attendance === "no" ||
      existingResponse?.attendance === "maybe",
  );

  const showMeals = attendance === "yes";
  const needsDeclineSubmit =
    (attendance === "no" || attendance === "maybe") &&
    attendance !== savedAttendance;

  async function saveAttendance(value: Attendance) {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendance: value }),
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Could not save your RSVP.");
        return;
      }

      setSavedAttendance(value);
      if (value === "no" || value === "maybe") {
        setDeclineSaved(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeclineSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (attendance === "no" || attendance === "maybe") {
      await saveAttendance(attendance);
    }
  }

  function handleAttendanceChange(value: Attendance) {
    setAttendance(value);
    setDeclineSaved(false);
    setError("");
    if (value === "yes") {
      setSavedAttendance(existingResponse?.attendance === "yes" ? "yes" : "");
    }
  }

  const showNoMessage =
    attendance === "no" && (declineSaved || savedAttendance === "no");
  const showMaybeMessage =
    attendance === "maybe" && (declineSaved || savedAttendance === "maybe");

  return (
    <section className="rsvp-flow">
      <form className="rsvp-attendance" onSubmit={handleDeclineSubmit}>
        <h2 className="meal-form-title">Can you make it?</h2>
        <div className="meal-options">
          {attendanceOptions.map((option) => (
            <label key={option.id} className="meal-option">
              <input
                type="radio"
                name="attendance"
                value={option.id}
                checked={attendance === option.id}
                onChange={() => handleAttendanceChange(option.id)}
              />
              <span className="meal-option-label">{option.label}</span>
            </label>
          ))}
        </div>

        {attendance === "no" && (
          <div className="rsvp-message rsvp-message-decline">
            <p role={showNoMessage ? "status" : undefined}>
              That&apos;s a shame — I&apos;ll miss you. If anything changes,
              please let me know.
            </p>
          </div>
        )}

        {attendance === "maybe" && (
          <div className="rsvp-message rsvp-message-maybe">
            <p role={showMaybeMessage ? "status" : undefined}>
              No worries — take your time to check. If your plans work out,
              I&apos;d love to see you
              {showMaybeMessage
                ? ". Just come back and update your RSVP anytime."
                : "."}
            </p>
          </div>
        )}

        {needsDeclineSubmit && (
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Saving…" : "Send RSVP"}
          </button>
        )}

        {error && (
          <p className="meal-error" role="alert">
            {error}
          </p>
        )}
      </form>

      {showMeals && (
        <MealQuestionnaire
          guestId={guestId}
          partyMembers={partyMembers}
          accountGuest={accountGuest}
          allowPlusOne={allowPlusOne}
          existingResponse={
            existingResponse?.attendance === "yes" ? existingResponse : null
          }
        />
      )}
    </section>
  );
}
