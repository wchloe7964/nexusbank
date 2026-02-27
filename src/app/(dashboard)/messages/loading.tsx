export default function MessagesLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-6 w-32 rounded-lg bg-muted" />
          <div className="h-4 w-52 rounded-md bg-muted/60" />
        </div>
        <div className="h-10 w-24 rounded-xl bg-muted" />
      </div>

      {/* Search */}
      <div className="h-11 w-full rounded-xl bg-muted/60" />

      {/* Tabs */}
      <div className="h-10 w-full rounded-xl bg-muted/40" />

      {/* Conversation cards */}
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="rounded-xl border border-border/50 bg-card p-4 flex items-start gap-3.5">
            <div className="h-9 w-9 rounded-xl bg-muted shrink-0" />
            <div className="flex-1 space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="h-4 w-40 rounded-md bg-muted" />
                <div className="h-[18px] w-[18px] rounded-full bg-muted/60" />
              </div>
              <div className="h-3 w-56 rounded-md bg-muted/50" />
              <div className="flex items-center gap-2">
                <div className="h-5 w-20 rounded-full bg-muted/40" />
                <div className="h-3 w-12 rounded-md bg-muted/40" />
              </div>
            </div>
            <div className="h-4 w-4 rounded bg-muted/30 mt-2" />
          </div>
        ))}
      </div>
    </div>
  )
}
