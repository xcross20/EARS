import { InvoiceListView } from "@/components/InvoiceListView";

export const dynamic = "force-dynamic";

export default function AssignedInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <InvoiceListView view="assigned" searchParams={searchParams} />;
}
