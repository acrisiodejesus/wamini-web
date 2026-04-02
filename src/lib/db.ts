// ─── SQLite Database — Next.js internal backend ───────────────────────────────
// Funciona sem servidor externo. O ficheiro DB fica em /data/wamini.db
// (volume persistente no Coolify) ou na raiz do projecto em dev.

import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

// Em produção usar /data (volume Coolify), em dev usar a raiz do projecto
const DATA_DIR =
  process.env.NODE_ENV === 'production'
    ? '/data'
    : path.join(process.cwd(), '.db');

// Criar directório se não existir
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'wamini.db');

// Singleton para reutilizar a ligação
let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL'); // melhor performance para reads concorrentes
  _db.pragma('foreign_keys = ON');
  initSchema(_db);
  seedData(_db);
  return _db;
}

// ─── Schema ───────────────────────────────────────────────────────────────────
function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      mobile_number TEXT  NOT NULL UNIQUE,
      password_hash TEXT  NOT NULL,
      localization TEXT,
      photo       TEXT,
      role        TEXT    DEFAULT 'buyer',
      subscription_plan   TEXT    DEFAULT 'free',
      subscription_status TEXT    DEFAULT 'inactive',
      subscription_expiry TEXT,
      created_at  TEXT    DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      name         TEXT    NOT NULL,
      quantity     REAL    NOT NULL DEFAULT 0,
      price        REAL    NOT NULL,
      photo        TEXT,
      category     TEXT    DEFAULT 'PRODUTOS',
      location     TEXT,
      publish_date TEXT    DEFAULT (date('now')),
      user_id      INTEGER NOT NULL REFERENCES users(id),
      created_at   TEXT    DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS inputs (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      name         TEXT    NOT NULL,
      quantity     REAL    NOT NULL DEFAULT 0,
      price        REAL    NOT NULL,
      photo        TEXT,
      publish_date TEXT    DEFAULT (date('now')),
      user_id      INTEGER NOT NULL REFERENCES users(id),
      created_at   TEXT    DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS transports (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      transport_type TEXT    NOT NULL,
      name           TEXT    NOT NULL,
      price_per_km   REAL    NOT NULL,
      photo          TEXT,
      location       TEXT,
      user_id        INTEGER NOT NULL REFERENCES users(id),
      created_at     TEXT    DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS negotiations (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      buyer_id     INTEGER NOT NULL REFERENCES users(id),
      seller_id    INTEGER REFERENCES users(id),
      product_id   INTEGER REFERENCES products(id),
      input_id     INTEGER REFERENCES inputs(id),
      transport_id INTEGER REFERENCES transports(id),
      created_at   TEXT    DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS messages (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      negotiation_id INTEGER NOT NULL REFERENCES negotiations(id),
      sender_id      INTEGER NOT NULL REFERENCES users(id),
      body           TEXT,
      attachment_url TEXT,
      attachment_type TEXT,
      is_read        INTEGER DEFAULT 0,
      timestamp      TEXT    DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS prices (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      product  TEXT    NOT NULL,
      price    TEXT    NOT NULL,
      unit     TEXT    NOT NULL DEFAULT 'MT/kg',
      location TEXT    NOT NULL,
      date     TEXT    NOT NULL,
      trend    TEXT    DEFAULT 'stable'
    );
  `);

  // Migrações em tempo real para tabelas existentes
  try { db.exec('ALTER TABLE messages ADD COLUMN is_read INTEGER DEFAULT 0;'); } catch (e) { /* Coluna já existe */ }
  try { db.exec('ALTER TABLE messages ADD COLUMN attachment_url TEXT;'); } catch (e) { /* Coluna já existe */ }
  try { db.exec('ALTER TABLE messages ADD COLUMN attachment_type TEXT;'); } catch (e) { /* Coluna já existe */ }
  try { db.exec('ALTER TABLE users ADD COLUMN subscription_plan TEXT DEFAULT "free";'); } catch (e) { }
  try { db.exec('ALTER TABLE users ADD COLUMN subscription_status TEXT DEFAULT "inactive";'); } catch (e) { }
  try { db.exec('ALTER TABLE users ADD COLUMN subscription_expiry TEXT;'); } catch (e) { }
}

// ─── Seed data (só insere se a DB estiver vazia) ──────────────────────────────
function seedData(db: Database.Database) {
  const userCount = (db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c;
  if (userCount > 0) return; // Já foi initializada

  // Utilizadores demo — password "demo123" gerada com bcrypt em runtime
  const demoHash = bcrypt.hashSync('demo123', 10);

  const insertUser = db.prepare(`
    INSERT INTO users (name, mobile_number, password_hash, localization, role)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertUser.run('Armando Maputo', '841234567', demoHash, 'Nampula', 'farmer');
  insertUser.run('Maria da Graça', '879876543', demoHash, 'Monapo', 'buyer');
  insertUser.run('João Transportes', '862345678', demoHash, 'Nacala-Porto', 'transporter');

  // Produtos agrícolas
  const insertProduct = db.prepare(`
    INSERT INTO products (name, quantity, price, photo, category, location, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const products = [
    ['Tomate Vermelho — 50kg', 200, 70, 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=400', 'PRODUTOS', 'Nampula', 1],
    ['Milho Branco — 100kg', 500, 45, 'https://images.unsplash.com/photo-1601593346740-925612772716?auto=format&fit=crop&q=80&w=400', 'PRODUTOS', 'Monapo', 1],
    ['Feijão Manteiga — 25kg', 150, 120, 'https://images.unsplash.com/photo-1559181567-c3190bef1eb4?auto=format&fit=crop&q=80&w=400', 'PRODUTOS', 'Murrupula', 2],
    ['Arroz Carolino — 50kg', 80, 85, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=400', 'PRODUTOS', 'Nampula', 1],
    ['Mandioca Fresca — 30kg', 300, 25, 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&q=80&w=400', 'PRODUTOS', 'Meconta', 3],
    ['Batata-doce — 20kg', 120, 35, 'https://images.unsplash.com/photo-1596097635121-14b63b7a0c19?auto=format&fit=crop&q=80&w=400', 'PRODUTOS', 'Angoche', 2],
    ['Amendoim — 10kg', 400, 95, 'https://images.unsplash.com/photo-1567892320421-4ef5c96e7e49?auto=format&fit=crop&q=80&w=400', 'PRODUTOS', 'Ribaué', 1],
    ['Caju — 15kg', 60, 150, 'https://images.unsplash.com/photo-1617576683096-00fc8eecb3af?auto=format&fit=crop&q=80&w=400', 'PRODUTOS', 'Memba', 3],
    ['Gergelim — 5kg', 200, 180, 'https://images.unsplash.com/photo-1559181567-c3190bef1eb4?auto=format&fit=crop&q=80&w=400', 'PRODUTOS', 'Malema', 2],
    ['Soja — 40kg', 250, 65, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=400', 'PRODUTOS', 'Rapale', 1],
    ['Banana Madura — caixa', 90, 40, 'https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&q=80&w=400', 'PRODUTOS', 'Moma', 3],
    ['Papaia — 20kg', 70, 30, 'https://images.unsplash.com/photo-1526318896980-cf78c088247c?auto=format&fit=crop&q=80&w=400', 'PRODUTOS', 'Nacala-Porto', 2],
  ];
  for (const p of products) insertProduct.run(...p);

  // Insumos
  const insertInput = db.prepare(`
    INSERT INTO inputs (name, quantity, price, photo, user_id)
    VALUES (?, ?, ?, ?, ?)
  `);

  const inputs = [
    ['Fertilizante NPK — 50kg', 100, 1800, 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&q=80&w=400', 1],
    ['Sementes de Milho Híbrido — 5kg', 200, 450, 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&q=80&w=400', 2],
    ['Pesticida Orgânico — 5L', 50, 800, 'https://images.unsplash.com/photo-1592921870789-04563d55041c?auto=format&fit=crop&q=80&w=400', 1],
    ['Composto Orgânico — 25kg', 300, 300, 'https://images.unsplash.com/photo-1585513692055-8fe3beea5b3f?auto=format&fit=crop&q=80&w=400', 3],
    ['Herbicida — 1L', 80, 650, 'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&q=80&w=400', 2],
    ['Sementes de Tomate — 100g', 500, 120, 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=400', 1],
    ['Irrigação por Gotejamento — Kit', 20, 4500, 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&q=80&w=400', 3],
    ['Esterco de Bovino — 50kg', 150, 180, 'https://images.unsplash.com/photo-1585513692055-8fe3beea5b3f?auto=format&fit=crop&q=80&w=400', 2],
  ];
  for (const i of inputs) insertInput.run(...i);

  // Transportes
  const insertTransport = db.prepare(`
    INSERT INTO transports (transport_type, name, price_per_km, photo, location, user_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const transports = [
    ['Camião', 'Camião 10 Toneladas — Nampula', 15, 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=400', 'Nampula', 3],
    ['Pick-up', 'Pick-up Toyota Hilux — Monapo', 8, 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=400', 'Monapo', 3],
    ['Moto', 'Moto de Carga — Nacala', 4, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=400', 'Nacala-Porto', 1],
    ['Camioneta', 'Camioneta Frigorífica — Nampula', 25, 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=400', 'Nampula', 2],
    ['Camião', 'Camião de Carga — Ribaué', 12, 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=400', 'Ribaué', 3],
    ['Bicicleta', 'Triciclo de Carga — Angoche', 2, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=400', 'Angoche', 1],
  ];
  for (const t of transports) insertTransport.run(...t);

  // Preços de mercado
  const insertPrice = db.prepare(`
    INSERT INTO prices (product, price, unit, location, date, trend)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const prices = [
    ['Tomate', '70', 'MT/kg', 'Nampula', '01 Abr 2026', 'up'],
    ['Milho', '45', 'MT/kg', 'Monapo', '01 Abr 2026', 'stable'],
    ['Feijão', '120', 'MT/kg', 'Murrupula', '01 Abr 2026', 'up'],
    ['Arroz', '85', 'MT/kg', 'Nampula', '01 Abr 2026', 'down'],
    ['Mandioca', '25', 'MT/kg', 'Meconta', '01 Abr 2026', 'stable'],
    ['Batata-doce', '35', 'MT/kg', 'Angoche', '01 Abr 2026', 'up'],
    ['Amendoim', '95', 'MT/kg', 'Ribaué', '01 Abr 2026', 'stable'],
    ['Caju', '150', 'MT/kg', 'Memba', '01 Abr 2026', 'down'],
    ['Gergelim', '180', 'MT/kg', 'Malema', '01 Abr 2026', 'up'],
    ['Soja', '65', 'MT/kg', 'Rapale', '01 Abr 2026', 'stable'],
    ['Banana', '40', 'MT/caixa', 'Moma', '01 Abr 2026', 'down'],
    ['Papaia', '30', 'MT/kg', 'Nacala-Porto', '01 Abr 2026', 'stable'],
    ['Alho', '200', 'MT/kg', 'Nampula', '01 Abr 2026', 'up'],
    ['Cebola', '55', 'MT/kg', 'Monapo', '01 Abr 2026', 'stable'],
    ['Piri-piri', '90', 'MT/kg', 'Murrupula', '01 Abr 2026', 'up'],
  ];
  for (const p of prices) insertPrice.run(...p);

  // Uma negociação de exemplo
  const negId = db.prepare(`
    INSERT INTO negotiations (buyer_id, seller_id, product_id)
    VALUES (?, ?, ?)
  `).run(2, 1, 1).lastInsertRowid;

  db.prepare(`
    INSERT INTO messages (negotiation_id, sender_id, body)
    VALUES (?, ?, ?)
  `).run(negId, 2, 'Bom dia! Tenho interesse no Tomate. Ainda está disponível?');

  db.prepare(`
    INSERT INTO messages (negotiation_id, sender_id, body)
    VALUES (?, ?, ?)
  `).run(negId, 1, 'Bom dia! Sim, ainda tenho stock. Posso vender 50kg a 65 MT/kg.');
}
