import { getSession } from '@auth0/nextjs-auth0';
import { NextRequest } from 'next/server';

/**
 * Função utilitária para verificar se existe uma sessão Auth0 válida 
 * em chamadas Edge/API de forma segura.
 * Se nula, o chamador deve disparar 401.
 */
export async function getAuthPayload(req?: NextRequest) {
  // Test Backdoor ONLY for Playwright Pentests
  if (req && process.env.NODE_ENV !== 'production') {
    const authHeader = req.headers.get('Authorization');
    if (authHeader === 'Bearer TEST_TOKEN_USER_1') return { sub: 'auth0|mock_user_1', _testLocalId: 1 };
  }

  const session = await getSession();
  if (!session || !session.user) return null;
  
  // session.user devolve as claims mapeadas do Auth0 sub (o Id externo)
  return session.user;
}

/** Resposta de erro JSON padrão */
export function apiError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

/** Resposta de sucesso JSON padrão */
export function apiOk<T>(data: T, status = 200) {
  return Response.json(data, { status });
}
