// GET /api/v1/transports
// POST /api/v1/transports
import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthPayload, apiError, apiOk } from '@/lib/auth';

export async function GET() {
  try {
    const db = getDb();
    const transports = db.prepare(
      `SELECT t.*, u.name as owner_name
       FROM transports t
       LEFT JOIN users u ON t.user_id = u.id
       ORDER BY t.created_at DESC`
    ).all();
    return apiOk(transports);
  } catch (err: any) {
    console.error('Transports GET error:', err);
    return apiError('Erro interno do servidor', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await getAuthPayload(req);
    if (!payload) return apiError('Não autenticado', 401);

    const body = await req.json();
    const { transport_type, name, price_per_km, photo, location } = body;

    if (!transport_type || !name || price_per_km === undefined) {
      return apiError('Tipo, nome e preço/km são obrigatórios', 400);
    }

    const db = getDb();
    const result = db.prepare(`
      INSERT INTO transports (transport_type, name, price_per_km, photo, location, user_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(transport_type, name, price_per_km, photo ?? null, location ?? null, payload.userId);

    return apiOk({ message: 'Transporte criado com sucesso', transport_id: result.lastInsertRowid }, 201);
  } catch (err: any) {
    console.error('Transports POST error:', err);
    return apiError('Erro interno do servidor', 500);
  }
}
