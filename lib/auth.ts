import {
  clearSignedCookie,
  decodeSignedToken,
  encodeSignedToken,
  getSignedCookie,
  setSignedCookie,
} from "./session-cookie";

const COOKIE_NAME = "birthday35_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 60; // 60 days

type SessionPayload = {
  guestId: string;
  exp: number;
};

export async function createSession(guestId: string): Promise<void> {
  const exp = Date.now() + MAX_AGE_SECONDS * 1000;
  const token = encodeSignedToken<SessionPayload>({ guestId, exp });
  await setSignedCookie(COOKIE_NAME, token, MAX_AGE_SECONDS);
}

export async function getSessionGuestId(): Promise<string | null> {
  const cookie = await getSignedCookie(COOKIE_NAME);
  if (!cookie) return null;

  const payload = decodeSignedToken<SessionPayload>(cookie);
  if (
    !payload ||
    typeof payload.guestId !== "string" ||
    typeof payload.exp !== "number"
  ) {
    return null;
  }
  if (payload.exp < Date.now()) return null;
  return payload.guestId;
}

export async function clearSession(): Promise<void> {
  await clearSignedCookie(COOKIE_NAME);
}
