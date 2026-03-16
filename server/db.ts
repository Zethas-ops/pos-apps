import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';

const dbPath = path.join(process.cwd(), 'pos.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS USERS (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS MENU (
      menu_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      image TEXT,
      addon_target TEXT,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS INGREDIENTS (
      ingredient_id INTEGER PRIMARY KEY AUTOINCREMENT,
      ingredient_name TEXT NOT NULL,
      unit TEXT NOT NULL,
      current_stock REAL NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS RECIPES (
      recipe_id INTEGER PRIMARY KEY AUTOINCREMENT,
      menu_id INTEGER NOT NULL,
      ingredient_id INTEGER NOT NULL,
      usage_amount REAL NOT NULL,
      FOREIGN KEY (menu_id) REFERENCES MENU(menu_id),
      FOREIGN KEY (ingredient_id) REFERENCES INGREDIENTS(ingredient_id)
    );

    CREATE TABLE IF NOT EXISTS MENU_ADDONS (
      menu_id INTEGER NOT NULL,
      addon_menu_id INTEGER NOT NULL,
      PRIMARY KEY (menu_id, addon_menu_id),
      FOREIGN KEY (menu_id) REFERENCES MENU(menu_id),
      FOREIGN KEY (addon_menu_id) REFERENCES MENU(menu_id)
    );

    CREATE TABLE IF NOT EXISTS TRANSACTIONS (
      transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      table_no TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      status TEXT NOT NULL,
      payment_method TEXT,
      total_price REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS TRANSACTION_ITEMS (
      item_id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id INTEGER NOT NULL,
      menu_id INTEGER NOT NULL,
      menu_name TEXT NOT NULL,
      addons TEXT,
      drink_type TEXT,
      sugar_level TEXT,
      qty INTEGER NOT NULL,
      price REAL NOT NULL,
      subtotal REAL NOT NULL,
      FOREIGN KEY (transaction_id) REFERENCES TRANSACTIONS(transaction_id)
    );

    CREATE TABLE IF NOT EXISTS OPEN_BILLS (
      bill_id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_no TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      created_time TEXT NOT NULL,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS OPEN_BILL_ITEMS (
      item_id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_id INTEGER NOT NULL,
      menu_id INTEGER NOT NULL,
      menu_name TEXT NOT NULL,
      addons TEXT,
      drink_type TEXT,
      sugar_level TEXT,
      qty INTEGER NOT NULL,
      price REAL NOT NULL,
      subtotal REAL NOT NULL,
      FOREIGN KEY (bill_id) REFERENCES OPEN_BILLS(bill_id)
    );

    CREATE TABLE IF NOT EXISTS PROMOTIONS (
      promo_id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      discount_percent REAL,
      discount_amount REAL,
      min_buy_qty INTEGER,
      free_qty INTEGER,
      promo_rule TEXT,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      day_filter TEXT,
      time_filter TEXT,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS STORE_PROFILE (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      store_name TEXT NOT NULL,
      address TEXT NOT NULL,
      phone TEXT NOT NULL
    );
  `);

  // Migrations
  try { db.prepare('ALTER TABLE MENU ADD COLUMN addon_target TEXT').run(); } catch (e) {}
  try { db.prepare('ALTER TABLE PROMOTIONS ADD COLUMN discount_amount REAL').run(); } catch (e) {}
  try { db.prepare('ALTER TABLE PROMOTIONS ADD COLUMN min_buy_qty INTEGER').run(); } catch (e) {}
  try { db.prepare('ALTER TABLE PROMOTIONS ADD COLUMN free_qty INTEGER').run(); } catch (e) {}
  
  try { db.prepare('ALTER TABLE TRANSACTIONS ADD COLUMN subtotal REAL DEFAULT 0').run(); } catch (e) {}
  try { db.prepare('ALTER TABLE TRANSACTIONS ADD COLUMN tax REAL DEFAULT 0').run(); } catch (e) {}
  try { db.prepare('ALTER TABLE TRANSACTIONS ADD COLUMN discount REAL DEFAULT 0').run(); } catch (e) {}
  try { db.prepare('ALTER TABLE TRANSACTIONS ADD COLUMN cash_amount REAL DEFAULT 0').run(); } catch (e) {}
  try { db.prepare('ALTER TABLE TRANSACTIONS ADD COLUMN change_amount REAL DEFAULT 0').run(); } catch (e) {}

  try { db.prepare('ALTER TABLE OPEN_BILLS ADD COLUMN subtotal REAL DEFAULT 0').run(); } catch (e) {}
  try { db.prepare('ALTER TABLE OPEN_BILLS ADD COLUMN tax REAL DEFAULT 0').run(); } catch (e) {}
  try { db.prepare('ALTER TABLE OPEN_BILLS ADD COLUMN discount REAL DEFAULT 0').run(); } catch (e) {}

  try { db.prepare('ALTER TABLE PROMOTIONS ADD COLUMN min_buy_menu_id INTEGER').run(); } catch (e) {}
  try { db.prepare('ALTER TABLE PROMOTIONS ADD COLUMN free_menu_id INTEGER').run(); } catch (e) {}
  try { db.prepare('ALTER TABLE PROMOTIONS ADD COLUMN min_nominal REAL').run(); } catch (e) {}
  try { db.prepare('ALTER TABLE USERS ADD COLUMN name TEXT').run(); } catch (e) {}
  try { db.prepare('ALTER TABLE OPEN_BILL_ITEMS ADD COLUMN is_auto_free INTEGER DEFAULT 0').run(); } catch (e) {}
  try { db.prepare('ALTER TABLE TRANSACTION_ITEMS ADD COLUMN is_auto_free INTEGER DEFAULT 0').run(); } catch (e) {}

  // Seed default users if none exist
  const userCount = db.prepare('SELECT COUNT(*) as count FROM USERS').get() as { count: number };
  if (userCount.count === 0) {
    const insertUser = db.prepare('INSERT INTO USERS (name, username, password, role) VALUES (?, ?, ?, ?)');
    insertUser.run('Administrator', 'admin', bcrypt.hashSync('admin', 10), 'ADMIN');
    insertUser.run('Cashier', 'user', bcrypt.hashSync('user', 10), 'USER');
  }

  // Seed store profile if none exists
  const profileCount = db.prepare('SELECT COUNT(*) as count FROM STORE_PROFILE').get() as { count: number };
  if (profileCount.count === 0) {
    db.prepare('INSERT INTO STORE_PROFILE (id, store_name, address, phone) VALUES (1, ?, ?, ?)').run(
      'My Coffee Shop',
      '123 Coffee Street, Jakarta',
      '081234567890'
    );
  }
}

export default db;
