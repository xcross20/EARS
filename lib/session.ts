import { createHmac, timingSafeEqual } from "node:crypto";

import { findEmployee } from "./seed";

export const SESSION_COOKIE = "ears_demo_session";
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

const REJECTED_SECRETS = new Set([
  "replace-this-local-secret",
  "changeme",
  "secret",
  "e2e-demo-session-secret-placeholder",
]);

type SessionPayload = {
  v: 1;
  employeeId: string;
  exp: number;
};

export function sessionSecret(): string {
  const secret = process.env.EARS_DEMO_SESSION_SECRET;
  if (!secret || secret.length < 16 || REJECTED_SECRETS.has(secret)) {
    throw new Error(
      "EARS_DEMO_SESSION_SECRET must be a non-example value of at least 16 characters",
    );
  }
  return secret;
}

export function sessionCookieOptions(maxAgeSeconds: number): {
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  path: "/";
  maxAge: number;
} {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export function issueSessionToken(employeeId: string, nowMs: number, secret: string): string | null {
  const employee = findEmployee(employeeId);
  if (!employee) {
    return null;
  }
  const payload: SessionPayload = {
    v: 1,
    employeeId: employee.employeeId,
    exp: nowMs + SESSION_TTL_MS,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${signature}`;
}

export function readSessionToken(
  token: string,
  nowMs: number,
  secret: string,
): { employeeId: string } | null {
  const parts = token.split(".");
  if (parts.length !== 2) {
    return null;
  }
  const [body, signature] = parts;
  if (!body || !signature) {
    return null;
  }
  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length) {
    return null;
  }
  if (!timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null;
  }
  let parsed: SessionPayload;
  try {
    parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
  } catch {
    return null;
  }
  if (parsed.v !== 1 || typeof parsed.employeeId !== "string" || typeof parsed.exp !== "number") {
    return null;
  }
  if (parsed.exp <= nowMs) {
    return null;
  }
  if (!findEmployee(parsed.employeeId)) {
    return null;
  }
  return { employeeId: parsed.employeeId };
}

export function employeeIdFromLoginBody(body: unknown): string | null {
  if (typeof body !== "object" || body === null) {
    return null;
  }
  const employeeId = (body as { employeeId?: unknown }).employeeId;
  if (typeof employeeId !== "string") {
    return null;
  }
  return findEmployee(employeeId)?.employeeId ?? null;
}
