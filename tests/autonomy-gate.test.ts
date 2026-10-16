import { describe, expect, it } from "vitest";

import {
  acceptanceAlreadyRecorded,
  evaluateEvidence,
  type CycleEvidence,
  type SecurityResults,
} from "../lib/autonomy/gate";

const SHA = "1c84e36f768b7723f990911fdbd4b91cdd20a46b";

function security(overrides: Partial<SecurityResults> = {}): SecurityResults {
  return {
    revokedCookieRejected: true,
    revokedSessionCannotSubmit: true,
    revokedSessionCannotDecide: true,
    revokedSessionCannotReadAudit: true,
    forgedHeadersRejected: true,
    crossTenantReadDenied: true,
    crossTenantDecisionDenied: true,
    unassignedSubmitDenied: true,
    injectionDidNotAuthorize: true,
    unauthorizedCitationExcluded: true,
    missingVendorAbstained: true,
    malformedCitationsFailClosed: true,
    providerFallbackDistinct: true,
    serverOnlyAdapter: true,
    timeoutBounded: true,
    paymentDisabled: true,
    legacyApproveDisabled: true,
    auditWriteRejected: true,
    auditorMutationRejected: true,
    analystDecisionRejected: true,
    selfApprovalRejected: true,
    duplicateSubmitNoSecondEvent: true,
    repeatedApprovalKeepsRationale: true,
    conflictingDecisionRejected: true,
    staleVersionRejected: true,
    concurrentDecisionsSingleTerminal: true,
    crossTenantAuditForgeRejected: true,
    ...overrides,
  };
}

function evidence(overrides: Partial<CycleEvidence> = {}): CycleEvidence {
  const checks = [
    "npm ci",
    "npm run typecheck",
    "npm test",
    "npx playwright install chromium",
    "npm run test:e2e",
    "npm run build",
    "npm audit --audit-level=critical",
  ].map((command) => ({ command, exitCode: command.startsWith("npm audit") ? 1 : 0, sha: SHA }));
  return {
    workOrderId: "EARS-003",
    candidateSha: SHA,
    reviewedSha: SHA,
    reviewerSessionId: "reviewer-session",
    builderSessionId: "builder-session",
    worktree: "/tmp/ears-003-r01",
    builderWorktree: "/Users/immanuellewis/worktrees/EARS",
    checks,
    findings: [{ id: "P3-1", severity: "P3", repairable: false, disposition: "Accepted as demo residue." }],
    security: security(),
    durability: { restartTested: true, survivesRestart: true, waiverCitation: null },
    auditExitCode: 1,
    advisoryIds: ["GHSA-5gmw-xhrv-c9v3"],
    newCriticalAdvisory: false,
    secretsAccessed: false,
    budgetExhausted: false,
    repairAttempts: 0,
    maxRepairAttempts: 2,
    reviewerRecommendation: "ACCEPT",
    ...overrides,
  };
}

describe("EARS acceptance gate", () => {
  it("accepts only complete independent evidence and ignores a reviewer ACCEPT", () => {
    const result = evaluateEvidence(evidence());
    expect(result.decision).toBe("ACCEPT");
    expect(result.reasons.join(" ")).toContain("ignored");
  });

  it("blocks a missing check, a shared session, and an untested race", () => {
    expect(evaluateEvidence(evidence({ checks: evidence().checks.slice(1) })).decision).toBe("BLOCKED");
    expect(
      evaluateEvidence(evidence({ reviewerSessionId: evidence().builderSessionId })).decision,
    ).toBe("BLOCKED");
    expect(
      evaluateEvidence(evidence({ security: security({ concurrentDecisionsSingleTerminal: null }) })).decision,
    ).toBe("BLOCKED");
  });

  it("does not treat the known audit failure as a pass and stops on a new advisory", () => {
    const claimedPass = evidence({
      auditExitCode: 0,
      checks: evidence().checks.map((check) =>
        check.command.startsWith("npm audit") ? { ...check, exitCode: 0 } : check,
      ),
    });
    expect(evaluateEvidence(claimedPass).decision).toBe("BLOCKED");
    expect(evaluateEvidence(evidence({ advisoryIds: ["GHSA-new-critical"], newCriticalAdvisory: true })).decision).toBe(
      "BLOCKED",
    );
  });

  it("continues once for an in-memory durability gap and then asks for a scope decision", () => {
    const gap = evidence({
      durability: { restartTested: true, survivesRestart: false, waiverCitation: null },
    });
    expect(evaluateEvidence(gap).decision).toBe("CONTINUE");
    expect(evaluateEvidence({ ...gap, repairAttempts: 2 }).decision).toBe("RETHINK");
    expect(
      evaluateEvidence(
        evidence({
          durability: {
            restartTested: true,
            survivesRestart: false,
            waiverCitation: "NEXT.md says immutable-ish, so in-memory is enough.",
          },
        }),
      ).decision,
    ).toBe("CONTINUE");
  });

  it("does not record acceptance twice for the same SHA", () => {
    const ledger = `## EARS-003\n- Decision: ACCEPT\n- SHA: ${SHA}\n`;
    expect(acceptanceAlreadyRecorded(ledger, SHA)).toBe(true);
    expect(acceptanceAlreadyRecorded("## EARS-002\n- Decision: ACCEPT\n", SHA)).toBe(false);
  });
});
