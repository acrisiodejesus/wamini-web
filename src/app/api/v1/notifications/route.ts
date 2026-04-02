import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthPayload, apiError, apiOk } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const payload = await getAuthPayload(req);
    if (!payload) return apiError('Não autenticado', 401);

    const db = getDb();
    
    // Obter todas as mensagens não lidas enviadas para mim
    // "Enviadas para mim" significa que a negociação pertence-me (sou buyer ou seller)
    // E o sender_id da mensagem != do meu userId.
    const unread = db.prepare(`
      SELECT m.id, m.negotiation_id, m.sender_id, m.body, m.timestamp, u.name as sender_name
      FROM messages m
      JOIN negotiations n ON m.negotiation_id = n.id
      JOIN users u ON m.sender_id = u.id
      WHERE (n.buyer_id = ? OR n.seller_id = ?)
        AND m.sender_id != ?
        AND m.is_read = 0
      ORDER BY m.timestamp DESC
    `).all(payload.userId, payload.userId, payload.userId);

    const total = unread.length;

    return apiOk({
      total,
      notifications: unread 
    });
  } catch (err: any) {
    console.error('Notifications GET error:', err);
    return apiError('Erro interno do servidor', 500);
  }
}
