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

  // Correcção de imagens de seed antigas (Produção)
  try {
    db.prepare("UPDATE products SET photo = '/products/soja.png' WHERE name LIKE 'Soja%'").run();
    db.prepare("UPDATE products SET photo = '/products/papaia.png' WHERE name LIKE 'Papaia%'").run();
    db.prepare("UPDATE products SET photo = '/products/caju.png' WHERE name LIKE 'Caju%'").run();
    db.prepare("UPDATE products SET photo = '/products/mandioca.png' WHERE name LIKE 'Mandioca%'").run();
    db.prepare("UPDATE products SET photo = '/products/feijao.png' WHERE name LIKE 'Feijão%'").run();
    db.prepare("UPDATE products SET photo = '/products/gergelim.png' WHERE name LIKE 'Gergelim%'").run();
    db.prepare("UPDATE products SET photo = '/products/batata_doce.png' WHERE name LIKE 'Batata-doce%'").run();
    db.prepare("UPDATE products SET photo = '/products/amendoim.png' WHERE name LIKE 'Amendoim%'").run();
    db.prepare("UPDATE products SET photo = '/products/tomate.png' WHERE name LIKE 'Tomate%'").run();
    db.prepare("UPDATE products SET photo = '/products/milho.png' WHERE name LIKE 'Milho%'").run();
    db.prepare("UPDATE products SET photo = '/products/arroz.png' WHERE name LIKE 'Arroz%'").run();
    db.prepare("UPDATE products SET photo = '/products/banana.png' WHERE name LIKE 'Banana%'").run();
  } catch (e) { console.error('Migration fix images error:', e); }
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
    ['Tomate Vermelho — 50kg', 200, 70, '/products/tomate.png', 'PRODUTOS', 'Nampula', 1],
    ['Milho Branco — 100kg', 500, 45, '/products/milho.png', 'PRODUTOS', 'Monapo', 1],
    ['Feijão Manteiga — 25kg', 150, 120, '/products/feijao.png', 'PRODUTOS', 'Murrupula', 2],
    ['Arroz Carolino — 50kg', 80, 85, '/products/arroz.png', 'PRODUTOS', 'Nampula', 1],
    ['Mandioca Fresca — 30kg', 300, 25, '/products/mandioca.png', 'PRODUTOS', 'Meconta', 3],
    ['Batata-doce — 20kg', 120, 35, '/products/batata_doce.png', 'PRODUTOS', 'Angoche', 2],
    ['Amendoim — 10kg', 400, 95, '/products/amendoim.png', 'PRODUTOS', 'Ribaué', 1],
    ['Caju — 15kg', 60, 150, '/products/caju.png', 'PRODUTOS', 'Memba', 3],
    ['Gergelim — 5kg', 200, 180, '/products/gergelim.png', 'PRODUTOS', 'Malema', 2],
    ['Soja — 40kg', 250, 65, '/products/soja.png', 'PRODUTOS', 'Rapale', 1],
    ['Banana Madura — caixa', 90, 40, '/products/banana.png', 'PRODUTOS', 'Moma', 3],
    ['Papaia — 20kg', 70, 30, '/products/papaia.png', 'PRODUTOS', 'Nacala-Porto', 2],
  ];
  for (const p of products) insertProduct.run(...p);

  // Insumos
  const insertInput = db.prepare(`
    INSERT INTO inputs (name, quantity, price, photo, user_id)
    VALUES (?, ?, ?, ?, ?)
  `);

  const inputs = [
    ['Fertilizante NPK — 50kg', 100, 2500, '/products/fertilizante.png', 1],
    ['Sementes de Milho — 10kg', 50, 1200, '/products/sementes_milho.png', 1],
    ['Pesticida Orgânico — 5L', 30, 1800, '/products/tomate.png', 2],
    ['Composto Orgânico — 25kg', 200, 500, '/products/mandioca.png', 3],
    ['Herbicida — 1L', 40, 950, '/products/alho.png', 2],
    ['Sementes de Tomate — 1kg', 20, 2200, '/products/tomate.png', 2],
    ['Irrigação por Gotejamento — Kit', 10, 8500, '/products/milho.png', 1],
    ['Esterco de Bovino — 30kg', 150, 300, '/products/mandioca.png', 3],
    ['Saco de Ráfia — 50kg (100un)', 500, 1500, '/products/arroz.png', 1],
    ['Calcário Agrícola — 40kg', 100, 800, '/products/milho.png', 2],
    ['Enxada Manual — Cabo Madeira', 60, 450, '/products/feijao.png', 3],
    ['Pulverizador Costal — 16L', 15, 3800, '/products/tomate.png', 1],
  ];
  for (const i of inputs) insertInput.run(...i);

  // Transportes
  const insertTransport = db.prepare(`
    INSERT INTO transports (transport_type, name, price_per_km, photo, location, user_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const transports = [
    ['Camião', 'Camião 10 Toneladas', 150, '/products/milho.png', 'Nampula', 1],
    ['Pick-up', 'Pick-up Toyota Hilux', 60, '/products/tomate.png', 'Monapo', 1],
    ['Moto', 'Moto de Carga', 25, '/products/mandioca.png', 'Meconta', 2],
    ['Camioneta', 'Camioneta Frigorífica', 180, '/products/papaia.png', 'Nacala', 1],
    ['Camião', 'Camião de Carga — Ribaué', 140, '/products/milho.png', 'Ribaué', 3],
    ['Bicicleta', 'Triciclo de Carga — Angoche', 20, '/products/caju.png', 'Angoche', 3],
    ['Tractor', 'Trator com Reboque', 200, '/products/milho.png', 'Malema', 2],
    ['Carrinha', 'Carrinha 3.5 Toneladas', 90, '/products/mandioca.png', 'Rapale', 2],
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
