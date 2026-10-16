import { cookies } from "next/headers";

import { currentActor } from "@/lib/actor";
import { toActor } from "@/lib/authz";
import { json } from "@/lib/http";
import { findEmployee } from "@/lib/seed";
import {
  employeeIdFromLoginBody,
  issueSessionToken,
  revokePresentedSession,
  SESSION_COOKIE,
  SESSION_TTL_MS,
  sessionCookieOptions,
  sessionSecret,
} from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const actor = await currentActor();
  if (!actor) {
    return json({ error: "unauthenticated" }, 401);
  }
  return json({ actor }, 200);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_body" }, 400);
  }
  const employeeId = employeeIdFromLoginBody(body);
  const employee = employeeId ? findEmployee(employeeId) : undefined;
  const token = employee ? issueSessionToken(employee.employeeId, Date.now(), sessionSecret()) : null;
  if (!employee || !token) {
    return json({ error: "unknown_identity" }, 400);
  }
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, sessionCookieOptions(SESSION_TTL_MS / 1000));
  return json({ actor: toActor(employee) }, 200);
}

export async function DELETE() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    try {
      revokePresentedSession(token, Date.now(), sessionSecret());
    } catch {
      // The cookie is still cleared when the signing secret is unusable.
    }
  }
  jar.delete(SESSION_COOKIE);
  return json({ ok: true }, 200);
}
