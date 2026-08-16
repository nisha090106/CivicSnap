import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for Better Auth session cookie
  const sessionToken = request.cookies.get('better-auth.session_token')?.value ||
                       request.cookies.get('better-auth_session_token')?.value ||
                       request.cookies.get('civicsnap_demo_role')?.value;

  // Protect /dashboard routes
  if (pathname.startsWith('/dashboard')) {
    if (!sessionToken) {
      if (pathname.startsWith('/dashboard/authority')) {
        return NextResponse.redirect(new URL('/authority/login', request.url));
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Role checks based on demo or session cookies
    const userRole = request.cookies.get('civicsnap_user_role')?.value || 'citizen';
    const isApproved = request.cookies.get('civicsnap_user_approved')?.value !== 'false';
    const userDept = request.cookies.get('civicsnap_user_dept')?.value || 'road-and-transport-authority';

    if (userRole === 'authority') {
      if (!isApproved) {
        return NextResponse.redirect(new URL('/authority/pending', request.url));
      }
      if (pathname === '/dashboard/citizen') {
        return NextResponse.redirect(new URL(`/dashboard/authority/${userDept}`, request.url));
      }
    }

    if (userRole === 'citizen' && pathname.startsWith('/dashboard/authority')) {
      return NextResponse.redirect(new URL('/dashboard/citizen', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/authority/pending'],
};
