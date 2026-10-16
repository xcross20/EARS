export function formatUsd(amountCents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amountCents / 100);
}

export function formatIsoDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) {
    throw new Error(`Invalid ISO date: ${isoDate}`);
  }
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function statusLabel(status: "awaiting_analyst_review"): string {
  if (status === "awaiting_analyst_review") {
    return "Awaiting analyst review";
  }
  return status;
}
