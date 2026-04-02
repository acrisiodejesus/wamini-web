import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import withSerwistInit from '@serwist/next';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
  // Exclude problematic chunks that cause 404s during precaching in Next.js App Router
  exclude: [
    /\/_next\/static\/chunks\/app\/not-found.*\.js$/,
    /\/_next\/static\/chunks\/app\/manifest\.webmanifest\/route.*\.js$/,
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── Images ───────────────────────────────────────────────────────────────
  images: {
    // Serve AVIF primeiro (melhor compressão), fallback WebP
    formats: ['image/avif', 'image/webp'] as ['image/avif', 'image/webp'],
    // Larguras para responsividade (sidebar, cards, etc.)
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    // Permitir imagens do domínio da API
    remotePatterns: [
      {
        protocol: 'https' as const,
        hostname: 'images.unsplash.com',
      },
    ],
  },

  // ── Compressão ───────────────────────────────────────────────────────────
  compress: true,

  // ── Remove header desnecessário ──────────────────────────────────────────
  poweredByHeader: false,

  // ── Compiler ─────────────────────────────────────────────────────────────
  compiler: {
    // Remove todos os console.log em produção (mantém console.error e console.warn)
    removeConsole: process.env.NODE_ENV === 'production'
      ? { exclude: ['error', 'warn'] }
      : false,
  },

  // ── Experimental ─────────────────────────────────────────────────────────
  experimental: {
    // Tree-shake automático: só os ícones e componentes usados são incluídos no bundle
    // optimizePackageImports: ['lucide-react', 'framer-motion', '@tanstack/react-query'],
  },
} satisfies NextConfig;

export default withNextIntl(withSerwist(nextConfig));
