// Skeleton placeholders: grey blocks in the shape of the page that is about
// to appear, so people see the layout straight away instead of a spinner.

export function Skeleton({ className = "" }) {
  return <div aria-hidden="true" className={`skeleton ${className}`} />;
}

// Varying widths make placeholder text look like real lines.
const WIDTHS = ["w-3/4", "w-1/2", "w-2/3", "w-5/6", "w-2/5", "w-3/5"];

export function SkeletonTable({ rows = 6, cols = 5, className = "" }) {
  return (
    <div aria-hidden="true" className={`w-full overflow-hidden ${className}`}>
      <div className="flex gap-4 border-b border-text/10 px-4 py-3">
        {Array.from({ length: cols }, (_, c) => (
          <Skeleton key={c} className="h-3 flex-1 opacity-70" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex items-center gap-4 border-b border-text/5 px-4 py-3.5">
          {Array.from({ length: cols }, (_, c) => (
            <div key={c} className="flex-1">
              <Skeleton className={`h-3.5 ${c === cols - 1 ? "ml-auto w-1/2" : WIDTHS[(r + c) % WIDTHS.length]}`} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 6, className = "" }) {
  return (
    <div aria-hidden="true" className={`grid gap-6 md:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="space-y-4 rounded-2xl border border-text/10 bg-surface p-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
          <Skeleton className="h-7 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-8 flex-1" />
            <Skeleton className="h-8 flex-1" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ rows = 5, className = "" }) {
  return (
    <div aria-hidden="true" className={`divide-y divide-text/10 ${className}`}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 py-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className={`h-3.5 ${WIDTHS[i % WIDTHS.length]}`} />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-7 w-20" />
        </div>
      ))}
    </div>
  );
}

function Header() {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-2.5">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-28 rounded-lg" />
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>
    </div>
  );
}

function Figures({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="space-y-3 rounded-xl border border-text/10 bg-surface p-4">
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-6 w-3/4" />
        </div>
      ))}
    </div>
  );
}

function Panel({ children }) {
  return <div className="rounded-xl border border-text/10 bg-surface">{children}</div>;
}

function FormFields({ count = 6 }) {
  return (
    <div className="grid gap-5 p-5 sm:grid-cols-2">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}

// A sheet of paper with a letterhead, parties and a goods table.
function DocumentSheet() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 rounded-xl border border-text/10 bg-surface p-6 sm:p-10">
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-64 max-w-full" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="ml-auto h-3 w-28" />
          <Skeleton className="ml-auto h-3 w-24" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="space-y-2.5 rounded-lg border border-text/10 p-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
      <SkeletonTable rows={4} cols={6} />
      <div className="ml-auto w-64 space-y-2.5">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-5 w-full" />
      </div>
    </div>
  );
}

// A whole page in outline. `variant`: "list" (heading, figures and a table),
// "ledger" (with filters), "cards", "form" or "document".
export function PageSkeleton({ variant = "list", label = "Loading…" }) {
  return (
    <div role="status" aria-live="polite" className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-8">
      <span className="sr-only">{label}</span>
      {variant === "document" ? (
        <DocumentSheet />
      ) : (
        <>
          <Header />
          {variant === "form" ? (
            <>
              <Panel><FormFields count={6} /></Panel>
              <Panel><FormFields count={4} /></Panel>
            </>
          ) : variant === "cards" ? (
            <SkeletonCards />
          ) : (
            <>
              <Figures />
              <Panel>
                {variant === "ledger" && (
                  <div className="grid gap-3 border-b border-text/10 p-5 sm:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }, (_, i) => (
                      <Skeleton key={i} className="h-10 rounded-lg" />
                    ))}
                  </div>
                )}
                <SkeletonTable rows={8} cols={variant === "ledger" ? 6 : 5} />
              </Panel>
            </>
          )}
        </>
      )}
    </div>
  );
}
