-- Supabase SQL Schema for Coffee POS
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Users Table (Custom Users Table, separate from auth.users for simplicity, or you can link them)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255),
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL, -- In production, use Supabase Auth instead of storing passwords!
  role VARCHAR(50) NOT NULL DEFAULT 'USER',
  permissions JSONB DEFAULT '["pos", "open-bills", "history"]'::jsonb
);

-- Insert default admin user (password: admin123 - hashed with bcrypt in the app, but for direct insert we can just put a dummy or use the app to create)
-- Note: The app uses bcrypt. You should create the first admin via the app's signup or use Supabase Auth.

-- 2. Create Menu Table
CREATE TABLE menu (
  menu_id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  image VARCHAR(255),
  addon_target TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

-- 3. Create Ingredients Table
CREATE TABLE ingredients (
  ingredient_id SERIAL PRIMARY KEY,
  ingredient_name VARCHAR(255) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  current_stock NUMERIC(10, 2) NOT NULL DEFAULT 0
);

-- 4. Create Recipes Table
CREATE TABLE recipes (
  recipe_id SERIAL PRIMARY KEY,
  menu_id INT NOT NULL REFERENCES menu(menu_id) ON DELETE CASCADE,
  ingredient_id INT NOT NULL REFERENCES ingredients(ingredient_id) ON DELETE CASCADE,
  usage_amount NUMERIC(10, 2) NOT NULL
);

-- 5. Create Menu Addons Table
CREATE TABLE menu_addons (
  menu_id INT NOT NULL REFERENCES menu(menu_id) ON DELETE CASCADE,
  addon_menu_id INT NOT NULL REFERENCES menu(menu_id) ON DELETE CASCADE,
  PRIMARY KEY (menu_id, addon_menu_id)
);

-- 6. Create Transactions Table
CREATE TABLE transactions (
  transaction_id SERIAL PRIMARY KEY,
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  total_price NUMERIC(10, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  table_no VARCHAR(50),
  customer_name VARCHAR(255),
  subtotal NUMERIC(10, 2) DEFAULT 0,
  tax NUMERIC(10, 2) DEFAULT 0,
  discount NUMERIC(10, 2) DEFAULT 0,
  cash_amount NUMERIC(10, 2) DEFAULT 0,
  change_amount NUMERIC(10, 2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'COMPLETED'
);

-- 7. Create Transaction Items Table
CREATE TABLE transaction_items (
  item_id SERIAL PRIMARY KEY,
  transaction_id INT NOT NULL REFERENCES transactions(transaction_id) ON DELETE CASCADE,
  menu_id INT NOT NULL,
  menu_name VARCHAR(255) NOT NULL,
  qty INT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL,
  addons JSONB,
  is_auto_free BOOLEAN DEFAULT FALSE
);

-- 8. Create Open Bills Table
CREATE TABLE open_bills (
  bill_id SERIAL PRIMARY KEY,
  table_no VARCHAR(50) NOT NULL,
  customer_name VARCHAR(255),
  created_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  subtotal NUMERIC(10, 2) DEFAULT 0,
  tax NUMERIC(10, 2) DEFAULT 0,
  discount NUMERIC(10, 2) DEFAULT 0,
  total_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status VARCHAR(50) DEFAULT 'OPEN'
);

-- 9. Create Open Bill Items Table
CREATE TABLE open_bill_items (
  item_id SERIAL PRIMARY KEY,
  bill_id INT NOT NULL REFERENCES open_bills(bill_id) ON DELETE CASCADE,
  menu_id INT NOT NULL,
  menu_name VARCHAR(255) NOT NULL,
  qty INT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL,
  addons JSONB,
  is_auto_free BOOLEAN DEFAULT FALSE
);

-- 10. Create Promotions Table
CREATE TABLE promotions (
  promo_id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  discount_percent NUMERIC(5, 2),
  discount_amount NUMERIC(10, 2),
  min_buy_qty INT,
  free_qty INT,
  min_buy_menu_id INT,
  free_menu_id INT,
  min_nominal NUMERIC(10, 2),
  promo_rule TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  day_filter VARCHAR(255),
  time_filter VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE
);

-- 11. Create Store Profile Table
CREATE TABLE store_profile (
  id INT PRIMARY KEY CHECK (id = 1),
  store_name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  phone VARCHAR(50) NOT NULL
);

-- Insert default store profile
INSERT INTO store_profile (id, store_name, address, phone) 
VALUES (1, 'My Coffee Shop', '123 Coffee Street', '081234567890')
ON CONFLICT (id) DO NOTHING;

-- RLS Policies (Optional but recommended for production)
-- For a local/internal POS, you might just want to allow all authenticated users to read/write.
-- To keep it simple for this migration, we will allow anon/authenticated access, 
-- but in production you MUST secure these with RLS.

-- Example to allow all access (Not recommended for public internet, but okay for a closed POS system)
/*
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON users FOR ALL USING (true);
-- Repeat for other tables...
*/
