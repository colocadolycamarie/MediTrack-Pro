import { Spinner } from "@/components/ui/spinner";

/**
 * Route-level Suspense fallback. Shown only for the brief moment it takes to
 * fetch a lazy-loaded page chunk — typically invisible on a warm cache, so it
 * stays minimal rather than trying to mimic the destination page's layout.
 */
export function PageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background" role="status" aria-live="polite">
      <Spinner className="size-6 text-muted-foreground" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
