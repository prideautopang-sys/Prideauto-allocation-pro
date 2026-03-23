import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';

// Import handlers
import loginHandler from './api/login.js';
import logoHandler from './api/assets/logo.js';
import carsIndexHandler from './api/cars/index.js';
import carsIdHandler from './api/cars/[id].js';
import matchesIndexHandler from './api/matches/index.js';
import matchesIdHandler from './api/matches/[id].js';
import salespersonsIndexHandler from './api/salespersons/index.js';
import salespersonsIdHandler from './api/salespersons/[id].js';
import usersIndexHandler from './api/users/index.js';
import usersIdHandler from './api/users/[id].js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Helper to wrap Vercel handlers
  const wrap = (handler: any) => async (req: express.Request, res: express.Response) => {
    // Vercel handlers expect req.query to contain params
    req.query = { ...req.query, ...req.params };
    try {
      await handler(req, res);
    } catch (err) {
      console.error(err);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Internal Server Error' });
      }
    }
  };

  // API Routes
  app.all('/api/login', wrap(loginHandler));
  app.all('/api/assets/logo', wrap(logoHandler));
  
  app.all('/api/cars', wrap(carsIndexHandler));
  app.all('/api/cars/:id', wrap(carsIdHandler));
  
  app.all('/api/matches', wrap(matchesIndexHandler));
  app.all('/api/matches/:id', wrap(matchesIdHandler));
  
  app.all('/api/salespersons', wrap(salespersonsIndexHandler));
  app.all('/api/salespersons/:id', wrap(salespersonsIdHandler));
  
  app.all('/api/users', wrap(usersIndexHandler));
  app.all('/api/users/:id', wrap(usersIdHandler));

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
