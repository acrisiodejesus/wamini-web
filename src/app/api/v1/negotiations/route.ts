// GET /api/v1/negotiations
// POST /api/v1/negotiations
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
      WHERE (n.buyer_id = ? OR n.seller_id = ?) AND n.deleted_at IS NULL
      ORDER BY n.created_at DESC
    `).all(actorId, actorId, actorId);

    // Incluir última mensagem e contagem
    const withMessages = negotiations.map((neg: any) => {
      const lastMsg = db.prepare(`
        SELECT body, timestamp FROM messages
        WHERE negotiation_id = ? AND deleted_at IS NULL
        ORDER BY timestamp DESC LIMIT 1
      `).get(neg.id) as any;

      const unreadCount = (db.prepare(`
        SELECT COUNT(*) as c FROM messages
        WHERE negotiation_id = ? AND sender_id != ? AND is_read = 0 AND deleted_at IS NULL
      `).get(neg.id, actorId) as any).c;

      return {
        ...neg,
        last_message: lastMsg?.body ?? null,
        last_timestamp: lastMsg?.timestamp ?? neg.created_at,
        unread_count: unreadCount
      };
    });

    // COMPLIANCE: Audit read access to sensitive negotiation list
    recordAuditLog(db, req, {
      actor_id: actorId,
      action: 'ACCESS',
      entity_type: 'negotiations_list',
      entity_id: null,
      new_data: { count: withMessages.length }
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

    const actorId = (payload as any)._testLocalId || (payload as any).userId;
    const body = await req.json();
    let { product_id, input_id, transport_id, messages } = body;

    // Helper to strip prefixes if string IDs were passed
    const strip = (id: any) => {
      if (typeof id === 'string') return Number(id.replace(/^(product_|input_|transport_)/, ''));
      return id;
    };

    product_id = strip(product_id);
    input_id = strip(input_id);
    transport_id = strip(transport_id);

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
      actorId,
      seller_id,
      product_id ?? null,
      input_id ?? null,
      transport_id ?? null
    );

    const negId = result.lastInsertRowid;

    // Inserir mensagem inicial se fornecida
    if (messages && Array.isArray(messages) && messages.length > 0) {
      for (const msg of messages) {
        db.prepare(`
          INSERT INTO messages (negotiation_id, sender_id, body)
          VALUES (?, ?, ?)
        `).run(negId, actorId, msg.body ?? msg);
      }
    }

    // COMPLIANCE: Audit creation
    recordAuditLog(db, req, {
      actor_id: actorId,
      action: 'CREATE',
      entity_type: 'negotiations',
      entity_id: Number(negId),
      new_data: { buyer_id: actorId, seller_id, product_id, input_id, transport_id }
    });

    return apiOk({ message: 'Negociação criada', negotiation_id: negId }, 201);
  } catch (err: any) {
    console.error('Negotiations POST error:', err);
    return apiError('Erro interno do servidor', 500);
  }
}

