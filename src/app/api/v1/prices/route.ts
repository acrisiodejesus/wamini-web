import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthPayload, apiError, apiOk } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const payload = await getAuthPayload(req);
    const db = getDb();
    const prices = db.prepare('SELECT * FROM prices ORDER BY product ASC').all();

    // COMPLIANCE: Audit read access to market prices
    recordAuditLog(db, req, {
      actor_id: (payload as any)?._testLocalId || (payload as any)?.userId || null,
      action: 'ACCESS',
      entity_type: 'market_prices',
      entity_id: null,
      new_data: { productCount: prices.length }
    });

    return apiOk(prices);
  } catch (err: any) {
    console.error('Prices GET error:', err);
    return apiError('Erro interno do servidor', 500);
  }
}

