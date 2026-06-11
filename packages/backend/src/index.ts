import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config.js';
import { initDb } from './db.js';
import { registerRoutes } from './routes.js';
import { startIndexer } from './indexer.js';

async function main(): Promise<void> {
  const app = Fastify({
    logger: { level: process.env.LOG_LEVEL ?? 'info' },
  });

  await app.register(cors, { origin: true });

  // Ensure schema exists. If the DB is unreachable, keep serving — /health reports it.
  try {
    await initDb();
    app.log.info('Database schema ready.');
  } catch (err) {
    app.log.error({ err }, 'Database init failed — DB-backed routes will error until it is reachable.');
  }

  await registerRoutes(app);

  await app.listen({ port: config.port, host: config.host });
  app.log.info(`ZenithDAO backend listening on http://${config.host}:${config.port}`);

  // Kick off the event indexer without blocking server startup.
  startIndexer(app.log).catch((err) => app.log.error({ err }, 'Indexer failed to start'));
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
