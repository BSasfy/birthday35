import { timingSafeEqual } from "crypto";
import {
  clearSignedCookie,
  decodeSignedToken,
  encodeSignedToken,
  getSignedCookie,
  setSignedCookie,
} from "./session-cookie";

const COOKIE_NAME = "birthday35_admin";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

type AdminSession = {
  role: "admin";
  exp: number;
};

export function verifyAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !password) return false;

  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function isAdminConfigured(): boolean {
  const password = process.env.ADMIN_PASSWORD;
  return Boolean(password && password.length >= 8);
}

export async function createAdminSession(): Promise<void> {
  const exp = Date.now() + MAX_AGE_SECONDS * 1000;
  const token = encodeSignedToken<AdminSession>({ role: "admin", exp });
  await setSignedCookie(COOKIE_NAME, token, MAX_AGE_SECONDS);
}

export async function isAdminSession(): Promise<boolean> {
  const token = await getSignedCookie(COOKIE_NAME);
  if (!token) return false;

  const payload = decodeSignedToken<AdminSession>(token);
  if (!payload || payload.role !== "admin" || typeof payload.exp !== "number") {
    return false;
  }
  return payload.exp >= Date.now();
}

export async function clearAdminSession(): Promise<void> {
  await clearSignedCookie(COOKIE_NAME);
}
