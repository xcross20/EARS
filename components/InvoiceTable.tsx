import Link from "next/link";

import { formatIsoDate, formatUsd, statusLabel } from "@/lib/format";
import { vendorLegalName } from "@/lib/invoices";
import type { Invoice } from "@/lib/types";

export function InvoiceTable({ invoices }: { invoices: readonly Invoice[] }) {
  return (
    <table className="invoice-table">
      <caption className="sr-only">Synthetic invoices visible to this session</caption>
      <thead>
        <tr>
          <th scope="col">Invoice</th>
          <th scope="col">Vendor</th>
          <th scope="col">Issued</th>
          <th scope="col" className="numeric">
            Amount
          </th>
          <th scope="col">Status</th>
        </tr>
      </thead>
      <tbody>
        {invoices.map((invoice) => {
          return (
            <tr key={invoice.invoiceId}>
              <td>
                <Link href={`/invoices/${invoice.invoiceId}`}>{invoice.invoiceNumber}</Link>
              </td>
              <td>{vendorLegalName(invoice.vendorId)}</td>
              <td>{formatIsoDate(invoice.issuedOn)}</td>
              <td className="numeric">{formatUsd(invoice.amountCents)}</td>
              <td>{statusLabel(invoice.status)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
