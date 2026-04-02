// GET /api/v1/products — listar produtos
// POST /api/v1/products — criar produto
import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthPayload, apiError, apiOk } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryQuery = searchParams.get('category') || 'Tudo';
    const search = searchParams.get('search') || '';

    const db = getDb();
    let queryParts: string[] = [];
    let params: any[] = [];

    // Base queries for each type
    const productQuery = `
      SELECT p.id, p.name, p.quantity, p.price, p.photo, p.category, p.location, 'product' as item_type, u.name as seller_name, p.created_at
      FROM products p
      LEFT JOIN users u ON p.user_id = u.id
    `;
    const inputQuery = `
      SELECT i.id, i.name, i.quantity, i.price, i.photo, 'Insumos' as category, NULL as location, 'input' as item_type, u.name as seller_name, i.created_at
      FROM inputs i
      LEFT JOIN users u ON i.user_id = u.id
    `;
    const transportQuery = `
      SELECT t.id, t.name, NULL as quantity, t.price_per_km as price, t.photo, 'Transporte' as category, t.location, 'transport' as item_type, u.name as seller_name, t.created_at
      FROM transports t
      LEFT JOIN users u ON t.user_id = u.id
    `;

    // Filter by type/category matching components/features/MarketFilters.tsx
    if (categoryQuery === 'Tudo') {
      queryParts = [productQuery, inputQuery, transportQuery];
    } else if (categoryQuery === 'Produtos') {
      queryParts = [productQuery];
    } else if (categoryQuery === 'Insumos') {
      queryParts = [inputQuery];
    } else if (categoryQuery === 'Transporte') {
      queryParts = [transportQuery];
    } else {
      // Fallback for custom categories
      queryParts = [`${productQuery} WHERE p.category = ?`];
      params.push(categoryQuery);
    }

    // Apply search to each part of the union
    const finalQuery = queryParts.map(part => {
      if (search) {
        const hasWhere = part.includes('WHERE');
        const searchParam = `%${search}%`;
        params.push(searchParam);
        return `${part} ${hasWhere ? 'AND' : 'WHERE'} (name LIKE ? OR category LIKE ?)`;
      }
      // If we are searching, we need to add the same number of params for category as well
      return part;
    }).join(' UNION ALL ') + ' ORDER BY created_at DESC';

    // Correction: each LIKE needs its own param
    const actualParams: any[] = [];
    const searchParam = `%${search}%`;
    
    // In logic above, I pushed to params inside map, let's fix it properly
    const sanitizedQueryParts = queryParts.map(part => {
      if (search) {
        const hasWhere = part.includes('WHERE');
        actualParams.push(searchParam, searchParam);
        return `${part} ${hasWhere ? 'AND' : 'WHERE'} (name LIKE ? OR category LIKE ?)`;
      }
      return part;
    });

    // Re-handling the custom category param
    const finalParams = categoryQuery !== 'Tudo' && 
                        categoryQuery !== 'Produtos' && 
                        categoryQuery !== 'Insumos' && 
                        categoryQuery !== 'Transporte' 
                        ? [categoryQuery, ...actualParams] 
                        : actualParams;

    const results = db.prepare(sanitizedQueryParts.join(' UNION ALL ') + ' ORDER BY created_at DESC').all(...finalParams);
    
    return apiOk(results);
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

    // Dicionário de Imagens Locais Robustas (Public/Products)
    const fallbackImages: Record<string, string> = {
      tomate: '/products/tomate.png',
      milho: '/products/milho.png',
      'feijão': '/products/feijao.png',
      feijao: '/products/feijao.png',
      arroz: '/products/arroz.png',
      mandioca: '/products/mandioca.png',
      batata: '/products/batata_doce.png',
      amendoim: '/products/amendoim.png',
      caju: '/products/caju.png',
      gergelim: '/products/gergelim.png',
      soja: '/products/soja.png',
      banana: '/products/banana.png',
      papaia: '/products/papaia.png',
      default: '/products/milho.png'
    };

    let finalPhoto = photo ?? null;
    if (!finalPhoto) {
      const lowerName = name.toLowerCase();
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
