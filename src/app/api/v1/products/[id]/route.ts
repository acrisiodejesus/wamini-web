// DELETE /api/v1/products/[id]
import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthPayload, apiError, apiOk } from '@/lib/auth';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await getAuthPayload(req);
    if (!payload) return apiError('Não autenticado', 401);

    const { id } = await params;
    const db = getDb();

    // Só o dono pode apagar
    const product = db.prepare('SELECT user_id FROM products WHERE id = ?').get(Number(id)) as any;
    if (!product) return apiError('Produto não encontrado', 404);
    if (product.user_id !== payload.userId) return apiError('Sem permissão', 403);

    db.prepare('DELETE FROM products WHERE id = ?').run(Number(id));
    return apiOk({ message: 'Produto removido com sucesso' });
  } catch (err: any) {
    console.error('Product DELETE error:', err);
    return apiError('Erro interno do servidor', 500);
  }
}
