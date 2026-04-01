// GET /api/v1/inputs
// POST /api/v1/inputs
import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthPayload, apiError, apiOk } from '@/lib/auth';

export async function GET() {
  try {
    const db = getDb();
    const inputs = db.prepare(
      `SELECT i.*, u.name as seller_name
       FROM inputs i
       LEFT JOIN users u ON i.user_id = u.id
       ORDER BY i.created_at DESC`
    ).all();
    return apiOk(inputs);
  } catch (err: any) {
    console.error('Inputs GET error:', err);
    return apiError('Erro interno do servidor', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await getAuthPayload(req);
    if (!payload) return apiError('Não autenticado', 401);

    const body = await req.json();
    const { name, quantity, price, photo } = body;

    if (!name || price === undefined) {
      return apiError('Nome e preço são obrigatórios', 400);
    }

    const db = getDb();
    const result = db.prepare(`
      INSERT INTO inputs (name, quantity, price, photo, user_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, quantity ?? 0, price, photo ?? null, payload.userId);

    return apiOk({ message: 'Insumo criado com sucesso', input_id: result.lastInsertRowid }, 201);
  } catch (err: any) {
    console.error('Inputs POST error:', err);
    return apiError('Erro interno do servidor', 500);
  }
}
