import { handleAuth } from '@auth0/nextjs-auth0';

// Configuração zero-trust: este handler inicializa automaticamente
// /api/auth/login, /api/auth/logout, /api/auth/callback e /api/auth/me
export const GET = handleAuth();
