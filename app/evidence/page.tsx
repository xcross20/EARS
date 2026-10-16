import { InvoiceListView } from "@/components/InvoiceListView";

export const dynamic = "force-dynamic";

export default function EvidencePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <InvoiceListView view="evidence" searchParams={searchParams} />;
}
