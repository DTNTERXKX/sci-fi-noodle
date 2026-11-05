import "server-only";

import { cookies } from "next/headers";

import { COOKIE, verifyAccessToken } from "@/lib/session";

import type { User } from "./schema";
import { getUserByEmail, userHasStudioAccess } from "./users";

export class HttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function getSessionEmail(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  return verifyAccessToken(token);
}

export async function requireUser(): Promise<User> {
  const email = await getSessionEmail();
  if (!email) {
    throw new HttpError("Sign in required.", 401);
  }
  const user = await getUserByEmail(email);
  if (!user || !userHasStudioAccess(user)) {
    throw new HttpError("Active subscription required.", 403);
  }
  return user;
}
