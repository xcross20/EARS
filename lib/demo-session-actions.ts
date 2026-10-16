"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { homePath } from "./authz";
import { findEmployee } from "./seed";
import {
  issueSessionToken,
  SESSION_COOKIE,
  SESSION_TTL_MS,
  sessionCookieOptions,
  sessionSecret,
} from "./session";

export async function startDemoSession(formData: FormData): Promise<void> {
  const employeeId = String(formData.get("employeeId") ?? "");
  const employee = findEmployee(employeeId);
  const token = employee ? issueSessionToken(employee.employeeId, Date.now(), sessionSecret()) : null;
  if (!employee || !token) {
    redirect("/?notice=unknown-identity");
  }
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, sessionCookieOptions(SESSION_TTL_MS / 1000));
  redirect(homePath(employee.role));
}

export async function endDemoSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/");
}
