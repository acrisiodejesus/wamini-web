// GET /api/v1/prices — preços de mercado
import { getDb } from '@/lib/db';
import { apiError, apiOk } from '@/lib/auth';

export async function GET() {
  try {
    const db = getDb();
    const prices = db.prepare('SELECT * FROM prices ORDER BY product ASC').all();
    return apiOk(prices);
  } catch (err: any) {
    console.error('Prices GET error:', err);
    return apiError('Erro interno do servidor', 500);
  }
}
