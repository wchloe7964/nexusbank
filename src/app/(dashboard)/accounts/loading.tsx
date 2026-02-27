export default function AccountsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-36 rounded-lg bg-muted" />
          <div className="h-4 w-52 rounded-md bg-muted/60" />
        </div>
        <div className="h-10 w-36 rounded-full bg-muted" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-muted" />
                <div className="h-4 w-28 rounded-md bg-muted" />
              </div>
              <div className="h-5 w-16 rounded-full bg-muted" />
            </div>
            <div className="h-8 w-36 rounded-md bg-muted" />
            <div className="h-3 w-24 rounded-md bg-muted/60" />
          </div>
        ))}
      </div>
    </div>
  )
}
