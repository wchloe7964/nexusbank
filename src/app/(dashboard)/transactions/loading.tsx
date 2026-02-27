export default function TransactionsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-40 rounded-lg bg-muted" />
          <div className="h-4 w-56 rounded-md bg-muted/60" />
        </div>
        <div className="h-10 w-28 rounded-full bg-muted" />
      </div>

      {/* Filters skeleton */}
      <div className="flex gap-3">
        <div className="h-10 w-48 rounded-full bg-muted" />
        <div className="h-10 w-32 rounded-full bg-muted" />
        <div className="h-10 w-32 rounded-full bg-muted" />
      </div>

      {/* Transaction rows */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-border/40 last:border-0">
            <div className="h-10 w-10 rounded-xl bg-muted shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-44 rounded-md bg-muted" />
              <div className="h-3 w-28 rounded-md bg-muted/60" />
            </div>
            <div className="h-5 w-20 rounded-md bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}
