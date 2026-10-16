"use client";

import { useState } from "react";

type ReviewPayload = {
  headline: string;
  summary: string;
  isAuthorization: false;
  citations: { citationId: string; source: string; excerpt: string }[];
  checks: { checkId: string; passed: boolean; detail: string }[];
  model: { provider: string; called: boolean };
};

export function ReviewPanel({ invoiceId }: { invoiceId: string }) {
  const [review, setReview] = useState<ReviewPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

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

  return (
    <section className="panel review-panel">
      <h2>Evidence review</h2>
      <p>The review can cite only documents this session is allowed to read. It cannot approve or pay.</p>
      <button type="button" onClick={runReview} disabled={isRunning}>
        {isRunning ? "Running AI review" : "Run AI review"}
      </button>
      {error ? (
        <p role="alert">{error}</p>
      ) : null}
      {review ? (
        <div>
          <h3>{review.headline}</h3>
          <p>{review.summary}</p>
          <p>
            {review.model.called
              ? "An external model draft was checked against the authorized citations."
              : "Deterministic evidence review. No external model was called."}
          </p>
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
        </div>
      ) : null}
    </section>
  );
}
