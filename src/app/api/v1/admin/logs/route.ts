import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { apiError, apiOk } from '@/lib/auth';
import { ensureAdmin } from '@/lib/admin';

export async function GET(req: NextRequest) {
  try {
    const admin = await ensureAdmin(req);
    if (!admin) return apiError('Acesso restrito: Administradores apenas', 403);

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const entityType = searchParams.get('entity_type');

    const db = getDb();
    let query = 'SELECT * FROM audit_logs';
    let params: any[] = [];

    if (entityType) {
      query += ' WHERE entity_type = ?';
      params.push(entityType);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const logs = db.prepare(query).all(...params);
    const total = db.prepare('SELECT COUNT(*) as count FROM audit_logs').get() as { count: number };

    return apiOk({ logs, total: total.count });
  } catch (err: any) {
    console.error('Admin Logs GET error:', err);
    return apiError('Erro interno ao carregar logs', 500);
  }
}
