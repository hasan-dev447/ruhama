import { NextResponse, type NextRequest } from 'next/server'

/**
 * Optimistic routing only (never authorization): staff and members share one
 * Bangla login page, and personal pages bounce signed-out visitors to it early.
 * Every page, action and endpoint still checks the session on the server.
 */
const MEMBER_PATHS = ['/dashboard', '/settings', '/notifications']

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (pathname === '/admin/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = `?next=${encodeURIComponent('/admin')}`
    return NextResponse.redirect(url)
  }

  if (MEMBER_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const hasSession = request.cookies.getAll().some((c) => c.name.endsWith('ruhama.session_token'))
    if (!hasSession) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.search = `?next=${encodeURIComponent(pathname + search)}`
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/login', '/dashboard/:path*', '/settings/:path*', '/notifications/:path*'],
}
