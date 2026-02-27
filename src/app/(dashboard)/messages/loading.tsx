export default function MessagesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-44 rounded-lg bg-muted" />
          <div className="h-4 w-64 rounded-md bg-muted/60" />
        </div>
        <div className="h-10 w-36 rounded-full bg-muted" />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-border/40 last:border-0">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-4 w-48 rounded-md bg-muted" />
                <div className="h-5 w-14 rounded-full bg-muted/60" />
              </div>
              <div className="h-3 w-24 rounded-md bg-muted/60" />
            </div>
            <div className="h-3 w-12 rounded-md bg-muted/60" />
          </div>
        ))}
      </div>
    </div>
  )
}
