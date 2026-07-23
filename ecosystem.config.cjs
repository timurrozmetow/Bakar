/**
 * PM2 process definition for the Bakar API.
 *
 * Run from the project root on the server:
 *   pm2 start ecosystem.config.cjs
 *   pm2 save && pm2 startup
 *
 * NOTE: instances stays at 1 on purpose. The rate limiter keeps its counters in
 * memory, so several workers would each allow the full quota. Move the limiter to
 * Redis before switching to cluster mode.
 */
module.exports = {
  apps: [
    {
      name: 'bakar-api',
      cwd: '/var/www/bakar/server',
      script: 'dist/index.js',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        HOST: '127.0.0.1',
        PORT: 4000,
      },
      error_file: '/var/log/bakar/api-error.log',
      out_file: '/var/log/bakar/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      kill_timeout: 5000,
    },
  ],
};
