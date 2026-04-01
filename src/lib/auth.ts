// ─── JWT Auth helpers ─────────────────────────────────────────────────────────
import { SignJWT, jwtVerify } from 'jose';
import { NextRequest } from 'next/server';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'wamini-secret-change-in-production-2024'
);

const EXPIRY = '7d';

export interface JwtPayload {
  userId: number;
  mobile_number: string;
}

export async function signToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Extrai e valida o token do header Authorization de um Request.
 * Devolve o payload ou null se inválido.
 */
export async function getAuthPayload(req: NextRequest): Promise<JwtPayload | null> {
  const auth = req.headers.get('Authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  return verifyToken(token);
}

/** Resposta de erro JSON padrão */
export function apiError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

/** Resposta de sucesso JSON padrão */
export function apiOk<T>(data: T, status = 200) {
  return Response.json(data, { status });
}
