export const attendanceOptions = [
  { id: "yes", label: "Yes" },
  { id: "no", label: "No" },
  { id: "maybe", label: "Maybe — need to check" },
] as const;

export type Attendance = (typeof attendanceOptions)[number]["id"];

export function isAttendance(value: unknown): value is Attendance {
  return (
    typeof value === "string" &&
    attendanceOptions.some((option) => option.id === value)
  );
}
