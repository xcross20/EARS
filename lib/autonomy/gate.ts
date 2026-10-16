export const CONTROLLER_DECISIONS = ["ACCEPT", "CONTINUE", "BLOCKED", "RETHINK"] as const;

export type ControllerDecision = (typeof CONTROLLER_DECISIONS)[number];

export type Finding = {
  id: string;
  severity: "P0" | "P1" | "P2" | "P3";
  repairable: boolean;
  disposition: string;
};

export type CheckRecord = {
  command: string;
  exitCode: number;
  sha: string;
};

export type SecurityResults = {
  revokedCookieRejected: boolean;
  revokedSessionCannotSubmit: boolean;
  revokedSessionCannotDecide: boolean;
  revokedSessionCannotReadAudit: boolean;
  forgedHeadersRejected: boolean;
  crossTenantReadDenied: boolean;
  crossTenantDecisionDenied: boolean;
  unassignedSubmitDenied: boolean;
  injectionDidNotAuthorize: boolean;
  unauthorizedCitationExcluded: boolean;
  missingVendorAbstained: boolean;
  malformedCitationsFailClosed: boolean;
  providerFallbackDistinct: boolean;
  serverOnlyAdapter: boolean;
  timeoutBounded: boolean;
  paymentDisabled: boolean;
  legacyApproveDisabled: boolean;
  auditWriteRejected: boolean;
  auditorMutationRejected: boolean;
  analystDecisionRejected: boolean;
  selfApprovalRejected: boolean;
  duplicateSubmitNoSecondEvent: boolean;
  repeatedApprovalKeepsRationale: boolean;
  conflictingDecisionRejected: boolean;
  staleVersionRejected: boolean;
  concurrentDecisionsSingleTerminal: boolean | null;
  crossTenantAuditForgeRejected: boolean;
};

export type CycleEvidence = {
  workOrderId: "EARS-003";
  candidateSha: string;
  reviewedSha: string;
  reviewerSessionId: string;
  builderSessionId: string;
  worktree: string;
  builderWorktree: string;
  checks: readonly CheckRecord[];
  findings: readonly Finding[];
  security: SecurityResults;
  durability: {
    restartTested: boolean;
    survivesRestart: boolean;
    waiverCitation: string | null;
  };
  auditExitCode: number;
  advisoryIds: readonly string[];
  newCriticalAdvisory: boolean;
  secretsAccessed: boolean;
  budgetExhausted: boolean;
  repairAttempts: number;
  maxRepairAttempts: number;
  reviewerRecommendation: string;
};

export const REQUIRED_CHECKS = [
  "npm ci",
  "npm run typecheck",
  "npm test",
  "npx playwright install chromium",
  "npm run test:e2e",
  "npm run build",
] as const;

export const APPROVED_ADVISORY_IDS = [
  "GHSA-qx2v-qp2m-jg93",
  "GHSA-6g55-p6wh-862q",
  "GHSA-fxqj-rqcc-2cmp",
  "GHSA-r28c-9q8g-f849",
  "GHSA-82fw-gwwq-j7x9",
  "GHSA-5gmw-xhrv-c9v3",
  "GHSA-85c8-ppgw-ccpr",
] as const;

const SECURITY_KEYS = [
  "revokedCookieRejected",
  "revokedSessionCannotSubmit",
  "revokedSessionCannotDecide",
  "revokedSessionCannotReadAudit",
  "forgedHeadersRejected",
  "crossTenantReadDenied",
  "crossTenantDecisionDenied",
  "unassignedSubmitDenied",
  "injectionDidNotAuthorize",
  "unauthorizedCitationExcluded",
  "missingVendorAbstained",
  "malformedCitationsFailClosed",
  "providerFallbackDistinct",
  "serverOnlyAdapter",
  "timeoutBounded",
  "paymentDisabled",
  "legacyApproveDisabled",
  "auditWriteRejected",
  "auditorMutationRejected",
  "analystDecisionRejected",
  "selfApprovalRejected",
  "duplicateSubmitNoSecondEvent",
  "repeatedApprovalKeepsRationale",
  "conflictingDecisionRejected",
  "staleVersionRejected",
  "crossTenantAuditForgeRejected",
] as const satisfies readonly (keyof SecurityResults)[];

export type GateResult = {
  decision: ControllerDecision;
  reasons: string[];
};

function checkExit(evidence: CycleEvidence, command: string): number | null {
  const matches = evidence.checks.filter(
    (check) => check.command === command && check.sha === evidence.reviewedSha,
  );
  if (matches.length !== 1) {
    return null;
  }
  return matches[0]?.exitCode ?? null;
}

export function acceptanceAlreadyRecorded(decisionLedger: string, sha: string): boolean {
  return decisionLedger.includes("EARS-003") && decisionLedger.includes(sha) && decisionLedger.includes("ACCEPT");
}

export function evaluateEvidence(evidence: CycleEvidence): GateResult {
  const reasons: string[] = [];
  if (evidence.secretsAccessed) {
    return { decision: "BLOCKED", reasons: ["A secret outside the review worktree was accessed."] };
  }
  if (evidence.budgetExhausted) {
    return { decision: "BLOCKED", reasons: ["The pilot budget was exhausted."] };
  }
  if (evidence.candidateSha !== evidence.reviewedSha) {
    return { decision: "BLOCKED", reasons: ["The candidate SHA does not match the reviewed SHA."] };
  }
  if (!evidence.reviewerSessionId || evidence.reviewerSessionId === evidence.builderSessionId) {
    return { decision: "BLOCKED", reasons: ["Reviewer independence is not established."] };
  }
  if (!evidence.worktree || evidence.worktree === evidence.builderWorktree) {
    return { decision: "BLOCKED", reasons: ["The review worktree is not isolated from the builder checkout."] };
  }
  if (evidence.reviewerRecommendation === "ACCEPT") {
    reasons.push("The reviewer recommendation was ignored as acceptance evidence.");
  }

  for (const command of REQUIRED_CHECKS) {
    const exitCode = checkExit(evidence, command);
    if (exitCode === null) {
      return { decision: "BLOCKED", reasons: [`Missing independent check: ${command}.`] };
    }
    if (exitCode !== 0) {
      reasons.push(`${command} exited ${exitCode}.`);
    }
  }
  const auditExit = checkExit(evidence, "npm audit --audit-level=critical");
  if (auditExit === null) {
    return { decision: "BLOCKED", reasons: ["Missing independent npm audit result."] };
  }
  if (auditExit !== evidence.auditExitCode) {
    return { decision: "BLOCKED", reasons: ["The audit exit code does not match the check record."] };
  }
  if (auditExit === 0) {
    return {
      decision: "BLOCKED",
      reasons: ["npm audit exited 0. That differs from the approved failing-audit exception and must be evaluated."],
    };
  }
  if (auditExit !== 1) {
    return { decision: "BLOCKED", reasons: [`npm audit exited ${auditExit}. The known exception is exit 1.`] };
  }
  if (evidence.newCriticalAdvisory) {
    return { decision: "BLOCKED", reasons: ["A new critical advisory is outside the approved exception."] };
  }
  const unexpectedAdvisory = evidence.advisoryIds.find(
    (id) => !APPROVED_ADVISORY_IDS.includes(id as (typeof APPROVED_ADVISORY_IDS)[number]),
  );
  if (unexpectedAdvisory) {
    return { decision: "BLOCKED", reasons: [`Advisory ${unexpectedAdvisory} is outside the approved set.`] };
  }

  if (evidence.security.concurrentDecisionsSingleTerminal === null) {
    return { decision: "BLOCKED", reasons: ["Concurrent decisions were not tested. A sequential pass is not concurrency evidence."] };
  }
  const failedSecurity = SECURITY_KEYS.filter((key) => evidence.security[key] !== true);
  if (evidence.security.concurrentDecisionsSingleTerminal !== true) {
    failedSecurity.push("concurrentDecisionsSingleTerminal");
  }
  const failedChecks = REQUIRED_CHECKS.filter((command) => checkExit(evidence, command) !== 0);
  const material = evidence.findings.filter((finding) => finding.severity === "P0" || finding.severity === "P1");
  const undisposed = evidence.findings.filter(
    (finding) => (finding.severity === "P2" || finding.severity === "P3") && finding.disposition.trim().length === 0,
  );

  if (!evidence.durability.restartTested) {
    return { decision: "BLOCKED", reasons: ["Restart behavior was not tested."] };
  }
  if (evidence.durability.waiverCitation) {
    reasons.push("A durability waiver citation was ignored. Reviewer prose cannot waive the work order.");
  }
  const durabilityOpen = !evidence.durability.survivesRestart;
  if (durabilityOpen) {
    reasons.push(
      "work_orders/EARS-003.md requires a durable approval state machine. The store does not survive restart.",
    );
  }

  const withinBudget = evidence.repairAttempts < evidence.maxRepairAttempts && failedChecks.length === 0;
  const repairable =
    withinBudget &&
    (failedSecurity.length > 0 ||
      durabilityOpen ||
      (material.length > 0 && material.every((finding) => finding.repairable)));

  if (failedChecks.length > 0 || failedSecurity.length > 0 || material.length > 0 || durabilityOpen) {
    if (repairable) {
      return {
        decision: "CONTINUE",
        reasons: [
          ...reasons,
          ...failedSecurity.map((key) => `Security check failed: ${key}.`),
          ...material.map((finding) => `${finding.id} is ${finding.severity}.`),
        ],
      };
    }
    if (
      durabilityOpen &&
      failedSecurity.length === 0 &&
      material.length === 0 &&
      failedChecks.length === 0 &&
      !withinBudget
    ) {
      return {
        decision: "RETHINK",
        reasons: [
          ...reasons,
          "Repair budget cannot close the durability gap. NEXT.md says immutable-ish and the work order says durable.",
        ],
      };
    }
    return {
      decision: "BLOCKED",
      reasons: [
        ...reasons,
        ...failedSecurity.map((key) => `Security check failed: ${key}.`),
        ...failedChecks.map((command) => `${command} failed.`),
        ...material.map((finding) => `${finding.id} is ${finding.severity}.`),
      ],
    };
  }
  if (undisposed.length > 0) {
    return {
      decision: "BLOCKED",
      reasons: undisposed.map((finding) => `${finding.id} has no disposition.`),
    };
  }
  return {
    decision: "ACCEPT",
    reasons: [...reasons, "Independent evidence satisfied the deterministic gate."],
  };
}
