export default function OpenBankingLoading() {
  return (
    <div className="space-y-6 max-w-xl mx-auto animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-36 rounded-lg bg-muted" />
        <div className="h-4 w-72 rounded-md bg-muted/60" />
      </div>

      {/* Info banner skeleton */}
      <div className="h-24 rounded-xl bg-muted/40 border border-border" />

      {/* Connections list skeleton */}
      <div className="space-y-3">
        <div className="h-5 w-44 rounded-md bg-muted" />
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-border/40 last:border-0">
              <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 rounded-md bg-muted" />
                <div className="h-3 w-48 rounded-md bg-muted/60" />
              </div>
              <div className="h-5 w-14 rounded-full bg-muted/60" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
