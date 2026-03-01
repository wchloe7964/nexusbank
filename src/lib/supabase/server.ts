import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method is called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
      global: {
        fetch: fetchWithTimeout(60_000),
      },
    }
  )
}
