// middleware.ts
export { default } from 'next-auth/middleware';

export const config = {
  // The matcher defines which routes are protected
  matcher: ['/dashboard/:path*'],
};