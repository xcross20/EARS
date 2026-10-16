import { ReviewPanel } from "@/components/ReviewPanel";
import { formatIsoDate, formatUsd, statusLabel } from "@/lib/format";
import type { InvoiceDetail as InvoiceDetailModel } from "@/lib/invoices";
import type { Actor } from "@/lib/types";

function roleNote(actor: Actor): string {
  if (actor.role === "analyst") {
    return "You can run an evidence review. It is not an approval and it cannot submit a payment.";
  }
  if (actor.role === "manager") {
    return "Oversight is read-only here. Approval is not available and cannot be performed from this screen.";
  }
  return "Read-only evidence. This session cannot change the invoice.";
}

export function InvoiceDetail({ actor, detail }: { actor: Actor; detail: InvoiceDetailModel }) {
  const { invoice, vendor, policy, assignee } = detail;
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
          <dd>{vendor.legalName}</dd>
        </div>
        <div>
          <dt>Vendor site</dt>
          <dd>{vendor.site}</dd>
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
          <dd>{assignee.displayName}</dd>
        </div>
        <div>
          <dt>Description</dt>
          <dd>{invoice.description}</dd>
        </div>
        <div>
          <dt>Policy metadata</dt>
          <dd>
            {policy.title} · version {policy.version}. {policy.thresholdNote}
          </dd>
        </div>
      </dl>
      {actor.role === "analyst" ? <ReviewPanel invoiceId={invoice.invoiceId} /> : null}
    </article>
  );
}
