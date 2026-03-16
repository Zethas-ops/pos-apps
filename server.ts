import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { initDb } from './server/db.js';
import authRoutes from './server/routes/auth.js';
import menuRoutes from './server/routes/menu.js';
import inventoryRoutes from './server/routes/inventory.js';
import posRoutes from './server/routes/pos.js';
import dashboardRoutes from './server/routes/dashboard.js';
import promoRoutes from './server/routes/promo.js';
import settingsRoutes from './server/routes/settings.js';
import usersRoutes from './server/routes/users.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Ensure uploads directory exists
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
  }

  app.use(express.json());
  app.use('/uploads', express.static(uploadsDir));

  // Initialize Database
  initDb();

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/menu', menuRoutes);
  app.use('/api/inventory', inventoryRoutes);
  app.use('/api/pos', posRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/promo', promoRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/users', usersRoutes);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
