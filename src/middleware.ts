import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Admin-only route protection
    if (path.startsWith('/admin') && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Redirect Admin users accessing Seller pages to Admin pages
    if (token?.role === 'ADMIN') {
      if (path === '/dashboard') {
        return NextResponse.redirect(new URL('/admin', req.url));
      }
      if (path === '/quotations') {
        return NextResponse.redirect(new URL('/admin/quotations', req.url));
      }
      if (path === '/orders') {
        return NextResponse.redirect(new URL('/admin/orders', req.url));
      }
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/products/:path*',
    '/quotations/:path*',
    '/orders/:path*',
    '/admin/:path*',
  ],
};
// Note: If you add more protected paths, append them to the matcher array above
