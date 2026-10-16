import { ManagerDecision } from "@/components/ManagerDecision";
import { ReviewPanel } from "@/components/ReviewPanel";
import { caseForActor } from "@/lib/workflow";
import { formatIsoDate, formatUsd, statusLabel } from "@/lib/format";
import type { InvoiceDetail as InvoiceDetailModel } from "@/lib/invoices";
import type { Actor } from "@/lib/types";

function roleNote(actor: Actor): string {
  if (actor.role === "analyst") {
    return "You can run an evidence review and submit it to a manager. It is not an approval and it cannot submit a payment.";
  }
  if (actor.role === "manager") {
    return "You can record a decision on a submitted request in your tenant. You cannot decide your own submission, and this does not send a payment.";
  }
  return "Read-only evidence. This session cannot change the invoice.";
}

export function InvoiceDetail({ actor, detail }: { actor: Actor; detail: InvoiceDetailModel }) {
  const { invoice, vendor, policy, assignee } = detail;
  const decision = caseForActor(actor, invoice.invoiceId);
  return (
    <article className="panel">
      <p className="eyebrow">{invoice.invoiceNumber}</p>
      <h1>{formatUsd(invoice.amountCents)}</h1>
      <p className="lede">{roleNote(actor)}</p>
      <dl className="facts">
        <div>
          <dt>Status</dt>
          <dd>{statusLabel(invoice.status)}</dd>
        </div>
        <div>
          <dt>Vendor</dt>
          <dd>{vendor ? vendor.legalName : "Vendor record unavailable"}</dd>
        </div>
        <div>
          <dt>Vendor site</dt>
          <dd>{vendor ? vendor.site : "Vendor record unavailable"}</dd>
        </div>
        <div>
          <dt>Issued</dt>
          <dd>{formatIsoDate(invoice.issuedOn)}</dd>
        </div>
        <div>
          <dt>Due</dt>
          <dd>{formatIsoDate(invoice.dueOn)}</dd>
        </div>
        <div>
          <dt>Assigned analyst</dt>
          <dd>{assignee ? assignee.displayName : "Assignee unavailable"}</dd>
        </div>
        <div>
          <dt>Description</dt>
          <dd>{invoice.description}</dd>
        </div>
        <div>
          <dt>Policy metadata</dt>
          <dd>
            {policy
              ? `${policy.title} · version ${policy.version}. ${policy.thresholdNote}`
              : "Policy record unavailable"}
          </dd>
        </div>
      </dl>
      {actor.role === "analyst" ? (
        <ReviewPanel invoiceId={invoice.invoiceId} initialVersion={decision?.version ?? 0} initialStatus={invoice.status} />
      ) : null}
      {actor.role === "manager" && decision ? <ManagerDecision invoiceId={invoice.invoiceId} decision={decision} /> : null}
    </article>
  );
}
