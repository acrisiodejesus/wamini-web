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
      'SELECT id, name, mobile_number, localization, photo, role, subscription_plan, subscription_status, subscription_expiry FROM users WHERE id = ?'
    ).get(payload.userId) as any;

    if (!user) return apiError('Utilizador não encontrado', 404);

    return apiOk(user);
  } catch (err: any) {
    console.error('Profile GET error:', err);
    return apiError('Erro interno do servidor', 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const payload = await getAuthPayload(req);
    if (!payload) return apiError('Não autenticado', 401);

    const body = await req.json();
    const { name, localization, photo } = body;

    const db = getDb();
    db.prepare(`
      UPDATE users 
      SET name = COALESCE(?, name), 
          localization = COALESCE(?, localization), 
          photo = COALESCE(?, photo)
      WHERE id = ?
    `).run(name ?? null, localization ?? null, photo ?? null, payload.userId);

    const updatedUser = db.prepare(
      'SELECT id, name, mobile_number, localization, photo, role, subscription_plan, subscription_status, subscription_expiry FROM users WHERE id = ?'
    ).get(payload.userId) as any;

    return apiOk(updatedUser);
  } catch (err: any) {
    console.error('Profile PUT error:', err);
    return apiError('Erro ao actualizar perfil', 500);
  }
}
