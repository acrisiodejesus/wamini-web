import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthPayload, apiError, apiOk } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const payload = await getAuthPayload(req);
    if (!payload) return apiError('Não autenticado', 401);

    const db = getDb();
    const actorId = (payload as any)._testLocalId || (payload as any).userId;

    const user = db.prepare(`
      SELECT id, name, mobile_number, localization, photo, role, subscription_plan, subscription_status, subscription_expiry 
      FROM users 
      WHERE id = ? AND deleted_at IS NULL
    `).get(actorId) as any;

    if (!user) return apiError('Utilizador não encontrado', 404);

    // COMPLIANCE: Audit read access to sensitive profile data
    recordAuditLog(db, req, {
      actor_id: actorId,
      action: 'ACCESS',
      entity_type: 'users',
      entity_id: actorId,
      old_data: { context: 'Internal profile view' }
    });

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
    const actorId = (payload as any)._testLocalId || (payload as any).userId;

    // Fetch old data for audit
    const oldUser = db.prepare('SELECT name, localization, photo FROM users WHERE id = ? AND deleted_at IS NULL').get(actorId) as any;
    if (!oldUser) return apiError('Utilizador não encontrado', 404);

    db.prepare(`
      UPDATE users 
      SET name = COALESCE(?, name), 
          localization = COALESCE(?, localization), 
          photo = COALESCE(?, photo),
          updated_at = datetime('now')
      WHERE id = ?
    `).run(name ?? null, localization ?? null, photo ?? null, actorId);

    const updatedUser = db.prepare(`
      SELECT id, name, mobile_number, localization, photo, role, subscription_plan, subscription_status, subscription_expiry 
      FROM users 
      WHERE id = ?
    `).get(actorId) as any;

    // COMPLIANCE: Audit update - fraud-proof record
    recordAuditLog(db, req, {
      actor_id: actorId,
      action: 'UPDATE',
      entity_type: 'users',
      entity_id: actorId,
      old_data: oldUser,
      new_data: { name: updatedUser.name, localization: updatedUser.localization, photo: updatedUser.photo }
    });

    return apiOk(updatedUser);
  } catch (err: any) {
    console.error('Profile PUT error:', err);
    return apiError('Erro ao actualizar perfil', 500);
  }
}

