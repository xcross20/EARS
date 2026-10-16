"use client";

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <section className="panel" role="alert">
      <h1>Something went wrong</h1>
      <p>The invoice view could not be loaded. No payment was attempted.</p>
      {onRetry ? (
        <button type="button" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </section>
  );
}
