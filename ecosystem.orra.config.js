module.exports = {
  apps: [{
    name: 'orra-server',
    script: 'node_modules/.bin/next',
    args: 'start -p 3000',
    cwd: '/home/z/my-project',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      DATABASE_URL: 'file:/home/z/my-project/db/custom.db',
      NEXTAUTH_SECRET: 'orra-super-secret-key-2025-production',
      NEXTAUTH_URL: 'http://localhost:3000',
      AUTH_TRUST_HOST: 'true',
    },
    // Auto-restart settings
    autorestart: true,
    max_restarts: 10,
    restart_delay: 5000,
    watch: false,
    // Memory management
    max_memory_restart: '512M',
    // Logging
    error_file: '/home/z/my-project/logs/pm2-error.log',
    out_file: '/home/z/my-project/logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    // Graceful shutdown
    kill_timeout: 10000,
    listen_timeout: 15000,
  }]
};
