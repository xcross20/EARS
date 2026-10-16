import { toActor } from "./authz";
import { findEmployee } from "./seed";
import { readSessionToken } from "./session";
import type { Actor } from "./types";

export type RequestAuthority = {
  sessionToken: string | undefined;
  headerRole: string | null;
  headerTenant: string | null;
};

// Callers pass client headers so the ignored inputs stay visible at the boundary.
// Role and tenant are loaded from the signed employee id, never from those headers.
export function actorFromRequestParts(
  input: RequestAuthority,
  nowMs: number,
  secret: string,
): Actor | null {
  void input.headerRole;
  void input.headerTenant;
  if (!input.sessionToken) {
    return null;
  }
  const session = readSessionToken(input.sessionToken, nowMs, secret);
  if (!session) {
    return null;
  }
  const employee = findEmployee(session.employeeId);
  if (!employee) {
    return null;
  }
  return toActor(employee);
}
