"use client";

import { ErrorState } from "@/components/ErrorState";

export default function RootError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="content">
      <ErrorState onRetry={reset} />
    </div>
  );
}
