import { createClient } from '@supabase/supabase-js'

// Custom fetch with extended timeout for slow VPS outbound network
function fetchWithTimeout(timeout = 60_000): typeof fetch {
  return (input, init) => {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeout)

    return fetch(input, {
      ...init,
      signal: controller.signal,
    }).finally(() => clearTimeout(id))
  }
}

// Service role client — bypasses RLS. Only use in server-side API routes.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        fetch: fetchWithTimeout(60_000),
      },
    }
  )
}
