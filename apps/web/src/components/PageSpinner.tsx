import { Spinner } from "@/components/ui/spinner";

/**
 * Route-level Suspense fallback, shown briefly while a lazy-loaded page
 * chunk downloads.
 */
export function PageSpinner() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background" role="status" aria-live="polite">
      <Spinner className="size-8 text-muted-foreground" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
