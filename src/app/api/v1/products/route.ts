// GET /api/v1/products — listar produtos
// POST /api/v1/products — criar produto
import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthPayload, apiError, apiOk } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const products = db.prepare(
      `SELECT p.*, u.name as seller_name
       FROM products p
       LEFT JOIN users u ON p.user_id = u.id
       ORDER BY p.created_at DESC`
    ).all();
    return apiOk(products);
  } catch (err: any) {
    console.error('Products GET error:', err);
    return apiError('Erro interno do servidor', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await getAuthPayload(req);
    if (!payload) return apiError('Não autenticado', 401);

    const body = await req.json();
    const { name, quantity, price, photo, category, location } = body;

    if (!name || price === undefined) {
      return apiError('Nome e preço são obrigatórios', 400);
    }

    const db = getDb();
    const result = db.prepare(`
      INSERT INTO products (name, quantity, price, photo, category, location, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      name,
      quantity ?? 0,
      price,
      photo ?? null,
      category ?? 'PRODUTOS',
      location ?? null,
      payload.userId
    );

    return apiOk({ message: 'Produto criado com sucesso', product_id: result.lastInsertRowid }, 201);
  } catch (err: any) {
    console.error('Products POST error:', err);
    return apiError('Erro interno do servidor', 500);
  }
}
