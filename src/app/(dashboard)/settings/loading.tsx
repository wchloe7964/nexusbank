export default function SettingsLoading() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-28 rounded-lg bg-muted" />
        <div className="h-4 w-56 rounded-md bg-muted/60" />
      </div>

      {/* Profile section skeleton */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="h-5 w-20 rounded-md bg-muted" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 w-16 rounded-md bg-muted/60" />
              <div className="h-11 w-full rounded-full bg-muted/40" />
            </div>
          ))}
        </div>
      </div>

      {/* Security section skeleton */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="h-5 w-24 rounded-md bg-muted" />
        <div className="flex items-center justify-between py-3">
          <div className="h-4 w-40 rounded-md bg-muted/60" />
          <div className="h-6 w-12 rounded-full bg-muted" />
        </div>
        <div className="flex items-center justify-between py-3">
          <div className="h-4 w-48 rounded-md bg-muted/60" />
          <div className="h-6 w-12 rounded-full bg-muted" />
        </div>
      </div>
    </div>
  )
}
