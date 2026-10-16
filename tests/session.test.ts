import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { actorFromRequestParts } from "../lib/authority";
import {
  employeeIdFromLoginBody,
  issueSessionToken,
  readSessionToken,
  resetSessionRegistry,
  revokePresentedSession,
  sessionSecret,
} from "../lib/session";

const SECRET = "unit-test-session-secret";
const NOW = Date.parse("2026-10-16T12:00:00Z");

beforeEach(() => {
  resetSessionRegistry();
});

afterEach(() => {
  delete process.env.EARS_DEMO_SESSION_SECRET;
  resetSessionRegistry();
});

describe("demo session", () => {
  it("signs an employee id and does not store a role", () => {
    const token = issueSessionToken("emp_avery_chen", NOW, SECRET);
    expect(token).toBeTruthy();
    const body = token!.split(".")[0]!;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
      employeeId: string;
      role?: string;
    };
    expect(payload.employeeId).toBe("emp_avery_chen");
    expect(payload.role).toBeUndefined();
    expect(payload).not.toHaveProperty("tenantId");
    expect(readSessionToken(token!, NOW + 1000, SECRET)?.employeeId).toBe("emp_avery_chen");
  });

  it("rejects a copied cookie after the server revokes the session", () => {
    const token = issueSessionToken("emp_avery_chen", NOW, SECRET)!;
    expect(readSessionToken(token, NOW + 1000, SECRET)?.employeeId).toBe("emp_avery_chen");
    revokePresentedSession(token, NOW + 1000, SECRET);
    expect(readSessionToken(token, NOW + 1000, SECRET)).toBeNull();
    expect(
      actorFromRequestParts({ sessionToken: token, headerRole: "manager", headerTenant: "tenant_harbor" }, NOW + 1000, SECRET),
    ).toBeNull();
  });

  it("rejects a tampered signature, an expired token, and an unknown employee", () => {
    const token = issueSessionToken("emp_avery_chen", NOW, SECRET)!;
    const [body, signature] = token.split(".");
    expect(readSessionToken(`${body}.${signature!.slice(0, -1)}x`, NOW, SECRET)).toBeNull();
    expect(readSessionToken(token, NOW + 9 * 60 * 60 * 1000, SECRET)).toBeNull();
    expect(issueSessionToken("emp_missing", NOW, SECRET)).toBeNull();
  });

  it("refuses the example secret", () => {
    process.env.EARS_DEMO_SESSION_SECRET = "replace-this-local-secret";
    expect(() => sessionSecret()).toThrow(/non-example/);
  });

  it("ignores role and tenant fields on the login body", () => {
    expect(
      employeeIdFromLoginBody({
        employeeId: "emp_avery_chen",
        role: "manager",
        tenantId: "tenant_summit",
      }),
    ).toBe("emp_avery_chen");
    expect(employeeIdFromLoginBody({ role: "manager" })).toBeNull();
  });

  it("resolves the actor from the signed cookie and ignores spoofed headers", () => {
    const token = issueSessionToken("emp_sam_ortiz", NOW, SECRET)!;
    const actor = actorFromRequestParts(
      {
        sessionToken: token,
        headerRole: "manager",
        headerTenant: "tenant_harbor",
      },
      NOW,
      SECRET,
    );
    expect(actor).toMatchObject({
      employeeId: "emp_sam_ortiz",
      role: "analyst",
      tenantId: "tenant_summit",
    });
    expect(
      actorFromRequestParts(
        { sessionToken: undefined, headerRole: "manager", headerTenant: "tenant_harbor" },
        NOW,
        SECRET,
      ),
    ).toBeNull();
  });
});
