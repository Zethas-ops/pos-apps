import { Router } from 'express';
import db from '../db.js';
import { authenticate } from '../middleware/auth.js';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from 'date-fns';

const router = Router();

router.get('/metrics', authenticate, (req, res) => {
  const { startDate, endDate, paymentMethod } = req.query;
  const now = new Date();
  
  const todayStart = format(startOfDay(now), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
  const todayEnd = format(endOfDay(now), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
  
  const weekStart = format(startOfWeek(now), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
  const weekEnd = format(endOfWeek(now), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
  
  const monthStart = format(startOfMonth(now), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
  const monthEnd = format(endOfMonth(now), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");

  let filterQuery = '';
  const params: any[] = [];
  
  if (startDate && endDate) {
    filterQuery += ' AND date >= ? AND date <= ?';
    params.push(startDate, endDate);
  }
  if (paymentMethod && paymentMethod !== 'All') {
    filterQuery += ' AND payment_method = ?';
    params.push(paymentMethod);
  }

  const filteredSales = db.prepare(`SELECT SUM(total_price) as total FROM TRANSACTIONS WHERE 1=1 ${filterQuery}`).get(...params) as any;
  const filteredOrders = db.prepare(`SELECT COUNT(*) as count FROM TRANSACTIONS WHERE 1=1 ${filterQuery}`).get(...params) as any;

  let pmQuery = '';
  const pmParams: any[] = [];
  if (paymentMethod && paymentMethod !== 'All') {
    pmQuery += ' AND payment_method = ?';
    pmParams.push(paymentMethod);
  }

  const todaySales = db.prepare(`SELECT SUM(total_price) as total FROM TRANSACTIONS WHERE date >= ? AND date <= ? ${pmQuery}`).get(todayStart, todayEnd, ...pmParams) as any;
  const weekSales = db.prepare(`SELECT SUM(total_price) as total FROM TRANSACTIONS WHERE date >= ? AND date <= ? ${pmQuery}`).get(weekStart, weekEnd, ...pmParams) as any;
  const monthSales = db.prepare(`SELECT SUM(total_price) as total FROM TRANSACTIONS WHERE date >= ? AND date <= ? ${pmQuery}`).get(monthStart, monthEnd, ...pmParams) as any;
  const todayOrders = db.prepare(`SELECT COUNT(*) as count FROM TRANSACTIONS WHERE date >= ? AND date <= ? ${pmQuery}`).get(todayStart, todayEnd, ...pmParams) as any;

  res.json({
    filteredSales: filteredSales.total || 0,
    filteredOrders: filteredOrders.count || 0,
    todaySales: todaySales.total || 0,
    weekSales: weekSales.total || 0,
    monthSales: monthSales.total || 0,
    todayOrders: todayOrders.count || 0,
  });
});

router.get('/charts', authenticate, (req, res) => {
  const { startDate, endDate, paymentMethod } = req.query;
  const now = new Date();
  const todayStart = format(startOfDay(now), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
  const todayEnd = format(endOfDay(now), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");

  let filterQuery = '';
  const params: any[] = [];
  
  if (startDate && endDate) {
    filterQuery += ' AND date >= ? AND date <= ?';
    params.push(startDate, endDate);
  } else {
    filterQuery += ' AND date >= ? AND date <= ?';
    params.push(todayStart, todayEnd);
  }

  if (paymentMethod && paymentMethod !== 'All') {
    filterQuery += ' AND payment_method = ?';
    params.push(paymentMethod);
  }

  // Sales Chart (Bar chart: Date vs Revenue)
  const salesChart = db.prepare(`
    SELECT strftime('%m-%d', date) as label, SUM(total_price) as revenue
    FROM TRANSACTIONS
    WHERE 1=1 ${filterQuery}
    GROUP BY strftime('%Y-%m-%d', date)
    ORDER BY date ASC
  `).all(...params);

  let pmQuery = '';
  const pmParams: any[] = [];
  if (paymentMethod && paymentMethod !== 'All') {
    pmQuery += ' AND payment_method = ?';
    pmParams.push(paymentMethod);
  }

  // Hourly Traffic (Bar chart: Hour vs Orders & Revenue)
  // The image says "Today's Hourly Traffic", so we use today's date
  const hourlyTraffic = db.prepare(`
    SELECT strftime('%H:00', date) as label, COUNT(*) as orders, SUM(total_price) as revenue
    FROM TRANSACTIONS
    WHERE date >= ? AND date <= ? ${pmQuery}
    GROUP BY strftime('%H', date)
    ORDER BY label ASC
  `).all(todayStart, todayEnd, ...pmParams);

  // Payment Methods
  const paymentMethods = db.prepare(`
    SELECT payment_method as name, COUNT(*) as value 
    FROM TRANSACTIONS 
    WHERE 1=1 ${filterQuery}
    GROUP BY payment_method
  `).all(...params);

  // Top Selling Items
  const topSelling = db.prepare(`
    SELECT ti.menu_name as name, SUM(ti.qty) as sold, SUM(ti.subtotal) as revenue
    FROM TRANSACTION_ITEMS ti
    JOIN TRANSACTIONS t ON ti.transaction_id = t.transaction_id
    WHERE 1=1 ${filterQuery.replace(/date/g, 't.date')}
    GROUP BY ti.menu_name
    ORDER BY sold DESC
    LIMIT 5
  `).all(...params);

  res.json({
    salesChart,
    hourlyTraffic,
    paymentMethods,
    topSelling
  });
});

router.get('/history', authenticate, (req, res) => {
  const transactions = db.prepare('SELECT * FROM TRANSACTIONS ORDER BY date DESC').all();
  const transactionsWithItems = transactions.map((t: any) => {
    const items = db.prepare('SELECT * FROM TRANSACTION_ITEMS WHERE transaction_id = ?').all(t.transaction_id);
    return { ...t, items: items.map((i: any) => ({ ...i, addons: JSON.parse(i.addons || '[]'), is_auto_free: i.is_auto_free === 1 })) };
  });

  res.json(transactionsWithItems);
});

export default router;
