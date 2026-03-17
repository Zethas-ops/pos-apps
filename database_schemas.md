# Database Schemas

Below are the database schemas for MariaDB (MySQL) and PostgreSQL based on the current SQLite implementation.

## MariaDB / MySQL Schema

```sql
CREATE TABLE USERS (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  permissions TEXT
);

CREATE TABLE MENU (
  menu_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  image VARCHAR(255),
  addon_target TEXT,
  is_active TINYINT(1) DEFAULT 1
);

CREATE TABLE INGREDIENTS (
  ingredient_id INT AUTO_INCREMENT PRIMARY KEY,
  ingredient_name VARCHAR(255) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  current_stock DECIMAL(10, 2) NOT NULL DEFAULT 0
);

CREATE TABLE RECIPES (
  recipe_id INT AUTO_INCREMENT PRIMARY KEY,
  menu_id INT NOT NULL,
  ingredient_id INT NOT NULL,
  usage_amount DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (menu_id) REFERENCES MENU(menu_id) ON DELETE CASCADE,
  FOREIGN KEY (ingredient_id) REFERENCES INGREDIENTS(ingredient_id) ON DELETE CASCADE
);

CREATE TABLE MENU_ADDONS (
  menu_id INT NOT NULL,
  addon_menu_id INT NOT NULL,
  PRIMARY KEY (menu_id, addon_menu_id),
  FOREIGN KEY (menu_id) REFERENCES MENU(menu_id) ON DELETE CASCADE,
  FOREIGN KEY (addon_menu_id) REFERENCES MENU(menu_id) ON DELETE CASCADE
);

CREATE TABLE TRANSACTIONS (
  transaction_id INT AUTO_INCREMENT PRIMARY KEY,
  date DATETIME NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  table_no VARCHAR(50),
  customer_name VARCHAR(255),
  subtotal DECIMAL(10, 2) DEFAULT 0,
  tax DECIMAL(10, 2) DEFAULT 0,
  discount DECIMAL(10, 2) DEFAULT 0,
  cash_amount DECIMAL(10, 2) DEFAULT 0,
  change_amount DECIMAL(10, 2) DEFAULT 0
);

CREATE TABLE TRANSACTION_ITEMS (
  item_id INT AUTO_INCREMENT PRIMARY KEY,
  transaction_id INT NOT NULL,
  menu_id INT NOT NULL,
  menu_name VARCHAR(255) NOT NULL,
  qty INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  addons TEXT,
  is_auto_free TINYINT(1) DEFAULT 0,
  FOREIGN KEY (transaction_id) REFERENCES TRANSACTIONS(transaction_id) ON DELETE CASCADE
);

CREATE TABLE OPEN_BILLS (
  bill_id INT AUTO_INCREMENT PRIMARY KEY,
  table_no VARCHAR(50) NOT NULL,
  customer_name VARCHAR(255),
  created_at DATETIME NOT NULL,
  subtotal DECIMAL(10, 2) DEFAULT 0,
  tax DECIMAL(10, 2) DEFAULT 0,
  discount DECIMAL(10, 2) DEFAULT 0,
  total_price DECIMAL(10, 2) NOT NULL
);

CREATE TABLE OPEN_BILL_ITEMS (
  item_id INT AUTO_INCREMENT PRIMARY KEY,
  bill_id INT NOT NULL,
  menu_id INT NOT NULL,
  menu_name VARCHAR(255) NOT NULL,
  qty INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  addons TEXT,
  is_auto_free TINYINT(1) DEFAULT 0,
  FOREIGN KEY (bill_id) REFERENCES OPEN_BILLS(bill_id) ON DELETE CASCADE
);

CREATE TABLE PROMOTIONS (
  promo_id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  discount_percent DECIMAL(5, 2),
  discount_amount DECIMAL(10, 2),
  min_buy_qty INT,
  free_qty INT,
  min_buy_menu_id INT,
  free_menu_id INT,
  min_nominal DECIMAL(10, 2),
  promo_rule TEXT,
  start_date DATETIME NOT NULL,
  end_date DATETIME NOT NULL,
  day_filter VARCHAR(255),
  time_filter VARCHAR(255),
  is_active TINYINT(1) DEFAULT 1
);

CREATE TABLE STORE_PROFILE (
  id INT PRIMARY KEY CHECK (id = 1),
  store_name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  phone VARCHAR(50) NOT NULL
);
```

## PostgreSQL Schema

```sql
CREATE TABLE USERS (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  permissions TEXT
);

CREATE TABLE MENU (
  menu_id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  image VARCHAR(255),
  addon_target TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE INGREDIENTS (
  ingredient_id SERIAL PRIMARY KEY,
  ingredient_name VARCHAR(255) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  current_stock NUMERIC(10, 2) NOT NULL DEFAULT 0
);

CREATE TABLE RECIPES (
  recipe_id SERIAL PRIMARY KEY,
  menu_id INT NOT NULL REFERENCES MENU(menu_id) ON DELETE CASCADE,
  ingredient_id INT NOT NULL REFERENCES INGREDIENTS(ingredient_id) ON DELETE CASCADE,
  usage_amount NUMERIC(10, 2) NOT NULL
);

CREATE TABLE MENU_ADDONS (
  menu_id INT NOT NULL REFERENCES MENU(menu_id) ON DELETE CASCADE,
  addon_menu_id INT NOT NULL REFERENCES MENU(menu_id) ON DELETE CASCADE,
  PRIMARY KEY (menu_id, addon_menu_id)
);

CREATE TABLE TRANSACTIONS (
  transaction_id SERIAL PRIMARY KEY,
  date TIMESTAMP NOT NULL,
  total_price NUMERIC(10, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  table_no VARCHAR(50),
  customer_name VARCHAR(255),
  subtotal NUMERIC(10, 2) DEFAULT 0,
  tax NUMERIC(10, 2) DEFAULT 0,
  discount NUMERIC(10, 2) DEFAULT 0,
  cash_amount NUMERIC(10, 2) DEFAULT 0,
  change_amount NUMERIC(10, 2) DEFAULT 0
);

CREATE TABLE TRANSACTION_ITEMS (
  item_id SERIAL PRIMARY KEY,
  transaction_id INT NOT NULL REFERENCES TRANSACTIONS(transaction_id) ON DELETE CASCADE,
  menu_id INT NOT NULL,
  menu_name VARCHAR(255) NOT NULL,
  qty INT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL,
  addons TEXT,
  is_auto_free BOOLEAN DEFAULT FALSE
);

CREATE TABLE OPEN_BILLS (
  bill_id SERIAL PRIMARY KEY,
  table_no VARCHAR(50) NOT NULL,
  customer_name VARCHAR(255),
  created_at TIMESTAMP NOT NULL,
  subtotal NUMERIC(10, 2) DEFAULT 0,
  tax NUMERIC(10, 2) DEFAULT 0,
  discount NUMERIC(10, 2) DEFAULT 0,
  total_price NUMERIC(10, 2) NOT NULL
);

CREATE TABLE OPEN_BILL_ITEMS (
  item_id SERIAL PRIMARY KEY,
  bill_id INT NOT NULL REFERENCES OPEN_BILLS(bill_id) ON DELETE CASCADE,
  menu_id INT NOT NULL,
  menu_name VARCHAR(255) NOT NULL,
  qty INT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL,
  addons TEXT,
  is_auto_free BOOLEAN DEFAULT FALSE
);

CREATE TABLE PROMOTIONS (
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
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  day_filter VARCHAR(255),
  time_filter VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE STORE_PROFILE (
  id INT PRIMARY KEY CHECK (id = 1),
  store_name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  phone VARCHAR(50) NOT NULL
);
```
