import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import type { Attendance } from "./rsvp";
import type { GuestResponse } from "./response-types";
import { isRedisConfigured, redisGetResponses, redisSetResponses } from "./redis";

export type { GuestResponse, MemberMealChoices } from "./response-types";
export { isPartyResponse } from "./response-types";

const responsesPath = path.join(process.cwd(), "data", "responses.json");

async function ensureDataDir(): Promise<void> {
  await mkdir(path.dirname(responsesPath), { recursive: true });
}

async function readAllFromFile(): Promise<GuestResponse[]> {
  try {
    const raw = await readFile(responsesPath, "utf-8");
    return JSON.parse(raw) as GuestResponse[];
  } catch {
    return [];
  }
}

async function writeAllToFile(responses: GuestResponse[]): Promise<void> {
  await ensureDataDir();
  await writeFile(responsesPath, JSON.stringify(responses, null, 2));
}

async function readAll(): Promise<GuestResponse[]> {
  if (isRedisConfigured()) {
    return (await redisGetResponses<GuestResponse>()) ?? [];
  }
  return readAllFromFile();
}

async function writeAll(responses: GuestResponse[]): Promise<void> {
  if (isRedisConfigured()) {
    await redisSetResponses(responses);
    return;
  }
  await writeAllToFile(responses);
}

export function getResponsesStorage(): "redis" | "file" {
  return isRedisConfigured() ? "redis" : "file";
}

export async function getResponseForGuest(
  guestId: string,
): Promise<GuestResponse | null> {
  const all = await readAll();
  return all.find((r) => r.guestId === guestId) ?? null;
}

function adminListRank(attendance: Attendance): number {
  return attendance === "no" ? 1 : 0;
}

export async function getAllResponses(): Promise<GuestResponse[]> {
  const all = await readAll();
  return all.sort((a, b) => {
    const rankDiff = adminListRank(a.attendance) - adminListRank(b.attendance);
    if (rankDiff !== 0) return rankDiff;
    return (
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  });
}

export async function saveResponse(response: GuestResponse): Promise<void> {
  const all = await readAll();
  const withoutGuest = all.filter((r) => r.guestId !== response.guestId);
  withoutGuest.push(response);
  await writeAll(withoutGuest);
}
