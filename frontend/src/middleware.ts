import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function inferTargetByRole(role: string | undefined) {
  if (role === 'ADMIN') return '/admin'
  if (role === 'BARBER') return '/barber'
  if (role === 'CLIENT') return '/client'
  return '/login'
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const token = req.cookies.get('accessToken')?.value
  const role = req.cookies.get('userRole')?.value

  const isAdmin = pathname.startsWith('/admin')
  const isBarber = pathname.startsWith('/barber')
  const isClient = pathname.startsWith('/client')

  if (!token && (isAdmin || isBarber || isClient)) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (token && role) {
    if (isAdmin && role !== 'ADMIN') {
      const url = req.nextUrl.clone()
      url.pathname = inferTargetByRole(role)
      return NextResponse.redirect(url)
    }
    if (isBarber && role !== 'BARBER') {
      const url = req.nextUrl.clone()
      url.pathname = inferTargetByRole(role)
      return NextResponse.redirect(url)
    }
    if (isClient && role !== 'CLIENT') {
      const url = req.nextUrl.clone()
      url.pathname = inferTargetByRole(role)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/login', '/register', '/forgot-password', '/admin/:path*', '/barber/:path*', '/client/:path*'],
}
