"use client";

import { useState } from "react";

type ReviewPayload = {
  outcome: "refer_to_manager" | "hold_duplicate" | "no_exception_noted" | "abstain";
  headline: string;
  summary: string;
  isAuthorization: false;
  citations: { citationId: string; source: string; excerpt: string }[];
  checks: { checkId: string; passed: boolean; detail: string }[];
  model: { provider: string; called: boolean; mode?: string };
};

function modelLine(model: ReviewPayload["model"]): string {
  if (model.mode === "provider_fallback") {
    return "The external model did not return a usable draft. Deterministic checks were used instead. This is not an approval.";
  }
  if (model.called) {
    return "An external model draft was checked against the authorized citations.";
  }
  return "Deterministic evidence review. No external model was called.";
}

export function ReviewPanel({
  invoiceId,
  initialVersion,
  initialStatus,
}: {
  invoiceId: string;
  initialVersion: number;
  initialStatus: string;
}) {
  const [review, setReview] = useState<ReviewPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState(initialStatus);
  const [version, setVersion] = useState(initialVersion);

  async function runReview() {
    setIsRunning(true);
    setError(null);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/review`, { method: "POST" });
      const body = (await response.json()) as { review?: ReviewPayload; error?: string };
      if (!response.ok || !body.review) {
        setReview(null);
        setError("The review was refused.");
        return;
      }
      setReview(body.review);
    } catch {
      setReview(null);
      setError("The review could not be loaded. No payment was attempted.");
    } finally {
      setIsRunning(false);
    }
  }

  async function submitReview() {
    setIsRunning(true);
    setError(null);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/submit`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ expectedVersion: version }),
      });
      const body = (await response.json()) as {
        decision?: { status: string; version: number };
        error?: string;
      };
      if (!response.ok || !body.decision) {
        setError(
          body.error === "not_submittable"
            ? "This review cannot be submitted. No payment was attempted."
            : "The submission was refused. No payment was attempted.",
        );
        return;
      }
      setStatus(body.decision.status);
      setVersion(body.decision.version);
    } catch {
      setError("The submission could not be recorded. No payment was attempted.");
    } finally {
      setIsRunning(false);
    }
  }

  const canSubmit =
    review?.outcome === "refer_to_manager" || review?.outcome === "no_exception_noted";
  const submitted = status === "pending_manager_decision" || status === "manager_approved" || status === "manager_rejected";

  return (
    <section className="panel review-panel">
      <h2>Evidence review</h2>
      <p>The review can cite only documents this session is allowed to read. It cannot approve or pay.</p>
      <button type="button" onClick={runReview} disabled={isRunning}>
        {isRunning ? "Running AI review" : "Run AI review"}
      </button>
      {error ? <p role="alert">{error}</p> : null}
      {review ? (
        <div>
          <h3>{review.headline}</h3>
          <p>{review.summary}</p>
          <p>{modelLine(review.model)}</p>
          <h4>Citations</h4>
          <ul>
            {review.citations.map((citation) => (
              <li key={citation.citationId}>
                <span>{citation.source}</span>
                <span>{citation.excerpt}</span>
              </li>
            ))}
          </ul>
          <h4>Checks</h4>
          <ul>
            {review.checks.map((check) => (
              <li key={check.checkId}>{check.detail}</li>
            ))}
          </ul>
          {submitted ? (
            <div>
              <h3>Submitted for a manager decision</h3>
              <p>No payment was sent.</p>
            </div>
          ) : canSubmit ? (
            <button type="button" onClick={submitReview} disabled={isRunning}>
              Submit to manager
            </button>
          ) : (
            <p>This review cannot be submitted. No payment was attempted.</p>
          )}
        </div>
      ) : null}
    </section>
  );
}
