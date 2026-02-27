export default function InsightsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-32 rounded-lg bg-muted" />
        <div className="h-4 w-60 rounded-md bg-muted/60" />
      </div>

      {/* Summary cards skeleton */}
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="h-4 w-24 rounded-md bg-muted/60" />
            <div className="h-8 w-28 rounded-md bg-muted" />
            <div className="h-3 w-16 rounded-md bg-muted/60" />
          </div>
        ))}
      </div>

      {/* Chart placeholder */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="h-5 w-36 rounded-md bg-muted mb-4" />
        <div className="h-64 w-full rounded-lg bg-muted/40" />
      </div>
    </div>
  )
}
