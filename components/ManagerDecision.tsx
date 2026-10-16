"use client";

import { useState } from "react";

import type { PublicDecision } from "@/lib/decision-types";

export function ManagerDecision({ invoiceId, decision }: { invoiceId: string; decision: PublicDecision }) {
  const [rationale, setRationale] = useState("");
  const [current, setCurrent] = useState(decision);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function send(outcome: "approve" | "reject") {
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/decision`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ expectedVersion: current.version, outcome, rationale }),
      });
      const body = (await response.json()) as { decision?: PublicDecision; error?: string };
      if (!response.ok || !body.decision) {
        setError("The decision was refused. No payment was attempted.");
        return;
      }
      setCurrent(body.decision);
    } catch {
      setError("The decision could not be recorded. No payment was attempted.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="panel review-panel">
      <h2>Manager decision</h2>
      <p>A manager decision is not a payment. You cannot decide your own submission.</p>
      {current.evidence ? (
        <div>
          <h3>{current.evidence.headline}</h3>
          <ul>
            {current.evidence.sources.map((source) => (
              <li key={source.citationId}>
                <span>{source.source}</span>
                <span>{source.excerpt}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p>No analyst submission is waiting.</p>
      )}
      {current.status === "manager_approved" || current.status === "manager_rejected" ? (
        <p>
          {current.rationale} No payment was sent.
        </p>
      ) : current.status === "pending_manager_decision" ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <label htmlFor="rationale">Rationale</label>
          <textarea
            id="rationale"
            value={rationale}
            onChange={(event) => setRationale(event.target.value)}
            maxLength={500}
            required
          />
          <button type="button" onClick={() => send("approve")} disabled={isSaving || rationale.trim().length === 0}>
            Record manager approval
          </button>
          <button type="button" onClick={() => send("reject")} disabled={isSaving || rationale.trim().length === 0}>
            Record manager rejection
          </button>
        </form>
      ) : null}
      {error ? <p role="alert">{error}</p> : null}
    </section>
  );
}
