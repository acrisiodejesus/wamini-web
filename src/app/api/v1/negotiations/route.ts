// GET /api/v1/negotiations
// POST /api/v1/negotiations
import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthPayload, apiError, apiOk } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const payload = await getAuthPayload(req);
    if (!payload) return apiError('Não autenticado', 401);

    const db = getDb();
    const negotiations = db.prepare(`
      SELECT
        n.*,
        u.name as other_user_name,
        p.name as product_name,
        i.name as input_name,
        t.name as transport_name
      FROM negotiations n
      LEFT JOIN users u ON (
        CASE WHEN n.buyer_id = ? THEN n.seller_id ELSE n.buyer_id END = u.id
      )
      LEFT JOIN products p ON n.product_id = p.id
      LEFT JOIN inputs i ON n.input_id = i.id
      LEFT JOIN transports t ON n.transport_id = t.id
      WHERE n.buyer_id = ? OR n.seller_id = ?
      ORDER BY n.created_at DESC
    `).all(payload.userId, payload.userId, payload.userId);

    // Incluir última mensagem e contagem
    const withMessages = negotiations.map((neg: any) => {
      const lastMsg = db.prepare(`
        SELECT body, timestamp FROM messages
        WHERE negotiation_id = ?
        ORDER BY timestamp DESC LIMIT 1
      `).get(neg.id) as any;

      const unreadCount = (db.prepare(`
        SELECT COUNT(*) as c FROM messages
        WHERE negotiation_id = ? AND sender_id != ? AND is_read = 0
      `).get(neg.id, payload.userId) as any).c;

      return {
        ...neg,
        last_message: lastMsg?.body ?? null,
        last_timestamp: lastMsg?.timestamp ?? neg.created_at,
        unread_count: unreadCount
      };
    });

    return apiOk(withMessages);
  } catch (err: any) {
    console.error('Negotiations GET error:', err);
    return apiError('Erro interno do servidor', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await getAuthPayload(req);
    if (!payload) return apiError('Não autenticado', 401);

    const body = await req.json();
    const { product_id, input_id, transport_id, messages } = body;

    if (!product_id && !input_id && !transport_id) {
      return apiError('É necessário indicar um produto, insumo ou transporte', 400);
    }

    const db = getDb();

    // Determinar o seller_id
    let seller_id: number | null = null;
    if (product_id) {
      const prod = db.prepare('SELECT user_id FROM products WHERE id = ?').get(product_id) as any;
      seller_id = prod?.user_id ?? null;
    } else if (input_id) {
      const inp = db.prepare('SELECT user_id FROM inputs WHERE id = ?').get(input_id) as any;
      seller_id = inp?.user_id ?? null;
    } else if (transport_id) {
      const tr = db.prepare('SELECT user_id FROM transports WHERE id = ?').get(transport_id) as any;
      seller_id = tr?.user_id ?? null;
    }

    const result = db.prepare(`
      INSERT INTO negotiations (buyer_id, seller_id, product_id, input_id, transport_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      payload.userId,
      seller_id,
      product_id ?? null,
      input_id ?? null,
      transport_id ?? null
    );

    // Inserir mensagem inicial se fornecida
    if (messages && Array.isArray(messages) && messages.length > 0) {
      for (const msg of messages) {
        db.prepare(`
          INSERT INTO messages (negotiation_id, sender_id, body)
          VALUES (?, ?, ?)
        `).run(result.lastInsertRowid, payload.userId, msg.body ?? msg);
      }
    }

    return apiOk({ message: 'Negociação criada', negotiation_id: result.lastInsertRowid }, 201);
  } catch (err: any) {
    console.error('Negotiations POST error:', err);
    return apiError('Erro interno do servidor', 500);
  }
}
