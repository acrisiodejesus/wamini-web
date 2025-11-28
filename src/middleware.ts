import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en', 'pt', 'emakua'],
  defaultLocale: 'pt'
});

export const config = {
  matcher: ['/', '/(pt|en|emakua)/:path*']
};
