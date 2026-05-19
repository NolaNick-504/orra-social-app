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
  ],
};
