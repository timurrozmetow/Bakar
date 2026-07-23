import { createApp } from './app.js';
import { env } from './lib/env.js';
import { prisma } from './lib/prisma.js';

const app = createApp();

// Behind nginx the app must not be reachable from the outside directly.
const host = process.env.HOST ?? (env.nodeEnv === 'production' ? '127.0.0.1' : '0.0.0.0');

const server = app.listen(env.port, host, () => {
  console.log(`\n  Bakar API → http://${host}:${env.port}`);
  console.log(`  Uploads   → http://${host}:${env.port}/uploads`);
  console.log(`  CORS from → ${env.clientOrigin}\n`);
});

async function shutdown() {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
