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

    // Dicionário de Imagens Fallback Premium
    const fallbackImages: Record<string, string> = {
      tomate: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=400',
      milho: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&q=80&w=400',
      'feijão': 'https://images.unsplash.com/photo-1559181567-c3190bef1eb4?auto=format&fit=crop&q=80&w=400',
      feijao: 'https://images.unsplash.com/photo-1559181567-c3190bef1eb4?auto=format&fit=crop&q=80&w=400',
      arroz: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=400',
      mandioca: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&q=80&w=400',
      batata: 'https://images.unsplash.com/photo-1596097635121-14b63b7a0c19?auto=format&fit=crop&q=80&w=400',
      amendoim: 'https://images.unsplash.com/photo-1567892320421-4ef5c96e7e49?auto=format&fit=crop&q=80&w=400',
      caju: 'https://images.unsplash.com/photo-1617576683096-00fc8eecb3af?auto=format&fit=crop&q=80&w=400',
      gergelim: 'https://images.unsplash.com/photo-1559181567-c3190bef1eb4?auto=format&fit=crop&q=80&w=400',
      soja: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=400',
      banana: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&q=80&w=400',
      papaia: 'https://images.unsplash.com/photo-1526318896980-cf78c088247c?auto=format&fit=crop&q=80&w=400',
      default: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&q=80&w=400'
    };

    let finalPhoto = photo ?? null;
    if (!finalPhoto) {
      const lowerName = name.toLowerCase();
      // Encontra a primeira chave no dicionário cujo nome do produto contém
      const match = Object.keys(fallbackImages).find(key => lowerName.includes(key));
      finalPhoto = match ? fallbackImages[match] : fallbackImages['default'];
    }

    const db = getDb();
    const result = db.prepare(`
      INSERT INTO products (name, quantity, price, photo, category, location, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      name,
      quantity ?? 0,
      price,
      finalPhoto,
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
