import { InvoiceListView } from "@/components/InvoiceListView";

export const dynamic = "force-dynamic";

export default function OversightPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <InvoiceListView view="oversight" searchParams={searchParams} />;
}
