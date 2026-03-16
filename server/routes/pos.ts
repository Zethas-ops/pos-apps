import { Router } from 'express';
import db from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Create transaction (Checkout)
router.post('/checkout', authenticate, (req, res) => {
  const { table_no, customer_name, payment_method, total_price, subtotal, tax, discount, cash_amount, change_amount, items, open_bill_id } = req.body;

  const transaction = db.transaction(() => {
    // Check inventory first
    for (const item of items) {
      const recipes = db.prepare('SELECT * FROM RECIPES WHERE menu_id = ?').all(item.menu_id) as any[];
      for (const recipe of recipes) {
        const requiredAmount = recipe.usage_amount * item.qty;
        const ingredient = db.prepare('SELECT current_stock FROM INGREDIENTS WHERE ingredient_id = ?').get(recipe.ingredient_id) as any;
        
        if (!ingredient || ingredient.current_stock < requiredAmount) {
          throw new Error(`Insufficient stock for ingredient ID ${recipe.ingredient_id}`);
        }
      }
      if (item.addons && item.addons.length > 0) {
        for (const addon of item.addons) {
          const addonRecipes = db.prepare('SELECT * FROM RECIPES WHERE menu_id = ?').all(addon.menu_id) as any[];
          for (const recipe of addonRecipes) {
            const requiredAmount = recipe.usage_amount * item.qty;
            const ingredient = db.prepare('SELECT current_stock FROM INGREDIENTS WHERE ingredient_id = ?').get(recipe.ingredient_id) as any;
            
            if (!ingredient || ingredient.current_stock < requiredAmount) {
              throw new Error(`Insufficient stock for addon ingredient ID ${recipe.ingredient_id}`);
            }
          }
        }
      }
    }

    // Deduct inventory
    for (const item of items) {
      const recipes = db.prepare('SELECT * FROM RECIPES WHERE menu_id = ?').all(item.menu_id) as any[];
      for (const recipe of recipes) {
        const requiredAmount = recipe.usage_amount * item.qty;
        db.prepare('UPDATE INGREDIENTS SET current_stock = current_stock - ? WHERE ingredient_id = ?').run(requiredAmount, recipe.ingredient_id);
      }
      if (item.addons && item.addons.length > 0) {
        for (const addon of item.addons) {
          const addonRecipes = db.prepare('SELECT * FROM RECIPES WHERE menu_id = ?').all(addon.menu_id) as any[];
          for (const recipe of addonRecipes) {
            const requiredAmount = recipe.usage_amount * item.qty;
            db.prepare('UPDATE INGREDIENTS SET current_stock = current_stock - ? WHERE ingredient_id = ?').run(requiredAmount, recipe.ingredient_id);
          }
        }
      }
    }

    // Insert Transaction
    const date = new Date().toISOString();
    const info = db.prepare(`
      INSERT INTO TRANSACTIONS (date, table_no, customer_name, status, payment_method, total_price, subtotal, tax, discount, cash_amount, change_amount)
      VALUES (?, ?, ?, 'COMPLETED', ?, ?, ?, ?, ?, ?, ?)
    `).run(date, table_no, customer_name, payment_method, total_price, subtotal || 0, tax || 0, discount || 0, cash_amount || 0, change_amount || 0);

    const transactionId = info.lastInsertRowid;

    // Insert Items
    const insertItem = db.prepare(`
      INSERT INTO TRANSACTION_ITEMS (transaction_id, menu_id, menu_name, addons, drink_type, sugar_level, qty, price, subtotal, is_auto_free)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const item of items) {
      insertItem.run(
        transactionId,
        item.menu_id,
        item.menu_name,
        JSON.stringify(item.addons || []),
        item.drink_type || null,
        item.sugar_level || null,
        item.qty,
        item.price,
        item.subtotal,
        item.is_auto_free ? 1 : 0
      );
    }

    // If it was an open bill, mark it as closed
    if (open_bill_id) {
      db.prepare("UPDATE OPEN_BILLS SET status = 'CLOSED' WHERE bill_id = ?").run(open_bill_id);
    }

    return transactionId;
  });

  try {
    const transactionId = transaction();
    res.json({ success: true, transactionId });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Checkout failed' });
  }
});

// Create Open Bill
router.post('/open-bill', authenticate, (req, res) => {
  const { table_no, customer_name, subtotal, tax, discount, items, open_bill_id } = req.body;
  const date = new Date().toISOString();

  const transaction = db.transaction(() => {
    // Check inventory first
    for (const item of items) {
      const recipes = db.prepare('SELECT * FROM RECIPES WHERE menu_id = ?').all(item.menu_id) as any[];
      for (const recipe of recipes) {
        const requiredAmount = recipe.usage_amount * item.qty;
        const ingredient = db.prepare('SELECT current_stock FROM INGREDIENTS WHERE ingredient_id = ?').get(recipe.ingredient_id) as any;
        
        if (!ingredient || ingredient.current_stock < requiredAmount) {
          throw new Error(`Insufficient stock for ingredient ID ${recipe.ingredient_id}`);
        }
      }
      if (item.addons && item.addons.length > 0) {
        for (const addon of item.addons) {
          const addonRecipes = db.prepare('SELECT * FROM RECIPES WHERE menu_id = ?').all(addon.menu_id) as any[];
          for (const recipe of addonRecipes) {
            const requiredAmount = recipe.usage_amount * item.qty;
            const ingredient = db.prepare('SELECT current_stock FROM INGREDIENTS WHERE ingredient_id = ?').get(recipe.ingredient_id) as any;
            
            if (!ingredient || ingredient.current_stock < requiredAmount) {
              throw new Error(`Insufficient stock for addon ingredient ID ${recipe.ingredient_id}`);
            }
          }
        }
      }
    }

    let billId = open_bill_id;

    if (billId) {
      // Update existing open bill
      db.prepare(`
        UPDATE OPEN_BILLS 
        SET table_no = ?, customer_name = ?, subtotal = ?, tax = ?, discount = ?
        WHERE bill_id = ?
      `).run(table_no, customer_name, subtotal || 0, tax || 0, discount || 0, billId);

      // Delete old items
      db.prepare('DELETE FROM OPEN_BILL_ITEMS WHERE bill_id = ?').run(billId);
    } else {
      // Create new open bill
      const info = db.prepare(`
        INSERT INTO OPEN_BILLS (table_no, customer_name, created_time, status, subtotal, tax, discount)
        VALUES (?, ?, ?, 'OPEN', ?, ?, ?)
      `).run(table_no, customer_name, date, subtotal || 0, tax || 0, discount || 0);
      billId = info.lastInsertRowid;
    }

    const insertItem = db.prepare(`
      INSERT INTO OPEN_BILL_ITEMS (bill_id, menu_id, menu_name, addons, drink_type, sugar_level, qty, price, subtotal, is_auto_free)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const item of items) {
      insertItem.run(
        billId,
        item.menu_id,
        item.menu_name,
        JSON.stringify(item.addons || []),
        item.drink_type || null,
        item.sugar_level || null,
        item.qty,
        item.price,
        item.subtotal,
        item.is_auto_free ? 1 : 0
      );
    }

    return billId;
  });

  try {
    const billId = transaction();
    res.json({ success: true, billId });
  } catch (err: any) {
    console.error('Open Bill Error:', err);
    res.status(500).json({ error: err.message || 'Failed to create open bill' });
  }
});

// Get Open Bills
router.get('/open-bills', authenticate, (req, res) => {
  const bills = db.prepare("SELECT * FROM OPEN_BILLS WHERE status = 'OPEN'").all() as any[];
  
  const billsWithItems = bills.map(bill => {
    const items = db.prepare('SELECT * FROM OPEN_BILL_ITEMS WHERE bill_id = ?').all(bill.bill_id);
    return { ...bill, items: items.map((i: any) => ({ ...i, addons: JSON.parse(i.addons || '[]'), is_auto_free: i.is_auto_free === 1 })) };
  });

  res.json(billsWithItems);
});

// Generate QRIS Placeholder
router.post('/qris', authenticate, (req, res) => {
  res.json({
    success: true,
    qr_string: '00020101021126670016COM.NOBUBANK.WWW01189360050300000879140214488836520000010303UMI51440014ID.CO.QRIS.WWW0215ID10200210000110303UMI52045812530336054061000005802ID5919DUMMY COFFEE SHOP6015JAKARTA SELATAN610512190621607120108A01234566304E1F4',
    status: 'PENDING'
  });
});

export default router;
