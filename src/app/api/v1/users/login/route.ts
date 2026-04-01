// POST /api/v1/users/login
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { signToken, apiError, apiOk } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mobile_number, password } = body;

    if (!mobile_number || !password) {
      return apiError('Número de telefone e senha são obrigatórios', 400);
    }

    const db = getDb();
    const user = db.prepare(
      'SELECT id, name, mobile_number, password_hash, localization, photo, role FROM users WHERE mobile_number = ?'
    ).get(mobile_number) as any;

    if (!user) {
      return apiError('Número ou senha incorrectos', 401);
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return apiError('Número ou senha incorrectos', 401);
    }

    const access_token = await signToken({ userId: user.id, mobile_number: user.mobile_number });

    return apiOk({
      access_token,
      user: { id: user.id, name: user.name },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return apiError('Erro interno do servidor', 500);
  }
}
