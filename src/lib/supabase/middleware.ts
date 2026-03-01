import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
      global: {
        fetch: fetchWithTimeout(60_000),
      },
    }
  )

  // Do not run code between createServerClient and supabase.auth.getUser().
  // A simple mistake could make it very hard to debug.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Admin route protection — check role before general route logic
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')

  if (isAdminRoute) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    // Fetch the user's role (uses RLS — auth.uid() = id)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role
    if (role !== 'admin' && role !== 'super_admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  }

  // Redirect unauthenticated users trying to access protected routes
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/register') ||
    request.nextUrl.pathname.startsWith('/forgot-password') ||
    request.nextUrl.pathname.startsWith('/reset-password')

  // Legal pages
  const isLegalPage =
    request.nextUrl.pathname.startsWith('/terms') ||
    request.nextUrl.pathname.startsWith('/privacy') ||
    request.nextUrl.pathname.startsWith('/cookies') ||
    request.nextUrl.pathname.startsWith('/accessibility') ||
    request.nextUrl.pathname.startsWith('/complaints')

  // Marketing / public product pages
  const isMarketingPage =
    request.nextUrl.pathname.startsWith('/mortgages') ||
    request.nextUrl.pathname.startsWith('/insurance') ||
    request.nextUrl.pathname.startsWith('/premier-banking') ||
    request.nextUrl.pathname.startsWith('/about') ||
    request.nextUrl.pathname.startsWith('/careers') ||
    request.nextUrl.pathname.startsWith('/credit-cards') ||
    request.nextUrl.pathname.startsWith('/loans') ||
    request.nextUrl.pathname.startsWith('/help') ||
    request.nextUrl.pathname.startsWith('/investments') ||
    request.nextUrl.pathname.startsWith('/savings') ||
    request.nextUrl.pathname.startsWith('/current-accounts') ||
    request.nextUrl.pathname.startsWith('/ways-to-bank')

  const isPublicPage = request.nextUrl.pathname === '/' ||
    request.nextUrl.pathname.startsWith('/auth/') ||
    isLegalPage ||
    isMarketingPage

  if (!user && !isAuthPage && !isPublicPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages (except reset-password and verify-2fa)
  if (
    user &&
    isAuthPage &&
    !request.nextUrl.pathname.startsWith('/reset-password') &&
    !request.nextUrl.pathname.startsWith('/login/verify-2fa')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Enforce MFA: if user has 2FA enrolled but hasn't verified, redirect to challenge page
  if (user && !isAuthPage && !isPublicPage) {
    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

    if (
      aalData &&
      aalData.nextLevel === 'aal2' &&
      aalData.currentLevel !== aalData.nextLevel
    ) {
      const url = request.nextUrl.clone()
      url.pathname = '/login/verify-2fa'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
