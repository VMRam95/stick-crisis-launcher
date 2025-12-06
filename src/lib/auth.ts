import { cookies, headers } from "next/headers";

const ADMIN_COOKIE_NAME = "stick_crisis_admin";
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24 hours

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.error("ADMIN_PASSWORD not configured");
    return false;
  }

  return password === adminPassword;
}

export async function verifyApiKey(): Promise<boolean> {
  const headersList = await headers();
  const apiKey = headersList.get("x-api-key");
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!apiKey || !adminPassword) {
    return false;
  }

  return apiKey === adminPassword;
}

export async function setAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionToken = Buffer.from(
    `admin_${Date.now()}_${Math.random().toString(36)}`
  ).toString("base64");

  cookieStore.set(ADMIN_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_COOKIE_NAME);
  return !!session?.value;
}
