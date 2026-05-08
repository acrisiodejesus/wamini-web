// ─── Turso/libSQL Database — Vercel-compatible ────────────────────────────────
// Em produção usa Turso via HTTP (variáveis TURSO_DATABASE_URL + TURSO_AUTH_TOKEN).
// Em dev local usa um ficheiro SQLite local via file: protocol.

import { createClient, type Client, type InStatement } from '@libsql/client';

// ─── Client Singleton ─────────────────────────────────────────────────────────
let _client: Client | null = null;
let _initialized = false;

function getClient(): Client {
  if (_client) return _client;

  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    // Turso cloud (ou libSQL server auto-hospedado)
    _client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  } else {
    // Dev local — ficheiro SQLite
    _client = createClient({
      url: 'file:local.db',
    });
  }

  return _client;
}

/**
 * Retorna o cliente libSQL já inicializado.
 * Na primeira chamada, cria as tabelas e faz seed.
 */
export async function getDb(): Promise<Client> {
  const client = getClient();

  if (!_initialized) {
    _initialized = true;
    console.log('--- DB Init: Schema ---');
    await initSchema(client);
    console.log('--- DB Init: Seed ---');
    await seedData(client);
  }

  return client;
}

// ─── Schema ───────────────────────────────────────────────────────────────────
async function initSchema(db: Client) {
  const statements: string[] = [
    `CREATE TABLE IF NOT EXISTS users (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL CHECK(length(name) <= 255),
      mobile_number TEXT  NOT NULL UNIQUE,
      auth0_sub   TEXT    UNIQUE,
      localization TEXT,
      photo       TEXT,
      role        TEXT    DEFAULT 'buyer',
      subscription_plan   TEXT    DEFAULT 'free',
      subscription_status TEXT    DEFAULT 'inactive',
      subscription_expiry TEXT,
      created_at  TEXT    DEFAULT (datetime('now')),
      updated_at  TEXT    DEFAULT (datetime('now')),
      deleted_at  TEXT    DEFAULT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS products (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      name         TEXT    NOT NULL CHECK(length(name) <= 255),
      quantity     REAL    NOT NULL DEFAULT 0,
      price        REAL    NOT NULL,
      photo        TEXT,
      category     TEXT    DEFAULT 'PRODUTOS',
      location     TEXT,
      publish_date TEXT    DEFAULT (date('now')),
      user_id      INTEGER NOT NULL REFERENCES users(id),
      created_at   TEXT    DEFAULT (datetime('now')),
      updated_at   TEXT    DEFAULT (datetime('now')),
      deleted_at   TEXT    DEFAULT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS inputs (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      name         TEXT    NOT NULL CHECK(length(name) <= 255),
      quantity     REAL    NOT NULL DEFAULT 0,
      price        REAL    NOT NULL,
      photo        TEXT,
      publish_date TEXT    DEFAULT (date('now')),
      user_id      INTEGER NOT NULL REFERENCES users(id),
      created_at   TEXT    DEFAULT (datetime('now')),
      updated_at   TEXT    DEFAULT (datetime('now')),
      deleted_at   TEXT    DEFAULT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS transports (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      transport_type TEXT    NOT NULL CHECK(length(transport_type) <= 50),
      name           TEXT    NOT NULL CHECK(length(name) <= 255),
      price_per_km   REAL    NOT NULL,
      photo          TEXT,
      location       TEXT,
      user_id        INTEGER NOT NULL REFERENCES users(id),
      created_at     TEXT    DEFAULT (datetime('now')),
      updated_at     TEXT    DEFAULT (datetime('now')),
      deleted_at     TEXT    DEFAULT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS negotiations (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      buyer_id     INTEGER NOT NULL REFERENCES users(id),
      seller_id    INTEGER REFERENCES users(id),
      product_id   INTEGER REFERENCES products(id),
      input_id     INTEGER REFERENCES inputs(id),
      transport_id INTEGER REFERENCES transports(id),
      status       TEXT    DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'cancelled')),
      created_at   TEXT    DEFAULT (datetime('now')),
      updated_at   TEXT    DEFAULT (datetime('now')),
      deleted_at   TEXT    DEFAULT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS messages (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      negotiation_id INTEGER NOT NULL REFERENCES negotiations(id),
      sender_id      INTEGER NOT NULL REFERENCES users(id),
      body           TEXT    CHECK(length(body) <= 1000),
      attachment_url TEXT,
      attachment_type TEXT,
      is_read        INTEGER DEFAULT 0,
      timestamp      TEXT    DEFAULT (datetime('now')),
      deleted_at     TEXT    DEFAULT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS prices (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      product  TEXT    NOT NULL CHECK(length(product) <= 255),
      price    TEXT    NOT NULL,
      unit     TEXT    NOT NULL DEFAULT 'MT/kg',
      location TEXT    NOT NULL,
      date     TEXT    NOT NULL,
      trend    TEXT    DEFAULT 'stable',
      created_at TEXT  DEFAULT (datetime('now'))
    )`,

    `CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reviewer_id INTEGER NOT NULL REFERENCES users(id),
      target_id INTEGER NOT NULL REFERENCES users(id),
      negotiation_id INTEGER NOT NULL REFERENCES negotiations(id),
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      comment TEXT CHECK(length(comment) <= 300),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      deleted_at TEXT DEFAULT NULL,
      CHECK (reviewer_id != target_id)
    )`,

    `CREATE TABLE IF NOT EXISTS audit_logs (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_id     INTEGER REFERENCES users(id),
      action       TEXT    NOT NULL,
      entity_type  TEXT    NOT NULL,
      entity_id    INTEGER,
      method       TEXT    NOT NULL,
      endpoint     TEXT    NOT NULL,
      old_data     TEXT,
      new_data     TEXT,
      ip_address   TEXT,
      user_agent   TEXT,
      created_at   TEXT    DEFAULT (datetime('now'))
    )`,
  ];

  for (const sql of statements) {
    await db.execute(sql);
  }

  // Safe column migration — ignore errors if columns already exist
  const migrations: string[] = [
    "ALTER TABLE messages ADD COLUMN is_read INTEGER DEFAULT 0",
    "ALTER TABLE messages ADD COLUMN attachment_url TEXT",
    "ALTER TABLE messages ADD COLUMN attachment_type TEXT",
    "ALTER TABLE messages ADD COLUMN deleted_at TEXT DEFAULT NULL",
    "ALTER TABLE users ADD COLUMN subscription_plan TEXT DEFAULT 'free'",
    "ALTER TABLE users ADD COLUMN subscription_status TEXT DEFAULT 'inactive'",
    "ALTER TABLE users ADD COLUMN subscription_expiry TEXT",
  ];

  for (const m of migrations) {
    try { await db.execute(m); } catch { /* column already exists */ }
  }
}

// ─── Seed data (só insere se a DB estiver vazia) ──────────────────────────────
async function seedData(db: Client) {
  const result = await db.execute('SELECT COUNT(*) as c FROM users');
  const count = Number(result.rows[0]?.c ?? 0);
  if (count > 0) return; // Já foi initializada

  // Utilizadores demo
  const users: InStatement[] = [
    { sql: `INSERT INTO users (name, mobile_number, auth0_sub, localization, role) VALUES (?, ?, ?, ?, ?)`,
      args: ['Armando Maputo', '841234567', 'auth0|mock_user_1', 'Nampula', 'farmer'] },
    { sql: `INSERT INTO users (name, mobile_number, auth0_sub, localization, role) VALUES (?, ?, ?, ?, ?)`,
      args: ['Maria da Graça', '879876543', 'auth0|mock_user_2', 'Monapo', 'buyer'] },
    { sql: `INSERT INTO users (name, mobile_number, auth0_sub, localization, role) VALUES (?, ?, ?, ?, ?)`,
      args: ['João Transportes', '862345678', 'auth0|mock_user_3', 'Nacala-Porto', 'transporter'] },
  ];

  // Produtos agrícolas
  const productSQL = `INSERT INTO products (name, quantity, price, photo, category, location, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  const products: InStatement[] = [
    { sql: productSQL, args: ['Tomate Vermelho — 50kg', 200, 70, '/products/tomate.png', 'PRODUTOS', 'Nampula', 1] },
    { sql: productSQL, args: ['Milho Branco — 100kg', 500, 45, '/products/milho.png', 'PRODUTOS', 'Monapo', 1] },
    { sql: productSQL, args: ['Feijão Manteiga — 25kg', 150, 120, '/products/feijao.png', 'PRODUTOS', 'Murrupula', 2] },
    { sql: productSQL, args: ['Arroz Carolino — 50kg', 80, 85, '/products/arroz.png', 'PRODUTOS', 'Nampula', 1] },
    { sql: productSQL, args: ['Mandioca Fresca — 30kg', 300, 25, '/products/mandioca.png', 'PRODUTOS', 'Meconta', 3] },
    { sql: productSQL, args: ['Batata-doce — 20kg', 120, 35, '/products/batata_doce.png', 'PRODUTOS', 'Angoche', 2] },
    { sql: productSQL, args: ['Amendoim — 10kg', 400, 95, '/products/amendoim.png', 'PRODUTOS', 'Ribaué', 1] },
    { sql: productSQL, args: ['Caju — 15kg', 60, 150, '/products/caju.png', 'PRODUTOS', 'Memba', 3] },
    { sql: productSQL, args: ['Gergelim — 5kg', 200, 180, '/products/gergelim.png', 'PRODUTOS', 'Malema', 2] },
    { sql: productSQL, args: ['Soja — 40kg', 250, 65, '/products/soja.png', 'PRODUTOS', 'Rapale', 1] },
    { sql: productSQL, args: ['Banana Madura — caixa', 90, 40, '/products/banana.png', 'PRODUTOS', 'Moma', 3] },
    { sql: productSQL, args: ['Papaia — 20kg', 70, 30, '/products/papaia.png', 'PRODUTOS', 'Nacala-Porto', 2] },
  ];

  // Insumos
  const inputSQL = `INSERT INTO inputs (name, quantity, price, photo, user_id) VALUES (?, ?, ?, ?, ?)`;
  const inputs: InStatement[] = [
    { sql: inputSQL, args: ['Fertilizante NPK — 50kg', 100, 2500, '/products/fertilizante.png', 1] },
    { sql: inputSQL, args: ['Sementes de Milho — 10kg', 50, 1200, '/products/sementes_milho.png', 1] },
    { sql: inputSQL, args: ['Pesticida Orgânico — 5L', 30, 1800, 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=400', 2] },
    { sql: inputSQL, args: ['Composto Orgânico — 25kg', 200, 500, 'https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?q=80&w=400', 3] },
    { sql: inputSQL, args: ['Herbicida — 1L', 40, 950, 'https://images.unsplash.com/photo-1589923188900-85dae523342b?q=80&w=400', 2] },
    { sql: inputSQL, args: ['Sementes de Tomate — 1kg', 20, 2200, '/products/tomate.png', 2] },
    { sql: inputSQL, args: ['Irrigação por Gotejamento — Kit', 10, 8500, 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=400', 1] },
    { sql: inputSQL, args: ['Esterco de Bovino — 30kg', 150, 300, 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?q=80&w=400', 3] },
    { sql: inputSQL, args: ['Saco de Ráfia — 50kg (100un)', 500, 1500, '/products/arroz.png', 1] },
    { sql: inputSQL, args: ['Calcário Agrícola — 40kg', 100, 800, 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=400', 2] },
    { sql: inputSQL, args: ['Enxada Manual — Cabo Madeira', 60, 450, 'https://images.unsplash.com/photo-1589133411037-333e8a716c52?q=80&w=400', 3] },
    { sql: inputSQL, args: ['Pulverizador Costal — 16L', 15, 3800, 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?q=80&w=400', 1] },
  ];

  // Transportes
  const transportSQL = `INSERT INTO transports (transport_type, name, price_per_km, photo, location, user_id) VALUES (?, ?, ?, ?, ?, ?)`;
  const transports: InStatement[] = [
    { sql: transportSQL, args: ['Camião', 'Camião 10 Toneladas', 2.5, 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?q=80&w=400', 'Nampula', 1] },
    { sql: transportSQL, args: ['Pick-up', 'Pick-up Toyota Hilux', 1.2, 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=400', 'Monapo', 1] },
    { sql: transportSQL, args: ['Moto', 'Moto de Carga', 0.8, 'https://images.unsplash.com/photo-1558981403-c5f97cb9d511?q=80&w=400', 'Meconta', 2] },
    { sql: transportSQL, args: ['Camioneta', 'Camioneta Frigorífica', 3.5, 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?q=80&w=400', 'Nacala', 1] },
    { sql: transportSQL, args: ['Camião', 'Camião de Carga — Ribaué', 2.2, 'https://images.unsplash.com/photo-1586191121278-200df44c5b6c?q=80&w=400', 'Ribaué', 3] },
    { sql: transportSQL, args: ['Bicicleta', 'Triciclo de Carga — Angoche', 0.4, 'https://images.unsplash.com/photo-1532152273105-ff390ade94eb?q=80&w=400', 'Angoche', 3] },
    { sql: transportSQL, args: ['Tractor', 'Trator com Reboque', 4.0, 'https://images.unsplash.com/photo-1593110291517-ef5f7ef5e9da?q=80&w=400', 'Malema', 2] },
    { sql: transportSQL, args: ['Carrinha', 'Carrinha 3.5 Toneladas', 1.8, 'https://images.unsplash.com/photo-1542461979660-aa109403c945?q=80&w=400', 'Rapale', 2] },
  ];

  // Preços de mercado
  const priceSQL = `INSERT INTO prices (product, price, unit, location, date, trend) VALUES (?, ?, ?, ?, ?, ?)`;
  const prices: InStatement[] = [
    { sql: priceSQL, args: ['Tomate', '70', 'MT/kg', 'Nampula', '01 Abr 2026', 'up'] },
    { sql: priceSQL, args: ['Milho', '45', 'MT/kg', 'Monapo', '01 Abr 2026', 'stable'] },
    { sql: priceSQL, args: ['Feijão', '120', 'MT/kg', 'Murrupula', '01 Abr 2026', 'up'] },
    { sql: priceSQL, args: ['Arroz', '85', 'MT/kg', 'Nampula', '01 Abr 2026', 'down'] },
    { sql: priceSQL, args: ['Mandioca', '25', 'MT/kg', 'Meconta', '01 Abr 2026', 'stable'] },
    { sql: priceSQL, args: ['Batata-doce', '35', 'MT/kg', 'Angoche', '01 Abr 2026', 'up'] },
    { sql: priceSQL, args: ['Amendoim', '95', 'MT/kg', 'Ribaué', '01 Abr 2026', 'stable'] },
    { sql: priceSQL, args: ['Caju', '150', 'MT/kg', 'Memba', '01 Abr 2026', 'down'] },
    { sql: priceSQL, args: ['Gergelim', '180', 'MT/kg', 'Malema', '01 Abr 2026', 'up'] },
    { sql: priceSQL, args: ['Soja', '65', 'MT/kg', 'Rapale', '01 Abr 2026', 'stable'] },
    { sql: priceSQL, args: ['Banana', '40', 'MT/caixa', 'Moma', '01 Abr 2026', 'down'] },
    { sql: priceSQL, args: ['Papaia', '30', 'MT/kg', 'Nacala-Porto', '01 Abr 2026', 'stable'] },
    { sql: priceSQL, args: ['Alho', '200', 'MT/kg', 'Nampula', '01 Abr 2026', 'up'] },
    { sql: priceSQL, args: ['Cebola', '55', 'MT/kg', 'Monapo', '01 Abr 2026', 'stable'] },
    { sql: priceSQL, args: ['Piri-piri', '90', 'MT/kg', 'Murrupula', '01 Abr 2026', 'up'] },
  ];

  // Executar tudo numa batch para performance
  await db.batch([
    ...users,
    ...products,
    ...inputs,
    ...transports,
    ...prices,
  ], 'write');

  // Negociação de exemplo (pendente)
  await db.execute({
    sql: `INSERT INTO negotiations (buyer_id, seller_id, product_id, status) VALUES (?, ?, ?, 'pending')`,
    args: [2, 1, 1],
  });

  await db.execute({
    sql: `INSERT INTO messages (negotiation_id, sender_id, body) VALUES (?, ?, ?)`,
    args: [1, 2, 'Bom dia! Tenho interesse no Tomate. Ainda está disponível?'],
  });

  await db.execute({
    sql: `INSERT INTO messages (negotiation_id, sender_id, body) VALUES (?, ?, ?)`,
    args: [1, 1, 'Bom dia! Sim, ainda tenho stock. Posso vender 50kg a 65 MT/kg.'],
  });

  // Negociação concluída para TDD e testes do Review zero-trust
  await db.execute({
    sql: `INSERT INTO negotiations (buyer_id, seller_id, product_id, status) VALUES (?, ?, ?, 'completed')`,
    args: [1, 2, 2],
  });

  await db.execute({
    sql: `INSERT INTO messages (negotiation_id, sender_id, body) VALUES (?, ?, ?)`,
    args: [2, 1, 'Vou comprar o milho.'],
  });
}
