module.exports = {
  apps: [{
    name: 'orra',
    script: 'npm',
    args: 'run start',
    env: {
      NODE_ENV: 'production',
      NEXTAUTH_SECRET: 'orra-super-secret-key-2025-production',
      NEXTAUTH_URL: 'http://localhost:3000',
      AUTH_TRUST_HOST: 'true',
      DATABASE_URL: 'file:/home/z/my-project/db/custom.db',
    }
  }]
};
