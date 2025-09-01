import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
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
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Get user from session
  const { data: { user }, error } = await supabase.auth.getUser()

  // If there's an error getting the user, try to refresh the session
  let authenticatedUser = user
  if (error || !user) {
    console.log('Middleware: User error or no user detected, attempting session refresh...')
    const { data: { session }, error: refreshError } = await supabase.auth.refreshSession()

    if (session?.user) {
      console.log('Middleware: Session refreshed successfully')
      authenticatedUser = session.user
    } else if (refreshError) {
      console.log('Middleware: Session refresh failed:', refreshError.message)
      authenticatedUser = null
    } else {
      authenticatedUser = null
    }
  }

  const { pathname } = request.nextUrl

  // Allow access to auth callback and API routes
  if (pathname.startsWith('/auth/callback') || pathname.startsWith('/api')) {
    return supabaseResponse
  }

  // Protect routes that require authentication
  if (!authenticatedUser && !pathname.startsWith('/login')) {
    console.log('Middleware: Unauthenticated user accessing protected route, redirecting to login')
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from login page
  if (authenticatedUser && pathname.startsWith('/login')) {
    console.log('Middleware: Authenticated user accessing login page, redirecting to home')
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Allow access to all other routes
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
