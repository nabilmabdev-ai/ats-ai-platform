import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // 1. Public Routes (No Auth Needed)
  const isPublic =
    pathname === '/login' ||
    pathname.startsWith('/careers') ||
    pathname.startsWith('/book') ||
    pathname.includes('/apply') || // Allow applying without login
    pathname.includes('/thank-you') ||
    pathname === '/not-found'; // Allow 404 page

  // 2. Redirect to Login if No Token & Not Public
  if (!token && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 3. If token exists and trying to access login, redirect to home
  if (token && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};