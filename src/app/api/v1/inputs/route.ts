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

    const fallbackImages: Record<string, string> = {
      fertilizante: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&q=80&w=400',
      semente: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&q=80&w=400',
      pesticida: 'https://images.unsplash.com/photo-1592921870789-04563d55041c?auto=format&fit=crop&q=80&w=400',
      composto: 'https://images.unsplash.com/photo-1585513692055-8fe3beea5b3f?auto=format&fit=crop&q=80&w=400',
      default: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=400'
    };

    let finalPhoto = photo ?? null;
    if (!finalPhoto) {
      const lowerName = name.toLowerCase();
      const match = Object.keys(fallbackImages).find(key => lowerName.includes(key));
      finalPhoto = match ? fallbackImages[match] : fallbackImages['default'];
    }

    const db = getDb();
    const result = db.prepare(`
      INSERT INTO inputs (name, quantity, price, photo, user_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, quantity ?? 0, price, finalPhoto, payload.userId);

    return apiOk({ message: 'Insumo criado com sucesso', input_id: result.lastInsertRowid }, 201);
  } catch (err: any) {
    console.error('Inputs POST error:', err);
    return apiError('Erro interno do servidor', 500);
  }
}
