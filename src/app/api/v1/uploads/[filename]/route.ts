import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

const DATA_DIR =
  process.env.NODE_ENV === 'production'
    ? '/data'
    : path.join(process.cwd(), '.db');

const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    const filepath = path.join(UPLOADS_DIR, filename);

    // Evitar acesso a directórios parentais
    if (!filepath.startsWith(UPLOADS_DIR)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!fs.existsSync(filepath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const stat = fs.statSync(filepath);
    const stream = fs.createReadStream(filepath) as any;

    let contentType = 'application/octet-stream';
    const ext = path.extname(filename).toLowerCase();
    if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    if (ext === '.png') contentType = 'image/png';
    if (ext === '.gif') contentType = 'image/gif';
    if (ext === '.webp') contentType = 'image/webp';
    if (ext === '.mp4') contentType = 'video/mp4';
    if (ext === '.webm') contentType = 'video/webm';

    return new NextResponse(stream, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': stat.size.toString(),
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (err) {
    console.error('File serve error:', err);
    return NextResponse.json({ error: 'Servidor falhou' }, { status: 500 });
  }
}
