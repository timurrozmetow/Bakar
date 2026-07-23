import 'dotenv/config';

const nodeEnv = process.env.NODE_ENV ?? 'development';

function required(name: string, fallback?: string): string {
  const v = process.env[name] || fallback;
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

/**
 * Secrets may fall back to a dev default only outside production — in production a
 * missing or empty value must stop the process instead of silently using a known key.
 */
function requiredSecret(name: string, devFallback: string): string {
  const v = process.env[name];
  if (v) return v;
  if (nodeEnv === 'production') {
    throw new Error(`${name} must be set in production (generate one: openssl rand -hex 48)`);
  }
  return devFallback;
}

export const env = {
  nodeEnv,
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: requiredSecret('JWT_SECRET', 'dev-secret-change-me'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  adminEmail: process.env.ADMIN_EMAIL ?? 'admin@bakar.tm',
  adminPassword: process.env.ADMIN_PASSWORD ?? 'admin12345',
  adminName: process.env.ADMIN_NAME ?? 'Администратор',
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  publicUrl: process.env.PUBLIC_URL ?? '',
};

export const isProd = env.nodeEnv === 'production';
