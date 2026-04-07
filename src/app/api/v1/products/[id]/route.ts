import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthPayload, apiError, apiOk } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await getAuthPayload(req);
    const { id } = await params;
    const db = getDb();

    const product = db.prepare(`
      SELECT p.*, u.name as seller_name
      FROM products p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = ? AND p.deleted_at IS NULL
    `).get(Number(id)) as any;

    if (!product) return apiError('Produto não encontrado ou removido', 404);

    // COMPLIANCE: Audit read access
    recordAuditLog(db, req, {
      actor_id: (payload as any)?._testLocalId || (payload as any)?.userId || null,
      action: 'ACCESS',
      entity_type: 'products',
      entity_id: Number(id),
      old_data: { context: 'Individual product view' }
    });

    return apiOk(product);
  } catch (err: any) {
    console.error('Product GET error:', err);
    return apiError('Erro interno do servidor', 500);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await getAuthPayload(req);
    if (!payload) return apiError('Não autenticado', 401);

    const { id } = await params;
    const db = getDb();
    const actorId = (payload as any)._testLocalId || (payload as any).userId;

    // Fetch previous state for audit log
    const oldProduct = db.prepare('SELECT * FROM products WHERE id = ? AND deleted_at IS NULL').get(Number(id)) as any;
    if (!oldProduct) return apiError('Produto não encontrado', 404);
    if (oldProduct.user_id !== actorId) return apiError('Sem permissão para editar', 403);

    const body = await req.json();
    const { name, quantity, price, location, category } = body;

    db.prepare(`
      UPDATE products 
      SET name = COALESCE(?, name),
          quantity = COALESCE(?, quantity),
          price = COALESCE(?, price),
          location = COALESCE(?, location),
          category = COALESCE(?, category),
          updated_at = datetime('now')
      WHERE id = ?
    `).run(name, quantity, price, location, category, Number(id));

    const newProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(Number(id));

    // COMPLIANCE: Audit update - fraud-proof record of what changed
    recordAuditLog(db, req, {
      actor_id: actorId,
      action: 'UPDATE',
      entity_type: 'products',
      entity_id: Number(id),
      old_data: oldProduct,
      new_data: newProduct
    });

    return apiOk({ message: 'Produto atualizado com sucesso', product: newProduct });
  } catch (err: any) {
    console.error('Product PUT error:', err);
    return apiError('Erro interno do servidor', 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await getAuthPayload(req);
    if (!payload) return apiError('Não autenticado', 401);

    const { id } = await params;
    const db = getDb();
    const actorId = (payload as any)._testLocalId || (payload as any).userId;

    // Só o dono pode apagar
    const product = db.prepare('SELECT user_id, name FROM products WHERE id = ? AND deleted_at IS NULL').get(Number(id)) as any;
    if (!product) return apiError('Produto não encontrado', 404);
    if (product.user_id !== actorId) return apiError('Sem permissão', 403);

    // SOFT DELETE: Mark as deleted but keep the record
    db.prepare("UPDATE products SET deleted_at = datetime('now') WHERE id = ?").run(Number(id));

    // COMPLIANCE: Audit deletion
    recordAuditLog(db, req, {
      actor_id: actorId,
      action: 'SOFT_DELETE',
      entity_type: 'products',
      entity_id: Number(id),
      old_data: { name: product.name, context: 'Soft deletion by user requested' }
    });

    return apiOk({ message: 'Produto removido com sucesso' });
  } catch (err: any) {
    console.error('Product DELETE error:', err);
    return apiError('Erro interno do servidor', 500);
  }
}

