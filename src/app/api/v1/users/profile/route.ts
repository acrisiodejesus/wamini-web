// GET /api/v1/users/profile
import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthPayload, apiError, apiOk } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const payload = await getAuthPayload(req);
    if (!payload) return apiError('Não autenticado', 401);

    const db = getDb();
    const user = db.prepare(
      'SELECT id, name, mobile_number, localization, photo, role FROM users WHERE id = ?'
    ).get(payload.userId) as any;

    if (!user) return apiError('Utilizador não encontrado', 404);

    return apiOk(user);
  } catch (err: any) {
    console.error('Profile error:', err);
    return apiError('Erro interno do servidor', 500);
  }
}
