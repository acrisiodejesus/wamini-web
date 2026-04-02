import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthPayload, apiError, apiOk } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const payload = await getAuthPayload(req);
    if (!payload) return apiError('Não autenticado', 401);

    const body = await req.json();
    const { plan } = body; // 'basic', 'plus', 'premium'

    if (!['basic', 'plus', 'premium'].includes(plan)) {
      return apiError('Plano inválido', 400);
    }

    const db = getDb();
    
    // Calcula a data de expiração (1 mês a partir de hoje)
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);
    const expiryStr = expiryDate.toISOString();

    db.prepare(`
      UPDATE users 
      SET subscription_plan = ?, 
          subscription_status = 'active', 
          subscription_expiry = ?
      WHERE id = ?
    `).run(plan, expiryStr, payload.userId);

    const updatedUser = db.prepare(
      'SELECT id, name, mobile_number, localization, photo, role, subscription_plan, subscription_status, subscription_expiry FROM users WHERE id = ?'
    ).get(payload.userId) as any;

    return apiOk({ message: 'Assinatura activada com sucesso!', user: updatedUser });
  } catch (err: any) {
    console.error('Subscription error:', err);
    return apiError('Erro ao processar assinatura', 500);
  }
}
