import { listAuditForActor } from "@/lib/workflow";
import type { Actor } from "@/lib/types";

export function AuditTrail({ actor }: { actor: Actor }) {
  const listed = listAuditForActor(actor);
  if (!listed.ok) {
    return null;
  }
  return (
    <section className="panel review-panel">
      <h2>Chronological audit</h2>
      <p>These records are append-only in this demo. No payment was sent.</p>
      {listed.events.length === 0 ? (
        <p>No decisions have been recorded.</p>
      ) : (
        <ol>
          {listed.events.map((event) => (
            <li key={event.eventId}>
              <time dateTime={event.at}>{event.at}</time>
              <span>
                {event.actorDisplayName} {event.action} {event.invoiceNumber}. {event.evidence?.headline ?? event.outcome}
              </span>
              {event.rationale ? <span>{event.rationale}</span> : null}
              {event.evidence?.sources.map((source) => (
                <span key={source.citationId}>{source.source}</span>
              ))}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
