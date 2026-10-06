import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/error.js';

const clientDist = fileURLToPath(new URL('../../client/dist', import.meta.url));

export function createApp() {
  const app = express();

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'"],
        },
      },
    })
  );
  const corsOptions = {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (env.clientOrigins.includes('*') || env.clientOrigins.includes(origin)) return callback(null, true);
      if (/\.netlify\.app$/i.test(new URL(origin).hostname) || /localhost|127\.0\.0\.1/i.test(origin)) return callback(null, true);
      return callback(null, true);
    },
    credentials: true,
  };
  app.use(cors(corsOptions));
  app.use(express.json({ limit: '10mb' }));
  if (!env.isProd) app.use(morgan('dev'));

  app.use('/api', routes);
  app.use('/api', notFound);

  // Serve the built React app (single-origin deployment) when it exists.
  if (fs.existsSync(path.join(clientDist, 'index.html'))) {
    app.use(express.static(clientDist));
    app.use((_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
  }

  app.use(errorHandler);
  return app;
}
