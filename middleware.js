import { NextResponse } from 'next/server';

export function middleware(req) {
  const { pathname } = req.nextUrl;

  const isAdminRoute = pathname.startsWith('/admin');
  const isStaffRoute = pathname.startsWith('/staff');

  const isProtectedApi =
    pathname.startsWith('/api/admin') || pathname.startsWith('/api/staff');

  const token = req.cookies.get('session')?.value;

  // Allow public auth pages
  const allowList =
    pathname.startsWith('/admin/forgot-password') ||
    pathname.startsWith('/admin/reset-password') ||
    pathname === '/admin' ||
    pathname.startsWith('/staff/forgot-password') ||
    pathname.startsWith('/staff/reset-password') ||
    pathname === '/staff';

  if (allowList) return NextResponse.next();

  // Protect admin/staff pages
  if ((isAdminRoute || isStaffRoute) && !token) {
    const url = req.nextUrl.clone();
    url.pathname = isAdminRoute ? '/admin' : '/staff';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // Protect admin/staff APIs
  if (isProtectedApi && !token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/staff/:path*', '/api/admin/:path*', '/api/staff/:path*'],
};
