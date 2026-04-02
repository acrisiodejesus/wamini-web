import { NextRequest, NextResponse } from 'next/server';
import { getAuthPayload, apiError, apiOk } from '@/lib/auth';
import path from 'path';
import fs from 'fs';

const DATA_DIR =
  process.env.NODE_ENV === 'production'
    ? '/data'
    : path.join(process.cwd(), '.db');

const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export async function POST(req: NextRequest) {
  try {
    const payload = await getAuthPayload(req);
    if (!payload) return apiError('Não autenticado', 401);

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return apiError('Nenhum ficheiro fornecido', 400);
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Gerar nome único
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const originalExt = path.extname(file.name) || '';
    const filename = `upload_${uniqueSuffix}${originalExt}`;
    const filepath = path.join(UPLOADS_DIR, filename);

    // Escrever ficheiro
    fs.writeFileSync(filepath, buffer);

    // O URL de acesso será o nosso endpoint GET respectivo
    const fileUrl = `/api/v1/uploads/${filename}`;
    
    // Identificar tipo basico
    let type = 'file';
    if (file.type.startsWith('image/')) type = 'image';
    if (file.type.startsWith('video/')) type = 'video';

    return apiOk({ 
      url: fileUrl,
      type: type,
      name: file.name
    }, 201);
  } catch (err: any) {
    console.error('File upload error:', err);
    return apiError('Erro a gravar anexo', 500);
  }
}
