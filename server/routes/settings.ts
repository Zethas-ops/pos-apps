import { Router } from 'express';
import db from '../db.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, (req, res) => {
  const profile = db.prepare('SELECT * FROM STORE_PROFILE WHERE id = 1').get();
  res.json(profile);
});

router.put('/', authenticate, requireAdmin, (req, res) => {
  const { store_name, address, phone } = req.body;

  try {
    db.prepare('UPDATE STORE_PROFILE SET store_name = ?, address = ?, phone = ? WHERE id = 1').run(store_name, address, phone);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update store profile' });
  }
});

router.post('/print', authenticate, async (req, res) => {
  const { transaction_id } = req.body;

  try {
    const transaction = db.prepare('SELECT * FROM TRANSACTIONS WHERE transaction_id = ?').get(transaction_id) as any;
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });

    const items = db.prepare('SELECT * FROM TRANSACTION_ITEMS WHERE transaction_id = ?').all(transaction_id) as any[];
    const profile = db.prepare('SELECT * FROM STORE_PROFILE WHERE id = 1').get() as any;

    // Simulate printing by logging to console
    console.log('--- RECEIPT ---');
    console.log(profile.store_name);
    console.log(profile.address);
    console.log(`Tel: ${profile.phone}`);
    console.log('----------------');
    console.log(`Date: ${new Date(transaction.date).toLocaleString()}`);
    console.log(`Table: ${transaction.table_no}`);
    console.log(`Customer: ${transaction.customer_name}`);
    console.log('----------------');

    for (const item of items) {
      console.log(`${item.qty}x ${item.menu_name} - Rp ${item.subtotal}`);
      if (item.addons) {
        const addons = JSON.parse(item.addons);
        for (const addon of addons) {
          console.log(`  + ${addon.name}`);
        }
      }
    }

    console.log('----------------');
    console.log(`Total: Rp ${transaction.total_price}`);
    console.log(`Payment: ${transaction.payment_method}`);
    console.log('----------------');
    console.log('Thank you for your visit!');
    console.log('--- END RECEIPT ---');

    res.json({ success: true, message: 'Receipt printed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to print receipt' });
  }
});

router.get('/export', authenticate, requireAdmin, (req, res) => {
  const { start_date, end_date } = req.query;

  try {
    const start = `${start_date}T00:00:00.000Z`;
    const end = `${end_date}T23:59:59.999Z`;

    const data = db.prepare(`
      SELECT t.transaction_id, t.date, t.table_no, t.customer_name, t.payment_method, t.total_price,
             i.menu_name, i.addons, i.drink_type, i.sugar_level, i.qty, i.price, i.subtotal
      FROM TRANSACTIONS t
      JOIN TRANSACTION_ITEMS i ON t.transaction_id = i.transaction_id
      WHERE t.date >= ? AND t.date <= ?
    `).all(start, end);

    if (data.length === 0) {
      return res.status(404).json({ error: 'No data found for the selected date range' });
    }

    const headers = Object.keys(data[0]).join(',');
    const csv = data.map((row: any) => Object.values(row).map(val => `"${val}"`).join(',')).join('\n');

    res.header('Content-Type', 'text/csv');
    res.attachment('export.csv');
    res.send(`${headers}\n${csv}`);
  } catch (err) {
    res.status(500).json({ error: 'Failed to export data' });
  }
});

export default router;
