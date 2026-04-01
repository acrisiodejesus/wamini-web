// POST /api/v1/users/register
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { apiError, apiOk } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, mobile_number, password, localization, photo } = body;

    if (!name || !mobile_number || !password) {
      return apiError('Nome, número de telefone e senha são obrigatórios', 400);
    }

    if (password.length < 6) {
      return apiError('A senha deve ter pelo menos 6 caracteres', 400);
    }

    const db = getDb();

    // Verificar se o número já existe
    const existing = db.prepare('SELECT id FROM users WHERE mobile_number = ?').get(mobile_number);
    if (existing) {
      return apiError('Este número de telefone já está registado', 409);
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = db.prepare(`
      INSERT INTO users (name, mobile_number, password_hash, localization, photo)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, mobile_number, password_hash, localization ?? null, photo ?? null);

    return apiOk({ message: 'Utilizador registado com sucesso', user_id: result.lastInsertRowid }, 201);
  } catch (err: any) {
    console.error('Register error:', err);
    return apiError('Erro interno do servidor', 500);
  }
}
