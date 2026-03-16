import { Router } from 'express';
import db from '../db.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, requireAdmin, (req, res) => {
  const ingredients = db.prepare('SELECT * FROM INGREDIENTS').all();
  res.json(ingredients);
});

router.post('/', authenticate, requireAdmin, (req, res) => {
  const { ingredient_name, unit, current_stock } = req.body;
  
  try {
    const info = db.prepare('INSERT INTO INGREDIENTS (ingredient_name, unit, current_stock) VALUES (?, ?, ?)').run(
      ingredient_name, unit, parseFloat(current_stock) || 0
    );
    res.json({ success: true, ingredient_id: info.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add ingredient' });
  }
});

router.put('/:id/adjust', authenticate, requireAdmin, (req, res) => {
  const { amount } = req.body;
  const { id } = req.params;

  try {
    const current = db.prepare('SELECT current_stock FROM INGREDIENTS WHERE ingredient_id = ?').get(id) as any;
    if (!current) return res.status(404).json({ error: 'Ingredient not found' });

    const newStock = Math.max(0, current.current_stock + parseFloat(amount));
    db.prepare('UPDATE INGREDIENTS SET current_stock = ? WHERE ingredient_id = ?').run(newStock, id);
    
    res.json({ success: true, newStock });
  } catch (err) {
    res.status(500).json({ error: 'Failed to adjust stock' });
  }
});

export default router;
