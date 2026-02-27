export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-48 rounded-lg bg-muted" />
        <div className="h-4 w-64 rounded-md bg-muted/60" />
      </div>

      {/* Cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-muted" />
              <div className="h-4 w-24 rounded-md bg-muted" />
            </div>
            <div className="h-8 w-32 rounded-md bg-muted" />
            <div className="h-3 w-20 rounded-md bg-muted/60" />
          </div>
        ))}
      </div>

      {/* List skeleton */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-border/40 last:border-0">
            <div className="h-10 w-10 rounded-xl bg-muted shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 rounded-md bg-muted" />
              <div className="h-3 w-24 rounded-md bg-muted/60" />
            </div>
            <div className="h-4 w-16 rounded-md bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}
