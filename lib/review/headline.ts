import type { ReviewOutcome } from "./types";

export function reviewHeadline(outcome: ReviewOutcome): string {
  if (outcome === "refer_to_manager") {
    return "Refer to a manager. This is not an approval.";
  }
  if (outcome === "hold_duplicate") {
    return "Hold for a duplicate invoice number. This is not an approval.";
  }
  if (outcome === "no_exception_noted") {
    return "No threshold or duplicate exception was found. This is not an approval.";
  }
  return "Abstain. The review is not grounded in authorized evidence.";
}
