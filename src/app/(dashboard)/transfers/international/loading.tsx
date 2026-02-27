export default function InternationalLoading() {
  return (
    <div className="space-y-6 max-w-xl mx-auto animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-52 rounded-lg bg-muted" />
          <div className="h-4 w-64 rounded-md bg-muted/60" />
        </div>
        <div className="h-10 w-32 rounded-full bg-muted" />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-border/40 last:border-0">
            <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-36 rounded-md bg-muted" />
              <div className="h-3 w-48 rounded-md bg-muted/60" />
            </div>
            <div className="h-3 w-14 rounded-md bg-muted/60" />
          </div>
        ))}
      </div>
    </div>
  )
}
