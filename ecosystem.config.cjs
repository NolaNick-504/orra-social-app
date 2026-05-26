module.exports = {
  apps: [
    {
      name: 'orra-next',
      script: '/home/z/my-project/.next/standalone/server.js',
      env: {
        PORT: 3001,
        NODE_ENV: 'production',
      },
    },
    {
      name: 'orra-proxy',
      script: '/home/z/my-project/.next/standalone/custom-server.js',
      env: {
        PORT: 3000,
        NODE_ENV: 'production',
      },
    },
    {
      name: 'orra-auto-poster',
      script: 'scripts/auto-poster.js',
      cwd: '/home/z/my-project',
      args: '--cron',
      env: {
        NODE_ENV: 'production',
        ORRA_URL: 'http://localhost:3000',
      },
      autorestart: true,
      max_restarts: 10,
      restart_delay: 60000,
      watch: false,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
