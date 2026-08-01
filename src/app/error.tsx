"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="display text-4xl text-ink">Something went wrong</h1>
      <p className="text-sm text-ink-muted">
        {error.message || "The page failed to render. You can try again."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-full bg-pitch-500 px-5 py-3 text-sm font-semibold text-pitch-950"
      >
        Try again
      </button>
    </div>
  );
}
