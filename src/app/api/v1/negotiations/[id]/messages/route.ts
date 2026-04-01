// GET /api/v1/negotiations/[id]/messages
// POST /api/v1/negotiations/[id]/messages
import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthPayload, apiError, apiOk } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await getAuthPayload(req);
    if (!payload) return apiError('Não autenticado', 401);

    const { id } = await params;
    const db = getDb();

    // Verificar acesso
    const neg = db.prepare(
      'SELECT id FROM negotiations WHERE id = ? AND (buyer_id = ? OR seller_id = ?)'
    ).get(Number(id), payload.userId, payload.userId);
    if (!neg) return apiError('Negociação não encontrada', 404);

    const messages = db.prepare(`
      SELECT m.*, u.name as sender_name
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.negotiation_id = ?
      ORDER BY m.timestamp ASC
    `).all(Number(id));

    return apiOk(messages);
  } catch (err: any) {
    console.error('Messages GET error:', err);
    return apiError('Erro interno do servidor', 500);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await getAuthPayload(req);
    if (!payload) return apiError('Não autenticado', 401);

    const { id } = await params;
    const body = await req.json();
    const { body: msgBody } = body;

    if (!msgBody?.trim()) {
      return apiError('Mensagem não pode estar vazia', 400);
    }

    const db = getDb();

    // Verificar acesso
    const neg = db.prepare(
      'SELECT id FROM negotiations WHERE id = ? AND (buyer_id = ? OR seller_id = ?)'
    ).get(Number(id), payload.userId, payload.userId);
    if (!neg) return apiError('Negociação não encontrada', 404);

    const result = db.prepare(`
      INSERT INTO messages (negotiation_id, sender_id, body)
      VALUES (?, ?, ?)
    `).run(Number(id), payload.userId, msgBody.trim());

    const message = db.prepare(`
      SELECT m.*, u.name as sender_name
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?
    `).get(result.lastInsertRowid);

    return apiOk({ message: 'Mensagem enviada', data: message }, 201);
  } catch (err: any) {
    console.error('Messages POST error:', err);
    return apiError('Erro interno do servidor', 500);
  }
}
