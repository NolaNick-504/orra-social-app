module.exports = {
  apps: [
    {
      name: 'orra-server',
      script: 'server.js',
      cwd: '/home/z/my-project',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NEXTAUTH_SECRET: 'orra-s3cr3t-k3y-p3rman3nt-2024',
        NEXTAUTH_URL: 'http://localhost:3000',
        AUTH_TRUST_HOST: 'true',
        DATABASE_URL: 'file:/home/z/my-project/db/custom.db',
        AUTOPOST_KEY: 'orra-internal-autopost-2026',
      },
      // Auto-restart on crash — zero downtime
      autorestart: true,
      max_restarts: 50,
      restart_delay: 3000,
      min_uptime: '10s',
      // Memory management — restart before OOM
      max_memory_restart: '450M',
      // Logging
      error_file: '/home/z/my-project/logs/orra-error.log',
      out_file: '/home/z/my-project/logs/orra-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      // Graceful shutdown
      kill_timeout: 10000,
      listen_timeout: 15000,
      // Auto-restart on file changes (disabled for production stability)
      watch: false,
    },
    {
      name: 'orra-keepalive',
      script: 'keepalive-daemon.js',
      cwd: '/home/z/my-project',
      env: {
        NODE_ENV: 'production',
      },
      autorestart: true,
      max_restarts: 30,
      restart_delay: 5000,
      min_uptime: '5s',
      error_file: '/home/z/my-project/logs/keepalive-error.log',
      out_file: '/home/z/my-project/logs/keepalive-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
