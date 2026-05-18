"use client";

import { useRouter } from "next/navigation";
import { formatSubmittedAt, mealLabel } from "@/lib/format-meals";
import type { GuestResponse } from "@/lib/responses";
import { isPartyResponse } from "@/lib/response-types";
import type { Attendance } from "@/lib/rsvp";

function attendanceLabel(attendance: Attendance): string {
  if (attendance === "yes") return "Attending";
  if (attendance === "no") return "Not attending";
  return "Maybe";
}

function attendanceClass(attendance: Attendance): string {
  if (attendance === "yes") return "admin-badge admin-badge--yes";
  if (attendance === "no") return "admin-badge admin-badge--no";
  return "admin-badge admin-badge--maybe";
}

type AdminDashboardProps = {
  responses: GuestResponse[];
  storage: "redis" | "file";
  guestCount: number;
};

export function AdminDashboard({
  responses,
  storage,
  guestCount,
}: AdminDashboardProps) {
  const router = useRouter();

  async function handleSignOut() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div>
          <h1 className="admin-title">RSVP &amp; meal responses</h1>
          <p className="admin-meta">
            {responses.length} of {guestCount} households have responded
            {" · "}
            Stored in {storage === "redis" ? "Upstash Redis" : "local file"}
          </p>
        </div>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => void handleSignOut()}
        >
          Sign out
        </button>
      </header>

      {responses.length === 0 ? (
        <p className="admin-empty">
          No responses yet. They will appear here as guests submit.
        </p>
      ) : (
        <div className="admin-list">
          {responses.map((response) => (
            <article key={response.guestId} className="admin-card">
              <header className="admin-card-header">
                <h2 className="admin-card-title">{response.guestName}</h2>
                <span className={attendanceClass(response.attendance)}>
                  {attendanceLabel(response.attendance)}
                </span>
              </header>
              <p className="admin-card-time">
                Submitted {formatSubmittedAt(response.submittedAt)}
              </p>

              {response.attendance === "yes" && isPartyResponse(response) ? (
                <div className="admin-members">
                  {response.members.map((member) => (
                    <div key={member.memberId} className="admin-member">
                      <h3 className="admin-member-name">
                        {member.memberName}
                        {!member.attending && (
                          <span className="admin-member-skip">
                            {" "}
                            — not attending
                          </span>
                        )}
                      </h3>
                      {member.attending && (
                        <dl className="admin-details">
                          <div>
                            <dt>Main</dt>
                            <dd>
                              {mealLabel(
                                member.main,
                                "main",
                                member.menu ?? "adult",
                                member.memberId,
                              )}
                            </dd>
                          </div>
                          <div>
                            <dt>Dessert</dt>
                            <dd>
                              {mealLabel(
                                member.dessert,
                                "dessert",
                                member.menu ?? "adult",
                              )}
                            </dd>
                          </div>
                          {member.dietaryNotes && (
                            <div>
                              <dt>Dietary</dt>
                              <dd>{member.dietaryNotes}</dd>
                            </div>
                          )}
                          {member.allergies && (
                            <div>
                              <dt>Allergies</dt>
                              <dd>{member.allergies}</dd>
                            </div>
                          )}
                        </dl>
                      )}
                    </div>
                  ))}
                </div>
              ) : response.attendance === "yes" ? (
                <dl className="admin-details">
                  <div>
                    <dt>Main</dt>
                    <dd>
                      {mealLabel(
                        response.main ?? "",
                        "main",
                        "adult",
                        response.guestId,
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Dessert</dt>
                    <dd>{mealLabel(response.dessert ?? "", "dessert")}</dd>
                  </div>
                  {response.dietaryNotes && (
                    <div>
                      <dt>Dietary</dt>
                      <dd>{response.dietaryNotes}</dd>
                    </div>
                  )}
                  {response.allergies && (
                    <div>
                      <dt>Allergies</dt>
                      <dd>{response.allergies}</dd>
                    </div>
                  )}
                </dl>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
